type WashHubLogoProps = {
  compact?: boolean;
  className?: string;
};

export function WashHubLogo({ compact = false, className = "" }: WashHubLogoProps) {
  return (
    <span className={["washhub-logo", compact ? "washhub-logo-compact" : "", className].filter(Boolean).join(" ")}>
      <img src={compact ? "/images/brand/areasorted-logo-header.png" : "/images/brand/areasorted-logo-trimmed.png"} alt="AreaSorted.com" className="washhub-logo-image" />
    </span>
  );
}
