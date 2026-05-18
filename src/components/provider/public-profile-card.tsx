import Image from "next/image";

type ProviderPublicProfile = {
  providerName: string;
  profileImageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  hasDbs?: boolean;
  hasInsurance?: boolean;
  introVideoUrl?: string | null;
  supportedContactChannels?: string[];
  responseTimeLabel?: string | null;
  serviceCommitments?: string[];
  languagesSpoken?: string[];
};

function getEmbeddableVideoUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.replace(/^\//, "");
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "loom.com") {
      const match = url.pathname.match(/\/share\/([^/]+)/);
      return match?.[1] ? `https://www.loom.com/embed/${match[1]}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

function fallbackInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProviderPublicProfileCard({ profile }: { profile: ProviderPublicProfile }) {
  const embedUrl = getEmbeddableVideoUrl(profile.introVideoUrl);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4 items-start">
      {profile.profileImageUrl ? (
        <Image
          src={profile.profileImageUrl}
          alt={profile.providerName}
          width={96}
          height={96}
          unoptimized
          className="h-24 w-24 rounded-3xl object-cover border border-slate-200 shadow-sm"
        />
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
          {profile.hasDbs ? <span className="quote-map-badge">DBS verified</span> : null}
          {profile.hasInsurance ? <span className="quote-map-badge">Provider insurance verified</span> : null}
          {profile.introVideoUrl ? <span className="quote-map-badge">Video intro</span> : null}
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
        {profile.introVideoUrl ? (
          <div style={{ marginTop: "0.8rem" }}>
            <p style={{ fontSize: "0.76rem", fontWeight: 700, letterSpacing: 0.3, color: "#475569", textTransform: "uppercase", margin: 0 }}>Video introduction</p>
            {embedUrl ? (
              <div style={{ marginTop: "0.5rem", position: "relative", paddingTop: "56.25%", borderRadius: "1rem", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <iframe
                  src={embedUrl}
                  title={`${profile.providerName} video introduction`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
            ) : (
              <a href={profile.introVideoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "0.45rem", color: "var(--color-brand)", fontWeight: 600 }}>
                Watch provider introduction
              </a>
            )}
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
