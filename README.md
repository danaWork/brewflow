# BrewFlow - Multi-App Restaurant System

A modern food-ordering/QR-based restaurant system built with **Next.js 16**, **Drizzle ORM**, and **Neon DB**, optimized for deployment on **Vercel**.

## 🏗️ Architecture

This project uses **Next.js App Router** with **Route Groups** to organize three separate applications within a single codebase:

- **Customer App** - For end customers ordering food (Real-time menu, cart, and ordering)
- **Owner App** - For restaurant owners/managers (Dashboard, order tracking, menu management)
- **Admin App** - For platform administrators (System-wide settings and analytics)

The system is decoupled using **Server Actions** for all database operations, ensuring a clean separation between the UI and the data layer.

## 📁 Project Structure

```
brewflow/
├── app/
│   ├── (customer)/          # Customer-facing app
│   ├── (owner)/             # Restaurant owner app
│   ├── (admin)/             # Platform admin app
│   └── actions/             # Database Server Actions (Neon/Drizzle)
├── components/              # React components (Shared, Customer, Owner, Admin)
├── context/                 # React Context providers (Auth, Cart, Order, Table)
├── db/                      # Drizzle schema and database configuration
├── drizzle/                 # Drizzle migrations and metadata
├── lib/                     # Core utilities and DB client
├── public/                  # Static assets
├── types/                   # TypeScript definitions
└── vercel.json              # Vercel configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Neon DB Account (PostgreSQL)

### Installation

```bash
npm install
```

### Database Setup

1. Copy `.env.example` to `.env` (if provided) or create one:
   ```
   DATABASE_URL=postgres://user:password@host/db
   ```
2. Push the schema to Neon:
   ```bash
   npx drizzle-kit push
   ```
3. Seed the database:
   ```bash
   npx tsx scripts/seed.ts
   ```

### Development

```bash
npm run dev
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon DB (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Runtime**: Node.js / Edge Compatible
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📄 License

MIT

