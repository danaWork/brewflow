# BrewFlow Project Context

Welcome to the **BrewFlow** codebase! This document provides an overview of the project's architecture, technologies, and development standards to help you navigate and contribute effectively.

## 🌟 Project Overview

BrewFlow is a modern, multi-tenant restaurant management and QR-based ordering system. It allows restaurant owners to manage their menus, tables, and orders, while providing a seamless ordering experience for customers via QR codes.

### Key Applications
The codebase is organized into three main functional areas using Next.js App Router and Route Groups:
- **Customer App (`/app/customer`)**: QR-based ordering interface for diners.
- **Owner App (`/app/owner`)**: Dashboard for restaurant managers/staff (orders, inventory, POS).
- **Admin App (`/app/admin`)**: Platform-level administration for managing companies and branches.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Authentication**: Custom JWT-based auth using `jose` and `httpOnly` cookies.
- **State Management**: React Context (`AuthProvider`, `CartProvider`, `OrderProvider`, `TableProvider`)
- **Testing**: [Vitest](https://vitest.dev/)

## 🏗️ Architecture & Multi-Tenancy

### Subdomain-Based Routing
BrewFlow uses subdomains to separate the platform administration from individual restaurant shops:
- **Admin/Root**: `brewflow.com` or `admin.brewflow.com`
- **Shop**: `{subdomain}.brewflow.com` (e.g., `starbucks.brewflow.com`)

The logic for parsing and validating tenants is located in `lib/tenant.ts` and enforced via `middleware.ts`.

### Data Layer
- **Schema**: Defined in `db/schema.ts`. It includes companies, branches, users (roles: `SUPERADMIN`, `BRANCH_MANAGER`, `KITCHEN_STAFF`), products, orders, and inventory.
- **Server Actions**: All database operations are performed via Next.js Server Actions in `app/actions/`, ensuring a clear separation from the UI.
- **Inventory Integration**: Products can be linked to ingredients in `inventory_items`. The system automatically checks stock levels before allowing an order.

## 🚀 Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server. |
| `npm run build` | Builds the application for production. |
| `npm run lint` | Runs ESLint to check for code quality issues. |
| `npm test` | Runs the test suite using Vitest. |
| `npx drizzle-kit push` | Pushes schema changes directly to the database. |
| `npx drizzle-kit studio` | Opens a GUI to explore the database. |
| `npx tsx scripts/seed.ts` | Seeds the database with initial data. |

## 📁 Important Directories

- `app/`: Next.js App Router pages and Server Actions.
- `components/`: React components, categorized by application (admin, owner, customer, ui).
- `context/`: React Context providers for global state.
- `db/`: Database schema and client configuration.
- `lib/`: Shared utility functions (auth, tenant parsing, receipt generation).
- `scripts/`: Maintenance and setup scripts (seeding, DB cleanup).
- `types/`: Shared TypeScript interfaces.

## 📝 Development Conventions

1. **Server Actions**: Prefer Server Actions for data fetching and mutations.
2. **Type Safety**: Maintain strict TypeScript typing. Ensure schema changes are reflected in `types/`.
3. **Multi-Tenancy**: Always validate `branchId` and `companyId` in Server Actions to prevent cross-tenant data leakage.
4. **UI Components**: Use the shared UI components in `components/ui/` (based on Radix/shadcn patterns) for consistency.
5. **Testing**: Add Vitest tests for complex logic, especially in Server Actions and utility functions.
