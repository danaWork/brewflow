-- Migration: Add order_number column to orders table
-- Run this in Supabase SQL Editor

-- Add the order_number column with a sequence
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Update existing orders to have sequential numbers (if any)
-- The serial will auto-assign numbers to new orders going forward
