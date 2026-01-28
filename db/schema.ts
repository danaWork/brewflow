import { pgTable, text, decimal, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tables = pgTable('tables', {
  id: uuid('id').defaultRandom().primaryKey(),
  qrCode: text('qr_code').notNull().unique(), // "table-1"
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tablesRelations = relations(tables, ({ many }) => ({
  orders: many(orders),
}));

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').default('drink'), // 'drink' or 'snack'
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  image: text('image'),
  isSignature: boolean('is_signature').default(false),
  categoryId: uuid('category_id').references(() => categories.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableId: uuid('table_id').references(() => tables.id),
  status: text('status').default('PENDING'), // PENDING, COMPLETED
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  items: jsonb('items'), // Storing items as JSON for simplicity as agreed
  specialInstructions: text('special_instructions'),
  paymentMethod: text('payment_method').default('Cash'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
}));

export const modifiers = pgTable('modifiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  type: text('type').notNull(), // 'milk', 'topping', 'sweetness', 'ice'
  image: text('image'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const productModifiers = pgTable('product_modifiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  modifierId: uuid('modifier_id').references(() => modifiers.id),
});

export const productRelations = pgTable('product_relations', {
  id: uuid('id').defaultRandom().primaryKey(),
  parentProductId: uuid('parent_product_id').references(() => products.id),
  childProductId: uuid('child_product_id').references(() => products.id),
  type: text('type').notNull(), // 'upsell', 'frequently_bought'
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
});

