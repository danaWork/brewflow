ALTER TABLE "products" ADD COLUMN "sale_discount_type" "discount_type";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_discount_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_label" text;