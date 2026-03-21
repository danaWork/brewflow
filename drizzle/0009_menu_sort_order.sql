ALTER TABLE "categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Back-fill deterministic order (matches previous implicit id-based ordering)
UPDATE "categories" AS c
SET "sort_order" = sub.rn
FROM (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY id) - 1)::integer AS rn
  FROM categories
) AS sub
WHERE c.id = sub.id;--> statement-breakpoint
UPDATE "products" AS p
SET "sort_order" = sub.rn
FROM (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY id) - 1)::integer AS rn
  FROM products
) AS sub
WHERE p.id = sub.id;
