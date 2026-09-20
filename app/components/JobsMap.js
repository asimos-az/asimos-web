"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./JobsMap.css";
import { BAKU_NEARBY_PLACES } from "../../lib/baku-nearby-places";

const DEFAULT_CENTER = [40.4093, 49.8671];
const AZERBAIJAN_BOUNDS = [[38.35, 44.7], [41.95, 50.7]];

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
  if (lat < AZERBAIJAN_BOUNDS[0][0] || lat > AZERBAIJAN_BOUNDS[1][0] || lng < AZERBAIJAN_BOUNDS[0][1] || lng > AZERBAIJAN_BOUNDS[1][1]) return null;

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

function getSeekerCoordinates(seeker) {
  const lat = Number(seeker?.lat);
  const lng = Number(seeker?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // Reject malformed coordinates before they can move the viewport to another
  // country or to the Caspian Sea. The backend also validates these values.
  if (lat < AZERBAIJAN_BOUNDS[0][0] || lat > AZERBAIJAN_BOUNDS[1][0] || lng < AZERBAIJAN_BOUNDS[0][1] || lng > AZERBAIJAN_BOUNDS[1][1]) return null;
  return {
    id: String(seeker?.id || `${lat}-${lng}`),
    lat,
    lng,
    profession: String(seeker?.profession || "İş axtaran"),
    category: String(seeker?.category || "Kateqoriya seçilməyib"),
    district: String(seeker?.district || ""),
    experience: String(seeker?.experience || ""),
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

function createSeekerMarkerIcon(L) {
  return L.divIcon({
    className: "jobs-map-seeker-marker-wrap",
    html: '<div class="jobs-map-seeker-marker" aria-label="İş axtaran"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2c-4.7 0-8 2.4-8 5.2V22h16v-2.8c0-2.8-3.3-5.2-8-5.2Zm5.4 5.5H6.6v-.3c0-1.4 2.2-3.2 5.4-3.2s5.4 1.8 5.4 3.2v.3Z"/></svg></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function createPlaceMarkerIcon(L, type) {
  const isMetro = type === "metro";
  return L.divIcon({
    className: `jobs-map-place-marker-wrap jobs-map-place-marker-wrap--${isMetro ? "metro" : "university"}`,
    html: `<div class="jobs-map-place-marker" aria-label="${isMetro ? "Metro" : "Universitet"}">${isMetro ? "M" : "U"}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function buildSeekerPopup(seeker) {
  return `<div class="jobs-map-popup jobs-map-popup--seeker"><div class="jobs-map-popup__title">İş axtaran</div><div class="jobs-map-popup__meta"><strong>Peşə:</strong> ${escapeHtml(seeker.profession)}</div><div class="jobs-map-popup__meta"><strong>Kateqoriya:</strong> ${escapeHtml(seeker.category)}</div>${seeker.district ? `<div class="jobs-map-popup__meta"><strong>Ərazi:</strong> ${escapeHtml(seeker.district)}</div>` : ""}${seeker.experience ? `<div class="jobs-map-popup__meta"><strong>Təcrübə:</strong> ${escapeHtml(seeker.experience)}</div>` : ""}<div class="jobs-map-popup__meta">Lokasiya istifadəçinin paylaşdığı nöqtədir</div></div>`;
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

export default function JobsMap({ jobs, seekers = [], showSeekers = false, focusedJobId = null, userLocation = null, radiusM = 0 }) {
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
  const seekersWithCoordinates = useMemo(
    () => (Array.isArray(seekers) ? seekers.map(getSeekerCoordinates).filter(Boolean) : []),
    [seekers]
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
          zoom: 10,
          minZoom: 7,
          maxBounds: L.latLngBounds(AZERBAIJAN_BOUNDS),
          maxBoundsViscosity: 0.8,
          preferCanvas: true,
          scrollWheelZoom: true,
          zoomControl: true,
          attributionControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          updateWhenIdle: true,
          updateWhenZooming: false,
          keepBuffer: 2,
        }).addTo(map);

        L.control
          .attribution({ position: "bottomright", prefix: false })
          .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>')
          .addTo(map);

        const jobsLayer = L.markerClusterGroup({
          chunkedLoading: true,
          chunkDelay: 35,
          chunkInterval: 170,
          // Keep nearby pins grouped at street zoom levels too. Otherwise a
          // dense city turns into an unreadable carpet of overlapping markers.
          maxClusterRadius: 36,
          removeOutsideVisibleBounds: true,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 14,
          iconCreateFunction: (cluster) => L.divIcon({
            className: "jobs-map-cluster-wrap",
            html: `<div class="jobs-map-cluster">${cluster.getChildCount()}</div>`,
            iconSize: [46, 46],
            iconAnchor: [23, 23],
          }),
        });

        const seekersLayer = L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 36,
          removeOutsideVisibleBounds: true,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 14,
          iconCreateFunction: (cluster) => L.divIcon({
            className: "jobs-map-seeker-cluster-wrap",
            html: `<div class="jobs-map-seeker-cluster">${cluster.getChildCount()}</div>`,
            iconSize: [46, 46],
            iconAnchor: [23, 23],
          }),
        });

        jobsLayer.addTo(map);
        seekersLayer.addTo(map);

        const contextLayer = L.layerGroup().addTo(map);
        layersRef.current = { jobs: jobsLayer, seekers: seekersLayer, context: contextLayer };
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
    const seekersLayer = layersRef.current.seekers;
    const contextLayer = layersRef.current.context;
    let focusRetryTimer = null;

    jobsLayer.clearLayers();
    seekersLayer.clearLayers();
    contextLayer.clearLayers();
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

    seekersWithCoordinates.forEach((seeker) => {
      L.marker([seeker.lat, seeker.lng], { icon: createSeekerMarkerIcon(L), riseOnHover: true })
        .bindPopup(buildSeekerPopup(seeker), { maxWidth: 300 })
        .addTo(seekersLayer);
      bounds.push([seeker.lat, seeker.lng]);
    });

    BAKU_NEARBY_PLACES.forEach((place) => {
      L.marker([place.lat, place.lng], { icon: createPlaceMarkerIcon(L, place.type), keyboard: false })
        .bindPopup(`<div class="jobs-map-popup jobs-map-popup--place"><div class="jobs-map-popup__title">${escapeHtml(place.name)}</div><div class="jobs-map-popup__meta">${place.type === "metro" ? "Metro stansiyası" : "Universitet"}</div></div>`, { maxWidth: 280 })
        .addTo(contextLayer);
    });

    const userLat = Number(userLocation?.lat);
    const userLng = Number(userLocation?.lng);

    if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
      const userIcon = L.divIcon({
        className: "jobs-map-user-marker-wrap",
        html: `<div class="jobs-map-user-marker"><span></span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      L.marker([userLat, userLng], { icon: userIcon })
        .bindPopup(`<div class="jobs-map-popup jobs-map-popup--user"><div class="jobs-map-popup__title">Sizin canlı lokasiyanız</div></div>`)
        .addTo(contextLayer);

      const normalizedRadius = Number(radiusM);
      if (Number.isFinite(normalizedRadius) && normalizedRadius > 0) {
        const radiusCircle = L.circle([userLat, userLng], {
          radius: normalizedRadius,
          color: "#079875",
          weight: 2,
          opacity: 0.72,
          fillColor: "#079875",
          fillOpacity: 0.1,
          interactive: false,
        }).addTo(contextLayer);
        const circleBounds = radiusCircle.getBounds();
        bounds.push(circleBounds.getNorthEast(), circleBounds.getSouthWest());
      }

      bounds.push([userLat, userLng]);
    }

    if (focusedMarker) {
      const latLng = focusedMarker.getLatLng();
      mapRef.current.setView(latLng, 15, { animate: true });
      setJobsRendered(true);
      let attempts = 0;
      const revealFocusedMarker = () => {
        if (!mapRef.current) return;
        if (!jobsLayer.hasLayer(focusedMarker)) {
          if (attempts++ < 40) focusRetryTimer = window.setTimeout(revealFocusedMarker, 50);
          return;
        }
        try {
          jobsLayer.zoomToShowLayer(focusedMarker, () => focusedMarker.openPopup());
        } catch (error) {
          console.warn("Selected map marker could not be expanded from its cluster", error);
          mapRef.current?.setView(latLng, 15);
        }
      };
      revealFocusedMarker();
      return () => { if (focusRetryTimer) window.clearTimeout(focusRetryTimer); };
    }

    if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 13);
    } else {
      mapRef.current.setView(DEFAULT_CENTER, 10);
    }

    setJobsRendered(true);
    setTimeout(() => mapRef.current?.invalidateSize(), 120);
    return () => { if (focusRetryTimer) window.clearTimeout(focusRetryTimer); };
  }, [jobsWithCoordinates, seekersWithCoordinates, focusedJobId, mapReady, radiusM, userLocation?.lat, userLocation?.lng]);

  return (
    <section className="container page-section jobs-map-section" id="home-jobs-map-section">
      <article className="jobs-map-shell">
        <header className="jobs-map-card-head">
          <div className="jobs-map-card-icon" aria-hidden="true">🗺️</div>
          <div>
            <h2>📍 {showSeekers ? "Vakansiyalar və iş axtaranlar" : "Kateqoriya üzrə elan xəritəsi"}</h2>
            <p>{showSeekers ? seekersWithCoordinates.length ? "İş axtaranların paylaşdığı lokasiyalar göstərilir; şəxsi əlaqə məlumatları gizlidir." : "Lokasiyası qeyd edilmiş iş axtaran tapılmadı." : "Yaxınlıqdakı qaynar iş məkanları"}</p>
          </div>
        </header>

        {loadError ? <p className="jobs-map-empty">{loadError}</p> : null}

       

        {!mapReady ? <div className="jobs-map-skeleton">Xəritə yüklənir...</div> : null}

        <div ref={mapNodeRef} className="jobs-map-canvas" />

        {jobsWithCoordinates.length || seekersWithCoordinates.length ? (
          <div className="jobs-map-legend" aria-label="Xəritə izahı">
            {jobsWithCoordinates.length ? <span><i className="jobs-map-legend-dot jobs" /> {jobsWithCoordinates.length} elan</span> : null}
            {showSeekers ? <span><i className="jobs-map-legend-dot seekers" /> {seekersWithCoordinates.length} iş axtaran</span> : null}
            {!jobsRendered ? <span>Markerlar yüklənir...</span> : null}
            <span>Cluster group aktivdir</span>
          </div>
        ) : null}
      </article>
    </section>
  );
}
