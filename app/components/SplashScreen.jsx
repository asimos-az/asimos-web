'use client';

import { useEffect, useState } from 'react';

const SPLASH_DURATION_MS = 1800;

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setIsLeaving(true), SPLASH_DURATION_MS - 360);
    const hideTimer = window.setTimeout(() => setIsVisible(false), SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`asimos-splash ${isLeaving ? 'asimos-splash--leaving' : ''}`} aria-label="Asimos yüklənir">
      <div className="asimos-splash__panel">
        <div className="asimos-splash__brand" role="img" aria-label="Asimos">
          <span className="asimos-splash__logo">
            <span className="asimos-splash__logo-dot" />
          </span>
          <span className="asimos-splash__name">asimos</span>
        </div>

        <div className="asimos-splash__loader" aria-hidden="true">
          <span />
        </div>

        <p className="asimos-splash__text">İş imkanları yüklənir</p>
      </div>
    </div>
  );
}
