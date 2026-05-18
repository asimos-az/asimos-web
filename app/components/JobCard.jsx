function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDistance(distanceM) {
  if (typeof distanceM !== "number") return null;
  if (distanceM >= 1000) {
    const km = distanceM / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
  }
  return `${Math.round(distanceM)} m`;
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
  if (job?.isDaily || job?.is_daily || type === "temporary") return "Gündəlik iş";
  if (type === "seeker") return "İş axtaran";
  return "Elan";
}


function DefaultJobLogoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V6a3 3 0 0 1 6 0v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 8.5h15v9A2.5 2.5 0 0 1 17 20H7a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15M10 12v1.2h4V12" />
    </svg>
  );
}

export default function JobCard({ job, onClick, onPrefetch, showEdit = false, onEdit, isFavorite = false, onToggleFavorite }) {
  const companyLabel = getCompanyLabel(job);
  const createdAt = formatDate(job.publishedAt || job.published_at || job.createdAt || job.created_at);
  const distance = formatDistance(job.distanceM);
  const views = Number.isFinite(Number(job.views)) ? Number(job.views) : 0;
  const locationLabel = getLocationLabel(job, distance);
  const jobTypeLabel = getJobTypeLabel(job);
  const premium = isPremiumJob(job);
  const logoUrl = job?.logoUrl || job?.logo_url || job?.imageUrl || job?.image_url || job?.companyLogo || job?.company_logo || "";

  return (
    <article className="job-card" onClick={onClick} onMouseEnter={onPrefetch} onFocus={onPrefetch} tabIndex={0}>
      <div className="job-card-logo" aria-hidden="true">
        {logoUrl ? <img src={logoUrl} alt="" /> : <DefaultJobLogoIcon />}
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

        <div className="job-card-location">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 10.3a2.2 2.2 0 1 0 0-.1v.1Z" />
          </svg>
          <span>{locationLabel}</span>
        </div>

        <div className="job-card-meta">
          <span className="job-card-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 8v4l2.5 1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {createdAt || "Yeni"}
          </span>
          <span className="job-card-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            {views}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`job-card-save ${isFavorite ? "saved" : ""}`}
        aria-label={isFavorite ? "Favoritdən sil" : "Yadda saxla"}
        title={isFavorite ? "Favoritdən sil" : "Yadda saxla"}
        onClick={(event) => onToggleFavorite?.(event)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M7 4.75A2.75 2.75 0 0 1 9.75 2h4.5A2.75 2.75 0 0 1 17 4.75V21l-5-3.2L7 21V4.75Z" strokeLinecap="round" strokeLinejoin="round" />
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
