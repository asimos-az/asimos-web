import HomePageClient from './_home/HomePageClient';

const description =
  'Asimos ilə Azərbaycanda iş elanlarını kəşf edin, yaxınlıqdakı vakansiyaları xəritədə görün, profil yaradın və işəgötürənlərlə daha rahat əlaqə qurun.';

export const metadata = {
  title: 'İş elanları, vakansiyalar və yaxınlıqdakı iş imkanları',
  description,
  keywords: [
    'iş elanları',
    'vakansiya',
    'vakansiyalar',
    'iş tapmaq',
    'Bakı iş elanları',
    'Azərbaycanda iş',
    'iş axtaran',
    'işçi axtaran',
    'işəgötürən',
    'part time iş',
    'gündəlik iş',
    'xəritədə iş elanları',
    'Asimos',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Asimos | İş elanları və karyera platforması',
    description,
    type: 'website',
    url: '/',
    locale: 'az_AZ',
    images: [
      {
        url: '/hero-bg.png',
        width: 1200,
        height: 630,
        alt: 'Asimos iş elanları və vakansiyalar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asimos | İş elanları və karyera platforması',
    description,
    images: ['/hero-bg.png'],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
