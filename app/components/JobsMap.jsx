"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CENTER = [40.4093, 49.8671];
const LEAFLET_CSS_ID = "leaflet-cdn-styles";
const LEAFLET_SCRIPT_ID = "leaflet-cdn-script";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_SCRIPT_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_QUERY = `
[out:json][timeout:25];
area["ISO3166-1"="AZ"][admin_level=2]->.searchArea;
(
  node["amenity"="university"](area.searchArea);
  way["amenity"="university"](area.searchArea);
  relation["amenity"="university"](area.searchArea);
)->.universities;
(
  node["railway"="station"]["station"="subway"](area.searchArea);
  way["railway"="station"]["station"="subway"](area.searchArea);
  relation["railway"="station"]["station"="subway"](area.searchArea);
  node["subway"="yes"](area.searchArea);
  way["subway"="yes"](area.searchArea);
  relation["subway"="yes"](area.searchArea);
)->.metros;
(.universities; .metros;);
out center tags;
`;

function ensureLeafletCss() {
  if (typeof document === "undefined" || document.getElementById(LEAFLET_CSS_ID)) return;

  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS_URL;
  document.head.appendChild(link);
}

function ensureLeafletScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet script can only load in the browser"));
  }

  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(LEAFLET_SCRIPT_ID);

    if (existing) {
      existing.addEventListener("load", () => resolve(window.L), { once: true });
      existing.addEventListener("error", () => reject(new Error("Leaflet script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = LEAFLET_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet script failed to load"));
    document.body.appendChild(script);
  });
}

function getJobCoordinates(job) {
  const lat = Number(job?.location?.lat ?? job?.lat);
  const lng = Number(job?.location?.lng ?? job?.lng ?? job?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: job?.id,
    title: job?.title || "Adsız elan",
    company: job?.companyName || job?.company_name || "Şirkət qeyd edilməyib",
    address: job?.location?.address || job?.address || "Ünvan qeyd edilməyib",
    wage: job?.wage || "Razılaşma ilə",
    category: job?.category || "Kateqoriya yoxdur",
    description: job?.description || "Təsvir yoxdur",
    phone: job?.phone || null,
    whatsapp: job?.whatsapp || null,
    link: job?.link || null,
    createdAt: job?.createdAt || null,
    lat,
    lng,
  };
}

function getElementCoordinates(element) {
  const lat = Number(element?.lat ?? element?.center?.lat);
  const lng = Number(element?.lon ?? element?.center?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function normalizePoi(element, kind) {
  const coordinates = getElementCoordinates(element);
  const name = element?.tags?.name || element?.tags?.["name:az"] || element?.tags?.operator;

  if (!coordinates || !name) return null;

  return {
    id: `${kind}-${element.type}-${element.id}`,
    kind,
    name,
    address:
      element?.tags?.["addr:full"] ||
      element?.tags?.["addr:street"] ||
      element?.tags?.description ||
      element?.tags?.operator ||
      "",
    lat: coordinates.lat,
    lng: coordinates.lng,
  };
}

function dedupePois(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.kind}-${item.name}-${item.lat.toFixed(4)}-${item.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceInKm(pointA, pointB) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(pointB.lat - pointA.lat);
  const deltaLng = toRadians(pointB.lng - pointA.lng);
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestPoint(origin, points) {
  if (!points.length) return null;

  return points.reduce((nearest, point) => {
    const distanceKm = getDistanceInKm(origin, point);
    if (!nearest || distanceKm < nearest.distanceKm) {
      return { ...point, distanceKm };
    }
    return nearest;
  }, null);
}

function truncateText(value, maxLength = 220) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

async function fetchPoiData(signal) {
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          Accept: "application/json",
        },
        body: OVERPASS_QUERY,
        signal,
      });

      if (!res.ok) {
        throw new Error(`Overpass request failed with status ${res.status}`);
      }

      const data = await res.json();
      const elements = Array.isArray(data?.elements) ? data.elements : [];

      const universities = dedupePois(
        elements
          .filter((element) => element?.tags?.amenity === "university")
          .map((element) => normalizePoi(element, "university"))
          .filter(Boolean)
      );

      const metros = dedupePois(
        elements
          .filter(
            (element) =>
              element?.tags?.station === "subway" ||
              element?.tags?.subway === "yes"
          )
          .map((element) => normalizePoi(element, "metro"))
          .filter(Boolean)
      );

      return { universities, metros };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("POI data could not be loaded");
}

