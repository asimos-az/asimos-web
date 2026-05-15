import SeoLandingPage from '../_seo/SeoLandingPage';
import { getSeoPage, SITE_URL } from '../../lib/seo-pages';

const page = getSeoPage('vakansiyalar');

export const metadata = {
  title: page.metaTitle,
  description: page.description,
  keywords: page.primaryKeywords,
  alternates: {
    canonical: '/vakansiyalar',
  },
  openGraph: {
    title: page.metaTitle,
    description: page.description,
    url: `${SITE_URL}/vakansiyalar`,
    type: 'website',
    locale: 'az_AZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: page.metaTitle,
    description: page.description,
  },
};

export default function Page() {
  return <SeoLandingPage page={page} />;
}
