'use client';

import { useEffect, useState } from 'react';

const SPLASH_DURATION_MS = 2500;

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setIsLeaving(true), SPLASH_DURATION_MS - 560);
    const hideTimer = window.setTimeout(() => setIsVisible(false), SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`asimos-splash ${isLeaving ? 'asimos-splash--leaving' : ''}`} aria-label="Asimos yüklənir">
      <div className="asimos-splash__noise" />
      <div className="asimos-splash__aurora asimos-splash__aurora--blue" />
      <div className="asimos-splash__aurora asimos-splash__aurora--green" />
      <div className="asimos-splash__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <main className="asimos-splash__stage">
        <div className="asimos-splash__mark" aria-hidden="true">
          <span className="asimos-splash__mark-dot" />
          <span className="asimos-splash__mark-line asimos-splash__mark-line--one" />
          <span className="asimos-splash__mark-line asimos-splash__mark-line--two" />
        </div>

        <div className="asimos-splash__wordmark" role="img" aria-label="Asimos">
          <span className="asimos-splash__script asimos-splash__script--glow" aria-hidden="true">Asimos</span>
          <span className="asimos-splash__script asimos-splash__script--main">Asimos</span>
        </div>

        <div className="asimos-splash__caption">
          <span />
          <p>İş imkanları yüklənir</p>
          <span />
        </div>
      </main>
    </div>
  );
}
