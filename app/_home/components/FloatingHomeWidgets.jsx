"use client";

import { useState } from "react";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com").replace(/\/+$/, "");

function getWidgetValue(widget, camelKey, snakeKey, fallback = "") {
  return widget?.[camelKey] ?? widget?.[snakeKey] ?? fallback;
}

export default function FloatingHomeWidgets({ config }) {
  const [usefulOpen, setUsefulOpen] = useState(false);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [ideaSending, setIdeaSending] = useState(false);
  const [ideaOk, setIdeaOk] = useState("");
  const [ideaError, setIdeaError] = useState("");

  const usefulInfo = config?.usefulInfo || config?.useful_info || null;
  const idea = config?.idea || null;
  const usefulItems = Array.isArray(usefulInfo?.items) ? usefulInfo.items : [];

  const showUseful = usefulInfo?.is_active !== false && usefulItems.length > 0;
  const showIdea = idea?.is_active !== false;

  const ideaTitle = idea?.title || "Yeni ideyan var?";
  const ideaDescription = idea?.description || "Asimos.az-ı necə daha yaxşı edə bilərik? İdeyanı yaz, mail vasitəsilə bizə göndər.";
  const ideaPlaceholder = getWidgetValue(idea, "textareaPlaceholder", "textarea_placeholder", "İdeyanı buraya yaz...");
  const ideaCta = getWidgetValue(idea, "ctaLabel", "cta_label", "✉️ Mail ilə göndər");

  async function handleIdeaSubmit(event) {
    event.preventDefault();
    const message = String(ideaText || "").trim();

    setIdeaOk("");
    setIdeaError("");

    if (!message) {
      setIdeaError("Zəhmət olmasa ideyanı yazın.");
      return;
    }

    try {
      setIdeaSending(true);
      const response = await fetch(`${SOCKET_URL}/home-widgets/idea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Mesaj göndərilmədi");

      setIdeaOk("Mesajınız göndərildi. Təşəkkür edirik!");
      setIdeaText("");
      window.setTimeout(() => {
        setIdeaOpen(false);
        setIdeaOk("");
      }, 1200);
    } catch (error) {
      setIdeaError(error?.message || "Mesaj göndərilmədi");
    } finally {
      setIdeaSending(false);
    }
  }

  return (
    <>
      {showUseful ? (
        <div style={{ position: "fixed", left: 18, bottom: 22, zIndex: 70 }}>
          {usefulOpen ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 68,
                width: "min(520px, calc(100vw - 36px))",
                background: "#fff",
                borderRadius: 28,
                padding: "28px 24px",
                boxShadow: "0 22px 55px rgba(15, 23, 42, 0.18)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ color: "#9ca3af", fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>
                {usefulInfo.title || "Faydalı məlumat"}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {usefulItems.map((item, index) => {
                  const url = String(item?.url || "").trim();
                  const row = (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "30px minmax(0, 1fr)",
                        gap: 12,
                        alignItems: "center",
                        padding: "12px 14px",
                        borderRadius: 16,
                        color: "#2f3237",
                        fontSize: 20,
                        fontWeight: 500,
                        background: index === 3 ? "#f1f5f9" : "transparent",
                      }}
                    >
                      <span aria-hidden="true">{item?.icon || "📥"}</span>
                      <span>{item?.title || "Link"}</span>
                    </div>
                  );

                  return url ? (
                    <a key={`${item?.title || "item"}-${index}`} href={url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                      {row}
                    </a>
                  ) : (
                    <div key={`${item?.title || "item"}-${index}`}>{row}</div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setUsefulOpen((value) => !value)}
            style={{
              border: 0,
              borderRadius: 999,
              background: "#1468b8",
              color: "#fff",
              padding: "15px 24px",
              fontSize: 18,
              fontWeight: 800,
              boxShadow: "0 12px 28px rgba(20, 104, 184, 0.35)",
              cursor: "pointer",
            }}
          >
            {usefulInfo.button_label || usefulInfo.buttonLabel || "📚 Faydalı məlumat"}
          </button>
        </div>
      ) : null}

      {showIdea ? (
        <div style={{ position: "fixed", right: 18, bottom: 22, zIndex: 70 }}>
          <button
            type="button"
            onClick={() => setIdeaOpen(true)}
            style={{
              border: 0,
              borderRadius: 999,
              background: "#1fa276",
              color: "#fff",
              padding: "15px 24px",
              fontSize: 18,
              fontWeight: 800,
              boxShadow: "0 12px 28px rgba(31, 162, 118, 0.35)",
              cursor: "pointer",
            }}
          >
            {idea.button_label || idea.buttonLabel || "💡 Yeni ideyan var?"}
          </button>
        </div>
      ) : null}

      {ideaOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(17, 24, 39, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
          onMouseDown={() => setIdeaOpen(false)}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              background: "#fff",
              borderRadius: 24,
              padding: "24px 28px 30px",
              boxShadow: "0 30px 80px rgba(15, 23, 42, 0.25)",
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <form onSubmit={handleIdeaSubmit}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24, fontWeight: 900 }}>💡 {ideaTitle}</h2>
                <button
                  type="button"
                  onClick={() => setIdeaOpen(false)}
                  aria-label="Bağla"
                  style={{ border: 0, background: "transparent", fontSize: 36, color: "#8b8f98", cursor: "pointer", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <p style={{ color: "#6b7280", fontSize: 18, lineHeight: 1.45, margin: "18px 0" }}>
                {ideaDescription}
              </p>

              <textarea
                value={ideaText}
                onChange={(event) => {
                  setIdeaText(event.target.value);
                  if (ideaError) setIdeaError("");
                  if (ideaOk) setIdeaOk("");
                }}
                placeholder={ideaPlaceholder}
                rows={5}
                style={{
                  width: "100%",
                  minHeight: 170,
                  border: "1px solid #dbe3ee",
                  borderRadius: 16,
                  padding: "16px 18px",
                  fontSize: 17,
                  resize: "vertical",
                  outline: "none",
                  color: "#111827",
                  boxSizing: "border-box",
                }}
              />

              {ideaError ? (
                <div style={{ marginTop: 12, color: "#dc2626", fontSize: 14, fontWeight: 700 }}>{ideaError}</div>
              ) : null}
              {ideaOk ? (
                <div style={{ marginTop: 12, color: "#15803d", fontSize: 14, fontWeight: 700 }}>{ideaOk}</div>
              ) : null}

              <button
                type="submit"
                disabled={ideaSending}
                style={{
                  marginTop: 20,
                  width: "100%",
                  minHeight: 56,
                  border: 0,
                  borderRadius: 18,
                  background: "#1fa276",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 900,
                  cursor: ideaSending ? "not-allowed" : "pointer",
                  opacity: ideaSending ? 0.7 : 1,
                }}
              >
                {ideaSending ? "Göndərilir..." : ideaCta}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
