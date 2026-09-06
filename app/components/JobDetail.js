import React, { useEffect, useMemo, useRef, useState } from 'react';

const LEAFLET_CSS_ID = 'asimos-detail-leaflet-css';
const LEAFLET_SCRIPT_ID = 'asimos-detail-leaflet-script';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_SCRIPT_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://asimos-backend.onrender.com').replace(/\/+$/, '');

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

function getWorkplace(job) {
  return getFirstValue(job?.workplace, job?.workplace_name, job?.branch, job?.filial);
}

function getAtsLink(job) {
  return getFirstValue(job?.atsLink, job?.ats_link, job?.atsURL, job?.ats_url, job?.contactLink, job?.contact_link, job?.applyLink, job?.apply_link, job?.link);
}

function getVacancyStartDate(job) {
  return getFirstValue(job?.vacancyStartDate, job?.vacancy_start_date, job?.startDate, job?.start_date);
}

function getVacancyEndDate(job) {
  return getFirstValue(job?.vacancyEndDate, job?.vacancy_end_date, job?.endDate, job?.end_date);
}

function getPrimaryContactLabel(job) {
  const value = String(job?.primaryContact || job?.primary_contact || '').toLowerCase();
  const labels = { phone: 'Telefon', whatsapp: 'WhatsApp', email: 'Email', link: 'Daxili CV bazası' };
  return labels[value] || value || 'Qeyd edilməyib';
}

function getContactVisibility(job) {
  const raw = job?.contactVisibility || job?.contact_visibility || {};
  if (!raw || typeof raw !== 'object') return { phone: true, whatsapp: true, email: true };
  return {
    phone: raw.phone !== false,
    whatsapp: raw.whatsapp !== false,
    email: raw.email !== false,
  };
}

function formatContactVisibility(job) {
  const visibility = getContactVisibility(job);
  const labels = [];
  if (visibility.phone) labels.push('Telefon');
  if (visibility.whatsapp) labels.push('WhatsApp');
  if (visibility.email) labels.push('Email');
  return labels.length ? labels.join(', ') : 'Heç biri göstərilmir';
}

function getVisibleContactItems(job, viewerUser = null) {
  const visibility = getContactVisibility(job);

  // Elan yerləşdirərkən aktiv edilən əlaqə kanalları detal səhifəsində mütləq görünməlidir.
  // Dəyər bazaya boş düşübsə, sıra yenə göstərilir, amma blur/muted "Qeyd edilməyib" kimi çıxır.
  const fallbackPhone = getFirstValue(viewerUser?.phone, viewerUser?.contact_phone, viewerUser?.contactPhone);
  const fallbackWhatsapp = getFirstValue(viewerUser?.whatsapp, viewerUser?.contact_whatsapp, viewerUser?.contactWhatsapp, fallbackPhone);
  const fallbackEmail = getFirstValue(viewerUser?.email, viewerUser?.contact_email, viewerUser?.contactEmail);

  const rawPhone = getFirstValue(job?.phone, job?.contact_phone, job?.contactPhone, job?.mobile_number, job?.mobileNumber, fallbackPhone);
  const rawWhatsapp = getFirstValue(job?.whatsapp, job?.contact_whatsapp, job?.contactWhatsapp, rawPhone, fallbackWhatsapp);
  const rawEmail = getFirstValue(getJobEmail(job), fallbackEmail);

  const items = {
    phone: visibility.phone
      ? {
          key: 'phone',
          label: 'Telefon',
          icon: '📞',
          value: rawPhone || '',
          displayValue: rawPhone || 'Qeyd edilməyib',
          href: rawPhone ? `tel:${rawPhone}` : '',
          isEmpty: !rawPhone,
        }
      : null,
    whatsapp: visibility.whatsapp
      ? {
          key: 'whatsapp',
          label: 'WhatsApp',
          icon: '💬',
          value: rawWhatsapp || '',
          displayValue: rawWhatsapp || 'Qeyd edilməyib',
          href: rawWhatsapp ? `https://wa.me/${rawWhatsapp.replace(/\D/g, '')}` : '',
          external: Boolean(rawWhatsapp),
          isEmpty: !rawWhatsapp,
        }
      : null,
    email: visibility.email
      ? {
          key: 'email',
          label: 'Email',
          icon: '✉️',
          value: rawEmail || '',
          displayValue: rawEmail || 'Qeyd edilməyib',
          href: rawEmail ? `mailto:${rawEmail}` : '',
          isEmpty: !rawEmail,
        }
      : null,
  };

  const primary = String(job?.primaryContact || job?.primary_contact || 'phone').toLowerCase();
  const order = [primary, 'phone', 'whatsapp', 'email'];
  const seen = new Set();

  return order
    .filter((key) => {
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(items[key]);
    })
    .map((key) => items[key]);
}

