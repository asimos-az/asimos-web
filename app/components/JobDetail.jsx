import React, { useEffect, useMemo, useRef, useState } from 'react';

const LEAFLET_CSS_ID = 'asimos-detail-leaflet-css';
const LEAFLET_SCRIPT_ID = 'asimos-detail-leaflet-script';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_SCRIPT_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function ensureLeafletAsset(tagName, id, attrs) {
  if (typeof document === 'undefined') return null;
  const existing = document.getElementById(id);
  if (existing) return existing;
  const element = document.createElement(tagName);
  element.id = id;
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  document.head.appendChild(element);
  return element;
}

function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Leaflet can only load in browser'));
  ensureLeafletAsset('link', LEAFLET_CSS_ID, { rel: 'stylesheet', href: LEAFLET_CSS_URL });
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(LEAFLET_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = ensureLeafletAsset('script', LEAFLET_SCRIPT_ID, { src: LEAFLET_SCRIPT_URL });
    script.addEventListener('load', () => resolve(window.L), { once: true });
    script.addEventListener('error', reject, { once: true });
  });
}

function formatJobDate(value) {
  if (!value) return 'Qeyd edilməyib';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Qeyd edilməyib';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function formatDateTime(value) {
  if (!value) return 'Qeyd edilməyib';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatJobDate(value);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${formatJobDate(value)} ${time}`;
}

function formatTimeValue(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const direct = raw.match(/^(\d{1,2}):(\d{2})/);
  if (direct) return `${direct[1].padStart(2, '0')}:${direct[2]}`;
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return raw;
}

function addDays(value, days) {
  const base = new Date(value);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + days);
  return base;
}

function formatRemainingTime(expiresAt, now) {
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return 'Qeyd edilməyib';
  const diff = expiresAt.getTime() - now.getTime();
  if (diff <= 0) return 'Elanın vaxtı bitib';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days} gün ${hours} saat qalıb`;
  const minutes = Math.max(1, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  return `${hours} saat ${minutes} dəqiqə qalıb`;
}

function getPublishedDate(job) {
  return job?.publishedAt || job?.published_at || job?.createdAt || job?.created_at || job?.created || job?.date;
}

function getExpiryDate(job) {
  const explicit = job?.validThrough || job?.valid_through || job?.expiresAt || job?.expires_at || job?.deadline || job?.expire_at;
  if (explicit) {
    const date = new Date(explicit);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return addDays(getPublishedDate(job), 28);
}

function getWorkSchedule(job) {
  const start = formatTimeValue(job?.start_time || job?.startTime || job?.schedule_start || job?.work_start_time);
  const end = formatTimeValue(job?.end_time || job?.endTime || job?.schedule_end || job?.work_end_time);
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start}-dan`;
  if (end) return `${end}-dək`;
  return job?.schedule || job?.work_schedule || '';
}

function getJobLevel(job) {
  const value = job?.jobLevel || job?.job_level || job?.positionLevel || job?.position_level || job?.level || job?.experience_level;
  const labels = {
    entry: 'Təcrübəsiz',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    manager: 'Menecer',
    lead: 'Rəhbər',
  };
  return labels[String(value || '').toLowerCase()] || value || '';
}

function getFirstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function getJobEmail(job) {
  const direct = job?.email || job?.contactEmail || job?.contact_email;
  if (direct) return String(direct).trim();

  const match = String(job?.description || '').match(/(?:e-?poçt|email|mail)\s*:\s*([^\s,;]+)/i);
  return match?.[1]?.trim() || '';
}

function getCompanyName(job) {
  return job?.companyName || job?.company_name || job?.company || 'Asimos elan';
}

function getWage(job) {
  if (job?.wage) return job.wage;
  if (job?.salary) return job.salary;
  if (job?.min_salary && job?.max_salary) return `${job.min_salary} - ${job.max_salary} AZN`;
  if (job?.minSalary && job?.maxSalary) return `${job.minSalary} - ${job.maxSalary} AZN`;
  return 'Razılaşma ilə';
}

function getJobTypeLabel(job) {
  const type = String(job?.jobType || job?.job_type || job?.workType || job?.work_type || '').toLowerCase();
  const labels = {
    permanent: 'Daimi',
    temporary: 'Müvəqqəti',
    daily: 'Gündəlik',
    full_time: 'Tam ştat',
    part_time: 'Yarım ştat',
    freelance: 'Frilans',
    shift: 'Növbə əsasında',
    commission: 'Komisyon haqqı',
    volunteer: 'Könüllü',
    seasonal: 'Mövsümi',
    internship: 'Təcrübə',
    scholarship: 'Təqaüd proqramı',
    seeker: 'İş axtaran',
  };
  return labels[type] || job?.jobType || job?.job_type || job?.workType || job?.work_type || 'Qeyd edilməyib';
}

function getAddress(job) {
  return job?.location?.address || job?.address || job?.city || 'Qeyd edilməyib';
}

function getJobLogoUrl(job) {
  return job?.logoUrl || job?.logo_url || job?.imageUrl || job?.image_url || job?.companyLogo || job?.company_logo || '';
}

function cleanDescription(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text
    .split('\n')
    .filter((line) => !/^\s*(Şirkət\s*\/\s*obyekt|İş qrafiki|Email|E-?poçt|Planlı yayım|Müddət)\s*:/i.test(line))
    .join('\n')
    .trim();
}

function JobDetailMap({ lat, lng, userLat, userLng, hasUserLocation, address, userAddress }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: false,
          preferCanvas: true,
        }).setView([lat, lng], 14);

        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          updateWhenIdle: true,
          keepBuffer: 2,
        }).addTo(map);

        const jobIcon = L.divIcon({
          className: 'detail-map-marker detail-map-marker-job',
          html: '<span>💼</span>',
          iconSize: [42, 42],
          iconAnchor: [21, 42],
          popupAnchor: [0, -40],
        });

        const userIcon = L.divIcon({
          className: 'detail-map-marker detail-map-marker-user',
          html: '<span>📍</span>',
          iconSize: [42, 42],
          iconAnchor: [21, 42],
          popupAnchor: [0, -40],
        });

        const jobMarker = L.marker([lat, lng], { icon: jobIcon })
          .addTo(map)
          .bindPopup(`<strong>Elan lokasiyası</strong><br/>${address || 'Ünvan qeyd edilməyib'}`);

        if (hasUserLocation) {
          L.marker([userLat, userLng], { icon: userIcon })
            .addTo(map)
            .bindPopup(`<strong>Sizin lokasiya</strong><br/>${userAddress || `${userLat.toFixed(5)}, ${userLng.toFixed(5)}`}`);

          const bounds = L.latLngBounds([
            [lat, lng],
            [userLat, userLng],
          ]);
          map.fitBounds(bounds, { padding: [42, 42], maxZoom: 15 });
        } else {
          jobMarker.openPopup();
        }

        setTimeout(() => map.invalidateSize(), 100);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [address, hasUserLocation, lat, lng, userAddress, userLat, userLng]);

  return <div ref={mapRef} className="job-detail-live-map" aria-label="Elan və cihaz lokasiyası xəritəsi" />;
}

const JobDetail = ({ job, onClose, mode = 'modal', user = null, userLocation = null }) => {
  const [now, setNow] = useState(() => new Date());
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncInfoOpen = () => setInfoOpen(window.innerWidth > 760);
    syncInfoOpen();
    window.addEventListener('resize', syncInfoOpen);
    return () => window.removeEventListener('resize', syncInfoOpen);
  }, []);

  if (!job) return null;

  const isPage = mode === 'page';
  const companyName = getCompanyName(job);
  const companyInitial = String(companyName || job.title || 'A').charAt(0).toUpperCase();
  const logoUrl = getJobLogoUrl(job);
  const cleanJobDescription = cleanDescription(job.description);
  const publishedDate = getPublishedDate(job);
  const jobDate = formatJobDate(publishedDate);
  const expiryDate = getExpiryDate(job);
  const expiryDateLabel = expiryDate ? formatDateTime(expiryDate) : 'Qeyd edilməyib';
  const expiryRemainingLabel = expiryDate ? formatRemainingTime(expiryDate, now) : 'Qeyd edilməyib';
  const workSchedule = getWorkSchedule(job);

  const lat = Number(job.location?.lat ?? job.lat);
  const lng = Number(job.location?.lng ?? job.lng ?? job.lon);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  const userLat = Number(userLocation?.lat);
  const userLng = Number(userLocation?.lng);
  const hasUserLocation = Number.isFinite(userLat) && Number.isFinite(userLng);
  const routeUrl = hasLocation && hasUserLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lng}`
    : '';
  const mapViewUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : '';

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  const copyShareLink = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedShareLink(true);
      window.setTimeout(() => setCopiedShareLink(false), 2200);
    } catch {
      setCopiedShareLink(false);
    }
  };

  const renderContact = () => {
    const jobEmail = getJobEmail(job);
    const contactLink = getFirstValue(job.link, job.contact_link, job.contactLink);
    const contactWhatsapp = getFirstValue(job.whatsapp, job.contact_whatsapp, job.contactWhatsapp);
    const contactPhone = getFirstValue(job.phone, job.contact_phone, job.contactPhone);
    const hasAnyContact = contactLink || contactWhatsapp || contactPhone || jobEmail;

    if (!user && hasAnyContact) {
      return <span className="contact-locked">Daxil olduqdan sonra görünəcək</span>;
    }

    if (jobEmail) {
      return <a href={`mailto:${jobEmail}`}>{jobEmail}</a>;
    }
    if (contactLink) {
      return <a href={contactLink} target="_blank" rel="noopener noreferrer">Müraciət linkinə keç</a>;
    }
    if (contactWhatsapp) {
      return <a href={`https://wa.me/${contactWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{contactWhatsapp}</a>;
    }
    if (contactPhone) {
      return <a href={`tel:${contactPhone}`}>{contactPhone}</a>;
    }
    return 'Qeyd edilməyib';
  };

  const content = (
    <div className={isPage ? 'job-detail-page-container' : 'job-detail-container'} onClick={isPage ? undefined : (e) => e.stopPropagation()}>
      <section className="job-detail-hero">
        <div className="job-detail-hero-pattern" aria-hidden="true" />
        <div className="job-detail-hero-content">
          <div className="job-detail-breadcrumb">Asimos / Elan detalları</div>
          <div className="job-detail-header-main">
            <div className="job-detail-logo">{logoUrl ? <img src={logoUrl} alt="" /> : companyInitial}</div>
            <div className="job-detail-title-section">
              <div className="job-detail-badges-row">
                <div className="job-detail-badges">
                  <span className="job-detail-badge">Elan</span>
                  {job.category ? <span className="job-detail-badge muted">{job.category}</span> : null}
                </div>
                {isPage ? (
                  <button
                    type="button"
                    className={`job-detail-share-btn${copiedShareLink ? ' copied' : ''}`}
                    onClick={copyShareLink}
                    aria-label="Elan linkini kopyala"
                  >
                    <span aria-hidden="true">{copiedShareLink ? '✓' : '↗'}</span>
                    {copiedShareLink ? 'Link kopyalandı' : 'Paylaş'}
                  </button>
                ) : null}
              </div>
              <h1 className="job-detail-title">{job.title}</h1>
              <p className="job-detail-company">{companyName}</p>
            </div>
          </div>
        </div>
        {!isPage ? (
          <button className="job-detail-close" onClick={onClose} aria-label="Bağla">
            &times;
          </button>
        ) : null}
      </section>

      <div className="job-detail-quick-grid">
        <div className="quick-stat-card primary">
          <span className="quick-stat-icon">₼</span>
          <span className="quick-stat-label">Maaş</span>
          <strong>{getWage(job)}</strong>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-icon">📍</span>
          <span className="quick-stat-label">Ünvan</span>
          <strong>{getAddress(job)}</strong>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-icon">🕘</span>
          <span className="quick-stat-label">İş qrafiki</span>
          <strong>{workSchedule || 'Qeyd edilməyib'}</strong>
        </div>
        <div className="quick-stat-card countdown">
          <span className="quick-stat-icon">⏳</span>
          <span className="quick-stat-label">Bitməsinə</span>
          <strong>{expiryRemainingLabel}</strong>
        </div>
      </div>

      <div className="job-detail-body">
        <main className="job-detail-main-content">
          <section className="job-detail-card description-card">
            <div className="section-heading-row">
              <div>
                <span className="section-kicker">Vakansiya haqqında</span>
                <h2 className="job-detail-section-title">Təsvir</h2>
              </div>
            </div>
            <div className="job-detail-description">{cleanJobDescription || 'Təsvir qeyd edilməyib.'}</div>
          </section>

          <section className={`job-detail-card job-detail-accordion-card${infoOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="job-detail-accordion-head"
              onClick={() => setInfoOpen((value) => !value)}
              aria-expanded={infoOpen}
            >
              <span>
                <span className="section-kicker">İş şərtləri</span>
                <strong>Əsas məlumatlar</strong>
              </span>
              <i aria-hidden="true">⌄</i>
            </button>
            <div className="job-detail-info-grid" hidden={!infoOpen}>
              <div className="info-item">
                <span className="info-label">Kateqoriya</span>
                <span className="info-value">{job.category || 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Vəzifə dərəcəsi</span>
                <span className="info-value">{getJobLevel(job) || 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">İş növü</span>
                <span className="info-value">{getJobTypeLabel(job)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">İş qrafiki</span>
                <span className="info-value">{workSchedule || 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Şirkət / obyekt</span>
                <span className="info-value">{companyName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">VOEN</span>
                <span className="info-value">{getFirstValue(job.voen, job.tax_id, job.taxId) || 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Müraciət linki</span>
                <span className="info-value">{getFirstValue(job.link, job.contact_link, job.contactLink) ? <a href={getFirstValue(job.link, job.contact_link, job.contactLink)} target="_blank" rel="noopener noreferrer">Keçidə bax</a> : 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Yayım tipi</span>
                <span className="info-value">{job.publishMode === 'scheduled' || job.publish_mode === 'scheduled' ? 'Planlı yayım' : 'Dərhal yayım'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Əlaqə email</span>
                <span className="info-value">{getJobEmail(job) || 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Telefon / WhatsApp</span>
                <span className="info-value">{getFirstValue(job.phone, job.contact_phone, job.contactPhone, job.whatsapp) || 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Elan tarixi</span>
                <span className="info-value">{jobDate}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Bitmə tarixi</span>
                <span className="info-value">{expiryDateLabel}</span>
              </div>
              <div className="info-item info-item-accent">
                <span className="info-label">Elanın bitməsinə</span>
                <span className="info-value">{expiryRemainingLabel}</span>
              </div>
            </div>
          </section>

          {!user && (job.link || job.whatsapp || job.phone || getJobEmail(job)) ? (
            <div className="job-detail-lock-note">
              <span>🔒</span>
              <div>
                <strong>Əlaqə məlumatları qorunur</strong>
                <p>WhatsApp, telefon, email və müraciət linki yalnız daxil olmuş istifadəçilərə göstərilir.</p>
              </div>
            </div>
          ) : null}
        </main>

        <aside className="job-detail-sidebar">
          <section className="job-detail-meta job-detail-card sticky-card">
            <div className="meta-card-head">
              <span className="section-kicker">Müraciət</span>
              <h2 className="meta-title">Əlaqə və lokasiya</h2>
            </div>
            <div className="meta-list">
              <div className="meta-item">
                <span className="meta-label">Əlaqə</span>
                <span className="meta-value">{renderContact()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Elan lokasiyası</span>
                <span className="meta-value">{getAddress(job)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Sizin lokasiya</span>
                <span className="meta-value">{hasUserLocation ? (userLocation?.address || `${userLat.toFixed(5)}, ${userLng.toFixed(5)}`) : 'Aktiv edilməyib'}</span>
              </div>
              {hasLocation ? (
                <div className="meta-item highlighted">
                  <span className="meta-label">Xəritə və marşrut</span>
                  <div className="map-action-row">
                    {routeUrl ? (
                      <a
                        className="map-icon-action"
                        href={routeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Cihaz lokasiyasından marşruta bax"
                        title="Cihaz lokasiyasından marşruta bax"
                      >
                        🧭
                      </a>
                    ) : null}
                    <a className="map-text-action" href={mapViewUrl} target="_blank" rel="noopener noreferrer">
                      <span>🗺️</span>
                      Google Maps-də aç
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      {hasLocation ? (
        <section className="job-detail-map-card job-detail-card job-detail-map-card-wide">
          <div className="map-card-head">
            <div>
              <span className="section-kicker">Xəritə</span>
              <h2 className="job-detail-section-title">Elan və cihaz lokasiyası</h2>
            </div>
            <span className="map-pin">📍</span>
          </div>
          <div className="job-map-legend">
            <span><i className="legend-dot job" /> Elan lokasiyası</span>
            {hasUserLocation ? <span><i className="legend-dot user" /> Sizin lokasiya</span> : null}
          </div>
          <JobDetailMap
            lat={lat}
            lng={lng}
            userLat={userLat}
            userLng={userLng}
            hasUserLocation={hasUserLocation}
            address={getAddress(job)}
            userAddress={userLocation?.address}
          />
        </section>
      ) : null}
    </div>
  );

  if (isPage) {
    return <div className="job-detail-page">{content}</div>;
  }

  return (
    <div className="job-detail-backdrop" onClick={onClose}>
      {content}
    </div>
  );
};

export default JobDetail;
