import { cache } from 'react';
import JobDetailPageClient from './JobDetailPageClient';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://asimos.az';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://asimos-backend.onrender.com').replace(/\/+$/, '');

const getJob = cache(async function getJob(id) {
  const res = await fetch(`${API_BASE_URL}/jobs/${encodeURIComponent(String(id))}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Elan detalları yüklənmədi');
  }

  return res.json();
});

function cleanText(value, fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim();
}

function getJobTitle(job, id) {
  return cleanText(job?.title, `İş elanı #${id}`);
}

function getCompanyName(job) {
  return cleanText(job?.companyName || job?.company_name || job?.company?.name, 'Asimos');
}

function getJobLocation(job) {
  const address = cleanText(job?.location?.address || job?.address || job?.city || 'Azərbaycan');
  return address;
}

function buildJobMetadata(job, id) {
  const title = getJobTitle(job, id);
  const companyName = getCompanyName(job);
  const rawDescription = job?.description || job?.summary || 'Asimos platformasında vakansiya detalları ilə tanış olun.';
  const description = cleanText(rawDescription).slice(0, 160);
  const canonical = `/jobs/${id}`;

  return {
    title: `${title} - ${companyName}`,
    description,
    keywords: [
      title,
      companyName,
      'iş elanı',
      'vakansiya',
      'iş müraciəti',
      'karyera',
      'Asimos',
      getJobLocation(job),
    ].filter(Boolean),
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} - ${companyName}`,
      description,
      url: canonical,
      type: 'article',
      locale: 'az_AZ',
      images: [
        {
          url: '/hero-bg.png',
          width: 1200,
          height: 630,
          alt: `${title} - ${companyName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${companyName}`,
      description,
      images: ['/hero-bg.png'],
    },
  };
}

function buildJobPostingSchema(job, id) {
  const title = getJobTitle(job, id);
  const companyName = getCompanyName(job);
  const description = cleanText(job?.description || job?.summary || title);
  const datePosted = job?.createdAt || job?.created_at || new Date().toISOString();
  const validThrough = job?.validThrough || job?.valid_through || job?.deadline || undefined;
  const address = getJobLocation(job);
  const employmentType = cleanText(job?.employmentType || job?.employment_type || job?.type || 'OTHER').toUpperCase();
  const salary = job?.salary || job?.price || job?.amount;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    datePosted,
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
      sameAs: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: address,
        addressCountry: 'AZ',
      },
    },
    directApply: true,
    url: `${SITE_URL}/jobs/${encodeURIComponent(String(id))}`,
  };

  if (validThrough) schema.validThrough = validThrough;

  if (salary) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'AZN',
      value: {
        '@type': 'QuantitativeValue',
        value: Number(salary) || salary,
        unitText: 'MONTH',
      },
    };
  }

  return schema;
}

export async function generateMetadata({ params }) {
  try {
    const job = await getJob(params.id);
    return buildJobMetadata(job, params.id);
  } catch {
    return {
      title: 'Elan tapılmadı',
      description: 'Axtardığınız iş elanı hazırda mövcud deyil və ya silinib.',
      alternates: {
        canonical: `/jobs/${params.id}`,
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
    const job = await getJob(params.id);
    const schema = buildJobPostingSchema(job, params.id);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <JobDetailPageClient job={job} error="" />
      </>
    );
  } catch (error) {
    return <JobDetailPageClient job={null} error={error.message || 'Elan tapılmadı.'} />;
  }
}
