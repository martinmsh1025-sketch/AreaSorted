type WashHubLogoProps = {
  compact?: boolean;
  className?: string;
};

export function WashHubLogo({ compact = false, className = "" }: WashHubLogoProps) {
  return (
    <span className={["washhub-logo", compact ? "washhub-logo-compact" : "", className].filter(Boolean).join(" ")}>
      <span className="washhub-logo-mark">A</span>
      <span className="washhub-logo-wordmark">
        <strong>AreaSorted</strong>
        {!compact ? <small>.com</small> : null}
      </span>
    </span>
  );
}
