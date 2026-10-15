CREATE TABLE "keyword_plan_items" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"phrase" text NOT NULL,
	"normalized_phrase" text NOT NULL,
	"market" text NOT NULL,
	"language" text NOT NULL,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"destination" text NOT NULL,
	"rationale" text NOT NULL,
	"updated_at" text DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "keyword_plan_items" ADD CONSTRAINT "keyword_plan_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "keyword_plan_project_phrase_market_language_idx" ON "keyword_plan_items" USING btree ("project_id","normalized_phrase","market","language");--> statement-breakpoint
CREATE INDEX "keyword_plan_project_market_idx" ON "keyword_plan_items" USING btree ("project_id","market");--> statement-breakpoint
CREATE INDEX "keyword_plan_project_priority_idx" ON "keyword_plan_items" USING btree ("project_id","priority");