// API base URL - can be configured via environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// App routes
export const ROUTES = {
  // Customer routes
  CUSTOMER: {
    HOME: '/',
    MENU: '/menu',
    CART: '/cart',
    CHECKOUT: '/checkout',
    ORDERS: '/orders',
    PROFILE: '/profile',
  },
  // Owner routes
  OWNER: {
    DASHBOARD: '/dashboard',
    MENU_MANAGEMENT: '/menu-management',
    ORDERS: '/orders',
    TABLES: '/tables',
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
  },
  // Admin routes
  ADMIN: {
    DASHBOARD: '/dashboard',
    RESTAURANTS: '/restaurants',
    USERS: '/users',
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
  },
} as const;

// Order status display names
export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

// Table status display names
export const TABLE_STATUS_LABELS = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  maintenance: 'Maintenance',
} as const;
