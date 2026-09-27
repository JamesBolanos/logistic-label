ALTER TABLE "logistic_label" ALTER COLUMN "gtin" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "logistic_label" ALTER COLUMN "lot_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "logistic_label" ALTER COLUMN "production_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "logistic_label" ALTER COLUMN "quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "logistic_label" ALTER COLUMN "weight_pounds" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "label_type" varchar(30) DEFAULT 'legacy_demo' NOT NULL;--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "template_version" varchar(30) DEFAULT 'v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "packaging_level" varchar(30);