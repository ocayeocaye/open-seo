CREATE TABLE `keyword_plan_items` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`phrase` text NOT NULL,
	`normalized_phrase` text NOT NULL,
	`market` text NOT NULL,
	`language` text NOT NULL,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`destination` text NOT NULL,
	`rationale` text NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `keyword_plan_project_phrase_market_language_idx` ON `keyword_plan_items` (`project_id`,`normalized_phrase`,`market`,`language`);--> statement-breakpoint
CREATE INDEX `keyword_plan_project_market_idx` ON `keyword_plan_items` (`project_id`,`market`);--> statement-breakpoint
CREATE INDEX `keyword_plan_project_priority_idx` ON `keyword_plan_items` (`project_id`,`priority`);