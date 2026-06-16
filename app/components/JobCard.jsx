import { useState } from "react";

function formatDistance(distanceM) {
  const value = Number(distanceM);
  if (!Number.isFinite(value)) return null;
  if (value >= 1000) {
    const km = value / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
  }
  return `${Math.round(value)} m`;
}

function formatNotifyRadius(value) {
  const meters = Number(value);
  if (!Number.isFinite(meters) || meters <= 0) return "";
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km radius`;
  }
  return `${Math.round(meters)} m radius`;
}

function getJobUrl(job) {
  const path = `/jobs/${job?.id || ""}`;
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function copyTextFallback(text) {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

async function copyText(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return copyTextFallback(text);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getExpiryDate(job) {
  const explicit = job?.validThrough || job?.valid_through || job?.expiresAt || job?.expires_at || job?.deadline || job?.expire_at;
  if (explicit) {
    const explicitDate = new Date(explicit);
    if (!Number.isNaN(explicitDate.getTime())) return explicitDate;
  }

  const rawType = String(job?.jobType || job?.job_type || "").toLowerCase();
  const isTemporary = job?.isDaily || job?.is_daily || rawType === "temporary";
  const durationDays = isTemporary ? Number(job?.durationDays ?? job?.duration_days ?? 1) : 28;
  const startValue = job?.publishedAt || job?.published_at || job?.createdAt || job?.created_at;
  const startDate = startValue ? new Date(startValue) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) return null;

  return new Date(startDate.getTime() + Math.max(1, durationDays || 1) * 86400000);
}

function getRemainingLabel(job) {
  const expiryDate = getExpiryDate(job);
  if (!expiryDate) return "";
  const diff = expiryDate.getTime() - Date.now();
  if (diff <= 0) return "Bu gün bitir";
  const days = Math.ceil(diff / 86400000);
  if (days >= 1) return `${days} gün qaldı`;
  const hours = Math.max(1, Math.ceil(diff / 3600000));
  return `${hours} saat qaldı`;
}

function getCopyText(job, values) {
  return [
    normalizeText(job?.title || "Adsız elan"),
    `Şirkət: ${values.companyLabel}`,
    `Növ: ${values.typeLabel}`,
    `Maaş: ${values.wageLabel}`,
    values.levelLabel ? `Səviyyə: ${values.levelLabel}` : "",
    `Lokasiya: ${values.locationLabel}`,
    values.distanceLabel ? `Məsafə: ${values.distanceLabel}` : "",
    values.remainingLabel ? `Müddət: ${values.remainingLabel}` : "",
    values.expiryLabel ? `Bitmə tarixi: ${values.expiryLabel}` : "",
    `Link: ${getJobUrl(job)}`,
  ].filter(Boolean).join("\n");
}

function getInitials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "AS";
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getCompanyLabel(job) {
  return job.company || job.companyName || job.company_name || "Asimos İşəgötürən";
}

function getLocationLabel(job, distance) {
  const address = job?.location?.address || job?.location_address || job?.address;
  if (address) return address;
  if (distance) return `${distance} uzaqda`;
  return "Bakı, Azərbaycan";
}

function isPremiumJob(job) {
  if (job?.is_premium || job?.isPremium || job?.premium) return true;
  const boostedUntil = job?.boostedUntil || job?.boosted_until;
  return Boolean(boostedUntil && new Date(boostedUntil) > new Date());
}

function getJobTypeLabel(job) {
  const type = String(job?.jobType || job?.job_type || "").toLowerCase();
  const labels = {
    shift: "Növbə əsasında",
    full_time: "Tam ştat",
    permanent: "Daimi",
    freelance: "Frilans",
    commission: "Komisyon haqqı",
    volunteer: "Könüllü",
    seasonal: "Mövsümi",
    temporary: "Müvəqqəti",
    internship: "Təcrübə",
    scholarship: "Təqaüd proqramı",
    part_time: "Yarım ştat",
  };
  if (job?.isDaily || job?.is_daily || type === "temporary") return "Gündəlik iş";
  if (type === "seeker") return "İş axtaran";
  return labels[type] || job?.jobType || job?.job_type || "Elan";
}

function getWageLabel(job) {
  const wage = job?.wage || job?.salary || job?.salaryRange || job?.salary_range;
  return wage ? String(wage) : "Razılaşma əsasında";
}

function getLevelLabel(job) {
  const level = job?.jobLevel || job?.job_level || job?.positionLevel || job?.level;
  const labels = {
    entry: "Təcrübəsiz",
    junior: "Junior",
    middle: "Middle",
    senior: "Senior",
    manager: "Menecer",
    lead: "Rəhbər",
  };
  if (!level) return "";
  return labels[String(level).toLowerCase()] || String(level);
}

export default function JobCard({ job, onClick, onPrefetch, showEdit = false, onEdit }) {
  const companyLabel = getCompanyLabel(job);
  const distance = formatDistance(job.distanceM);
  const locationLabel = getLocationLabel(job, distance);
  const jobTypeLabel = getJobTypeLabel(job);
  const typeLabel = job.category || jobTypeLabel;
  const wageLabel = getWageLabel(job);
  const levelLabel = getLevelLabel(job);
  const remainingLabel = getRemainingLabel(job);
  const expiryLabel = formatDateTime(getExpiryDate(job));
  const distanceLabel = distance || formatNotifyRadius(job?.notifyRadiusM || job?.notify_radius_m);
  const premium = isPremiumJob(job);
  const logoUrl = job?.logoUrl || job?.logo_url || job?.imageUrl || job?.image_url || job?.companyLogo || job?.company_logo || "";
  const [logoFailed, setLogoFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasValidLogo = Boolean(logoUrl && !logoFailed);

  return (
    <article className="job-card" onClick={onClick} onMouseEnter={onPrefetch} onFocus={onPrefetch} tabIndex={0}>
      <div className="job-card-logo" aria-hidden="true">
        {hasValidLogo ? <img src={logoUrl} alt="" onError={() => setLogoFailed(true)} /> : <span>{getInitials(companyLabel)}</span>}
      </div>

      <div className="job-card-content">
        <div className="job-card-title-row">
          <h3 className="job-card-title">{job.title || "Adsız elan"}</h3>
          {premium ? (
            <span className="job-card-premium-badge">
              <span aria-hidden="true">★</span> Premium
            </span>
          ) : null}
        </div>
        <p className="job-card-company">{companyLabel} <span>•</span> {jobTypeLabel}</p>

        <div className="job-card-meta">
          <span className="job-card-meta-item job-card-meta-category">
            {typeLabel}
          </span>
          <span className="job-card-meta-item job-card-meta-wage">
            {wageLabel}
          </span>
          {levelLabel ? (
            <span className="job-card-meta-item job-card-meta-level">
              {levelLabel}
            </span>
          ) : null}
          {distanceLabel ? (
            <span className="job-card-meta-item job-card-meta-distance">
              <span aria-hidden="true">📍</span>
              {distanceLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="job-card-side">
        {remainingLabel ? <span className="job-card-remaining">⏰ {remainingLabel}</span> : null}
      </div>

      <button
        type="button"
        className={`job-card-save ${copied ? "copied" : ""}`}
        aria-label={copied ? "Kopyalandı" : "Elan məlumatlarını kopyala"}
        title={copied ? "Kopyalandı" : "Elan məlumatlarını kopyala"}
        onClick={async (event) => {
          event.stopPropagation();
          let didCopy = false;
          try {
            didCopy = await copyText(getCopyText(job, {
              companyLabel,
              typeLabel,
              wageLabel,
              levelLabel,
              locationLabel,
              distanceLabel,
              remainingLabel,
              expiryLabel,
            }));
          } catch {
            didCopy = false;
          }
          if (didCopy) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          }
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.9 5.03" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07l1.22-1.22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {showEdit ? (
        <button
          type="button"
          className="job-card-edit"
          aria-label="Elanı redaktə et"
          onClick={(event) => {
            event.stopPropagation();
            onEdit?.();
          }}
        >
          Redaktə
        </button>
      ) : null}
    </article>
  );
}
