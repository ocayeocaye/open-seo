import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ProjectPageHeader } from "@/client/features/projects/ProjectPageHeader";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import {
  getKeywordPlan,
  getKeywordPlanSummary,
  importKeywordPlan,
} from "@/serverFunctions/keyword-plan";
import {
  importKeywordPlanSchema,
  keywordPlanRowSchema,
} from "@/types/schemas/keyword-plan";

export const Route = createFileRoute("/_app/p/$projectId/plan")({
  component: KeywordPlanPage,
});

const PAGE_SIZE = 50 as const;
const IMPORT_BATCH_SIZE = 500;
const MAX_FILE_BYTES = 16 * 1024 * 1024;

function KeywordPlanPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [market, setMarket] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const summary = useQuery({
    queryKey: ["keyword-plan-summary", projectId],
    queryFn: () => getKeywordPlanSummary(),
  });
  const listing = useQuery({
    queryKey: ["keyword-plan", projectId, search, market, priority, page],
    queryFn: () =>
      getKeywordPlan({
        data: { search, market, priority, page, pageSize: PAGE_SIZE },
      }),
  });

  async function importFile(file: File) {
    setError("");
    setImportProgress("");
    if (file.size > MAX_FILE_BYTES) {
      setError("Choose a plan file smaller than 16 MB.");
      return;
    }
    setImporting(true);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("keywords" in parsed) ||
        !Array.isArray(parsed.keywords) ||
        parsed.keywords.length === 0
      ) {
        throw new Error("The file needs a non-empty keywords array.");
      }
      // Validate the entire file before any batch is written, so a malformed
      // row near the end cannot leave a partly imported plan.
      const rows = parsed.keywords.map((row: unknown) =>
        keywordPlanRowSchema.parse(row),
      );
      for (let offset = 0; offset < rows.length; offset += IMPORT_BATCH_SIZE) {
        // The server validates every row and upserts by phrase, country and language.
        const batch = importKeywordPlanSchema.parse({
          rows: rows.slice(offset, offset + IMPORT_BATCH_SIZE),
        });
        await importKeywordPlan({ data: batch });
        setImportProgress(
          `${Math.min(offset + batch.rows.length, rows.length).toLocaleString()} of ${rows.length.toLocaleString()} rows imported`,
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["keyword-plan", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["keyword-plan-summary", projectId],
        }),
      ]);
      setImportProgress(
        `${rows.length.toLocaleString()} rows accepted. Reimporting the same plan updates existing rows.`,
      );
    } catch (cause) {
      setError(getStandardErrorMessage(cause));
    } finally {
      setImporting(false);
    }
  }

  const rows = listing.data?.rows ?? [];
  const totalCount = listing.data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="h-full overflow-auto px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ProjectPageHeader projectId={projectId} title="Keyword Plan" />
        <p className="text-sm text-muted-foreground">
          Possible searches and proposed pages. These are planning candidates,
          not Google queries, rankings, or measured demand. Research selected
          phrases before saving them as priorities.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Candidate rows</div>
            <div className="text-2xl font-semibold">
              {(summary.data?.totalCount ?? 0).toLocaleString()}
            </div>
          </div>
          {summary.data?.markets.map((entry) => (
            <div key={entry.market} className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">
                {entry.market}
              </div>
              <div className="text-2xl font-semibold">
                {entry.count.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Import a private plan</h2>
          <p className="text-sm text-muted-foreground">
            Choose a JSON file with a keywords array. The plan is stored for
            this OpenSEO project and shared with its authorized members.
            Importing does not look up metrics or use research credits.
          </p>
          <input
            aria-label="Import keyword plan JSON"
            type="file"
            accept=".json,application/json"
            disabled={importing}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void importFile(file);
              event.currentTarget.value = "";
            }}
          />
          {importProgress && (
            <p role="status" className="text-sm">
              {importProgress}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </section>
        <section className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-52 flex-1 gap-1 text-sm">
              Find a phrase
              <input
                className="rounded-md border bg-background px-3 py-2"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Try plumber or scheduling"
              />
            </label>
            <label className="grid min-w-48 gap-1 text-sm">
              Country
              <select
                className="rounded-md border bg-background px-3 py-2"
                value={market}
                onChange={(event) => {
                  setMarket(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All countries</option>
                {summary.data?.markets.map(({ market: name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-36 gap-1 text-sm">
              Priority
              <select
                className="rounded-md border bg-background px-3 py-2"
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All priorities</option>
                {["P1", "P2", "P3", "Later", "Do not target"].map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            {listing.isPending
              ? "Loading plan…"
              : `${totalCount.toLocaleString()} matching rows`}
          </p>
          {listing.isError && (
            <p role="alert">{getStandardErrorMessage(listing.error)}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Phrase</th>
                  <th className="p-2">Country</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Proposed page</th>
                  <th className="p-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b align-top">
                    <td className="p-2 font-medium">{row.phrase}</td>
                    <td className="p-2">{row.market}</td>
                    <td className="p-2">{row.priority}</td>
                    <td className="p-2">{row.status}</td>
                    <td className="p-2">{row.destination}</td>
                    <td className="p-2 text-muted-foreground">
                      {row.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm">
            <button
              className="rounded-md border px-3 py-2 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              className="rounded-md border px-3 py-2 disabled:opacity-50"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
