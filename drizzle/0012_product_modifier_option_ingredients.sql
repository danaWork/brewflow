CREATE TABLE "product_modifier_option_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"modifier_option_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity_required" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_modifier_option_ingredients" ADD CONSTRAINT "product_modifier_option_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_modifier_option_ingredients" ADD CONSTRAINT "product_modifier_option_ingredients_modifier_option_id_modifier_options_id_fk" FOREIGN KEY ("modifier_option_id") REFERENCES "public"."modifier_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_modifier_option_ingredients" ADD CONSTRAINT "product_modifier_option_ingredients_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;