function getStatusLabel(job) {
  const value = String(job?.status || '').toLowerCase();
  const labels = { open: 'Aktiv', pending: 'Admin təsdiqi gözləyir', draft: 'Qaralama', scheduled: 'Planlı yayım', closed: 'Bağlı', rejected: 'Rədd edilib' };
  return labels[value] || value || 'Qeyd edilməyib';
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/ə/g, 'e')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getSimilarJobHref(job) {
  if (!job) return '#';

  const categorySlug = slugify(
    job.categorySlug ||
    job.category_slug ||
    job.category ||
    job.categoryName ||
    job.category_name ||
    'Müxtəlif'
  ) || 'muxtelif';

  const titleSlug = slugify(
    job.slug ||
    job.titleSlug ||
    job.title_slug ||
    job.title ||
    job.name ||
    job.id ||
    'elan'
  );

  if (!categorySlug || !titleSlug) return '#';

  const path = `/jobs/${categorySlug}/${titleSlug}`;
  const jobId = job?.id || job?._id || job?.jobId || job?.job_id;
  return jobId ? `${path}?id=${encodeURIComponent(String(jobId))}` : path;
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

function getTextList(...values) {
  const value = values.find((item) => item !== undefined && item !== null && String(item).trim());
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '')
    .split(/\n|•|;/)
    .map((item) => item.replace(/^[-–—✓\s]+/, '').trim())
    .filter(Boolean);
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

        const jobMarker = L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<strong>Elan lokasiyası</strong><br/>${address || 'Ünvan qeyd edilməyib'}`);

        if (hasUserLocation) {
          L.marker([userLat, userLng])
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
  const [similarJobs, setSimilarJobs] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);

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

  useEffect(() => {
    if (!job?.id) return undefined;
    let ignore = false;
    setSimilarLoading(true);

    fetch(`${API_BASE_URL}/jobs/${job.id}/similar`)
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data) => {
        if (!ignore) setSimilarJobs(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setSimilarJobs([]);
      })
      .finally(() => {
        if (!ignore) setSimilarLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [job?.id]);

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
  const workplace = getWorkplace(job);
  const atsLink = getAtsLink(job);
  const vacancyStartDate = getVacancyStartDate(job);
  const vacancyEndDate = getVacancyEndDate(job);
  const contactVisibilityLabel = formatContactVisibility(job);
  const primaryContactLabel = getPrimaryContactLabel(job);
  const statusLabel = getStatusLabel(job);
  const applyContact = getVisibleContactItems(job, user).find((item) => item.href);
  const applyHref = atsLink || applyContact?.href || '';
  const requirements = getTextList(job?.requirements, job?.requirements_text, job?.skills, job?.qualifications);
  const responsibilities = getTextList(job?.responsibilities, job?.duties, job?.tasks);
  const benefits = getTextList(job?.benefits, job?.advantages, job?.perks);
  const education = getFirstValue(job?.education, job?.education_level, job?.qualification);
  const experience = getFirstValue(job?.experience, job?.experience_level, getJobLevel(job));


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
    const contactItems = getVisibleContactItems(job, user);

    if (!contactItems.length) return 'Qeyd edilməyib';

    return (
      <div className="job-detail-contact-list">
        {contactItems.map((item) => {
          const isPrimary = String(job?.primaryContact || job?.primary_contact || '').toLowerCase() === item.key;
          const className = `job-detail-contact-row${isPrimary ? ' is-primary' : ''}${item.isEmpty ? ' is-empty-contact' : ''}`;
          const rowContent = (
            <>
              <span className="contact-row-icon" aria-hidden="true">{item.icon}</span>
              <span>
                <small>{item.label}</small>
                <strong>{item.displayValue || item.value}</strong>
              </span>
            </>
          );

          return item.href ? (
            <a
              key={item.key}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={className}
            >
              {rowContent}
            </a>
          ) : (
            <div key={item.key} className={className}>
              {rowContent}
            </div>
          );
        })}
      </div>
    );
  };

  const content = (
    <div className={isPage ? 'job-detail-page-container job-detail-v2' : 'job-detail-container job-detail-v2'} onClick={isPage ? undefined : (e) => e.stopPropagation()}>
      <div className="job-detail-breadcrumb">Ana səhifə <span>/</span> Vakansiyalar <span>/</span> {job.category || 'Elan'} <span>/</span> {job.title}</div>
      <section className="job-detail-hero">
        <div className="job-detail-header-main">
          <div className="job-detail-logo">{logoUrl ? <img src={logoUrl} alt="" /> : companyInitial}</div>
          <div className="job-detail-title-section">
            <h1 className="job-detail-title">{job.title}</h1>
            <p className="job-detail-company">{companyName} <span className="verified-mark">✓</span></p>
            <strong className="job-detail-wage">{getWage(job)}</strong>
            <p className="job-detail-location">⌖ {getAddress(job)} {hasUserLocation ? <b>• Sizə yaxın</b> : null}</p>
            <div className="job-detail-badges">
              <span className="job-detail-badge">{getJobTypeLabel(job)}</span>
              {job?.workMode || job?.work_mode ? <span className="job-detail-badge muted">{job.workMode || job.work_mode}</span> : null}
              {experience ? <span className="job-detail-badge">{experience}</span> : null}
            </div>
            <div className="job-detail-facts"><span>▣ {jobDate === 'Qeyd edilməyib' ? 'Bu gün yerləşdirilib' : `${jobDate} tarixində yerləşdirilib`}</span><span>◉ {job?.views || job?.view_count || 0} baxış</span><span>◷ {expiryRemainingLabel}</span></div>
          </div>
          <div className="job-detail-hero-actions">
            {applyHref ? <a className="job-detail-apply-button" href={applyHref} target={atsLink || applyContact?.external ? '_blank' : undefined} rel="noopener noreferrer">⚡ 1 kliklə müraciət et</a> : <button className="job-detail-apply-button" type="button" disabled>Müraciət mümkün deyil</button>}
            <button type="button" className="job-detail-outline-action">♡ Elanı yadda saxla</button>
            <button type="button" className={`job-detail-outline-action${copiedShareLink ? ' copied' : ''}`} onClick={copyShareLink}>{copiedShareLink ? '✓ Link kopyalandı' : '⌯ Paylaş'}</button>
          </div>
        </div>
        {!isPage ? (
          <button className="job-detail-close" onClick={onClose} aria-label="Bağla">
            &times;
          </button>
        ) : null}
      </section>

      <div className="job-detail-body">
        <main className="job-detail-main-content">
          <section className="job-detail-card description-card">
            <h2 className="job-detail-section-title"><span>♙</span> Vəzifə haqqında</h2>
            <div className="job-detail-description">{cleanJobDescription || 'Təsvir qeyd edilməyib.'}</div>
          </section>

          {responsibilities.length ? <section className="job-detail-card"><h2 className="job-detail-section-title"><span>♟</span> Öhdəliklər</h2><ul className="job-detail-list">{responsibilities.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}

          <section className="job-detail-card"><h2 className="job-detail-section-title"><span>♙</span> Tələblər</h2>{requirements.length ? <ul className="job-detail-list">{requirements.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="job-detail-muted">Əlavə tələb qeyd edilməyib.</p>}<div className="job-detail-requirement-grid"><span><b>Təcrübə</b>{experience || 'Tələb olunmur'}</span><span><b>Təhsil</b>{education || 'Qeyd edilməyib'}</span><span><b>Kateqoriya</b>{job.category || 'Qeyd edilməyib'}</span><span><b>İş formatı</b>{getJobTypeLabel(job)}</span></div></section>

          <section className="job-detail-card"><h2 className="job-detail-section-title"><span>▣</span> İş şəraiti və üstünlüklər</h2><div className="job-detail-condition-grid"><span><b>İş qrafiki</b>{workSchedule || 'Qeyd edilməyib'}</span><span><b>Əmək müqaviləsi</b>{job?.contract || 'Rəsmi'}</span><span><b>İş yeri</b>{workplace || getAddress(job)}</span></div>{benefits.length ? <ul className="job-detail-list benefits">{benefits.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>

          <section className="job-detail-card job-detail-process"><h2 className="job-detail-section-title"><span>⌁</span> Müraciət prosesi</h2><div><span><i>➤</i><b>Göndərildi</b><small>0–1 gün</small></span><em>→</em><span><i>◉</i><b>Baxıldı</b><small>1–3 gün</small></span><em>→</em><span><i>♙</i><b>Müsahibə</b><small>3–7 gün</small></span><em>→</em><span><i>✓</i><b>Nəticə</b><small>1–3 gün</small></span></div></section>

          <section className="job-detail-security-note"><span>!</span><div><strong>İş üçün ödəniş tələb edən elanları şikayət edin</strong><p>Asimos-da bütün vakansiyalar tamamilə pulsuzdur. İşə qəbul zamanı ödəniş tələb edilə bilməz.</p></div><button type="button">Elanı şikayət et</button></section>

          <section className="job-detail-card similar-jobs-card">
            <div className="section-heading-row">
              <div>
                <span className="section-kicker">Oxşar vakansiyalar</span>
                <h2 className="job-detail-section-title">Bu elana oxşar elanlar</h2>
              </div>
            </div>
            {similarLoading ? (
              <div className="similar-jobs-state">Oxşar elanlar yüklənir...</div>
            ) : similarJobs.length ? (
              <div className="similar-jobs-grid">
                {similarJobs.map((item) => {
                  const itemCompany = getCompanyName(item);
                  const itemLogo = getJobLogoUrl(item);
                  const itemInitial = String(itemCompany || item.title || 'A').charAt(0).toUpperCase();
                  return (
                    <a key={item.id} href={getSimilarJobHref(item)} className="similar-job-card">
                      <span className="similar-job-logo">
                        {itemLogo ? <img src={itemLogo} alt="" /> : itemInitial}
                      </span>
                      <span className="similar-job-content">
                        <strong>{item.title || 'Elan'}</strong>
                        <small>{itemCompany}</small>
                        <span className="similar-job-tags">
                          {item.category ? <i>{item.category}</i> : null}
                          <i>{getWage(item)}</i>
                        </span>
                      </span>
                      <span className="similar-job-save" aria-hidden="true">♡</span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="similar-jobs-state">Oxşar elan tapılmadı.</div>
            )}
          </section>

        </main>

        <aside className="job-detail-sidebar">
          <section className="job-detail-card apply-card">
            <h2>Bu vakansiyaya müraciət et</h2><p>Vakansiya məlumatlarını yoxlayın və uyğun əlaqə kanalı ilə müraciət edin.</p>
            {applyHref ? <a className="job-detail-apply-button" href={applyHref} target={atsLink || applyContact?.external ? '_blank' : undefined} rel="noopener noreferrer">⚡ 1 kliklə müraciət et</a> : <button className="job-detail-apply-button" type="button" disabled>Müraciət kanalı qeyd edilməyib</button>}
            <small className="job-detail-privacy">▣ Məlumatlarınız yalnız işəgötürənlə paylaşılacaq.</small>
          </section>
          {hasLocation ? <section className="job-detail-card job-detail-side-map"><h2>İş yeri</h2><JobDetailMap lat={lat} lng={lng} userLat={userLat} userLng={userLng} hasUserLocation={hasUserLocation} address={getAddress(job)} userAddress={userLocation?.address}/><strong>{getAddress(job)}</strong><p>{hasUserLocation ? 'Seçilmiş lokasiyanızdan marşrut mövcuddur.' : 'Dəqiq ünvan yalnız seçilmiş namizədlərlə paylaşılır.'}</p><a href={mapViewUrl} target="_blank" rel="noopener noreferrer">🗺 Xəritədə göstər</a></section> : null}
          <section className="job-detail-card company-summary-card"><h2>Şirkət haqqında</h2><div className="company-summary-head"><div className="company-summary-logo">{logoUrl ? <img src={logoUrl} alt={`${companyName} loqosu`} /> : companyInitial}</div><div><h2>{companyName} <span className="verified-mark">✓</span></h2><p>{job.category || 'Şirkət'}</p></div></div><p className="company-description">{job?.companyDescription || job?.company_description || `${companyName} şirkətinin aktiv vakansiyası.`}</p><div className="company-summary-row"><span>Elanın statusu</span><strong>{statusLabel}</strong></div><div className="company-summary-row"><span>İş formatı</span><strong>{getJobTypeLabel(job)}</strong></div></section>
          <section className="job-detail-card job-detail-actions-card"><h2>Əlavə</h2><button type="button">♡ Elanı yadda saxla</button><button type="button" onClick={copyShareLink}>⌯ Paylaş</button><button type="button">△ Elanı şikayət et</button></section>
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
