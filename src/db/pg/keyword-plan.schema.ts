import { sql } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { projects } from "./app.schema";

const isoNow = sql`to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

export const keywordPlanItems = pgTable(
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
    updatedAt: text("updated_at").notNull().default(isoNow),
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
