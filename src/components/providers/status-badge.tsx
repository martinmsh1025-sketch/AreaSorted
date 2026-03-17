import { providerDocumentStatusLabels, providerDocumentToneClass, providerStatusLabels, providerStatusToneClass } from "@/lib/providers/service-catalog-mapping";

export function ProviderStatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${providerStatusToneClass[status] || "status-badge-legacy"}`}>{providerStatusLabels[status] || status}</span>;
}

export function ProviderDocumentBadge({ status }: { status: string }) {
  return <span className={`status-badge ${providerDocumentToneClass[status] || "status-badge-legacy"}`}>{providerDocumentStatusLabels[status] || status}</span>;
}
