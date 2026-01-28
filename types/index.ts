// Re-export all types from a central location
export * from './menu';
export * from './order';
export * from './table';
export * from './restaurant';
export * from './user';

// Common API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
