import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  const [email, setEmail] = useState("client@vaultpay.com");
  const [password, setPassword] = useState("Client@12345");
  const [token, setToken] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState("");

  const login = async () => {
    try {
      setMessage("Logging in...");

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setToken(data.token);
      setMessage("Login successful");

      await loadInvoices(data.token);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadInvoices = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/my-invoices`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load invoices");
      }

      setInvoices(data.invoices);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const payInvoice = async (invoice) => {
    try {
      setMessage("Creating Razorpay order...");

      const response = await fetch(
        `${API_URL}/api/invoices/${invoice._id}/pay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create Razorpay order");
      }

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout is not loaded. Check frontend/index.html."
        );
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "VaultPay",
        description: invoice.description,
        order_id: data.orderId,

        handler: async function (paymentResponse) {
          try {
            setMessage("Verifying payment...");

            const verifyResponse = await fetch(
              `${API_URL}/api/invoices/${invoice._id}/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message || "Payment verification failed"
              );
            }

            setMessage("Payment successful!");

            await loadInvoices(token);
          } catch (error) {
            setMessage(error.message);
          }
        },

        prefill: {
          name: "Test Client",
          email: "client@vaultpay.com",
        },

        theme: {
          color: "#111827",
        },

        modal: {
          ondismiss: function () {
            setMessage("Payment cancelled.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);

        setMessage(
          `Payment failed: ${
            response.error.description || "Unknown error"
          }`
        );
      });

      razorpay.open();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>VaultPay</h1>
        <p style={styles.subtitle}>Financial Core</p>

        {!token ? (
          <div style={styles.card}>
            <h2 style={styles.loginTitle}>Welcome back</h2>
            <p style={styles.loginSubtitle}>
              Sign in to manage your VaultPay invoices
            </p>

            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />

            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            <button style={styles.button} onClick={login}>
              Login
            </button>

            {message && <p>{message}</p>}
          </div>
        ) : (
          <div>
            <div style={styles.header}>
              <h2>My Invoices</h2>

              <button
                style={styles.logoutButton}
                onClick={() => {
                  setToken("");
                  setInvoices([]);
                  setMessage("");
                }}
              >
                Logout
              </button>
            </div>

            {message && <p style={styles.message}>{message}</p>}

            {invoices.length === 0 ? (
              <div style={styles.card}>
                <p>No invoices found.</p>
              </div>
            ) : (
              invoices.map((invoice) => (
                <div style={styles.invoice} key={invoice._id}>
                  <div>
                    <h3>{invoice.invoiceNumber}</h3>

                    <p>{invoice.description}</p>

                    <p>
                      <strong>Amount:</strong> ₹
                      {Number(invoice.amount).toLocaleString("en-IN")}
                    </p>

                    <p>
                      <strong>Due Date:</strong>{" "}
                      {new Date(invoice.dueDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </p>

                    <p style={{ marginTop: "12px" }}>
                      <strong>Status:</strong>{" "}
                      <span
                      style={{
                        display: "inline-block",
                        marginLeft: "6px",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:invoice.status === "Paid" ? "#ecfdf3" : "#fff7ed",
                        color:
                        invoice.status === "Paid" ? "#16804a" : "#c2410c",
                      }}
                      >
                        {invoice.status}
                        </span>
                        </p>
                  </div>

                  {invoice.status !== "Paid" && (
                    <button
                      style={styles.payButton}
                      onClick={() => payInvoice(invoice)}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: "48px 24px",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    color: "#0f172a",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "920px",
    margin: "0 auto",
  },

  title: {
    margin: 0,
    fontSize: "46px",
    fontWeight: "800",
    letterSpacing: "-2px",
    color: "#0f172a",
    textAlign: "center",
    lineHeight: "1.1",
  },

  subtitle: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: "0.2px",
  },

  card: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    marginTop: "32px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
    boxSizing: "border-box",
  },

  loginTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: "30px",
    fontWeight: "750",
    textAlign: "center",
    letterSpacing: "-0.8px",
    lineHeight: "1.2",
  },

  loginSubtitle: {
    margin: "0 0 26px",
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
    lineHeight: "1.5",
  },

  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    marginTop: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    fontSize: "15px",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
  },

  button: {
    width: "100%",
    padding: "15px",
    marginTop: "20px",
    border: "none",
    borderRadius: "9px",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    cursor: "pointer",
    letterSpacing: "0.1px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "38px",
    marginBottom: "22px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
  },

  logoutButton: {
    padding: "10px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    cursor: "pointer",
  },

  message: {
    padding: "13px 16px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    color: "#334155",
    fontSize: "14px",
    lineHeight: "1.5",
    marginBottom: "16px",
  },

  invoice: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "14px",
    marginTop: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    boxSizing: "border-box",
  },

  payButton: {
    padding: "12px 22px",
    border: "none",
    borderRadius: "8px",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

export default App;