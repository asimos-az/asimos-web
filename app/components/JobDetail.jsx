import React, { useEffect, useMemo, useRef } from 'react';

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
  const type = String(job?.jobType || job?.job_type || '').toLowerCase();
  if (type === 'permanent') return 'Daimi';
  if (type === 'temporary') return 'Müvəqqəti';
  if (type === 'daily') return 'Gündəlik';
  return job?.jobType || job?.job_type || 'Qeyd edilməyib';
}

function getAddress(job) {
  return job?.location?.address || job?.address || job?.city || 'Qeyd edilməyib';
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
  if (!job) return null;

  const isPage = mode === 'page';
  const companyName = getCompanyName(job);
  const companyInitial = String(companyName || job.title || 'A').charAt(0).toUpperCase();
  const jobDate = formatJobDate(job.createdAt || job.created_at || job.publishedAt || job.published_at);

  const lat = Number(job.location?.lat ?? job.lat);
  const lng = Number(job.location?.lng ?? job.lng ?? job.lon);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  const userLat = Number(userLocation?.lat);
  const userLng = Number(userLocation?.lng);
  const hasUserLocation = Number.isFinite(userLat) && Number.isFinite(userLng);
  const routeUrl = hasLocation && hasUserLocation
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLat}%2C${userLng}%3B${lat}%2C${lng}`
    : '';
  const mapViewUrl = hasLocation
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
    : '';

  const renderContact = () => {
    const jobEmail = getJobEmail(job);
    const hasAnyContact = job.link || job.whatsapp || job.phone || jobEmail;

    if (!user && hasAnyContact) {
      return <span className="contact-locked">Daxil olduqdan sonra görünəcək</span>;
    }

    if (jobEmail) {
      return <a href={`mailto:${jobEmail}`}>{jobEmail}</a>;
    }
    if (job.link) {
      return <a href={job.link} target="_blank" rel="noopener noreferrer">Müraciət linkinə keç</a>;
    }
    if (job.whatsapp) {
      return <a href={`https://wa.me/${job.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{job.whatsapp}</a>;
    }
    if (job.phone) {
      return <a href={`tel:${job.phone}`}>{job.phone}</a>;
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
            <div className="job-detail-logo">{companyInitial}</div>
            <div className="job-detail-title-section">
              <div className="job-detail-badges">
                <span className="job-detail-badge">Elan</span>
                {job.category ? <span className="job-detail-badge muted">{job.category}</span> : null}
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
          <span className="quick-stat-icon">🧭</span>
          <span className="quick-stat-label">İş növü</span>
          <strong>{getJobTypeLabel(job)}</strong>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-icon">📅</span>
          <span className="quick-stat-label">Tarix</span>
          <strong>{jobDate}</strong>
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
            <div className="job-detail-description">{job.description || 'Təsvir qeyd edilməyib.'}</div>
          </section>

          <section className="job-detail-card">
            <span className="section-kicker">İş şərtləri</span>
            <h2 className="job-detail-section-title">Əsas məlumatlar</h2>
            <div className="job-detail-info-grid">
              <div className="info-item">
                <span className="info-label">Kateqoriya</span>
                <span className="info-value">{job.category || 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">İş qrafiki</span>
                <span className="info-value">{job.start_time && job.end_time ? `${job.start_time} - ${job.end_time}` : job.work_type || 'Qeyd edilməyib'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Şirkət</span>
                <span className="info-value">{companyName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Elan tarixi</span>
                <span className="info-value">{jobDate}</span>
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
                      Xəritədə bax
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {hasLocation ? (
            <section className="job-detail-map-card job-detail-card">
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
        </aside>
      </div>
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
