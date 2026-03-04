import { pgTable, text, decimal, boolean, timestamp, uuid, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums based on the ER Diagram
export const roleEnum = pgEnum('role', ['SUPERADMIN', 'BRANCH_MANAGER', 'KITCHEN_STAFF']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'GCASH', 'PAYMAYA']);
export const paymentStatusEnum = pgEnum('payment_status', ['UNPAID', 'PAID']);
export const promotionTypeEnum = pgEnum('promotion_type', ['PERFECT_PAIR', 'CROSS_SELL']);
export const discountTypeEnum = pgEnum('discount_type', ['PERCENTAGE', 'FIXED']);

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
  type: text('type').default('drink').notNull(), // 'drink' or 'snack'
  config: text('config'), // JSON string for UI configuration/steps
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  name: text('name').notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isHidden: boolean('is_hidden').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isQuickCartItem: boolean('is_quick_cart_item').default(false).notNull(),
});

// Circular ref with modifierOptions; TypeScript cannot infer type. See modifierOptions below.
// @ts-expect-error - circular table reference (modifierGroups <-> modifierOptions)
export const modifierGroups = pgTable('modifier_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  displayMode: text('display_mode').default('list').notNull(), // 'list', 'buttons', 'cards'
  // @ts-expect-error - callback in references() has circular return type
  defaultOptionId: uuid('default_option_id').references(() => modifierOptions.id),
});

// @ts-expect-error - circular table reference (modifierOptions <-> modifierGroups)
export const modifierOptions = pgTable('modifier_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  // @ts-expect-error - callback in references() has circular return type
  modifierGroupId: uuid('modifier_group_id').references(() => modifierGroups.id).notNull(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0').notNull(),
  imageUrl: text('image_url'),
});

export const productModifierLinks = pgTable('product_modifier_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  modifierGroupId: uuid('modifier_group_id').references(() => modifierGroups.id).notNull(),
  defaultModifierOptionId: uuid('default_modifier_option_id').references(() => modifierOptions.id),
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
  orderNumber: integer('order_number').notNull(), // Manually computed per shop instead of global identity
  status: orderStatusEnum('status').default('PENDING').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  paymentStatus: paymentStatusEnum('payment_status').default('UNPAID').notNull(),
  note: text('note'),
  subtotalAmount: decimal('subtotal_amount', { precision: 10, scale: 2 }), // Before discounts
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }), // Applied discount value
  discountName: text('discount_name'), // e.g. "PWD", "Senior Citizen", "House 10%"
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  readyAt: timestamp('ready_at'),
  completedAt: timestamp('completed_at'),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id), // Nullable for ad-hoc items
  customName: text('custom_name'), // Name for ad-hoc items if productId is null
  quantity: integer('quantity').notNull(),
  priceAtTime: decimal('price_at_time', { precision: 10, scale: 2 }).notNull(),
  customizations: text('customizations'), // Store as JSON string for ad-hoc options
});

export const orderItemModifiers = pgTable('order_item_modifiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id').references(() => orderItems.id).notNull(),
  modifierOptionId: uuid('modifier_option_id').references(() => modifierOptions.id).notNull(),
  priceCharged: decimal('price_charged', { precision: 10, scale: 2 }).notNull(),
});

export const promotions = pgTable('promotions', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  name: text('name').notNull(),
  type: promotionTypeEnum('type').notNull(),
  triggerType: text('trigger_type').notNull(), // 'PRODUCT' or 'CATEGORY_TYPE'
  triggerValue: text('trigger_value').notNull(), // productId or 'drink'/'snack'
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const promotionItems = pgTable('promotion_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  promotionId: uuid('promotion_id').references(() => promotions.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  productId: uuid('product_id').references(() => products.id),
  type: text('type').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// Inventory System Tables

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  name: text('name').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('0'), // Changed to decimal for flexible units
  unit: text('unit').notNull(), // e.g., 'kg', 'g', 'pcs', 'L', 'ml'
  lowStockThreshold: decimal('low_stock_threshold', { precision: 10, scale: 2 }).default('10'),
  costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productIngredients = pgTable('product_ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  quantityRequired: decimal('quantity_required', { precision: 10, scale: 2 }).notNull(),
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
  promotions: many(promotions),
  notifications: many(notifications),
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
  promotionItems: many(promotionItems),
  productIngredients: many(productIngredients),
  notifications: many(notifications),
}));

export const branchProductAvailabilityRelations = relations(branchProductAvailability, ({ one }) => ({
  branch: one(branches, { fields: [branchProductAvailability.branchId], references: [branches.id] }),
  product: one(products, { fields: [branchProductAvailability.productId], references: [products.id] }),
}));

export const modifierGroupsRelations = relations(modifierGroups, ({ one, many }) => ({
  company: one(companies, { fields: [modifierGroups.companyId], references: [companies.id] }),
  options: many(modifierOptions),
  productLinks: many(productModifierLinks),
}));

export const productModifierLinksRelations = relations(productModifierLinks, ({ one }) => ({
  product: one(products, { fields: [productModifierLinks.productId], references: [products.id] }),
  modifierGroup: one(modifierGroups, { fields: [productModifierLinks.modifierGroupId], references: [modifierGroups.id] }),
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

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').references(() => branches.id),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  shop: one(branches, { fields: [activityLogs.shopId], references: [branches.id] }),
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));

export const promotionsRelations = relations(promotions, ({ one, many }) => ({
  branch: one(branches, { fields: [promotions.branchId], references: [branches.id] }),
  items: many(promotionItems),
}));

export const promotionItemsRelations = relations(promotionItems, ({ one }) => ({
  promotion: one(promotions, { fields: [promotionItems.promotionId], references: [promotions.id] }),
  product: one(products, { fields: [promotionItems.productId], references: [products.id] }),
}));



// Inventory Relations

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  branch: one(branches, { fields: [inventoryItems.branchId], references: [branches.id] }),
  productIngredients: many(productIngredients),
}));

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, { fields: [productIngredients.productId], references: [products.id] }),
  inventoryItem: one(inventoryItems, { fields: [productIngredients.inventoryItemId], references: [inventoryItems.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  branch: one(branches, { fields: [notifications.branchId], references: [branches.id] }),
  product: one(products, { fields: [notifications.productId], references: [products.id] }),
}));
