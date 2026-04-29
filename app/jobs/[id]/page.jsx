import { cache } from "react";
import JobDetailPageClient from "./JobDetailPageClient";

export const dynamic = "force-dynamic";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com").replace(/\/+$/, "");

const getJob = cache(async function getJob(id) {
  const res = await fetch(`${API_BASE_URL}/jobs/${encodeURIComponent(String(id))}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Elan detalları yüklənmədi");
  }

  return res.json();
});

function buildJobMetadata(job, id) {
  const title = job?.title || `Elan #${id}`;
  const companyName = job?.companyName || job?.company_name || "Asimos";
  const rawDescription = job?.description || job?.summary || "Asimos platformasında vakansiya detalları ilə tanış olun.";
  const description = String(rawDescription).replace(/\s+/g, " ").trim().slice(0, 160);

  return {
    title: `${title} - ${companyName}`,
    description,
    alternates: {
      canonical: `/jobs/${id}`,
    },
    openGraph: {
      title: `${title} - ${companyName}`,
      description,
      type: "article",
      locale: "az_AZ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - ${companyName}`,
      description,
    },
  };
}

export async function generateMetadata({ params }) {
  try {
    const job = await getJob(params.id);
    return buildJobMetadata(job, params.id);
  } catch {
    return {
      title: "Elan tapılmadı",
      description: "Axtardığınız iş elanı hazırda mövcud deyil və ya silinib.",
      alternates: {
        canonical: `/jobs/${params.id}`,
      },
    };
  }
}

export default async function JobDetailPage({ params }) {
  try {
    const job = await getJob(params.id);
    return <JobDetailPageClient job={job} error="" />;
  } catch (error) {
    return <JobDetailPageClient job={null} error={error.message || "Elan tapılmadı."} />;
  }
}
