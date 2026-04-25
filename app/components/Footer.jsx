import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <img src="/logo.svg" alt="Asimos loqosu" />
          </Link>
          <p>
            Asimos platformasında vakansiyaları izləyin, uyğun imkanları kəşf edin və karyera axınınızı daha rahat idarə edin.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Naviqasiya</h3>
            <Link href="/">Ana səhifə</Link>
            <Link href="/policy">Qaydalar</Link>
          </div>
          <div>
            <h3>Platforma</h3>
            <a href="https://play.google.com/store" target="_blank" rel="noreferrer">
              Play Store
            </a>
            <a href="https://www.apple.com/app-store/" target="_blank" rel="noreferrer">
              App Store
            </a>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 Asimos. Bütün hüquqlar qorunur.</span>
        <Link href="/">Asimos.az</Link>
      </div>
    </footer>
  );
}
