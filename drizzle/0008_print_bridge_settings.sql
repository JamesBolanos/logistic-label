ALTER TABLE "label_settings" ADD COLUMN "print_bridge_host" text DEFAULT '127.0.0.1' NOT NULL;--> statement-breakpoint
ALTER TABLE "label_settings" ADD COLUMN "print_bridge_port" integer DEFAULT 8080 NOT NULL;--> statement-breakpoint
ALTER TABLE "label_settings" ADD COLUMN "printer_hostname" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "label_settings" ADD COLUMN "printer_port" integer DEFAULT 9100 NOT NULL;--> statement-breakpoint
ALTER TABLE "label_settings" ADD COLUMN "printer_dpi" integer DEFAULT 203 NOT NULL;