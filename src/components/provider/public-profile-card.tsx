type ProviderPublicProfile = {
  providerName: string;
  profileImageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  hasDbs?: boolean;
  hasInsurance?: boolean;
  supportedContactChannels?: string[];
  responseTimeLabel?: string | null;
  serviceCommitments?: string[];
  languagesSpoken?: string[];
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4 items-start">
      {profile.profileImageUrl ? (
        <img src={profile.profileImageUrl} alt={profile.providerName} className="h-24 w-24 rounded-3xl object-cover border border-slate-200 shadow-sm" />
      ) : (
        <div className="h-24 w-24 rounded-3xl border border-slate-200 bg-slate-100 text-slate-700 flex items-center justify-center text-lg font-semibold shadow-sm">
          {fallbackInitials(profile.providerName)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <strong style={{ display: "block", overflowWrap: "anywhere", fontSize: "1.05rem", lineHeight: 1.35, color: "#0f172a" }}>{profile.providerName}</strong>
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
          {profile.responseTimeLabel ? <span className="quote-map-badge">{profile.responseTimeLabel}</span> : null}
        </div>
        {profile.supportedContactChannels?.length ? (
          <div style={{ marginTop: "0.6rem" }}>
            <p style={{ fontSize: "0.76rem", fontWeight: 700, letterSpacing: 0.3, color: "#475569", textTransform: "uppercase", margin: 0 }}>Contact methods after payment</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.45rem" }}>
              {profile.supportedContactChannels.map((channel) => <span key={channel} className="quote-map-badge">{channel}</span>)}
            </div>
          </div>
        ) : null}
        {profile.serviceCommitments?.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.55rem" }}>
            {profile.serviceCommitments.map((item) => (
              <span key={item} className="quote-map-badge" style={{ background: "var(--color-surface-muted)" }}>{item}</span>
            ))}
          </div>
        ) : null}
        {profile.languagesSpoken?.length ? (
          <p style={{ marginTop: "0.55rem", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            Languages: {profile.languagesSpoken.join(", ")}
          </p>
        ) : null}
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
    </div>
  );
}
