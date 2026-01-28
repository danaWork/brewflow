-- ==========================================
-- BREWFLOW RLS POLICIES
-- ==========================================
-- Current state: Permissive policies for demo
-- Future: Update policies when authentication is added
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- MENU DATA (Public Read-Only)
-- These stay public even after auth is added
-- ==========================================

-- Categories: Anyone can view
CREATE POLICY "categories_public_read" ON categories 
  FOR SELECT USING (true);

-- Products: Anyone can view  
CREATE POLICY "products_public_read" ON products 
  FOR SELECT USING (true);

-- Modifiers: Anyone can view
CREATE POLICY "modifiers_public_read" ON modifiers 
  FOR SELECT USING (true);

-- Product-Modifier links: Anyone can view
CREATE POLICY "product_modifiers_public_read" ON product_modifiers 
  FOR SELECT USING (true);

-- Product Relations (upsells): Anyone can view
CREATE POLICY "product_relations_public_read" ON product_relations 
  FOR SELECT USING (true);

-- Tables: Anyone can view
CREATE POLICY "tables_public_read" ON tables 
  FOR SELECT USING (true);

-- ==========================================
-- ORDERS (Customers + Owners)
-- TODO: Update these when auth is added
-- ==========================================

-- Anyone can view orders (for realtime kitchen display)
-- FUTURE: Restrict to owner role OR customer who placed order
CREATE POLICY "orders_public_read" ON orders 
  FOR SELECT USING (true);

-- Anyone can create orders (customers placing orders)
-- This is intentional - customers don't need to be logged in
CREATE POLICY "orders_public_insert" ON orders 
  FOR INSERT WITH CHECK (true);

-- Anyone can update orders (for owner dashboard status changes)
-- FUTURE: Restrict to owner/admin role only
CREATE POLICY "orders_public_update" ON orders 
  FOR UPDATE USING (true);

-- ==========================================
-- ADMIN WRITE POLICIES
-- TODO: Add these when auth is implemented
-- ==========================================
-- Example for future:
-- CREATE POLICY "products_admin_write" ON products
--   FOR ALL USING (
--     auth.jwt() ->> 'role' = 'admin' OR 
--     auth.jwt() ->> 'role' = 'superadmin'
--   );
