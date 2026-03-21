import { Loader2 } from "lucide-react";

type PageLoadingProps = {
  title?: string;
  message?: string;
  fullscreen?: boolean;
};

export function PageLoading({
  title = "Loading...",
  message = "Please wait while we prepare this page.",
  fullscreen = false,
}: PageLoadingProps) {
  const wrapperClass = fullscreen ? "page-loading-overlay" : "page-loading-shell";

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <div className="page-loading-card">
        <span className="page-loading-spinner-wrap" aria-hidden="true">
          <span className="page-loading-spinner" />
          <Loader2 className="page-loading-icon" />
        </span>
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
    </div>
  );
}
