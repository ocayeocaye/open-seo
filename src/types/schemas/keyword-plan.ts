import { z } from "zod";

export const keywordPlanRowSchema = z.object({
  phrase: z.string().trim().min(1).max(200),
  market: z.string().trim().min(1).max(80),
  language: z.string().trim().min(2).max(20),
  status: z.string().trim().min(1).max(80),
  priority: z.string().trim().min(1).max(32),
  destination: z.string().trim().min(1).max(512),
  rationale: z.string().trim().max(1000).default(""),
});

export const importKeywordPlanSchema = z.object({
  rows: z.array(keywordPlanRowSchema).min(1).max(500),
});

export const listKeywordPlanSchema = z.object({
  search: z.string().trim().max(200).optional(),
  market: z.string().trim().max(80).optional(),
  priority: z.string().trim().max(32).optional(),
  page: z.number().int().min(1).max(100000).default(1),
  pageSize: z.union([z.literal(20), z.literal(50), z.literal(100)]).default(50),
});

export type KeywordPlanRow = z.infer<typeof keywordPlanRowSchema>;
export type KeywordPlanListInput = z.infer<typeof listKeywordPlanSchema>;
