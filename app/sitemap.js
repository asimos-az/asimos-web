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

  const jobRoutes = await getJobsForSitemap();
  return [...staticRoutes, ...seoRoutes, ...jobRoutes];
}