function createMarkerIcon(L, kind, label) {
  const safeLabel = escapeHtml(label);

  return L.divIcon({
    className: "jobs-map-marker-wrap",
    html: `<div class="jobs-map-marker jobs-map-marker--${kind}"><span>${safeLabel}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -14],
  });
}

function buildPoiPopup(poi, title) {
  return `
    <div class="jobs-map-popup jobs-map-popup--poi">
      <strong>${escapeHtml(title)}</strong><br />
      <span>${escapeHtml(poi.name)}</span>
      ${poi.address ? `<br /><span>${escapeHtml(poi.address)}</span>` : ""}
    </div>
  `;
}

function buildJobPopup(job, nearestUniversity, nearestMetro) {
  const createdAt = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString("az-AZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tarix yoxdur";

  return `
    <div class="jobs-map-popup jobs-map-popup--job">
      <div class="jobs-map-popup__title">${escapeHtml(job.title)}</div>
      <div class="jobs-map-popup__company">${escapeHtml(job.company)}</div>
      <div class="jobs-map-popup__meta"><strong>Kateqoriya:</strong> ${escapeHtml(job.category)}</div>
      <div class="jobs-map-popup__meta"><strong>Maaş:</strong> ${escapeHtml(job.wage)}</div>
      <div class="jobs-map-popup__meta"><strong>Ünvan:</strong> ${escapeHtml(job.address)}</div>
      <div class="jobs-map-popup__meta"><strong>Tarix:</strong> ${escapeHtml(createdAt)}</div>
      <div class="jobs-map-popup__desc">${escapeHtml(truncateText(job.description))}</div>
      ${job.phone ? `<div class="jobs-map-popup__meta"><strong>Telefon:</strong> ${escapeHtml(job.phone)}</div>` : ""}
      ${job.whatsapp ? `<div class="jobs-map-popup__meta"><strong>WhatsApp:</strong> ${escapeHtml(job.whatsapp)}</div>` : ""}
      ${job.link ? `<div class="jobs-map-popup__meta"><strong>Link:</strong> ${escapeHtml(job.link)}</div>` : ""}
      <div class="jobs-map-popup__nearby">
        <div><strong>Ən yaxın metro:</strong> ${nearestMetro ? `${escapeHtml(nearestMetro.name)} (${nearestMetro.distanceKm.toFixed(1)} km)` : "Tapılmadı"}</div>
        <div><strong>Ən yaxın universitet:</strong> ${nearestUniversity ? `${escapeHtml(nearestUniversity.name)} (${nearestUniversity.distanceKm.toFixed(1)} km)` : "Tapılmadı"}</div>
      </div>
    </div>
  `;
}

export default function JobsMap({ jobs }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [poiError, setPoiError] = useState("");
  const [poiData, setPoiData] = useState({ universities: [], metros: [] });

  const jobsWithCoordinates = useMemo(
    () => (Array.isArray(jobs) ? jobs.map(getJobCoordinates).filter(Boolean) : []),
    [jobs]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchPoiData(controller.signal)
      .then((data) => {
        setPoiData(data);
        setPoiError("");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setPoiError(error.message || "Universitet və metro məlumatları yüklənmədi");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;

    ensureLeafletCss();
    ensureLeafletScript()
      .then((L) => {
        if (cancelled || !mapNodeRef.current || mapRef.current) return;

        const map = L.map(mapNodeRef.current, {
          center: DEFAULT_CENTER,
          zoom: 7,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapRef.current = map;
        layersRef.current = {
          jobs: L.layerGroup().addTo(map),
          universities: L.layerGroup().addTo(map),
          metros: L.layerGroup().addTo(map),
        };
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message || "Xəritə yüklənmədi");
        }
      });

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
    if (!mapRef.current || !layersRef.current || !window.L) return;

    const L = window.L;
    const { jobs: jobsLayer, universities: universitiesLayer, metros: metrosLayer } = layersRef.current;
    const jobIcon = createMarkerIcon(L, "job", "IS");
    const universityIcon = createMarkerIcon(L, "university", "U");
    const metroIcon = createMarkerIcon(L, "metro", "M");
    const bounds = [];

    jobsLayer.clearLayers();
    universitiesLayer.clearLayers();
    metrosLayer.clearLayers();

    poiData.universities.forEach((poi) => {
      L.marker([poi.lat, poi.lng], { icon: universityIcon })
        .bindPopup(buildPoiPopup(poi, "Universitet"))
        .addTo(universitiesLayer);
      bounds.push([poi.lat, poi.lng]);
    });

    poiData.metros.forEach((poi) => {
      L.marker([poi.lat, poi.lng], { icon: metroIcon })
        .bindPopup(buildPoiPopup(poi, "Metro"))
        .addTo(metrosLayer);
      bounds.push([poi.lat, poi.lng]);
    });

    jobsWithCoordinates.forEach((job) => {
      const nearestUniversity = findNearestPoint(job, poiData.universities);
      const nearestMetro = findNearestPoint(job, poiData.metros);

      L.marker([job.lat, job.lng], { icon: jobIcon })
        .bindPopup(buildJobPopup(job, nearestUniversity, nearestMetro), { maxWidth: 340 })
        .addTo(jobsLayer);
      bounds.push([job.lat, job.lng]);
    });

    if (!bounds.length) {
      mapRef.current.setView(DEFAULT_CENTER, 7);
      return;
    }

    if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 13);
      return;
    }

    mapRef.current.fitBounds(bounds, { padding: [36, 36] });
  }, [jobsWithCoordinates, poiData]);

  return (
    <section className="container page-section jobs-map-section">
      <header className="section-head jobs-map-head">
        <h2>Elanların xəritədə görünüşü</h2>
        <p>
          Xəritədə {jobsWithCoordinates.length} iş elanı, {poiData.universities.length} universitet və {poiData.metros.length} metro marker kimi göstərilir.
        </p>
      </header>

      <div className="jobs-map-shell card">
        {loadError ? <p className="jobs-map-empty">{loadError}</p> : null}
        {!loadError && poiError ? <p className="jobs-map-empty">{poiError}</p> : null}
        {!loadError && !jobsWithCoordinates.length ? (
          <p className="jobs-map-empty">Koordinatı olan elan tapılmadı.</p>
        ) : null}
        <div ref={mapNodeRef} className="jobs-map-canvas" />
      </div>
    </section>
  );
}
