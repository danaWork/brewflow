export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  qrCode: string;
  restaurantId?: string;
  currentOrderId?: string;
}
