import SeoLandingPage from '../_seo/SeoLandingPage';
import { getSeoPage, SITE_URL } from '../../lib/seo-pages';

const page = getSeoPage('is-elanlari');

export const metadata = {
  title: page.metaTitle,
  description: page.description,
  keywords: page.primaryKeywords,
  alternates: {
    canonical: '/is-elanlari',
  },
  openGraph: {
    title: page.metaTitle,
    description: page.description,
    url: `${SITE_URL}/is-elanlari`,
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
