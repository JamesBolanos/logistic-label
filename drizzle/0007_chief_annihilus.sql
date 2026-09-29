ALTER TABLE "logistic_label" ADD COLUMN "ship_from" text;--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "ship_to" text;--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "purchase_order" varchar(50);--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "carrier" varchar(100);--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "gross_weight" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "gross_weight_unit" varchar(3);--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "transport_count" integer;--> statement-breakpoint
ALTER TABLE "logistic_label" ADD COLUMN "transport_count_type" varchar(30);