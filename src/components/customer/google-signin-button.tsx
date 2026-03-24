import Link from "next/link";

type GoogleSignInButtonProps = {
  label: string;
  nextPath?: string;
};

export function GoogleSignInButton({ label, nextPath = "/account" }: GoogleSignInButtonProps) {
  return (
    <Link
      href={`/api/auth/google/start?next=${encodeURIComponent(nextPath)}`}
      className="button button-secondary"
      style={{ width: "100%", justifyContent: "center" }}
    >
      {label}
    </Link>
  );
}
