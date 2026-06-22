export default function SponsoredJobCard({ card }) {
  if (!card) return null;

  const title = card.title || "Sponsorlu xidmət";
  const company = card.companyName || card.company_name || "";
  const subtitle = card.subtitle || "";
  const description = card.description || "";
  const ctaLabel = card.ctaLabel || card.cta_label || "Ətraflı bax";
  const ctaUrl = card.ctaUrl || card.cta_url || "";
  const logoText = (card.logoText || card.logo_text || "AS").slice(0, 4).toUpperCase();
  const badgeLabel = card.badgeLabel || card.badge_label || "Sponsorlu";

  const content = (
    <article
      className="asimos-sponsored-job-card"
      style={{
        width: "100%",
        minHeight: 176,
        border: "1px solid #bfdbfe",
        background: "linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)",
        borderRadius: 24,
        padding: "20px 18px",
        display: "grid",
        gridTemplateColumns: "58px minmax(0, 1fr) auto",
        gap: 14,
        boxShadow: "0 16px 36px rgba(37, 99, 235, 0.08)",
        cursor: ctaUrl ? "pointer" : "default",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 58,
          height: 58,
          borderRadius: 16,
          background: "#dff7f1",
          border: "1px solid #bae6d8",
          color: "#18a477",
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          letterSpacing: 0.3,
          flexShrink: 0,
        }}
      >
        {logoText}
      </div>

      <div style={{ minWidth: 0 }}>
        <h3 style={{ margin: "0 0 8px", color: "#111827", fontSize: 18, lineHeight: 1.3, fontWeight: 800 }}>
          {title}
        </h3>
        {company || subtitle ? (
          <div style={{ color: "#8a8f98", fontSize: 15, lineHeight: 1.35, marginBottom: 12 }}>
            {[company, subtitle].filter(Boolean).join(" • ")}
          </div>
        ) : null}
        {description ? (
          <p style={{ margin: "0 0 18px", color: "#555b66", fontSize: 16, lineHeight: 1.55 }}>
            {description}
          </p>
        ) : null}
        {ctaUrl ? (
          <span style={{ color: "#1d5fae", fontWeight: 800, fontSize: 16 }}>
            {ctaLabel} <span aria-hidden="true">→</span>
          </span>
        ) : null}
      </div>

      <div style={{ alignSelf: "start" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 28,
            padding: "5px 12px",
            borderRadius: 999,
            background: "#1d5fae",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {badgeLabel}
        </span>
      </div>
    </article>
  );

  if (!ctaUrl) return content;

  return (
    <a href={ctaUrl} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      {content}
    </a>
  );
}
