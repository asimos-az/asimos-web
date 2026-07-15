import { useEffect, useState } from "react";

const NEW_JOB_WINDOW_MS = 4 * 60 * 60 * 1000;

function getJobPublishedAt(job) {
  return job?.publishedAt || job?.published_at || job?.createdAt || job?.created_at || null;
}

function getBakuWallClockTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 0;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Baku",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return new Date(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second)
    ).getTime();
  } catch {
    return date.getTime();
  }
}

function getNewJobUntil(job) {
  const publishedAt = getJobPublishedAt(job);
  if (!publishedAt) return 0;

  // Asimos elan vaxtlarını Bakı vaxtına görə göstərir. Development cihazının
  // timezone-u fərqli olsa da 4 saatlıq nişan düzgün hesablansın.
  const publishedTime = getBakuWallClockTime(publishedAt);
  if (!Number.isFinite(publishedTime)) return 0;

  return publishedTime + NEW_JOB_WINDOW_MS;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/ə/g, "e")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/Ə/g, "e")
    .replace(/Ö/g, "o")
    .replace(/Ü/g, "u")
    .replace(/I/g, "i")
    .replace(/İ/g, "i")
    .replace(/Ğ/g, "g")
    .replace(/Ş/g, "s")
    .replace(/Ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getJobCategorySlug(job) {
  const category =
    job?.category ||
    job?.categoryName ||
    job?.category_name ||
    job?.jobCategory ||
    job?.job_category ||
    "elan";

  return slugify(category) || "elan";
}

function getJobTitleSlug(job) {
  const title = job?.title || job?.name || job?.companyName || job?.company_name;

  const titleSlug = slugify(title);

  if (titleSlug) return titleSlug;

  return String(job?.id || "elan");
}

function getJobPath(job) {
  const categorySlug = getJobCategorySlug(job);
  const titleSlug = getJobTitleSlug(job);
  const jobId = job?.id || job?._id || job?.jobId || job?.job_id;

  const path = `/jobs/${categorySlug}/${titleSlug}`;
  return jobId ? `${path}?id=${encodeURIComponent(String(jobId))}` : path;
}

function getJobUrl(job) {
  const path = getJobPath(job);

  if (typeof window === "undefined") return path;

  return new URL(path, window.location.origin).toString();
}

function formatDistance(distanceM) {
  const value = Number(distanceM);

  if (!Number.isFinite(value)) return null;

  if (value >= 1000) {
    const km = value / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
  }

  return `${Math.round(value)} m`;
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

async function copyShareLink(text) {
  if (!text) return false;

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    return copyTextFallback(text);
  } catch {
    return false;
  }
}

function getExpiryDate(job) {
  const explicit =
    job?.validThrough ||
    job?.valid_through ||
    job?.expiresAt ||
    job?.expires_at ||
    job?.deadline ||
    job?.expire_at;

  if (explicit) {
    const explicitDate = new Date(explicit);

    if (!Number.isNaN(explicitDate.getTime())) {
      return explicitDate;
    }
  }

  return null;
}

function getRemainingLabel(job) {
  const expiryDate = getExpiryDate(job);

  if (!expiryDate) return "";

  const now = new Date();

  if (expiryDate.getTime() <= now.getTime()) {
    return "Bitib";
  }

  const diffMs = expiryDate.getTime() - now.getTime();
  const days = Math.ceil(diffMs / 86400000);

  if (days > 0) {
    return `${days} gün qaldı`;
  }

  const hours = Math.max(1, Math.ceil(diffMs / 3600000));

  return `${hours} saat qaldı`;
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
  return (
    job?.company ||
    job?.companyName ||
    job?.company_name ||
    "Asimos İşəgötürən"
  );
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
    seeker: "İş axtaran",
  };

  if (job?.isDaily || job?.is_daily || type === "temporary") {
    return "Gündəlik iş";
  }

  return labels[type] || job?.jobType || job?.job_type || "Elan";
}

function getWageLabel(job) {
  const wage =
    job?.wage ||
    job?.salary ||
    job?.salaryRange ||
    job?.salary_range;

  return wage ? String(wage) : "Razılaşma əsasında";
}

