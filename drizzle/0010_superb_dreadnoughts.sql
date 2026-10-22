ALTER TABLE "product" ADD COLUMN "gs1_valid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Backfill the flag for numbers saved before this column existed. Stored values
-- are always the padded 14-digit form, so the GS1 mod-10 check applies directly
-- (weights 3 and 1 alternating from the digit next to the check digit).
UPDATE "product"
SET "gs1_valid" = (
  (10 - (
    (
      SELECT sum(substr("gtin", i, 1)::int * CASE WHEN (14 - i) % 2 = 1 THEN 3 ELSE 1 END)
      FROM generate_series(1, 13) AS i
    ) % 10
  )) % 10
) = substr("gtin", 14, 1)::int
WHERE "gtin" ~ '^[0-9]{14}$';
