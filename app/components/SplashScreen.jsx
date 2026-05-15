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

        <svg
          className="asimos-splash__wordmark"
          viewBox="0 0 820 210"
          role="img"
          aria-labelledby="asimosSplashTitle"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title id="asimosSplashTitle">Asimos</title>
          <defs>
            <linearGradient id="asimosSplashStroke" x1="0" y1="0" x2="820" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="45%" stopColor="#3c7df0" />
              <stop offset="70%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
            <linearGradient id="asimosSplashFill" x1="130" y1="30" x2="700" y2="190" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="45%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
            <filter id="asimosSplashSoftGlow" x="-30%" y="-55%" width="160%" height="210%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.235 0 0 0 0 0.490 0 0 0 0 0.941 0 0 0 .62 0" result="colored" />
              <feMerge>
                <feMergeNode in="colored" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <mask id="asimosSplashReveal">
              <rect className="asimos-splash__mask-rect" x="0" y="0" width="820" height="210" fill="white" />
            </mask>
          </defs>

          <text className="asimos-splash__word asimos-splash__word--shadow" x="50%" y="56%" textAnchor="middle" dominantBaseline="middle">
            Asimos
          </text>
          <text className="asimos-splash__word asimos-splash__word--outline" x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" filter="url(#asimosSplashSoftGlow)">
            Asimos
          </text>
          <text className="asimos-splash__word asimos-splash__word--fill" x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" mask="url(#asimosSplashReveal)">
            Asimos
          </text>
        </svg>

        <div className="asimos-splash__caption">
          <span />
          <p>İş imkanları yüklənir</p>
          <span />
        </div>
      </main>
    </div>
  );
}
