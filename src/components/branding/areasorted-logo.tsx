type AreaSortedLogoProps = {
  compact?: boolean;
  className?: string;
};

export function AreaSortedLogo({ compact = false, className = "" }: AreaSortedLogoProps) {
  return (
    <span className={["areasorted-logo", compact ? "areasorted-logo-compact" : "", className].filter(Boolean).join(" ")}>
      <img src={compact ? "/images/brand/areasorted-logo-tight.png" : "/images/brand/areasorted-logo.png"} alt="AreaSorted.com" className="areasorted-logo-image" />
    </span>
  );
}
