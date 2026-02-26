import './globals.css';

export const metadata = {
  title: 'Asimos — Coming Soon',
  description: 'Asimos coming soon landing page',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
