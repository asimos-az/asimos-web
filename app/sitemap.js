import { seoPageList, SITE_URL } from '../lib/seo-pages';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://asimos-backend.onrender.com').replace(/\/+$/, '');

async function getJobsForSitemap() {
  try {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const jobs = Array.isArray(data) ? data : data?.jobs || data?.data || data?.items || [];

    return jobs
      .filter((job) => job?.id)
      .slice(0, 1000)
      .map((job) => ({
        url: `${SITE_URL}/jobs/${encodeURIComponent(String(job.id))}`,
        lastModified: job.updatedAt || job.updated_at || job.createdAt || job.created_at || new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
  } catch {
    return [];
  }
}

async function getCareerRoutes() {
  const routes = [];
  try {
    for (let page = 1; page <= 100; page++) {
      const res = await fetch(`${API_BASE_URL}/career-articles?limit=50&page=${page}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!res.ok) break;
      const data = await res.json();
      for (const article of data.items || []) routes.push({ url: `${SITE_URL}/karyera-meslehetleri/${encodeURIComponent(article.slug)}`, lastModified: article.updated_at, changeFrequency: 'monthly', priority: 0.7 });
      if (!data.items?.length || page * 50 >= data.total) break;
    }
  } catch { /* Keep the rest of the sitemap available when the API is down. */ }
  return routes;
}

export default async function sitemap() {
  const seoRoutes = seoPageList.map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: page.slug === 'is-elanlari' || page.slug === 'vakansiyalar' ? 0.92 : 0.86,
  }));

  const staticRoutes = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.35,
    },
  ];

  const [jobRoutes, careerRoutes] = await Promise.all([getJobsForSitemap(), getCareerRoutes()]);
  return [...staticRoutes, ...seoRoutes, { url: `${SITE_URL}/karyera-meslehetleri`, changeFrequency: 'weekly', priority: 0.8 }, ...jobRoutes, ...careerRoutes];
}
