CREATE TABLE "operational_event" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "operational_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"event_name" varchar(64) NOT NULL,
	"operation_id" varchar(128),
	"auth_method" varchar(20),
	"setup_type" varchar(20),
	"workflow_step" varchar(40),
	"error_category" varchar(40),
	"document_format" varchar(12),
	"download_source" varchar(20),
	"label_type" varchar(30),
	"label_size" varchar(12),
	"template_version" varchar(30),
	"duration_ms" integer,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "operational_event" ADD CONSTRAINT "operational_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "operational_event_name_operation_uidx" ON "operational_event" USING btree ("event_name","operation_id");--> statement-breakpoint
CREATE INDEX "operational_event_user_created_idx" ON "operational_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "operational_event_name_created_idx" ON "operational_event" USING btree ("event_name","created_at");