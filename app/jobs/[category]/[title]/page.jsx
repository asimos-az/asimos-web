import { cache } from "react";
import JobDetailPageClient from "./JobDetailPageClient";

export const dynamic = "force-dynamic";

const SITE_URL = "https://asimos.az";
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com"
).replace(/\/+$/, "");

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

function getJobCategorySlug(job) {
  return (
    slugify(
      job?.category ||
        job?.categoryName ||
        job?.category_name ||
        job?.jobCategory ||
        job?.job_category ||
        "elan"
    ) || "elan"
  );
}

function getJobTitleSlug(job) {
  const titleSlug = slugify(job?.title || job?.name || job?.companyName || job?.company_name);

  if (titleSlug) return titleSlug;

  return String(job?.id || "elan");
}

function extractJobs(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobs)) return data.jobs;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

const getAllJobs = cache(async function getAllJobs() {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Elanlar yüklənmədi");
  }

  const data = await res.json();

  return extractJobs(data);
});

const getJobBySlug = cache(async function getJobBySlug(categoryParam, titleParam) {
  const categorySlug = slugify(categoryParam);
  const titleSlug = slugify(titleParam);

  const jobs = await getAllJobs();

  const foundJob = jobs.find((job) => {
    const itemCategorySlug = getJobCategorySlug(job);
    const itemTitleSlug = getJobTitleSlug(job);

    return itemCategorySlug === categorySlug && itemTitleSlug === titleSlug;
  });

  if (!foundJob) {
    throw new Error("Elan tapılmadı");
  }

  return foundJob;
});

function cleanText(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function getJobTitle(job, fallback = "") {
  return cleanText(job?.title, fallback || "İş elanı");
}

function getCompanyName(job) {
  return cleanText(
    job?.companyName || job?.company_name || job?.company?.name,
    "Asimos"
  );
}

function getJobLocation(job) {
  return cleanText(job?.location?.address || job?.address || job?.city, "Azərbaycan");
}

function getCanonicalPath(job) {
  return `/jobs/${getJobCategorySlug(job)}/${getJobTitleSlug(job)}`;
}

function buildJobMetadata(job) {
  const title = getJobTitle(job);
  const companyName = getCompanyName(job);
  const rawDescription =
    job?.description ||
    job?.summary ||
    "Asimos platformasında vakansiya detalları ilə tanış olun.";

  const description = cleanText(rawDescription).slice(0, 160);
  const canonical = getCanonicalPath(job);

  return {
    title: `${title} - ${companyName}`,
    description,
    keywords: [
      title,
      companyName,
      "iş elanı",
      "vakansiya",
      "iş müraciəti",
      "karyera",
      "Asimos",
      getJobLocation(job),
    ].filter(Boolean),
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} - ${companyName}`,
      description,
      url: canonical,
      type: "article",
      locale: "az_AZ",
      images: [
        {
          url: "/hero-bg.png",
          width: 1200,
          height: 630,
          alt: `${title} - ${companyName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - ${companyName}`,
      description,
      images: ["/hero-bg.png"],
    },
  };
}

function buildJobPostingSchema(job) {
  const title = getJobTitle(job);
  const companyName = getCompanyName(job);
  const description = cleanText(job?.description || job?.summary || title);
  const datePosted = job?.createdAt || job?.created_at || new Date().toISOString();

  const validThrough =
    job?.validThrough ||
    job?.valid_through ||
    job?.expiresAt ||
    job?.expires_at ||
    job?.deadline ||
    undefined;

  const address = getJobLocation(job);

  const employmentType = cleanText(
    job?.employmentType ||
      job?.employment_type ||
      job?.jobType ||
      job?.job_type ||
      job?.type ||
      "OTHER"
  ).toUpperCase();

  const salary = job?.salary || job?.wage || job?.price || job?.amount;

  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    datePosted,
    employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
      sameAs: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: address,
        addressCountry: "AZ",
      },
    },
    directApply: true,
    url: `${SITE_URL}${getCanonicalPath(job)}`,
  };

  if (validThrough) {
    schema.validThrough = validThrough;
  }

  if (salary) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "AZN",
      value: {
        "@type": "QuantitativeValue",
        value: Number(salary) || salary,
        unitText: "MONTH",
      },
    };
  }

  return schema;
}

export async function generateMetadata({ params }) {
  try {
    const job = await getJobBySlug(params.category, params.title);
    return buildJobMetadata(job);
  } catch {
    return {
      title: "Elan tapılmadı",
      description: "Axtardığınız iş elanı hazırda mövcud deyil və ya silinib.",
      alternates: {
        canonical: `/jobs/${params.category}/${params.title}`,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }
}

export default async function JobDetailPage({ params }) {
  try {
    const job = await getJobBySlug(params.category, params.title);
    const schema = buildJobPostingSchema(job);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <JobDetailPageClient job={job} error="" />
      </>
    );
  } catch (error) {
    return (
      <JobDetailPageClient
        job={null}
        error={error.message || "Elan tapılmadı."}
      />
    );
  }
}