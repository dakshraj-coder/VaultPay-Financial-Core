# VaultPay – Financial Core

VaultPay Financial Core is a secure invoice and payment management application designed to manage clients, invoices, authentication, and online payments.

## 🚀 Features

- Secure Admin and Client authentication
- Role-based access control
- Admin client management
- Invoice creation and management
- Client-specific invoice access
- Invoice payment functionality
- Invoice payment status updates
- Protected API routes
- Responsive and professional web interface

## 🏗️ Project Structure

```text
VaultPay-Financial-Core/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Invoice.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── invoiceRoutes.js
│   │   └── testRoutes.js
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md

##🛠️ Technologies Used
Frontend
React
Vite
JavaScript
CSS
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
Payments
Razorpay
Development Tools
Git
GitHub
Visual Studio Code

##🔐 Authentication & Authorization

VaultPay uses authentication and role-based authorization to protect application resources.

The application supports:

Admin users
Client users
Protected API endpoints
Client-specific invoice access
Authorization checks for invoice ownership

Clients can only access invoices associated with their account.

##👨‍💼 Admin Workflow

```The Admin can:

Sign in securely.
View registered clients.
View and manage invoices.
Create invoices for clients.
View invoice information.
Log out securely.

##👤 Client Workflow

```The Client can:

Sign in securely.
View their invoices.
Review invoice details.
Make payments.
View updated payment status.
Log out securely.

##🧾 Invoice Management

Invoices contain important information such as:

Invoice number
Client
Description
Amount
Due date
Payment status

##Example:

Invoice Number: INV-1001
Description: Business Consulting Services
Amount: ₹5,000
Due Date: 15/10/2026
Status: Paid
💳 Payment Workflow

The payment flow is:

Admin creates invoice
        ↓
Invoice assigned to client
        ↓
Client logs in
        ↓
Client views invoice
        ↓
Client makes payment
        ↓
Payment succeeds
        ↓
Invoice status becomes Paid
🔒 Security

VaultPay implements protected routes and role-based authorization.

The system ensures that:

Authentication is required for protected resources.
Admin-only operations require Admin authorization.
Clients cannot access invoices belonging to other clients.
Sensitive environment variables are not committed to Git.
JWT-based authentication is used for API authorization.
⚙️ Running the Project
Prerequisites

Make sure the following are installed:

Node.js
npm
MongoDB
Git
Backend Setup

Open a terminal in the project root:

cd backend
npm install
npm start

The backend runs on:

http://localhost:5000
Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

The frontend runs on:

http://localhost:5173
🧪 Production Build

To create a production build of the frontend:

cd frontend
npm run build

The production files are generated in the dist directory.

🔑 Environment Variables

Sensitive configuration should be stored in environment variables and should not be committed to GitHub.

Example:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

The .gitignore file excludes .env files from Git tracking.

🧪 Testing the Application

A typical end-to-end test can be performed using the following workflow:

1. Start MongoDB
        ↓
2. Start Backend
        ↓
3. Start Frontend
        ↓
4. Login as Admin
        ↓
5. View Clients
        ↓
6. Create/View Invoice
        ↓
7. Login as Client
        ↓
8. View Invoice
        ↓
9. Make Payment
        ↓
10. Verify Paid Status
📊 Project Status

VaultPay Financial Core currently includes the core:

Authentication
Authorization
Client management
Invoice management
Payment workflow
Payment status updates
Admin and Client portals
Responsive frontend interface

The project is maintained using Git and GitHub.

📁 GitHub

The project repository is hosted on GitHub:

VaultPay Financial Core

Repository:

https://github.com/dakshraj-coder/VaultPay-Financial-Core

👨‍💻 Author

Dakshraj Ghatam

GitHub: https://github.com/dakshraj-coder
