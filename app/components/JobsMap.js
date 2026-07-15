"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./JobsMap.css";

const DEFAULT_CENTER = [40.4093, 49.8671];

const LEAFLET_CSS_ID = "leaflet-cdn-styles";
const LEAFLET_SCRIPT_ID = "leaflet-cdn-script";
const LEAFLET_CLUSTER_CSS_ID = "leaflet-markercluster-styles";
const LEAFLET_CLUSTER_DEFAULT_CSS_ID = "leaflet-markercluster-default-styles";
const LEAFLET_CLUSTER_SCRIPT_ID = "leaflet-markercluster-script";

const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_SCRIPT_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CLUSTER_CSS_URL = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
const LEAFLET_CLUSTER_DEFAULT_CSS_URL = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
const LEAFLET_CLUSTER_SCRIPT_URL = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";

function appendStylesheet(id, href) {
  if (typeof document === "undefined" || document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function appendScript(id, src) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Xəritə yalnız brauzerdə işləyir"));
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Xəritə script-i yüklənmədi")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Xəritə script-i yüklənmədi"));
    document.body.appendChild(script);
  });
}

function ensureLeafletCss() {
  appendStylesheet(LEAFLET_CSS_ID, LEAFLET_CSS_URL);
}

async function ensureLeafletScript() {
  if (typeof window === "undefined") throw new Error("Leaflet script can only load in browser");

  if (!window.L) await appendScript(LEAFLET_SCRIPT_ID, LEAFLET_SCRIPT_URL);

  return window.L;
}

async function ensureLeafletCluster(L) {
  appendStylesheet(LEAFLET_CLUSTER_CSS_ID, LEAFLET_CLUSTER_CSS_URL);
  appendStylesheet(LEAFLET_CLUSTER_DEFAULT_CSS_ID, LEAFLET_CLUSTER_DEFAULT_CSS_URL);

  if (!L?.markerClusterGroup) {
    await appendScript(LEAFLET_CLUSTER_SCRIPT_ID, LEAFLET_CLUSTER_SCRIPT_URL);
  }

  return L;
}

