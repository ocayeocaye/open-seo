import { and, asc, count, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { keywordPlanItems } from "@/db/schema";
import type {
  KeywordPlanListInput,
  KeywordPlanRow,
} from "@/types/schemas/keyword-plan";

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export const KeywordPlanRepository = {
  async upsert(projectId: string, rows: KeywordPlanRow[]) {
    const updatedAt = new Date().toISOString();
    // PostgreSQL rejects a single upsert statement that updates the same
    // conflict target twice. Keep the last occurrence, matching reimport order.
    const uniqueRows = new Map<string, KeywordPlanRow>();
    for (const row of rows) {
      uniqueRows.set(
        JSON.stringify([normalize(row.phrase), row.market, row.language]),
        row,
      );
    }
    const deduplicated = [...uniqueRows.values()];
    for (let offset = 0; offset < deduplicated.length; offset += 50) {
      const values = deduplicated.slice(offset, offset + 50).map((row) => ({
        ...row,
        phrase: row.phrase.trim().replace(/\s+/g, " "),
        id: crypto.randomUUID(),
        projectId,
        normalizedPhrase: normalize(row.phrase),
        updatedAt,
      }));
      await db
        .insert(keywordPlanItems)
        .values(values)
        .onConflictDoUpdate({
          target: [
            keywordPlanItems.projectId,
            keywordPlanItems.normalizedPhrase,
            keywordPlanItems.market,
            keywordPlanItems.language,
          ],
          set: {
            phrase: sql`excluded.phrase`,
            status: sql`excluded.status`,
            priority: sql`excluded.priority`,
            destination: sql`excluded.destination`,
            rationale: sql`excluded.rationale`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    }
    return { accepted: rows.length, unique: deduplicated.length };
  },

  async list(projectId: string, input: KeywordPlanListInput) {
    const clauses: SQL[] = [eq(keywordPlanItems.projectId, projectId)];
    if (input.market) clauses.push(eq(keywordPlanItems.market, input.market));
    if (input.priority)
      clauses.push(eq(keywordPlanItems.priority, input.priority));
    if (input.search) {
      const pattern = `%${escapeLike(normalize(input.search))}%`;
      clauses.push(
        sql`${keywordPlanItems.normalizedPhrase} LIKE ${pattern} ESCAPE ${"\\"}`,
      );
    }
    const where = and(...clauses);
    const [total] = await db
      .select({ value: count() })
      .from(keywordPlanItems)
      .where(where);
    const rows = await db
      .select({
        id: keywordPlanItems.id,
        phrase: keywordPlanItems.phrase,
        market: keywordPlanItems.market,
        language: keywordPlanItems.language,
        status: keywordPlanItems.status,
        priority: keywordPlanItems.priority,
        destination: keywordPlanItems.destination,
        rationale: keywordPlanItems.rationale,
        updatedAt: keywordPlanItems.updatedAt,
      })
      .from(keywordPlanItems)
      .where(where)
      .orderBy(
        asc(keywordPlanItems.market),
        asc(keywordPlanItems.normalizedPhrase),
      )
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);
    return {
      rows,
      totalCount: total?.value ?? 0,
      page: input.page,
      pageSize: input.pageSize,
    };
  },

  async summary(projectId: string) {
    const markets = await db
      .select({ market: keywordPlanItems.market, count: count() })
      .from(keywordPlanItems)
      .where(eq(keywordPlanItems.projectId, projectId))
      .groupBy(keywordPlanItems.market)
      .orderBy(asc(keywordPlanItems.market));
    return {
      totalCount: markets.reduce((sum, row) => sum + row.count, 0),
      markets,
    };
  },
};
