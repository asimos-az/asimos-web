import Link from "next/link";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M14 8.8V6.9c0-.8.2-1.3 1.4-1.3H17V2.2c-.8-.1-1.7-.2-2.5-.2-2.5 0-4.3 1.5-4.3 4.4v2.4H7.4v3.8h2.8V22H14v-9.4h2.9l.5-3.8H14Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm4.2 3.3A4.7 4.7 0 1 1 7.3 12 4.7 4.7 0 0 1 12 7.3Zm0 2A2.7 2.7 0 1 0 14.7 12 2.7 2.7 0 0 0 12 9.3Zm5-2.4a1.1 1.1 0 1 1-1.1 1.1A1.1 1.1 0 0 1 17 6.9Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16.7 2c.3 2.5 1.7 4 4.3 4.2v3.4c-1.5.1-2.9-.4-4.2-1.2v6.5c0 8.2-8.9 10.8-12.5 4.9-2.3-3.8-.9-10.5 6.5-10.8v3.6c-.5.1-1 .2-1.4.4-1.4.5-2.2 1.8-1.9 3.2.6 2.7 5.4 3.5 5-1.8V2h4.2Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.8h4v11.7H3V9.8Zm6.3 0h3.8v1.6h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6v6h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8v5.4h-4V9.8Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M18.2 2.8h3.1l-6.8 7.8 8 10.6h-6.3l-4.9-6.4-5.6 6.4H2.6l7.3-8.4L2.2 2.8h6.4l4.4 5.9 5.2-5.9Zm-1.1 16.5h1.7L7.7 4.6H5.9l11.2 14.7Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.8 4.2 18.5 20c-.2 1.1-.9 1.4-1.9.9l-5.2-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.3 9.7-8.8c.4-.4-.1-.6-.7-.2L5.3 13.3.1 11.7c-1.1-.4-1.1-1.1.2-1.6L20.6 2.3c.9-.3 1.8.2 1.2 1.9Z" />
    </svg>
  );
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com").replace(/\/+$/, "");

const defaultSocialLinks = {
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/asimos_az",
  tiktok: "https://www.tiktok.com/",
  linkedin: "https://www.linkedin.com/",
  twitter: "https://x.com/",
  telegram: "https://t.me/",
};

const socialLinkMeta = [
  { key: "facebook", label: "Facebook", icon: <FacebookIcon /> },
  { key: "instagram", label: "Instagram", icon: <InstagramIcon /> },
  { key: "tiktok", label: "TikTok", icon: <TikTokIcon /> },
  { key: "linkedin", label: "LinkedIn", icon: <LinkedInIcon /> },
  { key: "twitter", label: "Twitter / X", icon: <XIcon /> },
  { key: "telegram", label: "Telegram", icon: <TelegramIcon /> },
];

async function getSiteSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/site-settings`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { socialLinks: defaultSocialLinks };
    return await res.json();
  } catch {
    return { socialLinks: defaultSocialLinks };
  }
}

export default async function Footer() {
  const settings = await getSiteSettings();
  const links = { ...defaultSocialLinks, ...(settings?.socialLinks || {}) };
  const socialLinks = socialLinkMeta
    .map((item) => ({ ...item, href: typeof links[item.key] === "string" ? links[item.key].trim() : "" }))
    .filter((item) => item.href);

  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <img src="/logo.jpeg" alt="Asimos loqosu" />
          </Link>
          <p>
            Asimos platformasında vakansiyaları izləyin, uyğun imkanları kəşf edin və karyera axınınızı daha rahat idarə edin.
          </p>
          <div className="footer-socials" aria-label="Sosial şəbəkələr">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} title={item.label}>
                {item.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="footer-links footer-links--compact">
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
