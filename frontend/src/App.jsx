import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  useEffect(() => {
    const link = document.createElement("link");

    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";

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
        throw new Error(
          data.message || "Failed to create Razorpay order"
        );
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
                verifyData.message ||
                  "Payment verification failed"
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
          color: "#2563eb",
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
      {!token ? (
        /* ================= LOGIN PAGE ================= */
        <div style={styles.loginWrapper}>
          <div style={styles.loginBrand}>
            <div style={styles.logoMark}>V</div>

            <div>
              <div style={styles.brandName}>VaultPay</div>

              <div style={styles.brandSubtitle}>
                Financial Core
              </div>
            </div>
          </div>

          <div style={styles.loginCard}>
            <div style={styles.loginHeader}>
              <div style={styles.securityBadge}>
                <span style={styles.securityDot}></span>
                SECURE ACCESS
              </div>

              <h1 style={styles.loginTitle}>
                Welcome back
              </h1>

              <p style={styles.loginDescription}>
                Sign in to manage your VaultPay invoices and
                payments.
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Email address
              </label>

              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Password
              </label>

              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    login();
                  }
                }}
              />
            </div>

            <button
              style={styles.loginButton}
              onClick={login}
            >
              <span>Sign in</span>

              <span style={styles.arrow}>→</span>
            </button>

            {message && (
              <div style={styles.loginMessage}>
                {message}
              </div>
            )}
          </div>

          <div style={styles.loginFooter}>
            Secure financial management powered by VaultPay
          </div>
        </div>
      ) : (
        /* ================= DASHBOARD ================= */
        <div style={styles.dashboardContainer}>
          <header style={styles.dashboardHeader}>
            <div style={styles.dashboardBrand}>
              <div style={styles.smallLogo}>V</div>

              <div>
                <div style={styles.dashboardBrandName}>
                  VaultPay
                </div>

                <div
                  style={styles.dashboardBrandSubtitle}
                >
                  Financial Core
                </div>
              </div>
            </div>

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
          </header>

          <main>
            <div style={styles.dashboardIntro}>
              <div>
                <p style={styles.eyebrow}>
                  CLIENT PORTAL
                </p>

                <h1 style={styles.dashboardTitle}>
                  My Invoices
                </h1>

                <p style={styles.dashboardSubtitle}>
                  Review your outstanding invoices and manage
                  payments.
                </p>
              </div>

              <div style={styles.invoiceCount}>
                <span style={styles.countNumber}>
                  {invoices.length}
                </span>

                <span style={styles.countLabel}>
                  Invoices
                </span>
              </div>
            </div>

            {message && (
              <div style={styles.message}>
                {message}
              </div>
            )}

            {invoices.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>✓</div>

                <h2 style={styles.emptyTitle}>
                  No invoices found
                </h2>

                <p style={styles.emptyText}>
                  You currently have no invoices associated
                  with your account.
                </p>
              </div>
            ) : (
              <div style={styles.invoiceList}>
                {invoices.map((invoice) => (
                  <div
                    style={styles.invoice}
                    key={invoice._id}
                  >
                    <div style={styles.invoiceMain}>
                      <div style={styles.invoiceTop}>
                        <span
                          style={styles.invoiceLabel}
                        >
                          INVOICE
                        </span>

                        <span
                          style={{
                            ...styles.statusBadge,
                            background:
                              invoice.status === "Paid"
                                ? "#ecfdf5"
                                : "#fff7ed",
                            color:
                              invoice.status === "Paid"
                                ? "#047857"
                                : "#c2410c",
                          }}
                        >
                          <span
                            style={{
                              ...styles.statusDot,
                              background:
                                invoice.status === "Paid"
                                  ? "#10b981"
                                  : "#f97316",
                            }}
                          ></span>

                          {invoice.status}
                        </span>
                      </div>

                      <h2
                        style={styles.invoiceNumber}
                      >
                        {invoice.invoiceNumber}
                      </h2>

                      <p
                        style={
                          styles.invoiceDescription
                        }
                      >
                        {invoice.description}
                      </p>

                      <div
                        style={styles.invoiceDetails}
                      >
                        <div>
                          <span
                            style={styles.detailLabel}
                          >
                            Amount
                          </span>

                          <span style={styles.amount}>
                            ₹
                            {Number(
                              invoice.amount
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div>
                          <span
                            style={styles.detailLabel}
                          >
                            Due date
                          </span>

                          <span
                            style={styles.detailValue}
                          >
                            {new Date(
                              invoice.dueDate
                            ).toLocaleDateString(
                              "en-IN"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={styles.invoiceAction}
                    >
                      {invoice.status !== "Paid" ? (
                        <button
                          style={styles.payButton}
                          onClick={() =>
                            payInvoice(invoice)
                          }
                        >
                          Pay Now

                          <span
                            style={styles.payArrow}
                          >
                            →
                          </span>
                        </button>
                      ) : (
                        <div
                          style={
                            styles.paidIndicator
                          }
                        >
                          <span>✓</span>
                          Paid
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <footer style={styles.dashboardFooter}>
            VaultPay Financial Core
          </footer>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   VAULTPAY PROFESSIONAL UI STYLES
   ========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "0",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    color: "#0f172a",
    boxSizing: "border-box",
  },

  /* ================= LOGIN ================= */

  loginWrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  loginBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "30px",
  },

  logoMark: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "800",
    boxShadow:
      "0 8px 20px rgba(37, 99, 235, 0.25)",
  },

  brandName: {
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.6px",
    color: "#0f172a",
  },

  brandSubtitle: {
    marginTop: "2px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#64748b",
  },

  loginCard: {
    width: "100%",
    maxWidth: "470px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "38px",
    boxSizing: "border-box",
    boxShadow:
      "0 20px 50px rgba(15, 23, 42, 0.10)",
  },

  loginHeader: {
    textAlign: "center",
    marginBottom: "30px",
  },

  securityBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.8px",
    marginBottom: "20px",
  },

  securityDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#2563eb",
  },

  loginTitle: {
    margin: "0",
    color: "#0f172a",
    fontSize: "30px",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: "-0.8px",
    lineHeight: "1.2",
  },

  loginDescription: {
    margin: "10px auto 0",
    maxWidth: "370px",
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
    lineHeight: "1.6",
  },

  formGroup: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "15px",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
  },

  loginButton: {
    width: "100%",
    padding: "14px 18px",
    marginTop: "5px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow:
      "0 8px 18px rgba(37, 99, 235, 0.22)",
  },

  arrow: {
    fontSize: "18px",
    lineHeight: "1",
  },

  loginMessage: {
    marginTop: "18px",
    padding: "11px 14px",
    borderRadius: "9px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "13px",
    textAlign: "center",
  },

  loginFooter: {
    marginTop: "24px",
    color: "#94a3b8",
    fontSize: "12px",
    textAlign: "center",
  },

  /* ================= DASHBOARD ================= */

  dashboardContainer: {
    width: "100%",
    maxWidth: "1040px",
    margin: "0 auto",
    padding: "34px 28px 30px",
    boxSizing: "border-box",
  },

  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "25px",
    borderBottom: "1px solid #e2e8f0",
  },

  dashboardBrand: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  smallLogo: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: "800",
  },

  dashboardBrandName: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.3px",
  },

  dashboardBrandSubtitle: {
    marginTop: "1px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "500",
  },

  logoutButton: {
    padding: "9px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  dashboardIntro: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "30px",
    marginTop: "42px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 7px",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.2px",
  },

  dashboardTitle: {
    margin: "0",
    color: "#0f172a",
    fontSize: "36px",
    fontWeight: "800",
    letterSpacing: "-1px",
    lineHeight: "1.15",
  },

  dashboardSubtitle: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  invoiceCount: {
    minWidth: "90px",
    padding: "13px 17px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow:
      "0 5px 15px rgba(15, 23, 42, 0.04)",
  },

  countNumber: {
    display: "block",
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: "800",
  },

  countLabel: {
    display: "block",
    marginTop: "2px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "600",
  },

  message: {
    padding: "13px 16px",
    marginBottom: "18px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "10px",
    color: "#334155",
    fontSize: "13px",
  },

  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "60px 30px",
    textAlign: "center",
    boxShadow:
      "0 8px 25px rgba(15, 23, 42, 0.05)",
  },

  emptyIcon: {
    width: "50px",
    height: "50px",
    margin: "0 auto 18px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "800",
  },

  emptyTitle: {
    margin: "0",
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: "700",
  },

  emptyText: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "13px",
  },

  invoiceList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  invoice: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "25px",
    border: "1px solid #e2e8f0",
    boxShadow:
      "0 6px 20px rgba(15, 23, 42, 0.05)",
  },

  invoiceMain: {
    flex: "1",
    minWidth: "0",
  },

  invoiceTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  invoiceLabel: {
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  invoiceNumber: {
    margin: "12px 0 5px",
    color: "#0f172a",
    fontSize: "21px",
    fontWeight: "800",
    letterSpacing: "-0.4px",
  },

  invoiceDescription: {
    margin: "0",
    color: "#64748b",
    fontSize: "13px",
  },

  invoiceDetails: {
    display: "flex",
    alignItems: "center",
    gap: "45px",
    marginTop: "20px",
  },

  detailLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },

  amount: {
    display: "block",
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: "800",
  },

  detailValue: {
    display: "block",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "600",
  },

  invoiceAction: {
    flexShrink: "0",
  },

  payButton: {
    padding: "11px 19px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow:
      "0 6px 15px rgba(37, 99, 235, 0.20)",
  },

  payArrow: {
    marginLeft: "8px",
    fontSize: "16px",
  },

  paidIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 15px",
    borderRadius: "9px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "13px",
    fontWeight: "700",
  },

  dashboardFooter: {
    marginTop: "45px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "11px",
  },
};

export default App;