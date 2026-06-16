"use client";

import Header from "../components/Header";
import JobCard from "../components/JobCard";
import LocationPicker from "../components/LocationPicker";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { api, clearAuthToken, setAuthToken, setRefreshToken, setTokenUpdateHandler } from "../../lib/api";

import { clearAuth, loadAuth, saveAuth } from "../../lib/auth-store";

import styles from "./HomePage.module.css";
import AuthSection from "./components/AuthSection";
import AppLaunchPanel from "./components/AppLaunchPanel";
import LocationPermissionPrompt from "./components/LocationPermissionPrompt";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com").replace(/\/+$/, "");

const JobsMap = dynamic(() => import("../components/JobsMap"), {
  ssr: false,
  loading: () => (
    <section className="container page-section jobs-map-section">
      <header className="section-head jobs-map-head">
        <h2>Elanların xəritədə görünüşü</h2>
        <p>Xəritə yüklənir...</p>
      </header>
      <div className="jobs-map-shell card">
        <p className="jobs-map-empty">Xəritə modulu hazırlanır.</p>
      </div>
    </section>
  ),
});

const guestNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "about", label: "Haqqımızda" },
];

const seekerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "Elanlar" },
];

const employerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "Elanlar" },
];

const employerSupportCategories = [
  "Elan yükləyə bilmirəm",
  "Namizədlərlə əlaqə problemi",
  "Ödəniş problemi",
  "Hesab ilə bağlı problem",
  "Təklif və İradlar",
  "Digər",
];

const seekerSupportCategories = [
  "İşə müraciət edə bilmirəm",
  "Profilimi tamamlaya bilmirəm",
  "Hesab ilə bağlı problem",
  "Təklif və İradlar",
  "Digər",
];

const cityOptions = [
  "Bakı",
  "Sumqayıt",
  "Gəncə",
  "Mingəçevir",
  "Şəki",
  "Lənkəran",
  "Şirvan",
  "Naxçıvan",
  "Quba",
  "Xaçmaz",
  "Masallı",
  "Salyan",
];

const vacancyTypeOptions = [
  { label: "Növbə əsasında", value: "shift" },
  { label: "Tam ştat", value: "full_time" },
  { label: "Daimi", value: "permanent" },
  { label: "Frilans", value: "freelance" },
  { label: "Komisyon haqqı", value: "commission" },
  { label: "Könüllü", value: "volunteer" },
  { label: "Mövsümi", value: "seasonal" },
  { label: "Müvəqqəti", value: "temporary" },
  { label: "Təcrübə", value: "internship" },
  { label: "Təqaüd proqramı", value: "scholarship" },
  { label: "Yarım ştat", value: "part_time" },
];

const jobLevelOptions = [
  { label: "Təcrübəsiz", value: "entry" },
  { label: "Junior", value: "junior" },
  { label: "Middle", value: "middle" },
  { label: "Senior", value: "senior" },
  { label: "Menecer", value: "manager" },
  { label: "Rəhbər", value: "lead" },
];

const salaryRangeOptions = [
  { label: "0 - 500 AZN", min: "0", max: "500" },
  { label: "500 - 1000 AZN", min: "500", max: "1000" },
  { label: "1000 - 1500 AZN", min: "1000", max: "1500" },
  { label: "1500 - 2500 AZN", min: "1500", max: "2500" },
  { label: "2500+ AZN", min: "2500", max: "" },
];


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isBase64DataUrl(value) {
  return typeof value === "string" && value.trim().startsWith("data:");
}

function safeImageUrl(value) {
  const text = String(value || "").trim();

  if (!text) return undefined;

  if (isBase64DataUrl(text)) return undefined;

  return text;
}

function getSafeUserLogo(user) {
  return (
    safeImageUrl(user?.logoUrl) ||
    safeImageUrl(user?.logo_url) ||
    safeImageUrl(user?.profileLogoUrl) ||
    safeImageUrl(user?.profile_logo_url) ||
    ""
  );
}

function normalizeRole(role) {
  const raw = String(role || "").trim().toLowerCase();
  if (["seeker", "is axtaran", "alici", "jobseeker"].includes(raw)) return "seeker";
  if (["employer", "isci axtaran", "satici", "hirer", "company"].includes(raw)) return "employer";
  return null;
}

