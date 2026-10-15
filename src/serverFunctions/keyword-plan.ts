import { createServerFn } from "@tanstack/react-start";
import { requireProjectContext } from "@/serverFunctions/middleware";
import { KeywordPlanService } from "@/server/features/keywords/services/KeywordPlanService";
import {
  importKeywordPlanSchema,
  listKeywordPlanSchema,
} from "@/types/schemas/keyword-plan";

export const getKeywordPlan = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(listKeywordPlanSchema)
  .handler(({ data, context }) =>
    KeywordPlanService.list(context.projectId, data),
  );

export const getKeywordPlanSummary = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .handler(({ context }) => KeywordPlanService.summary(context.projectId));

export const importKeywordPlan = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(importKeywordPlanSchema)
  .handler(({ data, context }) =>
    KeywordPlanService.importRows(context.projectId, data.rows),
  );