function getJobCoordinates(job) {
  const lat = Number(job?.location?.lat ?? job?.lat);
  const lng = Number(job?.location?.lng ?? job?.lng ?? job?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: job?.id,
    title: job?.title || "Adsız elan",
    company: job?.companyName || job?.company_name || job?.company || "Şirkət qeyd edilməyib",
    address: job?.location?.address || job?.address || "Ünvan qeyd edilməyib",
    wage: job?.wage || job?.salary || "Razılaşma əsasında",
    category:
      job?.category ||
      job?.categoryName ||
      job?.category_name ||
      job?.jobCategory ||
      job?.job_category ||
      job?.category_slug ||
      "Müxtəlif",
    phone: job?.phone || job?.contact_phone || job?.contactPhone || "",
    whatsapp: job?.whatsapp || job?.contact_whatsapp || job?.contactWhatsapp || "",
    link: job?.atsLink || job?.ats_link || job?.link || "",
    lat,
    lng,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getCategoryShort(category) {
  const text = String(category || "").trim();
  if (!text) return "İş";

  return text
    .split(/[\s/,-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 3) || "İş";
}

function getCategoryColor(category) {
  const colors = ["#1fa276", "#2563eb", "#7c3aed", "#0e7490", "#b45309", "#dc2626", "#0f766e", "#4338ca"];
  const text = String(category || "job");
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % colors.length;
  }

  return colors[Math.abs(hash) % colors.length];
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

function getJobDetailHref(job) {
  const categorySlug = slugify(
    job?.category ||
    job?.categoryName ||
    job?.category_name ||
    job?.jobCategory ||
    job?.job_category ||
    job?.category_slug ||
    "Müxtəlif"
  ) || "muxtelif";
  const titleSlug = slugify(job?.title || job?.name || job?.id || "vakansiya") || "vakansiya";

  const path = `/jobs/${categorySlug}/${titleSlug}`;
  const jobId = job?.id || job?._id || job?.jobId || job?.job_id;
  return jobId ? `${path}?id=${encodeURIComponent(String(jobId))}` : path;
}

function createMarkerIcon(L, job, focused = false) {
  const label = getCategoryShort(job.category);
  const color = focused ? "#2563eb" : getCategoryColor(job.category);

  return L.divIcon({
    className: "jobs-map-marker-wrap",
    html: `
      <div class="jobs-map-marker${focused ? " jobs-map-marker--active" : ""}" style="--marker-color:${color}">
        <span>${escapeHtml(label)}</span>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 42],
    popupAnchor: [0, -38],
  });
}

function buildJobPopup(job) {
  const detailHref = getJobDetailHref(job);

  return `
    <div class="jobs-map-popup jobs-map-popup--job">
      <div class="jobs-map-popup__title">${escapeHtml(job.title)}</div>
      <div class="jobs-map-popup__company">${escapeHtml(job.company)}</div>
      <div class="jobs-map-popup__meta"><strong>Kateqoriya:</strong> ${escapeHtml(job.category)}</div>
      <div class="jobs-map-popup__meta"><strong>Maaş:</strong> ${escapeHtml(job.wage)}</div>
      <div class="jobs-map-popup__meta"><strong>Ünvan:</strong> ${escapeHtml(job.address)}</div>
      ${job.phone ? `<div class="jobs-map-popup__meta"><strong>Telefon:</strong> ${escapeHtml(job.phone)}</div>` : ""}
      ${job.whatsapp ? `<div class="jobs-map-popup__meta"><strong>WhatsApp:</strong> ${escapeHtml(job.whatsapp)}</div>` : ""}
      <a class="jobs-map-popup__link" href="${escapeHtml(detailHref)}">Elanın detalına keç</a>
    </div>
  `;
}

export default function JobsMap({ jobs, focusedJobId = null, userLocation = null }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [jobsRendered, setJobsRendered] = useState(false);

  const jobsWithCoordinates = useMemo(
    () => (Array.isArray(jobs) ? jobs.map(getJobCoordinates).filter(Boolean) : []),
    [jobs]
  );

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        ensureLeafletCss();

        let L = await ensureLeafletScript();
        L = await ensureLeafletCluster(L);

        if (cancelled || !mapNodeRef.current || mapRef.current) return;

        const map = L.map(mapNodeRef.current, {
          center: DEFAULT_CENTER,
          zoom: 7,
          preferCanvas: true,
          scrollWheelZoom: false,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          updateWhenIdle: true,
          updateWhenZooming: false,
          keepBuffer: 2,
        }).addTo(map);

        const jobsLayer = L.markerClusterGroup({
          chunkedLoading: true,
          chunkDelay: 35,
          chunkInterval: 170,
          maxClusterRadius: 48,
          removeOutsideVisibleBounds: true,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 16,
        });

        jobsLayer.addTo(map);

        layersRef.current = { jobs: jobsLayer };
        mapRef.current = map;
        setMapReady(true);

        setTimeout(() => map.invalidateSize(), 220);
      } catch (error) {
        if (!cancelled) setLoadError(error?.message || "Xəritə yüklənmədi");
      }
    }

    initMap();

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !layersRef.current || !window.L) return;

    const L = window.L;
    const jobsLayer = layersRef.current.jobs;

    jobsLayer.clearLayers();
    setJobsRendered(false);

    const bounds = [];
    let focusedMarker = null;

    const markers = jobsWithCoordinates.map((job) => {
      const focused = focusedJobId !== null && String(job.id) === String(focusedJobId);
      const marker = L.marker([job.lat, job.lng], {
        icon: createMarkerIcon(L, job, focused),
        riseOnHover: true,
      }).bindPopup(buildJobPopup(job), { maxWidth: 340 });

      if (focused) focusedMarker = marker;
      bounds.push([job.lat, job.lng]);

      return marker;
    });

    jobsLayer.addLayers(markers);

    const userLat = Number(userLocation?.lat);
    const userLng = Number(userLocation?.lng);

    if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
      const userIcon = L.divIcon({
        className: "jobs-map-user-marker-wrap",
        html: `<div class="jobs-map-user-marker"><span>📍</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      L.marker([userLat, userLng], { icon: userIcon })
        .bindPopup(`<div class="jobs-map-popup jobs-map-popup--user"><div class="jobs-map-popup__title">Sizin lokasiya</div></div>`)
        .addTo(jobsLayer);

      bounds.push([userLat, userLng]);
    }

    if (focusedMarker) {
      const latLng = focusedMarker.getLatLng();
      mapRef.current.setView(latLng, 15, { animate: true });
      jobsLayer.zoomToShowLayer(focusedMarker, () => focusedMarker.openPopup());
      setJobsRendered(true);
      return;
    }

    if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      mapRef.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    } else {
      mapRef.current.setView(DEFAULT_CENTER, 7);
    }

    setJobsRendered(true);
    setTimeout(() => mapRef.current?.invalidateSize(), 120);
  }, [jobsWithCoordinates, focusedJobId, mapReady, userLocation?.lat, userLocation?.lng]);

  return (
    <section className="container page-section jobs-map-section" id="home-jobs-map-section">
      <article className="jobs-map-shell">
        <header className="jobs-map-card-head">
          <div className="jobs-map-card-icon" aria-hidden="true">🗺️</div>
          <div>
            <h2>📍 Kateqoriya üzrə elan xəritəsi</h2>
            <p>Yaxınlıqdakı qaynar iş məkanları</p>
          </div>
        </header>

        {loadError ? <p className="jobs-map-empty">{loadError}</p> : null}

        {!loadError && !jobsWithCoordinates.length ? (
          <p className="jobs-map-empty">Koordinatı olan elan tapılmadı.</p>
        ) : null}

        {!mapReady ? <div className="jobs-map-skeleton">Xəritə yüklənir...</div> : null}

        <div ref={mapNodeRef} className="jobs-map-canvas" />

        {jobsWithCoordinates.length ? (
          <div className="jobs-map-legend" aria-label="Xəritə izahı">
            <span><i className="jobs-map-legend-dot jobs" /> {jobsWithCoordinates.length} elan</span>
            {!jobsRendered ? <span>Markerlar yüklənir...</span> : null}
            <span>Cluster group aktivdir</span>
          </div>
        ) : null}
      </article>
    </section>
  );
}
