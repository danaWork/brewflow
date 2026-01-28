# Coffee Shop Front-End - Multi-App Restaurant System

A modern food-ordering/QR-based restaurant system built with Next.js 15, featuring three distinct front-end applications and a complete fake API for demo purposes.

## 🏗️ Architecture

This project uses **Next.js App Router** with **Route Groups** to organize three separate applications within a single codebase:

- **Customer App** - For end customers ordering food
- **Owner App** - For restaurant owners/managers
- **Admin App** - For platform administrators

## 📁 Project Structure

```
coffee-shop-front/
├── app/
│   ├── (customer)/          # Customer-facing app
│   ├── (owner)/             # Restaurant owner app
│   ├── (admin)/             # Platform admin app
│   └── api/                 # Next.js Route Handlers (Fake API)
├── components/              # React components
│   ├── customer/
│   ├── owner/
│   ├── admin/
│   └── shared/
├── lib/                     # Utilities and helpers
│   ├── api/
│   └── utils/
├── types/                   # TypeScript definitions
├── hooks/                   # Custom React hooks
├── context/                 # React Context providers
├── data/                    # Mock data for API
└── public/                  # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser and navigate to:

- Customer App: `http://localhost:3000/`
- Owner App: `http://localhost:3000/dashboard`
- Admin App: `http://localhost:3000/dashboard`

## 📱 Applications

### Customer App Routes

- `/` - Home/Landing page
- `/menu` - Browse menu items
- `/menu/[id]` - Menu item details
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/orders` - Order history
- `/orders/[id]` - Order tracking
- `/table/[tableId]` - QR code landing page
- `/profile` - Customer profile

### Owner App Routes

- `/owner` - Redirects to dashboard
- `/owner/dashboard` - Owner dashboard
- `/owner/menu-management` - Menu CRUD operations
- `/owner/menu-management/create` - Create menu item
- `/owner/menu-management/edit/[id]` - Edit menu item
- `/owner/orders` - Active orders management
- `/owner/orders/[id]` - Order details
- `/owner/tables` - Table management & QR codes
- `/owner/analytics` - Sales & performance analytics
- `/owner/settings` - Restaurant settings

### Admin App Routes

- `/admin` - Redirects to dashboard
- `/admin/dashboard` - Admin dashboard
- `/admin/restaurants` - Restaurant listings
- `/admin/restaurants/create` - Create restaurant
- `/admin/restaurants/[id]` - Restaurant details
- `/admin/restaurants/[id]/edit` - Edit restaurant
- `/admin/users` - User management
- `/admin/users/[id]` - User details
- `/admin/analytics` - Platform-wide analytics
- `/admin/settings` - Platform settings

## 🔌 API Endpoints

All API routes are available under `/api/`:

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Menu

- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create menu item
- `GET /api/menu/[id]` - Get menu item
- `PUT /api/menu/[id]` - Update menu item
- `DELETE /api/menu/[id]` - Delete menu item

### Orders

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order
- `DELETE /api/orders/[id]` - Delete order

### Tables

- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create table
- `GET /api/tables/[id]` - Get table details
- `PUT /api/tables/[id]` - Update table
- `DELETE /api/tables/[id]` - Delete table

### Restaurants

- `GET /api/restaurants` - Get all restaurants
- `POST /api/restaurants` - Create restaurant
- `GET /api/restaurants/[id]` - Get restaurant details
- `PUT /api/restaurants/[id]` - Update restaurant
- `DELETE /api/restaurants/[id]` - Delete restaurant

### Users

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Cart

- `GET /api/cart` - Get cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart` - Update cart

### Analytics

- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/orders` - Orders analytics

## 🎯 Key Features

### Route Groups

Uses Next.js route groups `(customer)`, `(owner)`, `(admin)` to organize apps without affecting URL structure.

### Type Safety

Comprehensive TypeScript definitions for all entities:

- MenuItem
- Order
- Table
- Restaurant
- User

### Utilities

- **Formatters**: Currency, date, relative time
- **Validators**: Email, phone, field validation
- **Helpers**: ID generation, debounce, throttle, class names

### Mock API

Complete fake backend using Next.js Route Handlers with:

- RESTful endpoints
- Mock data
- Proper HTTP methods (GET, POST, PUT, DELETE)

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: CSS (ready for Tailwind CSS)
- **Routing**: App Router with Route Groups
- **API**: Next.js Route Handlers

## 📝 Next Steps

1. ✅ Folder structure created
2. ✅ Basic pages and layouts
3. ✅ API route handlers
4. ✅ Type definitions
5. ✅ Utility functions
6. 🔲 Implement UI components
7. 🔲 Add state management (Context/Hooks)
8. 🔲 Create mock data files
9. 🔲 Implement authentication middleware
10. 🔲 Add styling (Tailwind CSS)

## 📄 License

MIT
