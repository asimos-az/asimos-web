import './globals.css';
import './auth.css';
import './components/Header.css';
import './components/JobCard.css';
import './components/JobDetail.css';
import './components/Footer.css';
import Footer from './components/Footer';

export const metadata = {
  metadataBase: new URL('https://asimos.az'),
  title: {
    default: 'Asimos',
    template: '%s | Asimos',
  },
  description: 'Asimos platformasında iş elanlarını izləyin, vakansiyalar paylaşın və karyera axınınızı idarə edin.',
  applicationName: 'Asimos',
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
