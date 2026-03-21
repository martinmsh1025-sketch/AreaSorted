type AreaSortedLogoProps = {
  compact?: boolean;
  className?: string;
};

export function AreaSortedLogo({ compact = false, className = "" }: AreaSortedLogoProps) {
  return (
    <span className={["areasorted-logo", compact ? "areasorted-logo-compact" : "", className].filter(Boolean).join(" ")}>
      <span className="areasorted-logo-mark" aria-hidden="true">AS</span>
      <span className="areasorted-logo-wording">
        <span className="areasorted-logo-name">AreaSorted</span>
        {!compact && <span className="areasorted-logo-tag">London local services</span>}
      </span>
    </span>
  );
}
