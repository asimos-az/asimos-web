import AppRoutePage from '../_home/AppRoutePage';
import { SITE_URL } from '../../lib/seo-pages';

export const metadata = {
  title: 'Vakansiyalar xəritədə',
  description: 'Bütün vakansiyaları və iş imkanlarını xəritədə kəşf edin.',
  keywords: ['vakansiyalar xəritədə', 'iş elanları xəritədə', 'iş axtaranlar'],
  alternates: {
    canonical: '/xeritede-is-elanlari',
  },
  openGraph: {
    title: 'Vakansiyalar xəritədə',
    description: 'Bütün vakansiyaları və iş imkanlarını xəritədə kəşf edin.',
    url: `${SITE_URL}/xeritede-is-elanlari`,
    type: 'website',
    locale: 'az_AZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vakansiyalar xəritədə',
    description: 'Bütün vakansiyaları və iş imkanlarını xəritədə kəşf edin.',
  },
};

export default function Page() {
  return <AppRoutePage section="map" />;
}
