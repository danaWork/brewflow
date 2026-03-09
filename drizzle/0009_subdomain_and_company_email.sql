-- Add subdomain to companies (nullable first for backfill)
ALTER TABLE "companies" ADD COLUMN "subdomain" text;
--> statement-breakpoint
-- Backfill existing companies with unique subdomains (first gets 'hq', others get shop-<id prefix>)
UPDATE "companies" SET "subdomain" = 'hq' WHERE "subdomain" IS NULL AND "id" = (SELECT "id" FROM "companies" WHERE "subdomain" IS NULL ORDER BY "id" LIMIT 1);
UPDATE "companies" SET "subdomain" = 'shop-' || REPLACE(SUBSTRING("id"::text FROM 1 FOR 8), '-', '') WHERE "subdomain" IS NULL;
--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "subdomain" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "companies_subdomain_unique" ON "companies" USING btree ("subdomain");
--> statement-breakpoint
-- Replace global email unique with (company_id, email) unique
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "users_company_email_unique" ON "users" USING btree ("company_id","email");
