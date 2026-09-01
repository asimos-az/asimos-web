"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import JobDetail from "../../../components/JobDetail";
import { AppHeader } from "../../../_home/components/redesign/HomepageRedesign";
import { getRouteForSection } from "../../../_home/sectionRoutes";
import { loadAuth } from "../../../../lib/auth-store";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com").replace(/\/+$/, "");

function normalizeRole(role) {
  const raw = String(role || "").trim().toLowerCase();
  if (["seeker", "is axtaran", "alici", "jobseeker"].includes(raw)) return "seeker";
  if (["employer", "isci axtaran", "satici", "hirer", "company"].includes(raw)) return "employer";
  return null;
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
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStoredDeviceLocation() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem("asimos_device_location") || "null");
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Sorğu alınmadı");
  return data;
}

function normalizeJobPayload(data) {
  return data?.item || data?.job || data || null;
}

function normalizeJobsList(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

async function fetchJobDetailById(id) {
  if (!id) return null;

  try {
    return normalizeJobPayload(await fetchJson(`${API_BASE_URL}/jobs/${encodeURIComponent(String(id))}`));
  } catch {
    const list = await fetchJson(`${API_BASE_URL}/jobs?limit=5000`);
    return normalizeJobsList(list).find((item) => String(item?.id) === String(id)) || null;
  }
}

async function fetchJobBySlug(categorySlug, titleSlug) {
  try {
    const match = await fetchJson(
      `${API_BASE_URL}/jobs/slug/${encodeURIComponent(categorySlug)}/${encodeURIComponent(titleSlug)}`
    );

    const normalized = normalizeJobPayload(match);
    if (normalized?.title || normalized?.name) return normalized;
    if (normalized?.id || match?.id) return await fetchJobDetailById(normalized?.id || match?.id);
  } catch {
    // backend slug endpoint deploy olunmayıbsa list fallback işləsin
  }

  const list = await fetchJson(`${API_BASE_URL}/jobs?limit=5000`);
  const items = normalizeJobsList(list);
  const exact = items.find((item) => {
    const itemCategorySlug = slugify(
      item?.category || item?.categoryName || item?.category_name || item?.jobCategory || item?.job_category || 'Müxtəlif'
    );
    return itemCategorySlug === categorySlug && slugify(item?.title || item?.name) === titleSlug;
  });
  const titleOnly = items.find((item) => slugify(item?.title || item?.name) === titleSlug);
  const found = exact || titleOnly || null;

  if (!found) return null;
  return found?.id ? (await fetchJobDetailById(found.id)) || found : found;
}

export default function JobSlugDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [job, setJob] = useState(null);
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const roleName = normalizeRole(user?.role);
  const canCreateJob = roleName === "employer";

  function goToSection(section) {
    router.push(getRouteForSection(section));
  }

  const detailHeader = (
    <AppHeader ctx={{ activeSection: "jobs", setActiveSection: goToSection, user, canCreateJob }} />
  );

  useEffect(() => {
    const saved = loadAuth();
    setUser(saved?.user || null);
    setUserLocation(saved?.user?.location || getStoredDeviceLocation() || null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadJob() {
      setLoading(true);
      setError("");

      const categorySlug = decodeURIComponent(String(params?.category || "")).toLowerCase();
      const titleSlug = decodeURIComponent(String(params?.title || "")).toLowerCase();
      const idFromQuery = searchParams.get("id");

      try {
        // URL-də ID göstərilmir. Əgər köhnə linkdən ?id gəlibsə dəstək qalır,
        // amma əsas tapılma qaydası /jobs/category/title slug-larıdır.
        const detail = idFromQuery
          ? await fetchJobDetailById(idFromQuery)
          : await fetchJobBySlug(categorySlug, titleSlug);

        if (!detail) throw new Error("Elan tapılmadı");

        if (!cancelled) setJob(detail);
      } catch (err) {
        if (!cancelled) {
          setJob(null);
          setError(err?.message || "Elan tapılmadı");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJob();

    return () => {
      cancelled = true;
    };
  }, [params?.category, params?.title, searchParams]);

  if (loading) {
    return (
      <main className="site-shell">
        {detailHeader}
        <section className="container page-section">
          <div className="card">Elan yüklənir...</div>
        </section>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="site-shell">
        {detailHeader}
        <section className="container page-section">
          <div className="notice error">Elan tapılmadı</div>
        </section>
      </main>
    );
  }

  return (
    <main className="site-shell">
      {detailHeader}
      <JobDetail job={job} mode="page" user={user} userLocation={userLocation} />
    </main>
  );
}
