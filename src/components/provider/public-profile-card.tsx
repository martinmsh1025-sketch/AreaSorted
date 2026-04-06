type ProviderPublicProfile = {
  providerName: string;
  profileImageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  hasDbs?: boolean;
  hasInsurance?: boolean;
};

function fallbackInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProviderPublicProfileCard({ profile }: { profile: ProviderPublicProfile }) {
  return (
    <div className="flex gap-5 items-start">
      {profile.profileImageUrl ? (
        <img src={profile.profileImageUrl} alt={profile.providerName} className="h-28 w-28 rounded-3xl object-cover border shadow-sm" />
      ) : (
        <div className="h-28 w-28 rounded-3xl border bg-slate-100 text-slate-700 flex items-center justify-center text-lg font-semibold shadow-sm">
          {fallbackInitials(profile.providerName)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <strong style={{ display: "block", overflowWrap: "anywhere", fontSize: "1.08rem", lineHeight: 1.35 }}>{profile.providerName}</strong>
        {profile.headline ? (
          <p
            style={{
              marginTop: "0.2rem",
              fontSize: "0.98rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.45,
              overflowWrap: "anywhere",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {profile.headline}
          </p>
        ) : null}
        {profile.yearsExperience ? <p style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>{profile.yearsExperience}+ years experience</p> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.45rem" }}>
          {profile.hasDbs ? <span className="quote-map-badge">DBS</span> : null}
          {profile.hasInsurance ? <span className="quote-map-badge">Insured</span> : null}
        </div>
        {profile.bio ? (
          <p
            style={{
              marginTop: "0.65rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
              fontSize: "0.92rem",
              overflowWrap: "anywhere",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {profile.bio}
          </p>
        ) : null}
      </div>
    </div>
  );
}