function getLevelLabel(job) {
  const level =
    job?.jobLevel ||
    job?.job_level ||
    job?.positionLevel ||
    job?.level;

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

function isPremiumJob(job) {
  if (job?.is_premium || job?.isPremium || job?.premium) {
    return true;
  }

  const boostedUntil = job?.boostedUntil || job?.boosted_until;

  return Boolean(boostedUntil && new Date(boostedUntil) > new Date());
}

export default function JobCard({
  job,
  onClick,
  onPrefetch,
  showEdit = false,
  onEdit,
}) {
  const companyLabel = getCompanyLabel(job);
  const distanceLabel = formatDistance(job?.distanceM);
  const jobTypeLabel = getJobTypeLabel(job);
  const typeLabel = job?.category || jobTypeLabel;
  const wageLabel = getWageLabel(job);
  const levelLabel = getLevelLabel(job);
  const remainingLabel = getRemainingLabel(job);
  const premium = isPremiumJob(job);

  const logoUrl =
    job?.logoUrl ||
    job?.logo_url ||
    job?.imageUrl ||
    job?.image_url ||
    job?.companyLogo ||
    job?.company_logo ||
    job?.companyLogoUrl ||
    job?.company_logo_url ||
    "";

  const [logoFailed, setLogoFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNewJob, setIsNewJob] = useState(() => getNewJobUntil(job) > Date.now());

  useEffect(() => {
    const newUntil = getNewJobUntil(job);
    const remainingMs = newUntil - Date.now();
    setIsNewJob(remainingMs > 0);

    if (remainingMs <= 0) return undefined;

    const timer = window.setTimeout(() => setIsNewJob(false), remainingMs);
    return () => window.clearTimeout(timer);
  }, [job?.id, job?.publishedAt, job?.published_at, job?.createdAt, job?.created_at]);

  const hasValidLogo = Boolean(logoUrl && !logoFailed);

  const handleCardClick = (event) => {
    event.preventDefault();

    const jobPath = getJobPath(job);

    if (typeof window !== "undefined") {
      window.location.href = jobPath;
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      const jobPath = getJobPath(job);

      if (typeof window !== "undefined") {
        window.location.href = jobPath;
      }
    }
  };

  const handleShareClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl = getJobUrl(job);
    const didCopy = await copyShareLink(shareUrl);

    if (didCopy) {
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    }
  };

  return (
    <article
      className="job-card"
      onClick={handleCardClick}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      onKeyDown={handleCardKeyDown}
      tabIndex={0}
      role="button"
    >
      <div className="job-card-logo" aria-hidden="true">
        {hasValidLogo ? (
          <img
            src={logoUrl}
            alt=""
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span>{getInitials(companyLabel)}</span>
        )}
      </div>

      <div className="job-card-content">
        <div className="job-card-title-row">
          <h3 className="job-card-title">
            {job?.title || "Adsız elan"}
          </h3>

          {isNewJob ? <span className="job-card-new-badge"><span aria-hidden="true">🆕</span> Yeni</span> : null}

          {premium ? (
            <span className="job-card-premium-badge">
              <span aria-hidden="true">★</span> Premium
            </span>
          ) : null}
        </div>

        <p className="job-card-company">
          {companyLabel} <span>•</span> {jobTypeLabel}
        </p>

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
        {remainingLabel ? (
          <span className="job-card-remaining">
            ⏰ {remainingLabel}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        className={`job-card-save ${copied ? "copied" : ""}`}
        aria-label={copied ? "Link kopyalandı" : "Elan linkini kopyala"}
        title={copied ? "Link kopyalandı" : "Elan linkini kopyala"}
        onClick={handleShareClick}
      >
        {copied ? (
          <span className="job-card-share-check" aria-hidden="true">
            ✓
          </span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.9 5.03"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07l1.22-1.22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {showEdit ? (
        <button
          type="button"
          className="job-card-edit"
          aria-label="Elanı redaktə et"
          onClick={(event) => {
            event.preventDefault();
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
