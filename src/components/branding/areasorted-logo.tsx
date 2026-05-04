import Image from "next/image";

type AreaSortedLogoProps = {
  compact?: boolean;
  className?: string;
};

export function AreaSortedLogo({ compact = false, className = "" }: AreaSortedLogoProps) {
  return (
    <span className={["areasorted-logo", compact ? "areasorted-logo-compact" : "", className].filter(Boolean).join(" ")}>
      <Image
        src={compact ? "/images/logo/areasorted-logo-horizontal-clean.png" : "/images/logo/areasorted-logo-primary-clean.png"}
        alt="AreaSorted"
        width={compact ? 470 : 1245}
        height={compact ? 190 : 350}
        className="areasorted-logo-image"
        priority={compact}
      />
    </span>
  );
}
