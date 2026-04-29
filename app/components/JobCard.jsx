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

export default function JobCard({ job, onClick, onPrefetch, showEdit = false, onEdit }) {
  const companyLabel = job.company || job.companyName || job.company_name || "Asimos İşəgötürən";
  const createdAt = formatDate(job.publishedAt || job.published_at || job.createdAt || job.created_at);
  const isDaily = Boolean(job.isDaily || job.jobType === "temporary" || job.job_type === "temporary");
  const distance = formatDistance(job.distanceM);
  const wage = job.wage ? String(job.wage).replace(/AZN|₼/gi, "").trim() : "";
  const views = Number.isFinite(Number(job.views)) ? Number(job.views) : 0;

  return (
    <article className="job-card" onClick={onClick} onMouseEnter={onPrefetch} onFocus={onPrefetch}>
      <div className="job-card-main">
        <div className="job-card-logo">{companyLabel[0].toUpperCase()}</div>
        <div className="job-card-details">
          <div className="job-card-labels">
            <span className={`job-card-state ${isDaily ? "daily" : ""}`}>{isDaily ? "Gündəlik iş" : "Elan"}</span>
            {job.is_premium ? <span className="job-card-premium">PREMIUM</span> : null}
          </div>
          <h3 className="job-card-title">{job.title || "Adsız elan"}</h3>
          <p className="job-card-company">{companyLabel}</p>
          <div className="job-card-wage">
            <span>{wage ? `${wage} AZN` : "Razılaşma ilə"}</span>
          </div>
        </div>
      </div>
      <div className="job-card-aside">
        <div className="job-card-tags">
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
        </div>
        <div className="job-card-meta">
          <div className="job-card-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{views}</span>
          </div>
          <div className="job-card-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{createdAt || "Ətraflı bax"}</span>
          </div>
          {distance ? <div className="job-card-meta-item">{distance} uzaqda</div> : null}
        </div>
      </div>
    </article>
  );
}
