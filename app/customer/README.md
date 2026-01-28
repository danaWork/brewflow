# Customer Menu Module

This directory (`/app/customer`) contains the mobile-first customer facing menu and ordering system.

## 📱 How to View

The menu is designed for **mobile devices**.
To view it locally:

1.  Ensure the development server is running:
    ```bash
    npm run dev
    ```
2.  Navigate to a table URL:
    http://localhost:3000/customer/table/1

> **Note**: The `table/1` segment corresponds to the QR code logic. You can use any ID (e.g., `table/2`), but `table/1` is currently seeded.

## 🚀 Deployment

This application is built with **Next.js**. The easiest way to deploy is via **Vercel**.

1.  Push code to GitHub.
2.  Import project into Vercel.
3.  Configure Environment Variables (`DATABASE_URL`, etc.).
4.  Deploy.

Your menu will be accessible at:
`https://your-domain.com/customer/table/1`

## ✨ Features

- **Split Menu**: Toggle between **Drinks** and **Snacks**.
- **Dynamic Highlights**:
  - **Most Popular** badge (Fire Icon) for top snacks.
  - **Signature** badge (Star Icon) for signature drinks.
- **Search & Filter**: Filter by category (Milk Tea, Pasta, etc.).
- **Live Currency**: Prices displayed in **Philippine Peso (₱)**.
