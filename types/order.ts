export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId?: string;
  tableId?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax?: number;
  tip?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}
