import { pgTable, text, decimal, boolean, timestamp, uuid, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums based on the ER Diagram
export const roleEnum = pgEnum('role', ['SUPERADMIN', 'BRANCH_MANAGER', 'KITCHEN_STAFF']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'GCASH', 'PAYMAYA']);

// Tables

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contactEmail: text('contact_email'),
});

export const branches = pgTable('branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  branchName: text('branch_name').notNull(),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  branchId: uuid('branch_id').references(() => branches.id), // NULL for SuperAdmin
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  name: text('name').notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isHidden: boolean('is_hidden').default(false).notNull(),
});

export const modifierGroups = pgTable('modifier_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
});

export const modifierOptions = pgTable('modifier_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  modifierGroupId: uuid('modifier_group_id').references(() => modifierGroups.id).notNull(),
  name: text('name').notNull(),
});

export const productModifierLinks = pgTable('product_modifier_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  modifierGroupId: uuid('modifier_group_id').references(() => modifierGroups.id).notNull(),
});

export const tables = pgTable('tables', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  tableNumber: text('table_number').notNull(),
  qrIdentifier: text('qr_identifier').notNull(),
});

export const branchProductAvailability = pgTable('branch_product_availability', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  isInStock: boolean('is_in_stock').default(true).notNull(),
  branchPriceOverride: decimal('branch_price_override', { precision: 10, scale: 2 }),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  tableId: uuid('table_id').references(() => tables.id).notNull(),
  status: orderStatusEnum('status').default('PENDING').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  readyAt: timestamp('ready_at'),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtTime: decimal('price_at_time', { precision: 10, scale: 2 }).notNull(),
});

export const orderItemModifiers = pgTable('order_item_modifiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id').references(() => orderItems.id).notNull(),
  modifierOptionId: uuid('modifier_option_id').references(() => modifierOptions.id).notNull(),
  priceCharged: decimal('price_charged', { precision: 10, scale: 2 }).notNull(),
});

// Relations

export const companiesRelations = relations(companies, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  categories: many(categories),
  modifierGroups: many(modifierGroups),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  company: one(companies, { fields: [branches.companyId], references: [companies.id] }),
  users: many(users),
  tables: many(tables),
  orders: many(orders),
  productAvailability: many(branchProductAvailability),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [users.branchId], references: [branches.id] }),
  tokens: many(passwordResetTokens),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  company: one(companies, { fields: [categories.companyId], references: [companies.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  modifierLinks: many(productModifierLinks),
  orderItems: many(orderItems),
  branchAvailability: many(branchProductAvailability),
}));

export const modifierGroupsRelations = relations(modifierGroups, ({ one, many }) => ({
  company: one(companies, { fields: [modifierGroups.companyId], references: [companies.id] }),
  options: many(modifierOptions),
  productLinks: many(productModifierLinks),
}));

export const modifierOptionsRelations = relations(modifierOptions, ({ one, many }) => ({
  group: one(modifierGroups, { fields: [modifierOptions.modifierGroupId], references: [modifierGroups.id] }),
  orderItemModifiers: many(orderItemModifiers),
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  branch: one(branches, { fields: [tables.branchId], references: [branches.id] }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  branch: one(branches, { fields: [orders.branchId], references: [branches.id] }),
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  modifiers: many(orderItemModifiers),
}));

export const orderItemModifiersRelations = relations(orderItemModifiers, ({ one }) => ({
  orderItem: one(orderItems, { fields: [orderItemModifiers.orderItemId], references: [orderItems.id] }),
  modifierOption: one(modifierOptions, { fields: [orderItemModifiers.modifierOptionId], references: [modifierOptions.id] }),
}));
