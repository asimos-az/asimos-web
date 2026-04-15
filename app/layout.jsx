import './globals.css';

export const metadata = {
  title: 'Asimos Web Portal',
  description: 'Asimos mobil tetbiqinin web versiyasi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
