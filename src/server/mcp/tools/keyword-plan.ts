import { z } from "zod";
import { KeywordPlanService } from "@/server/features/keywords/services/KeywordPlanService";
import { mcpResponse } from "@/server/mcp/formatters";
import { buildProjectMeta } from "@/server/mcp/context";
import { optionalMetaOutputSchema } from "@/server/mcp/output-schemas";
import { withMcpProjectAuth } from "@/server/mcp/project-auth";
import { projectIdSchema } from "@/server/mcp/schemas";
import {
  importKeywordPlanSchema,
  listKeywordPlanSchema,
} from "@/types/schemas/keyword-plan";

const rowOutput = z.looseObject({
  id: z.string(),
  phrase: z.string(),
  market: z.string(),
  language: z.string(),
  status: z.string(),
  priority: z.string(),
  destination: z.string(),
  rationale: z.string(),
  updatedAt: z.string(),
});

const listInput = {
  projectId: projectIdSchema,
  ...listKeywordPlanSchema.shape,
} as const;

export const listKeywordPlanTool = {
  name: "list_keyword_plan",
  config: {
    title: "List keyword plan",
    description:
      "Read unmeasured keyword planning candidates for one project. Filter by phrase, country or priority and page through results. Uses no credits and does not claim Google demand or rankings. These rows are distinct from Saved Keywords.",
    inputSchema: listInput,
    outputSchema: z.looseObject({
      rows: z.array(rowOutput),
      totalCount: z.number(),
      page: z.number(),
      pageSize: z.number(),
      ...optionalMetaOutputSchema,
    }),
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  handler: withMcpProjectAuth(
    async (args: z.infer<z.ZodObject<typeof listInput>>, context) => {
      const result = await KeywordPlanService.list(args.projectId, args);
      return mcpResponse({
        text:
          result.rows.length === 0
            ? "No planning candidates match."
            : `Keyword plan (${result.rows.length} of ${result.totalCount}):\n` +
              result.rows
                .map(
                  (row) =>
                    `- ${row.phrase} · ${row.market} · ${row.priority} · ${row.status} · ${row.destination}`,
                )
                .join("\n"),
        meta: buildProjectMeta(
          context,
          args.projectId,
          `/p/${args.projectId}/plan`,
        ),
        structuredContent: result,
      });
    },
  ),
};

const importInput = {
  projectId: projectIdSchema,
  ...importKeywordPlanSchema.shape,
} as const;

export const importKeywordPlanTool = {
  name: "import_keyword_plan",
  config: {
    title: "Import keyword plan",
    description:
      "Upsert up to 500 unmeasured planning candidates for one authorized project. Identity is normalized phrase + country + language. Reimporting updates page, status, priority and rationale; it never deletes missing rows or calls a paid provider. Use only for an explicitly selected project plan.",
    inputSchema: importInput,
    outputSchema: z.looseObject({
      projectId: z.string(),
      accepted: z.number(),
      unique: z.number(),
      ...optionalMetaOutputSchema,
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  handler: withMcpProjectAuth(
    async (args: z.infer<z.ZodObject<typeof importInput>>, context) => {
      const result = await KeywordPlanService.importRows(
        args.projectId,
        args.rows,
      );
      return mcpResponse({
        text: `Accepted ${result.accepted} planning rows (${result.unique} unique in this batch) for project ${args.projectId}. No metrics were fetched.`,
        meta: buildProjectMeta(
          context,
          args.projectId,
          `/p/${args.projectId}/plan`,
        ),
        structuredContent: { projectId: args.projectId, ...result },
      });
    },
  ),
};
