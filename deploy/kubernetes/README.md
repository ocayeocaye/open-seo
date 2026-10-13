# Temporary Kubernetes deployment

Deploy the pinned ARM64 OpenSEO image with `kubectl --context YOUR_CONTEXT apply -f deploy/kubernetes/open-seo.yaml`. This is a standalone, unregistered temporary deployment. Review the namespace and node selector for your cluster.

The Service is ClusterIP only; no public Ingress is created. Access it using `kubectl -n by-freddie-seo port-forward service/open-seo 3311:3001`, then open http://127.0.0.1:3311. The MCP endpoint is http://127.0.0.1:3311/mcp. Do not expose local_noauth to the public internet.

The node-local data directory persists across pod replacement but requires an off-node backup before deleting the Kubernetes node. Resource limits cover the upstream image's first-start build. Telemetry is disabled.

Supply DATAFORSEO_API_KEY using an existing secret mechanism to enable SEO data operations. No credentials are included. A ready application is not evidence that provider-backed measurements or audits have run.
