import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireProjectContext } from "@/serverFunctions/middleware";
import { KeywordPlanService } from "@/server/features/keywords/services/KeywordPlanService";
import {
  importKeywordPlanSchema,
  listKeywordPlanSchema,
} from "@/types/schemas/keyword-plan";

const projectScope = { projectId: z.string().min(1) };

export const getKeywordPlan = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(listKeywordPlanSchema.extend(projectScope))
  .handler(({ data, context }) =>
    KeywordPlanService.list(context.projectId, data),
  );

export const getKeywordPlanSummary = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(z.object(projectScope))
  .handler(({ context }) => KeywordPlanService.summary(context.projectId));

export const importKeywordPlan = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(importKeywordPlanSchema.extend(projectScope))
  .handler(({ data, context }) =>
    KeywordPlanService.importRows(context.projectId, data.rows),
  );
