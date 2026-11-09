ALTER TABLE "product" ADD COLUMN "gpc" varchar(8);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "target_market" jsonb DEFAULT '[]'::jsonb;