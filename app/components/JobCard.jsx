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

export default function JobCard({ job, onClick, onPrefetch, showEdit = false, onEdit }) {
  const companyLabel = getCompanyLabel(job);
  const createdAt = formatDate(job.publishedAt || job.published_at || job.createdAt || job.created_at);
  const distance = formatDistance(job.distanceM);
  const views = Number.isFinite(Number(job.views)) ? Number(job.views) : 0;
  const locationLabel = getLocationLabel(job, distance);
  const jobTypeLabel = getJobTypeLabel(job);
  const premium = isPremiumJob(job);
  const initial = companyLabel.trim().charAt(0).toUpperCase() || "A";

  return (
    <article className="job-card" onClick={onClick} onMouseEnter={onPrefetch} onFocus={onPrefetch} tabIndex={0}>
      <div className="job-card-top">
        <div className="job-card-logo" aria-hidden="true">{initial}</div>
        {premium ? (
          <div className="job-card-crown" title="Premium elan" aria-label="Premium elan">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4.2 18.5h15.6l1.2-10.1c.08-.7-.76-1.13-1.29-.66l-4.33 3.8-2.67-6.14a.78.78 0 0 0-1.42 0l-2.67 6.14-4.33-3.8c-.53-.47-1.37-.04-1.29.66l1.2 10.1Zm15.18 1.5H4.62a.75.75 0 0 0 0 1.5h14.76a.75.75 0 0 0 0-1.5Z" />
            </svg>
          </div>
        ) : null}
      </div>

      <div className="job-card-content">
        <p className="job-card-company">{companyLabel} <span>•</span> {jobTypeLabel}</p>
        <h3 className="job-card-title">{job.title || "Adsız elan"}</h3>

        <div className="job-card-location">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 10.3a2.2 2.2 0 1 0 0-.1v.1Z" />
          </svg>
          <span>{locationLabel}</span>
        </div>
      </div>

      <div className="job-card-footer">
        <div className="job-card-meta">
          <span className="job-card-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {createdAt || "Yeni"}
          </span>
          <span className="job-card-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            {views}
          </span>
        </div>
      </div>

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
