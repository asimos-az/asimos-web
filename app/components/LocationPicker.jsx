"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER = { lat: 40.4093, lng: 49.8671 };
const LEAFLET_CSS_ID = "leaflet-picker-styles";
const LEAFLET_SCRIPT_ID = "leaflet-picker-script";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_SCRIPT_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

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
    return Promise.reject(new Error("Leaflet only runs in browser"));
  }

  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(LEAFLET_SCRIPT_ID);

    if (existing) {
      existing.addEventListener("load", () => resolve(window.L), { once: true });
      existing.addEventListener("error", () => reject(new Error("Leaflet script failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = LEAFLET_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet script failed"));
    document.body.appendChild(script);
  });
}

async function searchAddresses(query) {
  if (!query.trim()) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=az&limit=6&accept-language=az&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) throw new Error("Ünvan axtarışı alınmadı");

  const data = await response.json();
  return Array.isArray(data)
    ? data.map((item) => ({
        id: item.place_id,
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }))
    : [];
}

async function reverseGeocode(lat, lng) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&accept-language=az`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) throw new Error("Ünvan tapılmadı");

  const data = await response.json();
  return data?.display_name || "Seçilmiş ünvan";
}

export default function LocationPicker({ lat, lng, address, onChange }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [query, setQuery] = useState(address || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setQuery(address || "");
  }, [address]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        ensureLeafletCss();
        const L = await ensureLeafletScript();
        if (cancelled || !mapNodeRef.current || mapRef.current) return;

        const center = [Number(lat) || DEFAULT_CENTER.lat, Number(lng) || DEFAULT_CENTER.lng];
        const map = L.map(mapNodeRef.current, { zoomControl: true }).setView(center, 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        const marker = L.marker(center, { draggable: true }).addTo(map);

        async function syncFromPoint(nextLat, nextLng) {
          marker.setLatLng([nextLat, nextLng]);
          map.panTo([nextLat, nextLng], { animate: true });

          try {
            const nextAddress = await reverseGeocode(nextLat, nextLng);
            onChangeRef.current({
              lat: String(nextLat),
              lng: String(nextLng),
              address: nextAddress,
            });
          } catch {
            onChangeRef.current({
              lat: String(nextLat),
              lng: String(nextLng),
              address: address || "Seçilmiş ünvan",
            });
          }
        }

        map.on("click", (event) => {
          syncFromPoint(event.latlng.lat, event.latlng.lng);
        });

        marker.on("dragend", () => {
          const point = marker.getLatLng();
          syncFromPoint(point.lat, point.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
      } catch (error) {
        if (!cancelled) {
          setMapError(error.message || "Xəritə yüklənmədi");
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [address, lat, lng]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    const nextLat = Number(lat);
    const nextLng = Number(lng);

    if (!map || !marker || !Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;

    marker.setLatLng([nextLat, nextLng]);
    map.setView([nextLat, nextLng], map.getZoom(), { animate: false });
  }, [lat, lng]);

  async function handleSearch() {
    setSearching(true);
    setMapError("");

    try {
      const nextResults = await searchAddresses(query);
      setResults(nextResults);
    } catch (error) {
      setMapError(error.message || "Ünvan axtarışı alınmadı");
    } finally {
      setSearching(false);
    }
  }

  function handleSelect(result) {
    setResults([]);
    setQuery(result.label);
    onChangeRef.current({
      lat: String(result.lat),
      lng: String(result.lng),
      address: result.label,
    });
  }

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    handleSearch();
  }

  return (
    <div className="location-picker">
      <div className="location-search">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Ünvan axtarın"
        />
        <button type="button" className="btn-secondary" disabled={searching} onClick={handleSearch}>
          {searching ? "Axtarılır..." : "Axtar"}
        </button>
      </div>

      {results.length ? (
        <div className="location-search-results">
          {results.map((result) => (
            <button key={result.id} type="button" className="location-search-result" onClick={() => handleSelect(result)}>
              {result.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="location-meta">
        <span>{address || "Ünvan seçilməyib"}</span>
        <small>
          {lat}, {lng}
        </small>
      </div>

      <div ref={mapNodeRef} className="location-map-canvas" />

      {mapError ? <p className="muted">{mapError}</p> : null}
    </div>
  );
}
