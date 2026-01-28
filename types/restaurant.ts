export type RestaurantStatus = 'active' | 'inactive' | 'pending';

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  logo?: string;
  status: RestaurantStatus;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
}
