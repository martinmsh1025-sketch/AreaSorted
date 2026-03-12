import Image from "next/image";

type WashHubLogoProps = {
  compact?: boolean;
  className?: string;
};

export function WashHubLogo({ compact = false, className = "" }: WashHubLogoProps) {
  return (
    <span className={["washhub-logo", compact ? "washhub-logo-compact" : "", className].filter(Boolean).join(" ")}>
      <Image
        src="/images/washhub-logo.png"
        alt="WashHub"
        width={242}
        height={234}
        priority
        className="washhub-logo-image"
      />
    </span>
  );
}
