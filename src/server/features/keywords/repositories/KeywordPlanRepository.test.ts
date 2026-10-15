import { readFileSync } from "node:fs";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { KeywordPlanRepository } from "./KeywordPlanRepository";

const { client, testDb } = await vi.hoisted(async () => {
  const { createClient } = await import("@libsql/client");
  const { drizzle } = await import("drizzle-orm/libsql");
  const sqliteClient = createClient({ url: "file::memory:" });
  return { client: sqliteClient, testDb: drizzle(sqliteClient) };
});
vi.mock("cloudflare:workers", () => ({ env: { DATABASE_PROVIDER: "d1" } }));
vi.mock("@/db", () => ({ db: testDb }));

beforeAll(async () => {
  await client.execute("CREATE TABLE projects (id TEXT PRIMARY KEY)");
  const migration = readFileSync(
    "drizzle/sqlite/0055_plain_mindworm.sql",
    "utf8",
  ).replaceAll("--> statement-breakpoint", "");
  await client.executeMultiple(migration);
});

afterAll(() => client.close());
beforeEach(async () => {
  await client.execute("DELETE FROM keyword_plan_items");
  await client.execute("DELETE FROM projects");
  await client.execute("INSERT INTO projects (id) VALUES ('one'), ('two')");
});

const row = (phrase: string) => ({
  phrase,
  market: "United Kingdom",
  language: "en-GB",
  status: "proposed",
  priority: "P2",
  destination: "/services/",
  rationale: "Candidate only",
});

describe("keyword planning persistence", () => {
  it("upserts normalized phrases, handles duplicates within a batch, and keeps projects separate", async () => {
    await expect(
      KeywordPlanRepository.upsert("one", [
        row("House Painter"),
        row(" house   painter "),
      ]),
    ).resolves.toEqual({ accepted: 2, unique: 1 });
    await KeywordPlanRepository.upsert("two", [row("House Painter")]);

    const one = await KeywordPlanRepository.list("one", {
      page: 1,
      pageSize: 20,
    });
    expect(one.totalCount).toBe(1);
    expect(one.rows[0]).toMatchObject({ phrase: "house painter" });
    expect((await KeywordPlanRepository.summary("two")).totalCount).toBe(1);
  });

  it("treats LIKE wildcard characters as literal search text", async () => {
    await KeywordPlanRepository.upsert("one", [
      row("100% design"),
      row("1000 design"),
      row("A_B"),
    ]);
    const matches = await KeywordPlanRepository.list("one", {
      search: "100%",
      page: 1,
      pageSize: 20,
    });
    expect(matches.rows.map(({ phrase }) => phrase)).toEqual(["100% design"]);
    expect(
      (
        await KeywordPlanRepository.list("one", {
          search: "A_B",
          page: 1,
          pageSize: 20,
        })
      ).totalCount,
    ).toBe(1);
  });
});
