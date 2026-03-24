ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE text USING "payment_method"::text;--> statement-breakpoint
CREATE TABLE "company_payment_methods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "company_payment_methods" ADD CONSTRAINT "company_payment_methods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_payment_methods_company_idx" ON "company_payment_methods" USING btree ("company_id");--> statement-breakpoint
