import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { projects } from "./app.schema";

// Planning candidates are deliberately separate from measured/saved keywords.
export const keywordPlanItems = sqliteTable(
  "keyword_plan_items",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    phrase: text("phrase").notNull(),
    normalizedPhrase: text("normalized_phrase").notNull(),
    market: text("market").notNull(),
    language: text("language").notNull(),
    status: text("status").notNull(),
    priority: text("priority").notNull(),
    destination: text("destination").notNull(),
    rationale: text("rationale").notNull(),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    uniqueIndex("keyword_plan_project_phrase_market_language_idx").on(
      table.projectId,
      table.normalizedPhrase,
      table.market,
      table.language,
    ),
    index("keyword_plan_project_market_idx").on(table.projectId, table.market),
    index("keyword_plan_project_priority_idx").on(
      table.projectId,
      table.priority,
    ),
  ],
);
