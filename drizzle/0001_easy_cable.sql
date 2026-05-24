CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "logistic_label_user_created_idx" ON "logistic_label" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "logistic_label_user_gtin_idx" ON "logistic_label" USING btree ("user_id","gtin");--> statement-breakpoint
CREATE INDEX "logistic_label_user_lot_idx" ON "logistic_label" USING btree ("user_id","lot_number");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");