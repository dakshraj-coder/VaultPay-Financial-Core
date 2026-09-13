const express = require("express");
const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const User = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const Razorpay = require("razorpay");

const router = express.Router();

// Admin: Get all clients
router.get(
  "/clients",
  protect,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const clients = await User.find(
        { role: "Client" },
        { name: 1, email: 1 }
      ).sort({ name: 1 });

      res.json({
        clients,
      });
    } catch (error) {
      console.error("Fetch clients error:", error);

      res.status(500).json({
        message: "Failed to fetch clients",
        error: error.message,
      });
    }
  }
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Admin: Create an invoice
router.post(
  "/",
  protect,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const {
        invoiceNumber,
        clientId,
        amount,
        description,
        dueDate,
      } = req.body;

      if (
        !invoiceNumber ||
        !clientId ||
        !amount ||
        !description ||
        !dueDate
      ) {
        return res.status(400).json({
          message: "All invoice fields are required",
        });
      }

      // Validate client ID before querying MongoDB
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({
          message: "Invalid client ID",
        });
      }

      const client = await User.findById(clientId);

      if (!client) {
        return res.status(404).json({
          message: "Client not found",
          clientId,
        });
      }

      if (client.role !== "Client") {
        return res.status(400).json({
          message: "Selected user is not a Client",
          role: client.role,
        });
      }

      const existingInvoice = await Invoice.findOne({
        invoiceNumber,
      });

      if (existingInvoice) {
        return res.status(400).json({
          message: "Invoice number already exists",
        });
      }

      const invoice = await Invoice.create({
        invoiceNumber,
        client: clientId,
        amount,
        description,
        dueDate,
      });

      res.status(201).json({
        message: "Invoice created successfully",
        invoice,
      });
    } catch (error) {
      console.error("Create invoice error:", error);

      res.status(500).json({
        message: "Failed to create invoice",
        error: error.message,
      });
    }
  }
);

// Client: Get only their own invoices
router.get(
  "/my-invoices",
  protect,
  authorizeRoles("Client"),
  async (req, res) => {
    try {
      const invoices = await Invoice.find({
        client: req.user.id,
      }).sort({ createdAt: -1 });

      res.json({
        invoices,
      });
    } catch (error) {
      console.error("Fetch invoices error:", error);

      res.status(500).json({
        message: "Failed to fetch invoices",
        error: error.message,
      });
    }
  }
);

// Client: Get a specific invoice only if they own it
router.get(
  "/:id",
  protect,
  authorizeRoles("Client"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid invoice ID",
        });
      }

      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      // IDOR protection
      if (invoice.client.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Forbidden: You do not own this invoice",
        });
      }

      res.json({
        invoice,
      });
    } catch (error) {
      console.error("Fetch invoice error:", error);

      res.status(500).json({
        message: "Failed to fetch invoice",
        error: error.message,
      });
    }
  }
);

// Client: Create Razorpay Checkout Order
router.post(
  "/:id/pay",
  protect,
  authorizeRoles("Client"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid invoice ID",
        });
      }

      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      // IDOR protection
      if (invoice.client.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Forbidden: You do not own this invoice",
        });
      }

      if (invoice.status === "Paid") {
        return res.status(400).json({
          message: "Invoice is already paid",
        });
      }

      // Razorpay amount must be in paise.
      // Example: ₹5,000 = 500000 paise.
      const amountInPaise = Math.round(invoice.amount * 100);

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: invoice.invoiceNumber,
        notes: {
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
        },
      });

      // Store Razorpay order ID in the existing field
      // so we don't need to change the Invoice model yet.
      invoice.razorpayOrderId = order.id;
      await invoice.save();

      res.json({
        message: "Razorpay order created successfully",
        orderId: order.id,
        amount: amountInPaise,
        currency: "INR",
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Razorpay order error:", error);

      res.status(500).json({
        message: "Failed to create Razorpay order",
        error: error.message,
      });
    }
  }
);

// Client: Verify Razorpay payment
router.post(
  "/:id/verify-payment",
  protect,
  authorizeRoles("Client"),
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          message: "Payment verification details are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid invoice ID",
        });
      }

      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      // IDOR protection
      if (invoice.client.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Forbidden: You do not own this invoice",
        });
      }

      if (invoice.status === "Paid") {
        return res.status(400).json({
          message: "Invoice is already paid",
        });
      }

      // Make sure this payment belongs to this invoice
      if (invoice.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({
          message: "Payment order does not match this invoice",
        });
      }

      // Verify Razorpay signature
      const crypto = require("crypto");

      const generatedSignature = crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          message: "Invalid payment signature",
        });
      }

      // Payment verified successfully
      invoice.status = "Paid";
      invoice.paidAt = new Date();

      await invoice.save();

      res.json({
        message: "Payment verified successfully",
        invoice,
      });
    } catch (error) {
      console.error("Payment verification error:", error);

      res.status(500).json({
        message: "Payment verification failed",
        error: error.message,
      });
    }
  }
);

module.exports = router;