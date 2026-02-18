ALTER TABLE "modifier_groups" ADD COLUMN "display_mode" text DEFAULT 'list' NOT NULL;--> statement-breakpoint
ALTER TABLE "modifier_options" ADD COLUMN "price" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "modifier_options" ADD COLUMN "image_url" text;