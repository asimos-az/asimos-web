import './globals.css';
import './_home/components/AuthSection.css';
import './_home/components/LocationPermissionPrompt.css';
import './_home/components/AppLaunchPanel.css';
import './components/Header.css';
import './components/JobCard.css';
import './components/JobDetail.css';
import './components/JobsMap.css';
import './components/LocationPicker.css';
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
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
