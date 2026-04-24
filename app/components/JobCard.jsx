export default function JobCard({ job, onClick }) {
  const companyLabel = job.companyName || job.company_name || "Şirkət qeyd edilməyib";
  const createdAt = new Date(job.createdAt || Date.now()).toLocaleDateString("az-AZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="job-card" onClick={onClick}>
      <div className="job-card-main">
        <div className="job-card-logo">{companyLabel[0].toUpperCase()}</div>
        <div className="job-card-details">
          <h3 className="job-card-title">{job.title || "Adsız elan"}</h3>
          <p className="job-card-company">{companyLabel}</p>
          <div className="job-card-wage">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
            </svg>
            <span>{job.wage || "Razılaşma ilə"}</span>
          </div>
        </div>
      </div>
      <div className="job-card-aside">
        <div className="job-card-tags">
          {job.is_premium ? <span className="job-card-premium">PREMIUM</span> : null}
          <button type="button" className="job-card-favorite" aria-label="Elanı yadda saxla">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
          </button>
        </div>
        <div className="job-card-meta">
          <div className="job-card-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{job.views || 0}</span>
          </div>
          <div className="job-card-meta-item">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{createdAt}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