function formatNotificationTime(value) {
  if (!value) return "Yeni";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Yeni";

  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getNotificationJobId(notification) {
  return notification?.data?.jobId || notification?.data?.job_id || notification?.jobId || notification?.job_id || null;
}

function getNotificationCreatedAt(notification) {
  return notification?.createdAt || notification?.created_at || notification?.date || notification?.updatedAt || notification?.updated_at || null;
}

function getNotificationTone(notification) {
  const text = `${notification?.title || ""} ${notification?.body || ""} ${notification?.message || ""}`.toLowerCase();
  if (text.includes("yaxın") || text.includes("near")) return "near";
  if (text.includes("müraciət") || text.includes("apply")) return "apply";
  if (text.includes("elan")) return "job";
  return "general";
}

function normalizeList(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function flattenCategories(items) {
  const out = [];
  normalizeList(items).forEach((parent) => {
    if (parent?.name) out.push(String(parent.name));
    const children = Array.isArray(parent?.children) ? parent.children : [];
    children.forEach((child) => {
      if (child?.name) out.push(String(child.name));
    });
  });
  return out;
}

function hasSavedLocation(candidateUser) {
  const latValue = Number(candidateUser?.location?.lat);
  const lngValue = Number(candidateUser?.location?.lng);

  return Number.isFinite(latValue) && Number.isFinite(lngValue);
}

function buildJobDetailsText({
  companyObject,
  scheduleStart,
  scheduleEnd,
  publishMode,
  publishAt,
  durationLabel,
  contactEmail,
  description,
}) {
  const details = [];

  if (companyObject) details.push(`Şirkət / obyekt: ${companyObject}`);
  if (scheduleStart || scheduleEnd) details.push(`İş qrafiki: ${scheduleStart || "--:--"} - ${scheduleEnd || "--:--"}`);
  if (durationLabel) details.push(`Müddət: ${durationLabel}`);
  if (contactEmail) details.push(`Email: ${String(contactEmail).trim()}`);
  if (publishMode === "scheduled" && publishAt) details.push(`Planlı yayım: ${publishAt}`);

  return [description.trim(), details.length ? "" : null, ...details].filter(Boolean).join("\n");
}

function extractWageNumber(wageText) {
  if (!wageText) return null;
  const match = String(wageText).replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function getJobStatus(job) {
  return String(job?.status || job?.jobStatus || "open").toLowerCase();
}

function isPublicHomeJob(job) {
  if (!job?.id || !String(job?.title || "").trim()) return false;

  const status = getJobStatus(job);
  return !["closed", "deleted", "inactive", "rejected", "draft"].includes(status);
}

function hasJobCoordinates(job) {
  const lat = Number(job?.location?.lat ?? job?.lat);
  const lng = Number(job?.location?.lng ?? job?.lng ?? job?.lon);

  return Number.isFinite(lat) && Number.isFinite(lng);
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function formatTimeFromDateTime(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatProfileJobDate(value) {
  if (!value) return "Yeni";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Yeni";
  return date.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getProfileJobCompany(job) {
  return job?.companyName || job?.company_name || job?.company || "Asimos işəgötürən";
}

function getProfileJobLogo(job) {
  return job?.logoUrl || job?.logo_url || job?.imageUrl || job?.image_url || job?.companyLogo || job?.company_logo || "";
}

function getTicketSubject(ticket) {
  return ticket?.subject || ticket?.category || "Müraciət";
}


function SponsoredJobCard({ card }) {
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

function getWidgetValue(widget, camelKey, snakeKey, fallback = "") {
  return widget?.[camelKey] ?? widget?.[snakeKey] ?? fallback;
}

function FloatingHomeWidgets({ config }) {
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

function getTicketMessages(ticket) {
  const source = Array.isArray(ticket?.support_messages)
    ? ticket.support_messages
    : Array.isArray(ticket?.replies)
      ? ticket.replies
      : [];

  return source
    .map((item, index) => ({
      id: item.id || `${ticket?.id || "ticket"}-${index}`,
      message: item.message || item.body || "",
      created_at: item.created_at || item.createdAt || item.created_at,
      is_admin: Boolean(item.is_admin || item.isAdmin || item.admin),
    }))
    .filter((item) => item.message)
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
}

export default function HomePageClient() {
  const router = useRouter();
  const prefetchedJobIds = useRef(new Set());
  const latestJobsCarouselRef = useRef(null);
  const jobsLoadMoreRef = useRef(null);
  const [booting, setBooting] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState(null);

  const [mode, setMode] = useState("login");
  const [otpPayload, setOtpPayload] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [registerLogoPreview, setRegisterLogoPreview] = useState("");
  const [profileLogoPreview, setProfileLogoPreview] = useState("");
  const [phone, setPhone] = useState("+994");
  const [role, setRole] = useState("seeker");
  const [registerCategory, setRegisterCategory] = useState("");
  const [otp, setOtp] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  const [jobs, setJobs] = useState([]);
  const [sponsoredCard, setSponsoredCard] = useState(null);
  const [recommendedCard, setRecommendedCard] = useState(null);
  const [homeWidgets, setHomeWidgets] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [favoriteJobIds, setFavoriteJobIds] = useState(() => new Set());
  const [categories, setCategories] = useState([]);
  const [jobFilterOptions, setJobFilterOptions] = useState({ vacancyTypes: vacancyTypeOptions, jobLevels: jobLevelOptions, salaryRanges: salaryRangeOptions });
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [siteStats, setSiteStats] = useState(null);
  const [terms, setTerms] = useState("");
  const [unread, setUnread] = useState(0);

  const [search, setSearch] = useState("");
  const [searchSurface, setSearchSurface] = useState("global");
  const [focusedMapJobId, setFocusedMapJobId] = useState(null);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [activeHomeFilterTab, setActiveHomeFilterTab] = useState("type");
  const [activeCreateFilterTab, setActiveCreateFilterTab] = useState("type");
  const [dailyOnly, setDailyOnly] = useState(false);
  const [jobsMode, setJobsMode] = useState("all");
  const [minWage, setMinWage] = useState("");
  const [maxWage, setMaxWage] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "",
    city: "",
    jobType: "",
    jobLevel: "",
    minWage: "",
    maxWage: "",
  });
  const [radiusM, setRadiusM] = useState("0");
  const [myJobsStatus, setMyJobsStatus] = useState("open");
  const [jobsVisibleCount, setJobsVisibleCount] = useState(10);
  const [editingJobId, setEditingJobId] = useState(null);

  const [title, setTitle] = useState("");
  const [companyObject, setCompanyObject] = useState("");
  const [vacancyStartDate, setVacancyStartDate] = useState(() => getDateInputValue(0));
  const [vacancyEndDate, setVacancyEndDate] = useState(() => getDateInputValue(30));
  const [contactVisibility, setContactVisibility] = useState({ phone: true, whatsapp: true, email: true });
  const [primaryContact, setPrimaryContact] = useState("phone");
  const [wage, setWage] = useState("");
  const [wageMode, setWageMode] = useState("agreement");
  const [wageMin, setWageMin] = useState("");
  const [wageMax, setWageMax] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("+994");
  const [contactPhone, setContactPhone] = useState("+994");
  const [contactEmail, setContactEmail] = useState("");
  const [link, setLink] = useState("");
  const [voen, setVoen] = useState("");
  const [workType, setWorkType] = useState("permanent");
  const [durationPreset, setDurationPreset] = useState("1");
  const [customDurationDays, setCustomDurationDays] = useState("");
  const [durationDays, setDurationDays] = useState("1");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [publishMode, setPublishMode] = useState("instant");
  const [publishAt, setPublishAt] = useState("");
  const [locationText, setLocationText] = useState("");
  const [jobImagePreview, setJobImagePreview] = useState("");
  const [lat, setLat] = useState("40.4093");
  const [lng, setLng] = useState("49.8671");

  const [alertCategory, setAlertCategory] = useState("");
  const [alertRadius, setAlertRadius] = useState("500");
  const [alertKeywords, setAlertKeywords] = useState("");

  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketReply, setTicketReply] = useState({});
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportMode, setSupportMode] = useState("list");
  const [activeTicketId, setActiveTicketId] = useState(null);
  const supportSocketRef = useRef(null);

  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [switchCompany, setSwitchCompany] = useState("");
  const [switchVoen, setSwitchVoen] = useState("");
  const [roleSwitchStatus, setRoleSwitchStatus] = useState(null);
  const [roleSwitchConfirmOpen, setRoleSwitchConfirmOpen] = useState(false);

  const roleName = normalizeRole(user?.role);
  const canCreateJob = roleName === "employer";
  const navItems = roleName === "employer" ? employerNav : roleName === "seeker" ? seekerNav : guestNav;

  const navTitle = roleName === "employer" ? "İşçi axtaran" : roleName === "seeker" ? "İş axtaran" : "Qonaq";
  const nextRoleName = roleName === "seeker" ? "employer" : roleName === "employer" ? "seeker" : null;
  const nextRoleLabel = nextRoleName === "employer" ? "İşçi axtaran" : nextRoleName === "seeker" ? "İş axtaran" : "Yeni rol";
  const supportCategories = roleName === "employer" ? employerSupportCategories : seekerSupportCategories;
  const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) || null;
  const effectiveLocation = user?.location || deviceLocation || null;
  const homeJobs = useMemo(() => jobs.filter(isPublicHomeJob), [jobs]);
  const homeMapJobs = useMemo(() => homeJobs.filter(hasJobCoordinates), [homeJobs]);
  const statsChartItems = useMemo(() => {
    const values = [
      { label: "İstifadəçi", value: Number(siteStats?.users || 0) },
      { label: "Aktiv elan", value: Number(siteStats?.activeJobs || 0) },
      { label: "Online", value: Number(siteStats?.onlineUsers || 0) },
      { label: "Bugün", value: Number(siteStats?.visitsToday || 0) },
      { label: "Bu ay", value: Number(siteStats?.visitsThisMonth || 0) },
    ];
    const max = Math.max(1, ...values.map((item) => item.value));
    return values.map((item) => ({ ...item, percent: Math.max(8, Math.round((item.value / max) * 100)) }));
  }, [siteStats]);
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !Boolean(item.readAt || item.read_at)),
    [notifications]
  );
  const activeUnreadCount = unreadNotifications.length;
  const hasHomeJobs = homeJobs.length > 0;
  const hasHomeMapJobs = homeMapJobs.length > 0;

  useEffect(() => {
    if (!user || !token) {
      if (supportSocketRef.current) {
        supportSocketRef.current.disconnect();
        supportSocketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 800,
    });

    supportSocketRef.current = socket;

    const refreshSupport = async (payload = {}) => {
      try {
        const res = await api.listTickets();
        const nextTickets = res.items || [];
        setTickets(nextTickets);
        if (payload.ticketId && activeTicketId === payload.ticketId) {
          setActiveTicketId(payload.ticketId);
          await api.markTicketRead(payload.ticketId).catch(() => null);
        }
        const notifRes = await api.listMyNotifications({ limit: 50 }).catch(() => null);
        if (notifRes?.items) setNotifications(notifRes.items);
      } catch { }
    };

    socket.on("support:updated", refreshSupport);
    socket.on("connect", () => {
      if (activeTicketId) socket.emit("support:join", { ticketId: activeTicketId });
    });

    return () => {
      socket.off("support:updated", refreshSupport);
      socket.disconnect();
      if (supportSocketRef.current === socket) supportSocketRef.current = null;
    };
  }, [user?.id, token, activeTicketId]);

  useEffect(() => {
    const socket = supportSocketRef.current;
    if (!socket || !activeTicketId) return;
    socket.emit("support:join", { ticketId: activeTicketId });
    return () => socket.emit("support:leave", { ticketId: activeTicketId });
  }, [activeTicketId]);

  useEffect(() => {
    if (!user && activeSection !== "home" && activeSection !== "about" && activeSection !== "auth") {
      setActiveSection("auth");
    }
  }, [user, activeSection]);

  useEffect(() => {
    if (activeSection === "daily") {
      setJobsMode("daily");
    } else if (activeSection === "jobs") {
      setJobsMode("all");
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "create" && roleName !== "employer") {
      setActiveSection(user ? "profile" : "auth");
    }
  }, [activeSection, roleName, user]);

  useEffect(() => {
    const savedDeviceLocation = (() => {
      try {
        return JSON.parse(window.localStorage.getItem("asimos_device_location") || "null");
      } catch {
        return null;
      }
    })();

    if (savedDeviceLocation?.lat && savedDeviceLocation?.lng) {
      setDeviceLocation(savedDeviceLocation);
      setLat(String(savedDeviceLocation.lat));
      setLng(String(savedDeviceLocation.lng));
      setLocationText(savedDeviceLocation.address || "Cari məkan");
    }

    const saved = loadAuth();
    if (saved?.token) {
      setToken(saved.token);
      setRefreshTokenState(saved.refreshToken || null);
      setUser(saved.user || null);
      setAuthToken(saved.token);
      setRefreshToken(saved.refreshToken || null);

      if (saved.user?.location) {
        setLat(String(saved.user.location.lat || "40.4093"));
        setLng(String(saved.user.location.lng || "49.8671"));
        setLocationText(saved.user.location.address || "");
      }

      if (saved.user?.phone) {
        setPhone(saved.user.phone);
        setContactPhone(saved.user.phone);
        setContactEmail(saved.user.email || "");
        setWhatsapp(saved.user.phone);
      }

      setEditingName(saved.user?.fullName || "");
      setEditingPhone(saved.user?.phone || "");
      setCompanyName(saved.user?.companyName || saved.user?.company_name || "");
      const savedLogo = getSafeUserLogo(saved.user);

      setProfileLogoPreview(savedLogo);
      setJobImagePreview(savedLogo);
      if (saved.user?.companyName || saved.user?.company_name) setCompanyObject(saved.user.companyName || saved.user.company_name || "");
    }

    setTokenUpdateHandler(({ token: nextToken, refreshToken: nextRefresh, user: nextUser }) => {
      setToken(nextToken || null);
      setRefreshTokenState(nextRefresh || null);
      if (nextUser) setUser(nextUser);
      saveAuth({ token: nextToken || null, refreshToken: nextRefresh || null, user: nextUser || user || null });
    });

    setBooting(false);

    const hasAnyLocation = hasSavedLocation(saved?.user) || Boolean(savedDeviceLocation?.lat && savedDeviceLocation?.lng);
    if (!hasAnyLocation && typeof navigator !== "undefined" && navigator.geolocation) {
      window.setTimeout(() => setLocationPromptOpen(true), 500);
    }
  }, []);


  useEffect(() => {
    if (roleName !== "employer" || !user) return;

    const userCompany = user.companyName || user.company_name || "";
    const userLogo = getSafeUserLogo(user);

    if (userCompany && !companyName) {
      setCompanyName(userCompany);
    }

    if (userCompany && !companyObject) {
      setCompanyObject(userCompany);
    }

    if (userLogo && !profileLogoPreview) {
      setProfileLogoPreview(userLogo);
    }

    if (userLogo && !jobImagePreview) {
      setJobImagePreview(userLogo);
    }

    if (user.phone) {
      if (!contactPhone || contactPhone === "+994") {
        setContactPhone(user.phone);
      }

      if (!whatsapp || whatsapp === "+994") {
        setWhatsapp(user.phone);
      }
    }

    if (user.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [roleName, user?.id]);


  useEffect(() => {
    let ignore = false;

    fetch(`${SOCKET_URL}/sponsored-cards`)
      .then((res) => (res.ok ? res.json() : { sponsored: null, recommended: null }))
      .then((data) => {
        if (!ignore) {
          setSponsoredCard(data?.sponsored || data?.item || null);
          setRecommendedCard(data?.recommended || null);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSponsoredCard(null);
          setRecommendedCard(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch(`${SOCKET_URL}/home-widgets`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore) setHomeWidgets(data || null);
      })
      .catch(() => {
        if (!ignore) setHomeWidgets(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function loadBaseData() {
    const [categoryRes, jobsRes, termsRes, filterOptionsRes] = await Promise.all([
      api.listCategories().catch(() => ({ items: [] })),
      api
        .listJobsWithSearch({
          q: appliedFilters.search || undefined,
          lat: effectiveLocation?.lat,
          lng: effectiveLocation?.lng,
          daily: jobsMode === "daily" || dailyOnly || undefined,
          jobType: appliedFilters.jobType || undefined,
          jobLevel: appliedFilters.jobLevel || undefined,
          city: appliedFilters.city || undefined,
          minWage: appliedFilters.minWage || undefined,
          maxWage: appliedFilters.maxWage || undefined,
          categories: appliedFilters.category || undefined,
          limit: 1000,
        })
        .catch(() => ({ items: [] })),
      api.getContent("terms").catch(() => null),
      api.getJobFilterOptions().catch(() => null),
    ]);

    setCategories(flattenCategories(categoryRes?.items || categoryRes));
    if (filterOptionsRes) {
      setJobFilterOptions({
        vacancyTypes: Array.isArray(filterOptionsRes.vacancyTypes) && filterOptionsRes.vacancyTypes.length ? filterOptionsRes.vacancyTypes : vacancyTypeOptions,
        jobLevels: Array.isArray(filterOptionsRes.jobLevels) && filterOptionsRes.jobLevels.length ? filterOptionsRes.jobLevels : jobLevelOptions,
        salaryRanges: Array.isArray(filterOptionsRes.salaryRanges) && filterOptionsRes.salaryRanges.length ? filterOptionsRes.salaryRanges : salaryRangeOptions,
      });
    }
    setJobs(normalizeList(jobsRes));
    setTerms(termsRes?.content || termsRes?.body || "Qaydalar məlumatı mövcud deyil.");
  }

  async function loadAuthedData(currentUser = user) {
    if (!currentUser?.id) return;

    const [myJobsRes, favoritesRes, alertsRes, notificationsRes, unreadRes, ticketsRes, switchRes] = await Promise.all([
      api.listMyJobs(currentUser.id).catch(() => ({ items: [] })),
      api.listMyFavorites().catch(() => ({ items: [] })),
      api.listMyAlerts().catch(() => ({ items: [] })),
      api.listMyNotifications({ limit: 100, offset: 0 }).catch(() => ({ items: [] })),
      api.getUnreadNotificationsCount().catch(() => ({ unread: 0 })),
      api.listTickets().catch(() => ({ items: [] })),
      api.getRoleSwitchStatus().catch(() => null),
    ]);

    setMyJobs(normalizeList(myJobsRes));
    const nextFavorites = normalizeList(favoritesRes);
    setFavoriteJobs(nextFavorites);
    setFavoriteJobIds(new Set(nextFavorites.map((job) => String(job.id)).filter(Boolean)));
    setAlerts(normalizeList(alertsRes));
    setNotifications(normalizeList(notificationsRes));
    setUnread(Number(unreadRes?.unread || 0));
    setTickets(normalizeList(ticketsRes));

    const latestRoleRequest = switchRes?.request || null;
    setRoleSwitchStatus(latestRoleRequest);

    const approvedRole = normalizeRole(latestRoleRequest?.status === "approved" ? latestRoleRequest?.to_role : null);
    const currentRole = normalizeRole(currentUser?.role);

    if (approvedRole && approvedRole !== currentRole) {
      const nextUser = {
        ...(currentUser || {}),
        role: approvedRole,
        companyName: approvedRole === "employer" ? latestRoleRequest?.company_name || currentUser?.companyName : null,
        company_name: approvedRole === "employer" ? latestRoleRequest?.company_name || currentUser?.company_name : null,
      };

      setUser(nextUser);
      saveAuth({ token, refreshToken, user: nextUser });
      setOk(`Rolunuz admin tərəfindən təsdiqləndi və profil ${approvedRole === "employer" ? "İşçi axtaran" : "İş axtaran"} olaraq yeniləndi`);
    }
  }

  useEffect(() => {
    if (booting) return;
    let alive = true;

    (async () => {
      setError("");
      try {
        await loadBaseData();
        if (user && alive) {
          await loadAuthedData(user);
        }
      } catch (e) {
        if (alive) setError(e.message || "Yükləmə xətası baş verdi");
      }
    })();

    return () => {
      alive = false;
    };
  }, [booting, user, effectiveLocation?.lat, effectiveLocation?.lng]);

  async function refreshJobs(nextFilters = appliedFilters) {
    const filters = {
      search: nextFilters?.search ?? appliedFilters.search,
      category: nextFilters?.category ?? appliedFilters.category,
      city: nextFilters?.city ?? appliedFilters.city,
      jobType: nextFilters?.jobType ?? appliedFilters.jobType,
      jobLevel: nextFilters?.jobLevel ?? appliedFilters.jobLevel,
      minWage: nextFilters?.minWage ?? appliedFilters.minWage,
      maxWage: nextFilters?.maxWage ?? appliedFilters.maxWage,
    };

    const res = await api.listJobsWithSearch({
      q: filters.search || undefined,
      lat: effectiveLocation?.lat,
      lng: effectiveLocation?.lng,
      daily: jobsMode === "daily" || dailyOnly || undefined,
      jobType: filters.jobType || undefined,
      jobLevel: filters.jobLevel || undefined,
      city: filters.city || undefined,
      minWage: filters.minWage || undefined,
      maxWage: filters.maxWage || undefined,
      categories: filters.category || undefined,
      limit: 1000,
    });
    const nextJobs = normalizeList(res);
    setJobs(nextJobs);
    return nextJobs;
  }

  useEffect(() => {
    if (booting) return;
    refreshJobs(appliedFilters).catch((err) => setError(err.message || "Elanlar yenilənmədi"));
  }, [jobsMode]);

  async function handleHeroSearchSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const heroFilters = { search, category, city, jobType, jobLevel, minWage, maxWage };
      setAppliedFilters(heroFilters);
      const nextJobs = await refreshJobs(heroFilters);

      if (searchSurface === "map") {
        const jobsWithCoords = nextJobs.filter((job) => {
          const latValue = Number(job?.location?.lat ?? job?.lat);
          const lngValue = Number(job?.location?.lng ?? job?.lng ?? job?.lon);
          return Number.isFinite(latValue) && Number.isFinite(lngValue);
        });

        if (!jobsWithCoords.length) {
          setFocusedMapJobId(null);
          setError("Bu axtarış üzrə xəritədə göstəriləcək koordinatlı elan tapılmadı.");
          return;
        }

        const normalizedSearch = String(search || "").trim().toLowerCase();
        const matchedJob =
          jobsWithCoords.find((job) => {
            if (!normalizedSearch) return true;

            const haystack = [
              job?.title,
              job?.companyName,
              job?.company_name,
              job?.category,
              job?.description,
              job?.location?.address,
              job?.address,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizedSearch);
          }) || jobsWithCoords[0];

        setFocusedMapJobId(matchedJob.id);
        window.setTimeout(() => {
          const mapSection = document.getElementById("home-jobs-map");
          mapSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        return;
      }

      setFocusedMapJobId(null);
      setJobsMode(search.toLowerCase().includes("gündəlik") ? "daily" : "all");
      setActiveSection("jobs");
    } catch (e) {
      setError(e.message || "Axtarış zamanı xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  async function reverseGeocode(latValue, lngValue) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(latValue))}&lon=${encodeURIComponent(String(lngValue))}&accept-language=az`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) throw new Error("Lokasiya ünvanı tapılmadı");
      const data = await res.json();
      return data?.display_name || "Cari məkan";
    } catch {
      return "Cari məkan";
    }
  }

  function maybeOpenLocationPrompt(nextUser = user) {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    if (hasSavedLocation(nextUser) || deviceLocation) return;
    setLocationPromptOpen(true);
  }

  async function requestLocationActivation(nextUser, authTokenValue = token, refreshTokenValue = refreshToken) {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Bu cihazda lokasiya xidməti dəstəklənmir");
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const nextLat = position.coords.latitude;
          const nextLng = position.coords.longitude;
          const address = await reverseGeocode(nextLat, nextLng);
          const userWithLocation = {
            ...(nextUser || {}),
            location: {
              address,
              lat: nextLat,
              lng: nextLng,
            },
          };

          setLat(String(nextLat));
          setLng(String(nextLng));
          setLocationText(address);
          setDeviceLocation(userWithLocation.location);
          window.localStorage.setItem("asimos_device_location", JSON.stringify(userWithLocation.location));
          if (nextUser) {
            setUser(userWithLocation);
            saveAuth({
              token: authTokenValue || null,
              refreshToken: refreshTokenValue || null,
              user: userWithLocation,
            });
          }
          setLocationPromptOpen(false);

          if (nextUser) {
            try {
              await api.updateMyLocation(userWithLocation.location);
              setOk("Lokasiya uğurla aktivləşdirildi");
            } catch (locationError) {
              setError(locationError.message || "Lokasiya yenilənmədi");
            }
          } else {
            setOk("Cihaz lokasiyası aktivləşdirildi");
          }

          resolve(true);
        },
        () => {
          setOk("Yaxınlıqdakı elanları görmək üçün lokasiya icazəsini aktivləşdirə bilərsiniz");
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  async function handleLocationActivation() {
    setLocationLoading(true);
    setError("");

    try {
      await requestLocationActivation(user, token, refreshToken);
    } finally {
      setLocationLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const res = await api.login({ email, password });
      const nextUser = { ...(res.user || {}), role: normalizeRole(res?.user?.role) || role };

      setUser(nextUser);
      setToken(res.token);
      setRefreshTokenState(res.refreshToken || null);
      setAuthToken(res.token);
      setRefreshToken(res.refreshToken || null);
      saveAuth({ token: res.token, refreshToken: res.refreshToken || null, user: nextUser });

      setActiveSection("home");
      setOk("Giriş uğurla tamamlandı");
      maybeOpenLocationPrompt(nextUser);
      await loadAuthedData(nextUser);
    } catch (err) {
      setError(err.message || "Giriş alınmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterLogoFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setRegisterLogoPreview("");
      return;
    }

    if (file.size > 900 * 1024) {
      setError("Loqo maksimum 900KB olmalıdır. Kiçik ölçülü şəkil seçin.");
      event.target.value = "";
      setRegisterLogoPreview("");
      return;
    }

    const dataUrl = await fileToDataUrl(file);

    setRegisterLogoPreview(dataUrl);
  }

  async function handleProfileLogoFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setProfileLogoPreview("");
      return;
    }

    if (file.size > 900 * 1024) {
      setError("Profil loqosu maksimum 900KB olmalıdır.");
      event.target.value = "";
      setProfileLogoPreview("");
      return;
    }

    const dataUrl = await fileToDataUrl(file);

    setProfileLogoPreview(dataUrl);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      if (password !== confirmPassword) throw new Error("Şifrələr eyni deyil");

      const safeRegisterLogo = safeImageUrl(registerLogoPreview);

      const payload = {
        role,
        fullName,
        companyName: role === "employer" ? companyName : undefined,

        logoUrl: role === "employer" ? safeRegisterLogo : undefined,
        profileLogoUrl: role === "employer" ? safeRegisterLogo : undefined,

        category: role === "employer" ? registerCategory || undefined : undefined,
        email,
        password,
        phone,
      };

      const res = await api.register(payload);
      if (res?.needsOtp) {
        setOtpPayload(payload);
        setMode("verifyOtp");
        setOk("OTP kodu e-poçt ünvanınıza göndərildi");
      } else if (res?.token) {
        await handleLogin({ preventDefault: () => { } });
      }
    } catch (err) {
      setError(err.message || "Qeydiyyat alınmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const base = otpPayload || {
        email,
        password,
        role,
        fullName,
        companyName,
        phone,
      };

      const res = await api.verifyOtp({
        email: base.email,
        password: base.password,
        role: base.role,
        fullName: base.fullName,
        companyName: base.companyName,
        logoUrl: base.logoUrl || base.profileLogoUrl || null,
        phone: base.phone,
        code: otp,
      });

      if (res?.pendingApproval) {
        setMode("login");
        setOk("Hesabınız yoxlanış üçün göndərildi");
      } else if (res?.token) {
        const nextUser = { ...(res.user || {}), role: normalizeRole(res?.user?.role) || base.role };
        setUser(nextUser);
        setToken(res.token);
        setRefreshTokenState(res.refreshToken || null);
        setAuthToken(res.token);
        setRefreshToken(res.refreshToken || null);
        saveAuth({ token: res.token, refreshToken: res.refreshToken || null, user: nextUser });
        setActiveSection("home");
        setOk("Hesabınız təsdiqləndi və giriş tamamlandı");
        maybeOpenLocationPrompt(nextUser);
        await loadAuthedData(nextUser);
      }
    } catch (err) {
      setError(err.message || "OTP təsdiqi alınmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      await api.forgotPassword(forgotEmail);
      setOk("Bərpa kodu e-poçt ünvanınıza göndərildi");
      setMode("resetPassword");
      setEmail(forgotEmail);
    } catch (err) {
      setError(err.message || "Şifrə bərpa sorğusu alınmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const res = await api.resetPassword({ email, code: resetCode, password: resetPassword });
      if (res?.token) {
        const nextUser = { ...(res.user || {}), role: normalizeRole(res?.user?.role) || null };
        setUser(nextUser);
        setToken(res.token);
        setRefreshTokenState(res.refreshToken || null);
        setAuthToken(res.token);
        setRefreshToken(res.refreshToken || null);
        saveAuth({ token: res.token, refreshToken: res.refreshToken || null, user: nextUser });
        setActiveSection("home");
        maybeOpenLocationPrompt(nextUser);
      }
      setOk("Şifrə uğurla yeniləndi");
    } catch (err) {
      setError(err.message || "Şifrə yenilənmədi");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    setUser(null);
    setToken(null);
    setRefreshTokenState(null);
    setFavoriteJobs([]);
    setFavoriteJobIds(new Set());
    clearAuthToken();
    clearAuth();
    setActiveSection("home");
    setLocationPromptOpen(false);
    setOk("Hesabdan çıxış edildi");
  }

  async function openSupportModal() {
    if (!user) {
      setActiveSection("auth");
      return;
    }

    setSupportModalOpen(true);
    setSupportMode("list");
    setActiveTicketId(null);
    if (!ticketCategory) setTicketCategory((roleName === "employer" ? employerSupportCategories : seekerSupportCategories)[0] || "");
    await loadAuthedData(user);
  }

  function closeSupportModal() {
    setSupportModalOpen(false);
    setSupportMode("list");
    setActiveTicketId(null);
  }

  async function openTicketDetail(ticket) {
    setActiveTicketId(ticket.id);
    setSupportMode("detail");
    if (ticket.is_answered || ticket.status === "replied") {
      await api.markTicketRead(ticket.id).catch(() => null);
      await loadAuthedData();
    }
  }

  function resetJobForm() {
    const safeUserLogo = getSafeUserLogo(user);

    setEditingJobId(null);
    setTitle("");
    setCompanyObject("");
    setVacancyStartDate(getDateInputValue(0));
    setVacancyEndDate(getDateInputValue(30));
    setContactVisibility({ phone: true, whatsapp: true, email: true });
    setPrimaryContact("phone");
    setWage("Razılaşma əsasında");
    setWageMode("agreement");
    setWageMin("");
    setWageMax("");
    setDescription("");
    setContactEmail(user?.email || "");
    setLink("");
    setVoen("");
    setScheduleStart("");
    setScheduleEnd("");
    setDurationPreset("1");
    setCustomDurationDays("");
    setDurationDays("1");
    setCategory("");
    setJobType("");
    setJobLevel("");
    setActiveCreateFilterTab("type");
    setPublishMode("instant");
    setPublishAt("");

    setJobImagePreview(safeUserLogo || "");
  }

  function startEditJob(job) {
    if (!job) return;

    const nextJobType = job.jobType || job.job_type || (job.isDaily ? "temporary" : "permanent");
    const nextDuration = Number(job.durationDays ?? job.duration_days ?? 1);
    const nextDurationPreset = [1, 3, 10].includes(nextDuration) ? String(nextDuration) : "other";
    const nextPublishAt = job.publishedAt || job.published_at || "";

    setEditingJobId(job.id);
    setTitle(job.title || "");
    setCompanyObject(job.workplace || job.work_place || job.branch || job.companyObject || job.companyName || job.company_name || "");
    setVacancyStartDate(toDateInputValue(job.vacancyStartDate || job.vacancy_start_date || job.startDate || job.start_date) || getDateInputValue(0));
    setVacancyEndDate(toDateInputValue(job.vacancyEndDate || job.vacancy_end_date || job.endDate || job.end_date || job.expiresAt || job.expires_at) || getDateInputValue(30));
    setContactVisibility(job.contactVisibility || job.contact_visibility || { phone: true, whatsapp: true, email: true });
    setPrimaryContact(job.primaryContact || job.primary_contact || "phone");
    const nextWage = job.wage || "";
    const nextWageLower = String(nextWage).toLowerCase();
    setWage(nextWage || "Razılaşma əsasında");
    if (nextWageLower.includes("bacar")) {
      setWageMode("skill");
      setWageMin("");
      setWageMax("");
    } else if (/\d/.test(nextWageLower)) {
      const wageNumbers = String(nextWage).match(/\d+/g) || [];
      setWageMode("range");
      setWageMin(wageNumbers[0] || "");
      setWageMax(wageNumbers[1] || "");
    } else {
      setWageMode("agreement");
      setWageMin("");
      setWageMax("");
    }
    setCategory(job.category || "");
    setWhatsapp(job.whatsapp || "+994");
    setContactPhone(job.phone || "+994");
    setContactEmail(job.email || job.contactEmail || job.contact_email || "");
    setLink(job.atsLink || job.ats_link || job.link || "");
    setVoen(job.voen || "");
    setDescription(job.description || "");
    setJobType(nextJobType || "permanent");
    setDurationPreset(nextDurationPreset);
    setCustomDurationDays(nextDurationPreset === "other" ? String(nextDuration || "") : "");
    setDurationDays(String(nextDuration || "1"));
    setWorkType(job.work_type || "full_time");
    setScheduleStart(formatTimeFromDateTime(job.start_time || job.startTime || job.schedule_start || "") || "");
    setScheduleEnd(formatTimeFromDateTime(job.end_time || job.endTime || job.schedule_end || "") || "");
    setJobLevel(job.jobLevel || job.job_level || job.positionLevel || job.level || "");
    setPublishMode(nextPublishAt ? "scheduled" : "instant");
    setPublishAt(toDateTimeLocal(nextPublishAt));
    setJobImagePreview(job.imageUrl || job.image_url || job.logoUrl || job.logo_url || "");

    if (job.location) {
      setLocationText(job.location.address || "");
      setLat(String(job.location.lat || "40.4093"));
      setLng(String(job.location.lng || "49.8671"));
    }

    setActiveSection("create");
    setOk("Elan redaktə rejimində açıldı");
  }

  function getResolvedWageValue() {
    if (wageMode === "agreement") return "Razılaşma əsasında";
    if (wageMode === "skill") return "Bacarığa uyğun";
    const min = String(wageMin || "").replace(/[^0-9]/g, "");
    const max = String(wageMax || "").replace(/[^0-9]/g, "");
    if (min && max) return `${min} - ${max} AZN`;
    if (min) return `${min} AZN`;
    return "";
  }

  async function handleCreateJob(e, saveAsDraft = false) {
    e.preventDefault();

    if (!user?.id) return;

    if (roleName !== "employer") {
      setError("Elan yaratmaq yalnız işçi axtaran profili üçün aktivdir");
      setActiveSection("profile");
      return;
    }

    setLoading(true);
    setError("");
    setOk("");

    try {
      if (!title.trim()) {
        throw new Error("Elanın adını yazın");
      }

      if (!category) {
        throw new Error("Kateqoriya seçin");
      }

      if (!jobType) {
        throw new Error("Vakansiyanın növünü seçin");
      }

      const resolvedDuration =
        jobType === "temporary"
          ? durationPreset === "other"
            ? customDurationDays
            : durationPreset
          : "";

      const durationLabel = jobType === "temporary" ? `${resolvedDuration} gün` : "";

      if (
        publishMode === "scheduled" &&
        (!publishAt || new Date(publishAt).getTime() <= Date.now())
      ) {
        throw new Error("Planlı yayım üçün gələcək tarix və saat seçin");
      }

      const resolvedWage = getResolvedWageValue();

      if (wageMode === "range" && !resolvedWage) {
        throw new Error("Minimum və ya maksimum maaş rəqəmini yazın");
      }

      const safeLogo =
        safeImageUrl(jobImagePreview) ||
        safeImageUrl(profileLogoPreview) ||
        getSafeUserLogo(user) ||
        undefined;

      const payload = {
        title,
        wage: resolvedWage,
        category,

        whatsapp,
        phone: contactPhone,
        contactPhone,

        email: contactEmail,
        contactEmail,
        contact_email: contactEmail,

        link,
        atsLink: link,
        ats_link: link,
        workplace: companyObject,
        workplace_name: companyObject,
        vacancyStartDate,
        vacancy_start_date: vacancyStartDate || null,
        vacancyEndDate,
        vacancy_end_date: vacancyEndDate || null,
        contactVisibility,
        contact_visibility: contactVisibility,
        primaryContact,
        primary_contact: primaryContact,
        voen,

        description: buildJobDetailsText({
          companyObject,
          scheduleStart,
          scheduleEnd,
          publishMode,
          publishAt,
          durationLabel,
          contactEmail,
          description,
        }),

        companyName:
          roleName === "employer"
            ? companyObject || companyName || user?.companyName || user?.company_name
            : undefined,

        // ƏSAS DÜZƏLİŞ:
        // Buraya artıq data:image/png;base64,... getməyəcək
        company_logo_url: safeLogo,
        logoUrl: safeLogo,
        imageUrl: safeLogo,

        createdBy: user.id,

        jobType: jobType || (roleName === "seeker" ? "seeker" : "permanent"),

        jobLevel: jobLevel || undefined,
        job_level: jobLevel || undefined,

        isDaily: jobType === "temporary",

        durationDays:
          jobType === "temporary"
            ? Number(resolvedDuration || 0)
            : undefined,

        work_type: workType || undefined,

        start_time: scheduleStart || null,
        end_time: scheduleEnd || null,

        notifyRadiusM: Number(radiusM) > 0 ? Number(radiusM) : 500,

        publishMode,

        publishedAt: saveAsDraft
          ? null
          : publishMode === "scheduled"
            ? new Date(publishAt).toISOString()
            : null,

        status: saveAsDraft ? "draft" : undefined,

        saveAsDraft,

        location: {
          address: locationText || "Bakı",
          lat: Number(lat),
          lng: Number(lng),
        },
      };

      if (editingJobId) {
        await api.updateJob(editingJobId, payload);
        setOk("Elan yeniləndi");
      } else {
        await api.createJob(payload);
        setOk(saveAsDraft ? "Elan yadda saxlanıldı" : "Elan yayımlandı");
      }

      resetJobForm();

      await loadAuthedData();
      await refreshJobs();

      if (roleName === "employer") {
        setActiveSection("profile");
      }
    } catch (err) {
      setError(err.message || "Elan yaradılmadı");
    } finally {
      setLoading(false);
    }
  }


  async function handlePublishJob(id) {
    try {
      await api.publishJob(id);
      setOk("Elan aktiv edildi");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Elan aktiv edilmədi");
    }
  }

  async function handleDeleteJob(id) {
    if (!window.confirm("Elanı silinmiş elanlara göndərmək istəyirsiniz?")) return;
    try {
      await api.deleteJob(id);
      setOk("Elan silinmiş elanlara göndərildi");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Elan silinmədi");
    }
  }

  async function handleCloseJob(id) {
    try {
      await api.closeJob(id, { reason: "filled" });
      setOk("Elan bağlandı");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Bağlama mümkün olmadı");
    }
  }

  async function handleReopenJob(id) {
    try {
      await api.reopenJob(id);
      setOk("Elan yenidən açıldı");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Yenidən açmaq mümkün olmadı");
    }
  }

  async function handleCreateAlert(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      await api.createAlert({
        category: alertCategory || undefined,
        radius_m: Number(alertRadius || 0),
        q: alertKeywords || undefined,
      });
      setOk("İş bildirişi yaradıldı");

      setAlertCategory("");
      setAlertRadius("500");
      setAlertKeywords("");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bildiriş yaradılmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAlert(id) {
    try {
      await api.deleteAlert(id);
      setOk("Bildiriş silindi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bildiriş silinmədi");
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((items) =>
        items.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
          read_at: item.read_at || new Date().toISOString(),
        }))
      );
      setUnread(0);
      setOk("Bütün bildirişlər oxundu kimi işarələndi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Əməliyyat alınmadı");
    }
  }

  async function handleOpenNotification(notification) {
    try {
      await api.markNotificationRead(notification.id);
      const wasUnread = !Boolean(notification.readAt || notification.read_at);
      const readTime = new Date().toISOString();

      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: item.readAt || readTime, read_at: item.read_at || readTime }
            : item
        )
      );

      if (wasUnread) {
        setUnread((count) => Math.max(0, Number(count || 0) - 1));
      }

      const jobId = getNotificationJobId(notification);
      if (jobId) {
        router.push(`/jobs/${jobId}`);
        return;
      }

      setOk("Bildiriş oxundu");
    } catch (err) {
      setError(err.message || "Bildiriş açılmadı");
    }
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      await api.createTicket({ category: ticketCategory, message: ticketMessage });
      setTicketMessage("");
      setTicketCategory(supportCategories[0] || "");
      setOk("Dəstək bileti yaradıldı");
      await loadAuthedData();
      setSupportMode("list");
    } catch (err) {
      setError(err.message || "Bilet yaradılmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(ticketId) {
    const text = ticketReply[ticketId]?.trim();
    if (!text) return;

    try {
      await api.replyTicket(ticketId, text);
      setTicketReply((prev) => ({ ...prev, [ticketId]: "" }));
      setOk("Cavab göndərildi");
      await loadAuthedData();
      setActiveTicketId(ticketId);
    } catch (err) {
      setError(err.message || "Cavab göndərilmədi");
    }
  }

  async function handleDeleteTicket(ticketId) {
    try {
      await api.deleteTicket(ticketId);
      setOk("Müraciət sonlandırıldı");
      await loadAuthedData();
      setSupportMode("list");
      setActiveTicketId(null);
    } catch (err) {
      setError(err.message || "Bilet silinmedi");
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const nextLocation = {
        address: locationText || user?.location?.address || "Bakı",
        lat: Number(lat),
        lng: Number(lng),
      };
      const safeProfileLogo =
        safeImageUrl(profileLogoPreview) ||
        getSafeUserLogo(user) ||
        null;

      const payload = {
        fullName: editingName,
        phone: editingPhone,
        location: nextLocation,
        companyName: roleName === "employer"
          ? companyName || user?.companyName || user?.company_name || ""
          : undefined,

        logoUrl: roleName === "employer" ? safeProfileLogo : undefined,
      };
      const response = await api.updateProfile(payload);
      const nextUser = response?.user || {
        ...(user || {}),
        fullName: editingName,
        phone: editingPhone,
        location: nextLocation,
        companyName: payload.companyName ?? user?.companyName,
        logoUrl: payload.logoUrl ?? user?.logoUrl,
      };

      setUser(nextUser);
      setCompanyName(nextUser?.companyName || nextUser?.company_name || "");
      setProfileLogoPreview(nextUser?.logoUrl || nextUser?.logo_url || "");
      saveAuth({ token, refreshToken, user: nextUser });
      setOk("Profil yeniləndi");
    } catch (err) {
      setError(err.message || "Profil yenilənmədi");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Hesabı silmək istədiyinizə əminsiniz?")) return;

    try {
      await api.deleteMyAccount("İstifadəçi veb üzərindən hesabını sildi");
      handleSignOut();
    } catch (err) {
      setError(err.message || "Hesab silinmədi");
    }
  }

  function handleRoleSwitch(e) {
    e.preventDefault();
    setError("");
    setOk("");

    if (!nextRoleName) {
      setError("Rol dəyişikliyi üçün əvvəlcə hesabınıza daxil olun");
      return;
    }

    if (roleName === "seeker" && !switchCompany.trim()) {
      setError("İşçi axtaran profilinə keçmək üçün şirkət adını yazın");
      return;
    }

    setRoleSwitchConfirmOpen(true);
  }

  async function confirmRoleSwitchRequest() {
    const currentRole = normalizeRole(user?.role);
    setRoleSwitchConfirmOpen(false);
    setLoading(true);
    setError("");
    setOk("");

    try {
      let res;

      if (currentRole === "seeker") {
        res = await api.requestRoleSwitch({
          toRole: "employer",
          companyName: switchCompany,
          voen: switchVoen || undefined,
          category: category || undefined,
        });
      } else {
        res = await api.requestRoleSwitch({ toRole: "seeker" });
      }

      if (res?.newRole || res?.immediate) {
        const updatedRole = normalizeRole(res?.newRole) || "seeker";
        const nextUser = {
          ...(user || {}),
          role: updatedRole,
          companyName: updatedRole === "employer" ? user?.companyName : null,
          company_name: updatedRole === "employer" ? user?.company_name : null,
        };

        setUser(nextUser);
        saveAuth({ token, refreshToken, user: nextUser });
        setOk(`Rol uğurla dəyişdirildi. Profiliniz ${updatedRole === "employer" ? "İşçi axtaran" : "İş axtaran"} oldu.`);
        await loadAuthedData(nextUser);
        return;
      }

      setOk("Sorğu adminə göndərildi. Təsdiqdən sonra rolunuz avtomatik yenilənəcək.");
      await loadAuthedData(user);
    } catch (err) {
      setError(err.message || "Rol dəyişikliyi alınmadı");
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = useMemo(() => {
    const appliedSearch = String(appliedFilters.search || "").trim().toLowerCase();
    const appliedCategory = String(appliedFilters.category || "").trim().toLowerCase();
    const appliedCity = String(appliedFilters.city || "").trim().toLowerCase();
    const appliedJobLevel = String(appliedFilters.jobLevel || "").trim().toLowerCase();
    const minN = appliedFilters.minWage ? Number(appliedFilters.minWage) : null;
    const maxN = appliedFilters.maxWage ? Number(appliedFilters.maxWage) : null;

    return jobs.filter((job) => {
      const matchSearch =
        !appliedSearch ||
        [job?.title, job?.companyName, job?.company_name, job?.category, job?.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(appliedSearch);
      const matchCategory = !appliedCategory || String(job?.category || "").toLowerCase().includes(appliedCategory);
      const matchCity = !appliedCity || String(job?.location?.address || job?.address || "").toLowerCase().includes(appliedCity);
      const matchJobType = !appliedFilters.jobType || String(job?.jobType || job?.job_type || job?.workType || "").toLowerCase() === String(appliedFilters.jobType).toLowerCase();
      const matchJobLevel = !appliedJobLevel || [job?.jobLevel, job?.job_level, job?.positionLevel, job?.level, job?.title, job?.description].filter(Boolean).join(" ").toLowerCase().includes(appliedJobLevel);
      const normalizedJobType = String(job?.jobType || job?.job_type || job?.workType || job?.work_type || "").toLowerCase();
      const dailyHaystack = [job?.title, job?.category, job?.description, job?.durationLabel, job?.duration_label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchDaily = jobsMode !== "daily" || Boolean(
        job?.isDaily ||
        job?.is_daily ||
        ["temporary", "daily", "gundelik", "gündəlik", "muveqqeti", "müvəqqəti", "shift"].includes(normalizedJobType) ||
        dailyHaystack.includes("gündəlik") ||
        dailyHaystack.includes("gundelik") ||
        dailyHaystack.includes("müvəqqəti") ||
        dailyHaystack.includes("muveqqeti")
      );
      const wageNumber = extractWageNumber(job?.wage);
      const matchMin = minN === null || !Number.isFinite(minN) || (wageNumber !== null && wageNumber >= minN);
      const matchMax = maxN === null || !Number.isFinite(maxN) || (wageNumber !== null && wageNumber <= maxN);
      return matchSearch && matchCategory && matchCity && matchJobType && matchJobLevel && matchDaily && matchMin && matchMax;
    });
  }, [jobs, appliedFilters, jobsMode]);

  const homeFilterTabs = useMemo(() => ([
    { key: "type", label: "Vakansiyanın növü" },
    { key: "category", label: "Kateqoriyalar" },
    { key: "level", label: "Vəzifə dərəcəsi" },
    { key: "salary", label: "Maaş aralığı" },
  ]), []);

  const activeVacancyTypeOptions = useMemo(() => jobFilterOptions.vacancyTypes || vacancyTypeOptions, [jobFilterOptions]);
  const activeJobLevelOptions = useMemo(() => jobFilterOptions.jobLevels || jobLevelOptions, [jobFilterOptions]);
  const activeSalaryRangeOptions = useMemo(() => jobFilterOptions.salaryRanges || salaryRangeOptions, [jobFilterOptions]);

  const homeCategoryOptions = useMemo(() => categories.slice(0, 12), [categories]);

  const activeSalaryLabel = useMemo(() => {
    const match = activeSalaryRangeOptions.find((item) => item.min === minWage && item.max === maxWage);
    return match?.label || "";
  }, [minWage, maxWage, activeSalaryRangeOptions]);

  const activeCreateSalaryLabel = useMemo(() => {
    if (wageMode === "agreement") return "Razılaşma əsasında";
    if (wageMode === "skill") return "Bacarığa uyğun";
    if (wageMode === "range") return "Minimum / maksimum";
    return "";
  }, [wageMode]);

  const shownJobs = filteredJobs;
  const visibleShownJobs = useMemo(() => shownJobs.slice(0, jobsVisibleCount), [shownJobs, jobsVisibleCount]);
  const hasMoreShownJobs = shownJobs.length > visibleShownJobs.length;
  useEffect(() => {
    setJobsVisibleCount(10);
  }, [appliedFilters, jobsMode]);

  useEffect(() => {
    if (activeSection !== "jobs") return;
    if (!hasMoreShownJobs) return;
    const node = jobsLoadMoreRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setJobsVisibleCount((current) => Math.min(current + 10, shownJobs.length));
      }
    }, { rootMargin: "240px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeSection, hasMoreShownJobs, shownJobs.length]);

  const profileJobs = useMemo(() => {
    return myJobs.filter((job) => {
      const status = getJobStatus(job);
      if (myJobsStatus === "open") return status === "open" || status === "scheduled" || status === "pending";
      if (myJobsStatus === "draft") return status === "draft";
      if (myJobsStatus === "closed") return status === "closed" || status === "inactive";
      if (myJobsStatus === "rejected") return status === "rejected";
      if (myJobsStatus === "deleted") return status === "deleted";
      return status === myJobsStatus;
    });
  }, [myJobs, myJobsStatus]);


  async function handleToggleFavorite(job, event) {
    event?.stopPropagation?.();
    if (!job?.id) return;
    if (!user) {
      setActiveSection("auth");
      setError("Elanı yadda saxlamaq üçün əvvəlcə daxil olun.");
      return;
    }

    const id = String(job.id);
    const alreadySaved = favoriteJobIds.has(id);
    setFavoriteJobIds((current) => {
      const next = new Set(current);
      alreadySaved ? next.delete(id) : next.add(id);
      return next;
    });
    setFavoriteJobs((current) => alreadySaved ? current.filter((item) => String(item.id) !== id) : [{ ...job, isFavorite: true, is_favorite: true }, ...current]);

    try {
      if (alreadySaved) {
        await api.removeFavoriteJob(id);
        setOk("Elan favoritlərdən silindi");
      } else {
        await api.addFavoriteJob(id);
        setOk("Elan favoritlərə əlavə edildi");
      }
      await loadAuthedData(user);
    } catch (e) {
      setFavoriteJobIds((current) => {
        const next = new Set(current);
        alreadySaved ? next.add(id) : next.delete(id);
        return next;
      });
      setError(e.message || "Favorit əməliyyatı alınmadı");
    }
  }

  function openJobDetail(jobId) {
    router.push(`/jobs/${jobId}`);
  }

  function prefetchJobDetail(jobId) {
    if (!jobId || prefetchedJobIds.current.has(jobId)) return;

    prefetchedJobIds.current.add(jobId);
    router.prefetch(`/jobs/${jobId}`);
  }

  function scrollLatestJobs(direction) {
    const node = latestJobsCarouselRef.current;
    if (!node) return;
    const amount = Math.max(node.clientWidth * 0.85, 320);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }


  useEffect(() => {
    let ignore = false;
    const sessionKey = "asimos_web_session_id";
    let sessionId = "";
    try {
      sessionId = window.localStorage.getItem(sessionKey) || "";
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        window.localStorage.setItem(sessionKey, sessionId);
      }
      api.trackVisit({ path: window.location.pathname, sessionId }).catch(() => { });
    } catch { }

    api.getSiteStats()
      .then((data) => { if (!ignore) setSiteStats(data || null); })
      .catch(() => { if (!ignore) setSiteStats(null); });

    return () => { ignore = true; };
  }, []);

  if (booting) {
    return (
      <main className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <h2 className={styles.loadingTitle}>Yüklənir</h2>
          <p className={styles.loadingText}>Platforma hazırlanır, zəhmət olmasa bir neçə saniyə gözləyin.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        navItems={navItems}
        user={user}
        handleSignOut={handleSignOut}
        canCreateJob={canCreateJob}
        onOpenSupport={openSupportModal}
        showSupport={roleName === "employer"}
        unreadNotificationsCount={activeUnreadCount}
      />
      {activeSection === "home" ? (
        <section className={styles.homeFilterSection}>
          <div className="container">
            <form className={`${styles.homeFilterCard} ${styles.compactSearchFilter}`} onSubmit={handleHeroSearchSubmit}>
              <div className={styles.homeFilterTitle}>
                <span className={styles.homeFilterTitleIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                </span>
                <h1>İş axtarışı</h1>
              </div>

              <div className={styles.homeFilterSearchRow}>
                <label className={styles.homeFilterInputWrap}>
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Vakansiya adı və ya açar söz"
                  />
                </label>

                <label className={styles.homeFilterSelectWrap}>
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>
                  <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Şəhəri seç">
                    <option value="">Şəhəri seç</option>
                    {cityOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <button type="submit" className={styles.homeFilterSubmit} disabled={loading} aria-label="Axtar">
                  <svg className={styles.homeFilterSubmitIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <span className={styles.homeFilterSubmitText}>{loading ? "Axtarılır..." : "Axtar"}</span>
                </button>

                <label className={styles.mobileFilterButton} htmlFor="home-filter-toggle" aria-label="Filterləri göstər">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 6h16" strokeLinecap="round" />
                    <path d="M7 12h10" strokeLinecap="round" />
                    <path d="M10 18h4" strokeLinecap="round" />
                  </svg>
                  <span>Filter</span>
                </label>
              </div>

              <input id="home-filter-toggle" className={styles.mobileFilterCheckbox} type="checkbox" />

              <div className={styles.homeFilterTabs} role="tablist" aria-label="Elan filterləri">
                {homeFilterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={activeHomeFilterTab === tab.key ? styles.homeFilterTabActive : styles.homeFilterTab}
                    onClick={() => setActiveHomeFilterTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className={styles.homeFilterOptions}>
                {activeHomeFilterTab === "type" ? activeVacancyTypeOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={jobType === item.value ? styles.homeFilterOptionActive : styles.homeFilterOption}
                    onClick={() => setJobType((current) => current === item.value ? "" : item.value)}
                  >
                    {item.label}
                  </button>
                )) : null}

                {activeHomeFilterTab === "category" ? (homeCategoryOptions.length ? homeCategoryOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={category === item ? styles.homeFilterOptionActive : styles.homeFilterOption}
                    onClick={() => setCategory((current) => current === item ? "" : item)}
                  >
                    {item}
                  </button>
                )) : <p className={styles.homeFilterEmpty}>Kateqoriyalar yüklənir...</p>) : null}

                {activeHomeFilterTab === "level" ? activeJobLevelOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={jobLevel === item.value ? styles.homeFilterOptionActive : styles.homeFilterOption}
                    onClick={() => setJobLevel((current) => current === item.value ? "" : item.value)}
                  >
                    {item.label}
                  </button>
                )) : null}

                {activeHomeFilterTab === "salary" ? activeSalaryRangeOptions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={activeSalaryLabel === item.label ? styles.homeFilterOptionActive : styles.homeFilterOption}
                    onClick={() => {
                      const same = minWage === item.min && maxWage === item.max;
                      setMinWage(same ? "" : item.min);
                      setMaxWage(same ? "" : item.max);
                    }}
                  >
                    {item.label}
                  </button>
                )) : null}
              </div>

              <div className={styles.homeFilterFooter}>
                <button
                  type="button"
                  className={styles.homeFilterReset}
                  onClick={() => {
                    setSearch("");
                    setCity("");
                    setCategory("");
                    setJobType("");
                    setJobLevel("");
                    setMinWage("");
                    setMaxWage("");
                    const emptyFilters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "" };
                    setAppliedFilters(emptyFilters);
                    refreshJobs(emptyFilters);
                  }}
                >
                  Sıfırla
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
      {activeSection === "home" && homeWidgets ? <FloatingHomeWidgets config={homeWidgets} /> : null}

      <LocationPermissionPrompt
        isOpen={locationPromptOpen}
        user={user}
        locationLoading={locationLoading}
        onActivate={handleLocationActivation}
        onDismiss={() => setLocationPromptOpen(false)}
      />
      {error ? <div className="toast-notice app-toast error" role="alert">{error}</div> : null}
      {ok ? <div className="toast-notice app-toast success" role="status">{ok}</div> : null}

      {supportModalOpen ? (
        <div className="support-modal-backdrop" role="dialog" aria-modal="true" aria-label="Dəstək müraciətləri" onMouseDown={closeSupportModal}>
          <div className={`support-modal ${supportMode === "detail" ? "support-modal-chat" : ""}`} onMouseDown={(event) => event.stopPropagation()}>
            <header className="support-modal-header">
              <button
                type="button"
                className="support-back-button"
                onClick={() => {
                  if (supportMode === "list") closeSupportModal();
                  else {
                    setSupportMode("list");
                    setActiveTicketId(null);
                  }
                }}
                aria-label="Geri"
              >
                ‹
              </button>
              <div>
                <h2>{supportMode === "create" ? "Yeni müraciət" : supportMode === "detail" ? getTicketSubject(activeTicket) : "Dəstək"}</h2>
                <p>{supportMode === "detail" ? "Asimos dəstək komandası ilə canlı yazışma" : supportMode === "list" ? "Müraciətləriniz və cavablarınız" : "Probleminizi qısa yazın"}</p>
              </div>
              <button type="button" className="support-close-button" onClick={closeSupportModal} aria-label="Bağla">
                ×
              </button>
            </header>

            {supportMode === "list" ? (
              <div className="support-modal-body">
                <button
                  type="button"
                  className="btn-primary support-new-ticket"
                  onClick={() => {
                    setTicketCategory(supportCategories[0] || "");
                    setTicketMessage("");
                    setSupportMode("create");
                  }}
                >
                  + Yeni Müraciət
                </button>

                <div className="support-ticket-list">
                  {tickets.map((ticket) => {
                    const status = String(ticket.status || "open").toLowerCase();
                    const hasReply = status === "replied" || ticket.is_answered;
                    return (
                      <button key={ticket.id} type="button" className="support-ticket-card" onClick={() => openTicketDetail(ticket)}>
                        <div className="support-ticket-card-head">
                          <strong>{getTicketSubject(ticket)}</strong>
                          <span className={`support-ticket-status ${status === "closed" ? "closed" : hasReply ? "replied" : ""}`}>
                            {status === "closed" ? "Bağlı" : hasReply ? "Cavab var" : "Açıq"}
                          </span>
                        </div>
                        <p>{ticket.message || "Mesaj yoxdur"}</p>
                        <small>{ticket.created_at || ticket.createdAt ? new Date(ticket.created_at || ticket.createdAt).toLocaleDateString("az-AZ") : ""}</small>
                      </button>
                    );
                  })}
                  {tickets.length === 0 ? (
                    <div className="support-empty">
                      <strong>Sualınız var?</strong>
                      <p>Bizə yazın, ən qısa zamanda cavablandıraq.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {supportMode === "create" ? (
              <form className="support-modal-body support-create-form" onSubmit={handleCreateTicket}>
                <label>
                  Mövzu
                  <select value={ticketCategory} onChange={(event) => setTicketCategory(event.target.value)} required>
                    <option value="">Mövzunu seçin</option>
                    {supportCategories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Mesajınız
                  <textarea
                    value={ticketMessage}
                    onChange={(event) => setTicketMessage(event.target.value)}
                    rows={6}
                    placeholder="Problemi ətraflı təsvir edin..."
                    required
                  />
                </label>
                <button type="submit" className="btn-primary" disabled={loading}>
                  Müraciəti Göndər
                </button>
              </form>
            ) : null}

            {supportMode === "detail" && activeTicket ? (
              <div className="support-detail">
                <div className="support-ticket-banner">
                  <strong>{getTicketSubject(activeTicket)}</strong>
                  <span>{String(activeTicket.status || "open").toLowerCase() === "closed" ? "BAĞLANDI" : "AÇIQ"}</span>
                </div>

                <div className="support-chat">
                  {getTicketMessages(activeTicket).map((message) => (
                    <div key={message.id} className={`support-message ${message.is_admin ? "admin" : "user"}`}>
                      {message.is_admin ? <strong>ASIMOS DƏSTƏK</strong> : null}
                      <p>{message.message}</p>
                      <small>{message.created_at ? new Date(message.created_at).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : ""}</small>
                    </div>
                  ))}
                </div>

                {String(activeTicket.status || "open").toLowerCase() !== "closed" ? (
                  <div className="support-chat-footer">
                    <textarea
                      value={ticketReply[activeTicket.id] || ""}
                      onChange={(event) => setTicketReply((prev) => ({ ...prev, [activeTicket.id]: event.target.value }))}
                      placeholder="Mesaj yazın..."
                      rows={2}
                    />
                    <button type="button" className="btn-primary" onClick={() => handleReply(activeTicket.id)} disabled={loading || !ticketReply[activeTicket.id]?.trim()}>
                      Göndər
                    </button>
                  </div>
                ) : (
                  <p className="support-closed-note">Bu müraciət artıq bağlanıb.</p>
                )}

                <div className="support-detail-actions">
                  <button type="button" className="btn-danger" onClick={() => handleDeleteTicket(activeTicket.id)} disabled={loading}>
                    Müraciəti sonlandır
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setSupportMode("create")}>
                    Yeni müraciət yarat
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeSection === "home" ? (
        <>


          {hasHomeJobs || sponsoredCard || recommendedCard ? (
            <section className="container page-section">
              <header className={`section-head ${styles.latestJobsHead}`}>
                <div>
                  <span className={styles.latestJobsKicker}>Yeni imkanlar</span>
                  <h2>Son elanlar</h2>
                  <p>Ən son əlavə edilən elanları buradan izləyə bilərsən.</p>
                </div>
                <div className={styles.latestJobsActions}>
                  {homeJobs.length > 8 ? (
                    <button
                      type="button"
                      className={styles.latestJobsMoreButton}
                      onClick={() => {
                        setJobsMode("all");
                        setFocusedMapJobId(null);
                        setActiveSection("jobs");
                        window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                      }}
                    >
                      Hamısına bax
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : null}
                </div>
              </header>
              <div className={styles.latestJobsGridList}>
                {sponsoredCard ? (
                  <div className={styles.latestJobsGridItem} key="sponsored-card">
                    <SponsoredJobCard card={sponsoredCard} />
                  </div>
                ) : null}
                {homeJobs.slice(0, 4).map((job) => (
                  <div className={styles.latestJobsGridItem} key={job.id}>
                    <JobCard
                      job={job}
                      onClick={() => openJobDetail(job.id)}
                      onPrefetch={() => prefetchJobDetail(job.id)}
                      isFavorite={favoriteJobIds.has(String(job.id))}
                      onToggleFavorite={(event) => handleToggleFavorite(job, event)}
                    />
                  </div>
                ))}
                {recommendedCard ? (
                  <div className={styles.latestJobsGridItem} key="recommended-card">
                    <SponsoredJobCard card={recommendedCard} />
                  </div>
                ) : null}
                {homeJobs.slice(4, 8).map((job) => (
                  <div className={styles.latestJobsGridItem} key={job.id}>
                    <JobCard
                      job={job}
                      onClick={() => openJobDetail(job.id)}
                      onPrefetch={() => prefetchJobDetail(job.id)}
                      isFavorite={favoriteJobIds.has(String(job.id))}
                      onToggleFavorite={(event) => handleToggleFavorite(job, event)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {hasHomeMapJobs ? (
            <div id="home-jobs-map">
              <JobsMap jobs={homeMapJobs} focusedJobId={focusedMapJobId} userLocation={effectiveLocation} />
            </div>
          ) : null}
          <AppLaunchPanel />

          <section className={`container page-section ${styles.statsSection} ${styles.statsSectionBottom}`}>
            <div className={styles.statsCard}>
              <div className={styles.statsIntro}>
                <span>Asimos statistikası</span>
                <h2>Platformanın canlı göstəriciləri</h2>
                <p>Qeydiyyat, aktiv elanlar və sayt ziyarətləri burada avtomatik yenilənən formada göstərilir.</p>
              </div>
              <div className={styles.statsGrid}>
                {statsChartItems.map((item) => (
                  <div className={`${styles.statItem} ${styles.statItemChart}`} key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                    <div className={styles.statBarTrack} aria-hidden="true">
                      <i style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {Array.isArray(siteStats?.dailyVisits) && siteStats.dailyVisits.length ? (
                <div className={styles.statsMiniChart} aria-label="Son günlər üzrə giriş qrafiki">
                  {siteStats.dailyVisits.slice(-7).map((row) => {
                    const maxValue = Math.max(1, ...siteStats.dailyVisits.map((item) => Number(item.count || 0)));
                    const height = Math.max(14, Math.round((Number(row.count || 0) / maxValue) * 92));
                    return (
                      <span key={row.date}>
                        <i style={{ height }} />
                        <small>{Number(row.count || 0)}</small>
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {activeSection === "jobs" ? (
        <section className="container page-section">
          <header className="mobile-web-head">
            <div>
              <span className="mobile-web-kicker">Asimos</span>
              <h2>{jobsMode === "daily" ? "Gündəlik işlər" : "İş elanları"}</h2>
              <p>{jobsMode === "daily" ? "Yalnız müvəqqəti və günlük elanlar" : "Mobil tətbiqdəki elanlar axınına uyğun axtarış"}</p>
            </div>
          </header>

          <div className="segmented-tabs">
            <button type="button" className={jobsMode === "all" ? "active" : ""} onClick={() => setJobsMode("all")}>
              Elanlar
            </button>
            <button type="button" className={jobsMode === "daily" ? "active" : ""} onClick={() => setJobsMode("daily")}>
              Gündəlik
            </button>
          </div>

          <form className={`${styles.homeFilterCard} ${styles.compactSearchFilter}`} onSubmit={(e) => {
            e.preventDefault();
            const nextFilters = { search, category, city, jobType, jobLevel, minWage, maxWage };
            setAppliedFilters(nextFilters);
            refreshJobs(nextFilters);
          }}>
            <div className={styles.homeFilterTitle}>
              <span className={styles.homeFilterTitleIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </span>
              <h1>İş axtarışı</h1>
            </div>

            <div className={styles.homeFilterSearchRow}>
              <label className={styles.homeFilterInputWrap}>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Vakansiya adı və ya açar söz" />
              </label>

              <label className={styles.homeFilterSelectWrap}>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Şəhəri seç">
                  <option value="">Şəhəri seç</option>
                  {cityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <button type="submit" className={styles.homeFilterSubmit} disabled={loading} aria-label="Axtar">
                <svg className={styles.homeFilterSubmitIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <span className={styles.homeFilterSubmitText}>{loading ? "Axtarılır..." : "Axtar"}</span>
              </button>

              <label className={styles.mobileFilterButton} htmlFor="jobs-filter-toggle" aria-label="Filterləri göstər">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 6h16" strokeLinecap="round" />
                  <path d="M7 12h10" strokeLinecap="round" />
                  <path d="M10 18h4" strokeLinecap="round" />
                </svg>
                <span>Filter</span>
              </label>
            </div>

            <input id="jobs-filter-toggle" className={styles.mobileFilterCheckbox} type="checkbox" />

            <div className={styles.homeFilterTabs} role="tablist" aria-label="Elan filterləri">
              {homeFilterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeHomeFilterTab === tab.key ? styles.homeFilterTabActive : styles.homeFilterTab}
                  onClick={() => setActiveHomeFilterTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.homeFilterOptions}>
              {activeHomeFilterTab === "type" ? activeVacancyTypeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={jobType === item.value ? styles.homeFilterOptionActive : styles.homeFilterOption}
                  onClick={() => setJobType((current) => current === item.value ? "" : item.value)}
                >
                  {item.label}
                </button>
              )) : null}

              {activeHomeFilterTab === "category" ? (homeCategoryOptions.length ? homeCategoryOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={category === item ? styles.homeFilterOptionActive : styles.homeFilterOption}
                  onClick={() => setCategory((current) => current === item ? "" : item)}
                >
                  {item}
                </button>
              )) : <p className={styles.homeFilterEmpty}>Kateqoriyalar yüklənir...</p>) : null}

              {activeHomeFilterTab === "level" ? activeJobLevelOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={jobLevel === item.value ? styles.homeFilterOptionActive : styles.homeFilterOption}
                  onClick={() => setJobLevel((current) => current === item.value ? "" : item.value)}
                >
                  {item.label}
                </button>
              )) : null}

              {activeHomeFilterTab === "salary" ? (
                <>
                  {activeSalaryRangeOptions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={activeSalaryLabel === item.label ? styles.homeFilterOptionActive : styles.homeFilterOption}
                      onClick={() => {
                        const same = minWage === item.min && maxWage === item.max;
                        setMinWage(same ? "" : item.min);
                        setMaxWage(same ? "" : item.max);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                  <input
                    className={styles.homeFilterOption}
                    style={{ textAlign: "left", cursor: "text" }}
                    value={minWage}
                    onChange={(e) => setMinWage(e.target.value)}
                    inputMode="numeric"
                    placeholder="Min maaş: məsələn 400"
                  />
                  <input
                    className={styles.homeFilterOption}
                    style={{ textAlign: "left", cursor: "text" }}
                    value={maxWage}
                    onChange={(e) => setMaxWage(e.target.value)}
                    inputMode="numeric"
                    placeholder="Max maaş: məsələn 1200"
                  />
                </>
              ) : null}
            </div>

            <div className={styles.homeFilterFooter}>
              <button
                type="button"
                className={styles.homeFilterReset}
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setCity("");
                  setJobType("");
                  setJobLevel("");
                  setMinWage("");
                  setMaxWage("");
                  setRadiusM("0");
                  const emptyFilters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "" };
                  setAppliedFilters(emptyFilters);
                  refreshJobs(emptyFilters);
                }}
              >
                Sıfırla
              </button>
            </div>
          </form>

          <div className="mobile-job-list">
            {sponsoredCard ? <SponsoredJobCard card={sponsoredCard} /> : null}
            {visibleShownJobs.slice(0, 4).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => openJobDetail(job.id)}
                onPrefetch={() => prefetchJobDetail(job.id)}
                showEdit={(job?.createdBy || job?.created_by) === user?.id}
                onEdit={() => startEditJob(job)}
                isFavorite={favoriteJobIds.has(String(job.id))}
                onToggleFavorite={(event) => handleToggleFavorite(job, event)}
              />
            ))}
            {recommendedCard ? <SponsoredJobCard card={recommendedCard} /> : null}
            {visibleShownJobs.slice(4).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => openJobDetail(job.id)}
                onPrefetch={() => prefetchJobDetail(job.id)}
                showEdit={(job?.createdBy || job?.created_by) === user?.id}
                onEdit={() => startEditJob(job)}
                isFavorite={favoriteJobIds.has(String(job.id))}
                onToggleFavorite={(event) => handleToggleFavorite(job, event)}
              />
            ))}
          </div>

          {hasMoreShownJobs ? (
            <div className="jobs-lazy-load" ref={jobsLoadMoreRef}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setJobsVisibleCount((current) => Math.min(current + 10, shownJobs.length))}
              >
                Daha 10 elan göstər
              </button>
              <span>{visibleShownJobs.length} / {shownJobs.length}</span>
            </div>
          ) : shownJobs.length > 10 ? (
            <div className="jobs-lazy-load completed">Bütün elanlar göstərildi</div>
          ) : null}

          {shownJobs.length === 0 && !sponsoredCard && !recommendedCard ? (
            <div className="empty-state-card">
              <strong>Elan tapılmadı</strong>
              <p>Seçilən filterlərə uyğun elan yoxdur. Filterləri sıfırlayıb bütün elanlara baxa bilərsiniz.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setCity("");
                  setJobType("");
                  setJobLevel("");
                  setMinWage("");
                  setMaxWage("");
                  setJobsMode("all");
                  const emptyFilters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "" };
                  setAppliedFilters(emptyFilters);
                  refreshJobs(emptyFilters);
                }}
              >
                Bütün elanları göstər
              </button>
            </div>
          ) : null}

        </section>
      ) : null}

      {activeSection === "create" && canCreateJob ? (
        <section className="container page-section" style={{ maxWidth: 760 }}>
          <header className="section-head" style={{ marginBottom: 10, padding: "0 4px" }}>
            <h2>{editingJobId ? "Elanı redaktə et" : "Yeni vakansiya yerləşdir"}</h2>
            <p>{editingJobId ? "Vakansiya məlumatlarını yeniləyin və yenidən təsdiqə göndərin." : "Məlumatları tam doldurun. Elan admin təsdiqindən sonra yayımlanacaq."}</p>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <form onSubmit={handleCreateJob} style={{ display: "grid", gap: 10 }} className="asimos-compact-job-form">
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Vakansiya məlumatları</div>
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>
                    Vakansiya adı <span style={{ color: "#ef4444" }}>*</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Məs: Mühasib, React proqramçısı..." required style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 46, padding: "0 14px", fontSize: 15, outline: "none" }} />
                  </label>

                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>
                    Filial / iş yeri
                    <input value={companyObject} onChange={(e) => setCompanyObject(e.target.value)} placeholder="Məs: Nərimanov filialı, Mərkəzi ofis..." style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 46, padding: "0 14px", fontSize: 15, outline: "none" }} />
                  </label>

                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>
                    Kateqoriya <span style={{ color: "#ef4444" }}>*</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 46, padding: "0 14px", fontSize: 15, background: "#fff", outline: "none" }}>
                      <option value="">Kateqoriya seçin</option>
                      {homeCategoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>
                    Dərəcə
                    <select value={jobLevel} onChange={(e) => setJobLevel(e.target.value)} style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 46, padding: "0 14px", fontSize: 15, background: "#fff", outline: "none" }}>
                      <option value="">Seçin (məcburi deyil)</option>
                      {activeJobLevelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Maaş <span style={{ color: "#ef4444" }}>*</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: wageMode === "range" ? 12 : 4 }}>
                  {[
                    ["agreement", "Razılaşma"],
                    ["skill", "Bacarığa əsasən"],
                    ["range", "Rəqəm göstər"],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => { setWageMode(value); if (value === "agreement") setWage("Razılaşma əsasında"); if (value === "skill") setWage("Bacarığa uyğun"); }} style={{ border: "1px solid #dbe3ee", borderRadius: 999, minHeight: 42, padding: "0 18px", fontSize: 15, fontWeight: 700, background: wageMode === value ? "#1fa276" : "#fff", color: wageMode === value ? "#fff" : "#666", cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {wageMode === "range" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <input value={wageMin} onChange={(event) => { const value = event.target.value.replace(/[^0-9]/g, ""); setWageMin(value); const max = String(wageMax || "").replace(/[^0-9]/g, ""); setWage(value && max ? `${value} - ${max} AZN` : value ? `${value} AZN` : ""); }} inputMode="numeric" placeholder="Minimum maaş" style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                    <input value={wageMax} onChange={(event) => { const value = event.target.value.replace(/[^0-9]/g, ""); setWageMax(value); const min = String(wageMin || "").replace(/[^0-9]/g, ""); setWage(min && value ? `${min} - ${value} AZN` : min ? `${min} AZN` : value ? `${value} AZN` : ""); }} inputMode="numeric" placeholder="Maksimum maaş" style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                  </div>
                ) : <p style={{ margin: "10px 0 0", color: "#9a9a9a", fontSize: 13 }}>Elanda "{wageMode === "skill" ? "Bacarığa uyğun" : "Razılaşma əsasında"}" görünəcək</p>}
              </div>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>İş növü <span style={{ color: "#ef4444" }}>*</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  <button type="button" onClick={() => { setJobType("permanent"); setDurationPreset("1"); }} style={{ border: "1px solid #dbe3ee", borderRadius: 999, minHeight: 42, padding: "0 18px", fontSize: 15, fontWeight: 700, background: jobType !== "temporary" ? "#1fa276" : "#fff", color: jobType !== "temporary" ? "#fff" : "#666", cursor: "pointer" }}>Daimi iş</button>
                  <button type="button" onClick={() => { setJobType("temporary"); setDurationPreset("1"); setDurationDays("1"); }} style={{ border: "1px solid #dbe3ee", borderRadius: 999, minHeight: 42, padding: "0 18px", fontSize: 15, fontWeight: 700, background: jobType === "temporary" ? "#1fa276" : "#fff", color: jobType === "temporary" ? "#fff" : "#666", cursor: "pointer" }}>Günəmuzd</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>Başlama tarixi
                    <input type="date" value={vacancyStartDate} onChange={(e) => setVacancyStartDate(e.target.value)} style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                  </label>
                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>Bitmə tarixi <span style={{ color: "#ef4444" }}>*</span>
                    <input type="date" value={vacancyEndDate} onChange={(e) => setVacancyEndDate(e.target.value)} required style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                  </label>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Əlaqə məlumatları</div>
                <div style={{ background: "#eef4ff", borderRadius: 14, padding: 12, display: "grid", gap: 14 }}>
                  <div style={{ color: "#9a9a9a", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>🔄 Profildən avtomatik — elanda görünməsini seçin</div>
                  {[
                    ["phone", "📞", contactPhone || user?.phone || "+994"],
                    ["whatsapp", "💬", whatsapp || user?.phone || "+994"],
                    ["email", "✉️", contactEmail || user?.email || "email@example.com"],
                  ].map(([key, icon, value]) => (
                    <div key={key} style={{ display: "grid", gridTemplateColumns: "54px 24px minmax(0, 1fr) auto", gap: 8, alignItems: "center" }}>
                      <button type="button" onClick={() => setContactVisibility((prev) => ({ ...prev, [key]: !prev[key] }))} aria-pressed={Boolean(contactVisibility[key])} style={{ width: 46, height: 26, borderRadius: 999, border: 0, padding: 4, background: contactVisibility[key] ? "#1fa276" : "#cfd3d8", cursor: "pointer", display: "flex", justifyContent: contactVisibility[key] ? "flex-end" : "flex-start" }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", display: "block" }} /></button>
                      <span style={{ fontSize: 17 }}>{icon}</span>
                      <span style={{ fontSize: 15, color: "#111827", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
                      {primaryContact === key ? <span style={{ background: "#dcfce7", color: "#147555", borderRadius: 999, padding: "6px 10px", fontWeight: 800 }}>İlk göstərilməlidir</span> : <button type="button" onClick={() => setPrimaryContact(key)} style={{ border: "1px solid #6ee7b7", color: "#15956d", background: "#fff", borderRadius: 14, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>İlk et</button>}
                    </div>
                  ))}
                  <p style={{ margin: 0, color: "#9a9a9a", fontSize: 13 }}>Aktiv etdiyiniz əlaqə yolları elanda göstərilir. “İlk göstərilməlidir” seçimi həmin əlaqə vasitəsini siyahının başına çıxarır.</p>
                </div>
                <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700, marginTop: 18 }}>ATS linki
                  <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://ats.sirketiniz.az/apply" style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                </label>
              </div>

              <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                Təsvir
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required placeholder="Vakansiyanın tələbləri, vəzifələr və əlavə qeydlər..." style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, padding: 12, fontSize: 14, resize: "vertical" }} />
              </label>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Lokasiya <span style={{ color: "#ef4444" }}>*</span></div>
                <div style={{ border: "1px solid #a7f3d0", borderRadius: 14, overflow: "hidden", minHeight: 150 }}>
                  <LocationPicker lat={lat} lng={lng} address={locationText} onChange={({ lat: nextLat, lng: nextLng, address: nextAddress }) => { setLat(nextLat); setLng(nextLng); setLocationText(nextAddress); }} />
                </div>
              </div>

              <div style={{ background: "#f8fbff", border: "1px solid #bfdbfe", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
                <strong style={{ color: "#1d5fae", fontSize: 17 }}>📅 Yayımlanma planlaması</strong>
                <button type="button" onClick={() => setPublishMode((value) => value === "scheduled" ? "instant" : "scheduled")} aria-pressed={publishMode === "scheduled"} style={{ width: 56, height: 32, borderRadius: 999, border: 0, padding: 4, background: publishMode === "scheduled" ? "#1fa276" : "#cfd3d8", cursor: "pointer", display: "flex", justifyContent: publishMode === "scheduled" ? "flex-end" : "flex-start" }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", display: "block" }} /></button>
              </div>

              {publishMode === "scheduled" ? (
                <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>Yayım tarixi və saatı
                  <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                </label>
              ) : null}

              <p style={{ color: "#747b87", fontSize: 14, lineHeight: 1.4, margin: "4px 0" }}>🛡️ Elan adminə göndəriləcək. Təsdiqləndikdən sonra yayımlanacaq. Daha sürətli təsdiq almaq üçün elanı qaydalara uyğun və ətraflı formada doldurun.</p>

              <div style={{ display: "grid", gap: 12 }}>
                {!editingJobId ? <button type="button" disabled={loading} onClick={(e) => handleCreateJob(e, true)} style={{ minHeight: 46, border: "1px solid #dbe3ee", borderRadius: 16, background: "#fff", color: "#555", fontSize: 17, fontWeight: 800, cursor: "pointer" }}>✏️ Qaralama olaraq saxla</button> : null}
                <button type="submit" disabled={loading} style={{ minHeight: 48, border: 0, borderRadius: 16, background: "#1fa276", color: "#fff", fontSize: 17, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1 }}>{loading ? "Göndərilir..." : editingJobId ? "Dəyişiklikləri saxla" : "📥 Elanı adminə göndər"}</button>
                {editingJobId ? <button type="button" onClick={resetJobForm} style={{ minHeight: 42, border: "1px solid #dbe3ee", borderRadius: 18, background: "#fff", color: "#555", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Redaktəni ləğv et</button> : null}
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      {activeSection === "alerts" ? (
        <section className="container page-section notifications-page">
          <div className="notifications-hero">
            <div className="notifications-hero-content">
              <span className="notifications-eyebrow">Asimos iş bildirişləri</span>
              <h2>İş bildirişləri</h2>
              <p>Yaxınlığındakı yeni elanları, müraciət yeniliklərini və vacib hesab məlumatlarını bir yerdə izlə.</p>
            </div>

            <div className="notifications-hero-actions">
              <div className="notifications-stat-card primary">
                <span>{activeUnreadCount}</span>
                <small>Aktiv</small>
              </div>
              <div className="notifications-stat-card">
                <span>{notifications.length}</span>
                <small>Ümumi bildiriş</small>
              </div>
            </div>
          </div>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <>
              <div className="notifications-toolbar">
                <div>
                  <strong>Son yeniliklər</strong>
                  <p>{notifications.length ? "Bütün bildirişlər default olaraq burada görünür. Bildirişə klikləyərək bağlı elana keçə bilərsən." : "Yeni bildiriş gəldikdə burada görünəcək."}</p>
                </div>
                <button type="button" className="btn-secondary notifications-read-button" onClick={handleMarkAllRead} disabled={!notifications.length}>
                  Hamısını oxundu et
                </button>
              </div>

              {notifications.length ? (
                <div className="notifications-list">
                  {notifications.map((item) => {
                    const isRead = Boolean(item.readAt || item.read_at);
                    const jobId = getNotificationJobId(item);
                    const tone = getNotificationTone(item);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`notification-card ${isRead ? "read" : "unread"} tone-${tone}`}
                        onClick={() => handleOpenNotification(item)}
                      >
                        <span className="notification-icon" aria-hidden="true">
                          {tone === "near" ? "📍" : tone === "apply" ? "💼" : tone === "job" ? "✨" : "🔔"}
                        </span>

                        <span className="notification-content">
                          <span className="notification-title-row">
                            <strong>{item.title || "Bildiriş"}</strong>
                            {!isRead ? <span className="notification-unread-dot">Yeni</span> : null}
                          </span>
                          <span className="notification-message">{item.body || item.message || "Mesaj yoxdur"}</span>
                          <span className="notification-meta">
                            <span>{formatNotificationTime(getNotificationCreatedAt(item))}</span>
                            {jobId ? <span>Elana keçid aktivdir</span> : <span>Ümumi məlumat</span>}
                          </span>
                        </span>

                        <span className="notification-arrow" aria-hidden="true">→</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="notifications-empty">
                  <div className="notifications-empty-icon">🔕</div>
                  <h3>Hələ bildiriş yoxdur</h3>
                  <p>Yaxınlığında yeni elan və ya hesabında vacib yenilik olduqda burada görünəcək.</p>
                </div>
              )}

              <div className="notifications-toolbar alerts-create-toolbar">
                <div>
                  <strong>Yeni bildiriş kriteriyası yarat</strong>
                  <p>Kateqoriya, radius və açar söz seçərək gələcək elanlar üçün ayrıca xəbərdarlıq qura bilərsən.</p>
                </div>
              </div>

              <form className="form-grid compact" onSubmit={handleCreateAlert}>
                <label>
                  Kateqoriya
                  <select value={alertCategory} onChange={(e) => setAlertCategory(e.target.value)}>
                    <option value="">Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Radius (m)
                  <input value={alertRadius} onChange={(e) => setAlertRadius(e.target.value)} />
                </label>

                <label>
                  Açar sözlər
                  <input value={alertKeywords} onChange={(e) => setAlertKeywords(e.target.value)} />
                </label>

                <div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    Yarat
                  </button>
                </div>
              </form>

              {alerts.length ? (
                <div className="stack-list alerts-rules-list">
                  {alerts.map((item) => (
                    <div key={item.id} className="line-item">
                      <div>
                        <strong>{item.category || "Ümumi"}</strong>
                        <p>
                          Radius: {item.radius_m || item.radius || "-"}m | Söz: {item.q || item.query || "-"}
                        </p>
                      </div>
                      <button type="button" className="btn-secondary" onClick={() => handleDeleteAlert(item.id)}>
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {activeSection === "notifications" ? (
        <section className="container page-section notifications-page">
          <div className="notifications-hero">
            <div className="notifications-hero-content">
              <span className="notifications-eyebrow">Asimos iş bildirişləri</span>
              <h2>İş bildirişləri</h2>
              <p>Yaxınlığındakı yeni elanları, müraciət yeniliklərini və vacib hesab məlumatlarını bir yerdə izlə.</p>
            </div>

            <div className="notifications-hero-actions">
              <div className="notifications-stat-card primary">
                <span>{activeUnreadCount}</span>
                <small>Aktiv</small>
              </div>
              <div className="notifications-stat-card">
                <span>{notifications.length}</span>
                <small>Ümumi bildiriş</small>
              </div>
            </div>
          </div>

          <div className="notifications-toolbar">
            <div>
              <strong>Son yeniliklər</strong>
              <p>{activeUnreadCount ? "Oxunmamış bildirişlər burada aktiv görünür. Kliklədikdə oxundu sayılır və siyahıdan bağlanır." : "Yeni oxunmamış bildiriş gəldikdə burada görünəcək."}</p>
            </div>
            <button type="button" className="btn-secondary notifications-read-button" onClick={handleMarkAllRead} disabled={!activeUnreadCount}>
              Hamısını oxundu et
            </button>
          </div>

          {activeUnreadCount ? (
            <div className="notifications-list">
              {unreadNotifications.map((item) => {
                const isRead = Boolean(item.readAt || item.read_at);
                const jobId = getNotificationJobId(item);
                const tone = getNotificationTone(item);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`notification-card ${isRead ? "read" : "unread"} tone-${tone}`}
                    onClick={() => handleOpenNotification(item)}
                  >
                    <span className="notification-icon" aria-hidden="true">
                      {tone === "near" ? "📍" : tone === "apply" ? "💼" : tone === "job" ? "✨" : "🔔"}
                    </span>

                    <span className="notification-content">
                      <span className="notification-title-row">
                        <strong>{item.title || "Bildiriş"}</strong>
                        {!isRead ? <span className="notification-unread-dot">Yeni</span> : null}
                      </span>
                      <span className="notification-message">{item.body || item.message || "Mesaj yoxdur"}</span>
                      <span className="notification-meta">
                        <span>{formatNotificationTime(getNotificationCreatedAt(item))}</span>
                        {jobId ? <span>Elana keçid aktivdir</span> : <span>Ümumi məlumat</span>}
                      </span>
                    </span>

                    <span className="notification-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="notifications-empty">
              <div className="notifications-empty-icon">🔕</div>
              <h3>Aktiv bildiriş yoxdur</h3>
              <p>Oxunmamış bildirişlər burada görünəcək. Oxuduğun bildirişlər avtomatik siyahıdan bağlanır.</p>
            </div>
          )}
        </section>
      ) : null}

      {activeSection === "profile" ? (
        <section className="container page-section profile-page">
          <header className="profile-hero">
            <div className="profile-identity">
              <div className="profile-avatar">{profileLogoPreview || user?.logoUrl || user?.logo_url ? <img src={profileLogoPreview || user?.logoUrl || user?.logo_url} alt="Profil loqosu" /> : String(editingName || user?.fullName || user?.companyName || "A").trim()[0]?.toUpperCase()}</div>
              <div>
                <span className="profile-eyebrow">{roleName === "employer" ? "İşçi axtaran profil" : "İş axtaran profil"}</span>
                <h2>{editingName || user?.fullName || user?.companyName || "Profil"}</h2>
                <p>{editingPhone || user?.phone || "Telefon qeyd edilməyib"}</p>
              </div>
            </div>
            <div className="profile-stats">
              <div>
                <span>{roleName === "employer" ? myJobs.length : alerts.length}</span>
                <small>{roleName === "employer" ? "Elan" : "Bildiriş"}</small>
              </div>
              <div>
                <span>{activeUnreadCount}</span>
                <small>Aktiv</small>
              </div>
              <div>
                <span>{hasSavedLocation(user) ? "Aktiv" : "Yoxdur"}</span>
                <small>Lokasiya</small>
              </div>
            </div>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <div className="profile-layout">
              <div className="profile-main-column">
                <form className="profile-panel profile-form" onSubmit={handleProfileSave}>
                  <div className="profile-panel-head">
                    <div>
                      <span>Hesab məlumatları</span>
                      <h3>Profil detalları</h3>
                    </div>
                    <small>Görünən ad, telefon və əsas lokasiya</small>
                  </div>

                  <div className="profile-fields">
                    <label>
                      Ad Soyad
                      <input value={editingName} onChange={(e) => setEditingName(e.target.value)} required />
                    </label>

                    <label>
                      Telefon
                      <input value={editingPhone} onChange={(e) => setEditingPhone(e.target.value)} required />
                    </label>

                    {roleName === "employer" ? (
                      <>
                        <label>
                          Şirkət adı
                          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Şirkət adı" />
                        </label>
                        <label className="full-row profile-logo-editor">
                          Şirkət loqosu
                          <div className="asimos-file-upload">
                            <input id="profile-logo-upload" type="file" accept="image/*" onChange={handleProfileLogoFileChange} />
                            <label htmlFor="profile-logo-upload" className="asimos-file-button">Loqo seç</label>
                            <span>{profileLogoPreview ? "Loqo seçildi" : "Loqo əlavə edilməyib"}</span>
                          </div>
                          {profileLogoPreview ? (
                            <div className="asimos-upload-preview profile-logo-preview">
                              <img src={profileLogoPreview} alt="Profil loqosu" />
                              <button type="button" className="btn-secondary" onClick={() => setProfileLogoPreview("")}>Loqonu sil</button>
                            </div>
                          ) : null}
                        </label>
                      </>
                    ) : null}

                    <label className="full-row">
                      Ünvan
                      <input value={locationText} onChange={(e) => setLocationText(e.target.value)} />
                    </label>

                    <label>
                      Lat
                      <input value={lat} onChange={(e) => setLat(e.target.value)} />
                    </label>

                    <label>
                      Lng
                      <input value={lng} onChange={(e) => setLng(e.target.value)} />
                    </label>
                  </div>

                  <div className="profile-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      Profili yenilə
                    </button>
                    <button type="button" className="btn-danger" onClick={handleDeleteAccount}>
                      Hesabı sil
                    </button>
                  </div>
                </form>

                {roleName === "employer" ? (
                  <section className="profile-panel profile-jobs-section">
                    <div className="profile-panel-head">
                      <div>
                        <span>İdarəetmə</span>
                        <h3>Mənim elanlarım</h3>
                      </div>
                      <small>{myJobs.length} aktiv və ya arxiv elan</small>
                    </div>

                    <div className="status-tabs">
                      {[
                        ["open", "Aktiv elanlar"],
                        ["draft", "Yadda saxlanılanlar"],
                        ["closed", "Deaktiv elanlar"],
                        ["rejected", "Rədd edilmiş"],
                        ["deleted", "Silinmiş elanlar"],
                      ].map(([value, label]) => (
                        <button key={value} type="button" className={myJobsStatus === value ? "active" : ""} onClick={() => setMyJobsStatus(value)}>
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="profile-jobs-list">
                      {profileJobs.map((job) => {
                        const logo = getProfileJobLogo(job);
                        const status = getJobStatus(job);
                        return (
                          <article key={job.id} className="profile-job-card">
                            <div className="profile-job-main">
                              <div className="profile-job-logo" aria-hidden="true">
                                {logo ? <img src={logo} alt="" /> : <span>{String(job.title || getProfileJobCompany(job) || "A").charAt(0).toUpperCase()}</span>}
                              </div>
                              <div className="profile-job-info">
                                <div className="profile-job-title-row">
                                  <h3>{job.title || "Adsız elan"}</h3>
                                  <span className={`profile-job-status ${status}`}>{status}</span>
                                </div>
                                <p>{getProfileJobCompany(job)}{job.category ? ` • ${job.category}` : ""}</p>
                                <div className="profile-job-meta">
                                  <span>{job.location?.address || job.address || "Ünvan yoxdur"}</span>
                                  <span>{formatProfileJobDate(job.publishedAt || job.published_at || job.createdAt || job.created_at)}</span>
                                  <span>{job.jobType || job.job_type || "permanent"}</span>
                                </div>
                              </div>
                            </div>
                            <div className="profile-job-actions">
                              <button type="button" className="btn-secondary" onClick={() => startEditJob(job)}>
                                Redaktə et
                              </button>
                              {["draft", "closed", "rejected"].includes(status) ? (
                                <button type="button" className="btn-secondary" onClick={() => handlePublishJob(job.id)}>
                                  Aktiv et
                                </button>
                              ) : null}
                              {status === "open" || status === "pending" || status === "scheduled" ? (
                                <button type="button" className="btn-secondary" onClick={() => handleCloseJob(job.id)}>
                                  Deaktiv et
                                </button>
                              ) : null}
                              {status !== "deleted" ? (
                                <button type="button" className="btn-secondary danger-soft" onClick={() => handleDeleteJob(job.id)}>
                                  Sil
                                </button>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    {profileJobs.length === 0 ? <p className="muted">Bu statusda elan yoxdur.</p> : null}
                  </section>
                ) : null}


                <section className="profile-panel profile-favorites-section">
                  <div className="profile-panel-head">
                    <div>
                      <span>Favoritlər</span>
                      <h3>Yadda saxlanılan elanlar</h3>
                    </div>
                    <small>{favoriteJobs.length} elan</small>
                  </div>

                  {favoriteJobs.length ? (
                    <div className="profile-favorites-list">
                      {favoriteJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onClick={() => openJobDetail(job.id)}
                          onPrefetch={() => prefetchJobDetail(job.id)}
                          isFavorite={true}
                          onToggleFavorite={(event) => handleToggleFavorite(job, event)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Favorit elan yoxdur. Elan kartındakı yadda saxla ikonuna kliklədikdə burada görünəcək.</p>
                  )}
                </section>
              </div>

              <aside className="profile-side-column">
                <form className="profile-panel role-panel" onSubmit={handleRoleSwitch}>
                  <div className="profile-panel-head">
                    <div>
                      <span>Rol</span>
                      <h3>Rol dəyişikliyi</h3>
                    </div>
                    <small>{roleSwitchStatus ? `Status: ${roleSwitchStatus.status}` : "Yeni sorğu göndərin"}</small>
                  </div>
                  {roleName === "seeker" ? (
                    <div className="profile-fields single">
                      <label>
                        Şirkət adı
                        <input value={switchCompany} onChange={(e) => setSwitchCompany(e.target.value)} required />
                      </label>
                      <label>
                        VOEN
                        <input value={switchVoen} onChange={(e) => setSwitchVoen(e.target.value)} />
                      </label>
                    </div>
                  ) : (
                    <p className="muted">Hazırda işçi axtaran profili ilə istifadə edirsiniz.</p>
                  )}
                  <button type="submit" className="btn-secondary" disabled={loading}>
                    Sorğu göndər
                  </button>
                </form>
              </aside>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeSection === "support" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Dəstək mərkəzi</h2>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <>
              <form className="form-grid" onSubmit={handleCreateTicket}>
                <label>
                  Kateqoriya
                  <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                    <option value="general">Ümumi</option>
                    <option value="technical">Texniki</option>
                    <option value="account">Hesab</option>
                    <option value="payment">Ödəniş</option>
                  </select>
                </label>

                <label className="full-row">
                  Mesaj
                  <textarea value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} rows={4} required />
                </label>

                <div className="full-row">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    Bilet yarat
                  </button>
                </div>
              </form>

              <div className="stack-list">
                {tickets.map((ticket) => (
                  <article key={ticket.id} className="ticket-item">
                    <h4>{ticket.category || "Ticket"}</h4>
                    <p>{ticket.message}</p>

                    {Array.isArray(ticket.replies) ? (
                      <div className="reply-block">
                        {ticket.replies.map((reply) => (
                          <p key={reply.id}>- {reply.message}</p>
                        ))}
                      </div>
                    ) : null}

                    <div className="actions-row">
                      <input
                        value={ticketReply[ticket.id] || ""}
                        onChange={(e) => setTicketReply((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                        placeholder="Cavab yaz"
                      />
                      <button type="button" className="btn-secondary" onClick={() => handleReply(ticket.id)}>
                        Göndər
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => handleDeleteTicket(ticket.id)}>
                        Sil
                      </button>
                    </div>
                  </article>
                ))}
                {tickets.length === 0 ? <p className="muted">Bilet yoxdur.</p> : null}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activeSection === "about" ? (
        <section className="container page-section about-page">
          <header className="section-head">
            <span className="section-kicker">Asimos haqqında</span>
            <h2>Yaxınındakı elanları və gündəlik fürsətləri bir yerdə tap.</h2>
            <p>Asimos iş axtaranları, xidmət göstərənləri və işçi axtaranları lokasiya əsaslı sadə platformada birləşdirir.</p>
          </header>
          <div className="about-grid">
            <article className="about-card">
              <strong>Lokasiya əsaslı axtarış</strong>
              <span>Cihaz lokasiyasını aktiv etdikdə sənə ən yaxın elanları xəritədə görə bilərsən.</span>
            </article>
            <article className="about-card">
              <strong>Elanlar və gündəlik işlər</strong>
              <span>Daimi və günlük fürsətləri ayrıca filtrlə, uyğun olanı sürətli tap.</span>
            </article>
            <article className="about-card">
              <strong>Bildiriş sistemi</strong>
              <span>Maraqlı kateqoriyalar üzrə iş bildirişləri yarat və yeni elanlardan xəbərdar ol.</span>
            </article>
          </div>
        </section>
      ) : null}

      {activeSection === "terms" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Qaydalar və şərtlər</h2>
          </header>
          <div className="terms-box">{terms}</div>
          <div className="actions-row">
            <Link href="/policy" className="btn-secondary">
              Siyasət səhifəsinə keç
            </Link>
          </div>
        </section>
      ) : null}

      {activeSection === "auth" ? (
        <AuthSection
          mode={mode}
          setMode={setMode}
          loading={loading}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          fullName={fullName}
          setFullName={setFullName}
          companyName={companyName}
          setCompanyName={setCompanyName}
          registerLogoPreview={registerLogoPreview}
          setRegisterLogoPreview={setRegisterLogoPreview}
          onRegisterLogoFileChange={handleRegisterLogoFileChange}
          phone={phone}
          setPhone={setPhone}
          role={role}
          setRole={setRole}
          registerCategory={registerCategory}
          setRegisterCategory={setRegisterCategory}
          categories={categories}
          otp={otp}
          setOtp={setOtp}
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          resetCode={resetCode}
          setResetCode={setResetCode}
          resetPassword={resetPassword}
          setResetPassword={setResetPassword}
          showResetPassword={showResetPassword}
          setShowResetPassword={setShowResetPassword}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          handleVerifyOtp={handleVerifyOtp}
          handleForgotPassword={handleForgotPassword}
          handleResetPassword={handleResetPassword}
          onBack={() => {
            setActiveSection("home");
            setMode("login");
          }}
        />
      ) : null}


      {roleSwitchConfirmOpen ? (
        <div className="confirm-modal-backdrop" role="presentation" onClick={() => setRoleSwitchConfirmOpen(false)}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="role-switch-confirm-title" onClick={(event) => event.stopPropagation()}>
            <div className="confirm-modal-icon" aria-hidden="true">↔</div>
            <h3 id="role-switch-confirm-title">Sorğunuzu dəyişməyə əminsiniz?</h3>
            <p>
              Profil rolunuzu <strong>{nextRoleLabel}</strong> olaraq dəyişmək üçün sorğu göndəriləcək.
              {roleName === "seeker" ? " Admin təsdiqlədikdən sonra profiliniz avtomatik yenilənəcək." : " Bu keçid üçün admin təsdiqi lazım deyil, rolunuz dərhal iş axtaran olaraq yenilənəcək."}
            </p>
            {roleName === "seeker" ? (
              <div className="confirm-modal-summary">
                <span>Şirkət</span>
                <strong>{switchCompany || "Qeyd edilməyib"}</strong>
                {switchVoen ? <small>VOEN: {switchVoen}</small> : null}
              </div>
            ) : null}
            <div className="confirm-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setRoleSwitchConfirmOpen(false)} disabled={loading}>
                Xeyr
              </button>
              <button type="button" className="btn-primary" onClick={confirmRoleSwitchRequest} disabled={loading}>
                {roleName === "seeker" ? "Bəli, sorğu göndər" : "Bəli, rolu dəyiş"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

    </main>
  );
}
