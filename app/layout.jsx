import './globals.css';
import './_home/components/AuthSection.css';
import './_home/components/LocationPermissionPrompt.css';
import './_home/components/AppLaunchPanel.css';
import './_home/components/NotificationsSection.css';
import './components/Header.css';
import './components/JobCard.css';
import './components/JobDetail.css';
import './components/JobsMap.css';
import './components/LocationPicker.css';
import './components/Footer.css';
import './components/SplashScreen.css';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';

const siteUrl = 'https://asimos.az';
const siteName = 'Asimos';
const siteDescription =
  'Asimos Azərbaycanda iş axtaranlar və işəgötürənlər üçün hazırlanmış iş elanları, vakansiya paylaşımı, xəritə ilə yaxın iş imkanları və karyera platformasıdır.';

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'Asimos', url: siteUrl }],
  creator: 'Asimos',
  publisher: 'Asimos',
  category: 'jobs, career, recruitment',
  title: {
    default: 'Asimos | Azərbaycanda iş elanları və vakansiyalar',
    template: '%s | Asimos',
  },
  description: siteDescription,
  keywords: [
    'Asimos',
    'iş elanları',
    'vakansiyalar',
    'vakansiya',
    'iş tapmaq',
    'iş axtarıram',
    'işçi axtarıram',
    'iş axtaran',
    'işəgötürən',
    'karyera',
    'Bakı iş elanları',
    'Azərbaycanda iş',
    'gündəlik iş',
    'yaxınlıqda iş',
    'xəritədə iş elanları',
    'remote iş',
    'part time iş',
    'full time iş',
  ],
  alternates: {
    canonical: '/',
    languages: {
      az: '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: siteUrl,
    siteName,
    title: 'Asimos | Azərbaycanda iş elanları və vakansiyalar',
    description: siteDescription,
    images: [
      {
        url: '/hero-bg.png',
        width: 1200,
        height: 630,
        alt: 'Asimos iş elanları və karyera platforması',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asimos | Azərbaycanda iş elanları və vakansiyalar',
    description: siteDescription,
    images: ['/hero-bg.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.webmanifest',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Asimos',
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  sameAs: [siteUrl],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Asimos',
  url: siteUrl,
  inLanguage: 'az-AZ',
  description: siteDescription,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <SplashScreen />
        {children}
        <Footer />
      </body>
    </html>
  );
}
