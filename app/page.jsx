"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function getTimeLeft(targetDate) {
  const now = new Date().getTime();
  const diff = Math.max(targetDate - now, 0);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

function Countdown({ targetDate }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(targetDate));

    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const safeTime = timeLeft ?? { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const items = [
    { label: "Days", value: safeTime.days },
    { label: "Hours", value: safeTime.hours },
    { label: "Minutes", value: safeTime.minutes },
    { label: "Seconds", value: safeTime.seconds },
  ];

  return (
    <div className="countdown-grid">
      {items.map((item) => (
        <div className="countdown-card" key={item.label}>
          <div className="countdown-value" suppressHydrationWarning>
            {mounted ? String(item.value).padStart(2, "0") : "--"}
          </div>
          <div className="countdown-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const targetDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 45);
    return date.getTime();
  }, []);

  return (
    <main className="coming-page">
      <section className="hero-shell">
        <div className="hero-content">
          <div className="brand-row">
            <div className="logo-box">A</div>
            <div>
              <h1 className="brand-name">Asimos</h1>
              <p className="brand-subtitle">Modern social app experience is on the way</p>
            </div>
          </div>

          <span className="badge">🚀 Coming Soon</span>

          <h2 className="hero-title">Tezliklə veb saytımızda olacaq</h2>
          <p className="hero-desc">
            Asimos üçün yeni və daha güclü təcrübə hazırlanır. Sayt aktiv olan kimi App Store və Google Play
            linkləri burada görünəcək.
          </p>

          <Countdown targetDate={targetDate} />

          <div className="store-grid">
            <button type="button" className="store-btn" aria-label="App Store coming soon">
              <span className="store-icon"></span>
              <span>
                <small>Coming Soon on</small>
                <strong>App Store</strong>
              </span>
            </button>
            <button type="button" className="store-btn" aria-label="Google Play coming soon">
              <span className="store-icon">▶</span>
              <span>
                <small>Coming Soon on</small>
                <strong>Google Play</strong>
              </span>
            </button>
          </div>

          <div className="footer-row">
            <span>© 2026 Asimos</span>
            <span>•</span>
            <Link href="/policy" className="policy-link">Privacy Policy</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
