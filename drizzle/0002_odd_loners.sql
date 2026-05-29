CREATE TABLE "label_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"company_name" text DEFAULT 'Company Name' NOT NULL,
	"gs1_company_prefix" varchar(12),
	"extension_digit" varchar(1) DEFAULT '0' NOT NULL,
	"next_serial_reference" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "label_settings" ADD CONSTRAINT "label_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;