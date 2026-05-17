function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="store-logo store-logo-play">
      <defs>
        <linearGradient id="play-green" x1="5.7" x2="27.4" y1="3.8" y2="25.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00A0FF" />
          <stop offset="1" stopColor="#00E064" />
        </linearGradient>
        <linearGradient id="play-yellow" x1="24" x2="42.1" y1="22.1" y2="22.1" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE000" />
          <stop offset="1" stopColor="#FFB300" />
        </linearGradient>
        <linearGradient id="play-red" x1="6.6" x2="30.2" y1="44.4" y2="20.8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3D00" />
          <stop offset="1" stopColor="#FF1744" />
        </linearGradient>
      </defs>
      <path fill="url(#play-green)" d="M8.2 4.8c-.7.7-1.1 1.8-1.1 3.1v32.2c0 1.3.4 2.4 1.1 3.1L26 24 8.2 4.8Z" />
      <path fill="url(#play-yellow)" d="M32 17.5 26 24l6 6.5 8.1-4.7c2.3-1.3 2.3-3.3 0-4.6L32 17.5Z" />
      <path fill="#00C853" d="m8.2 4.8 23.9 12.7L26 24 8.2 4.8Z" opacity=".9" />
      <path fill="url(#play-red)" d="M8.2 43.2 26 24l6.1 6.5L8.2 43.2Z" />
      <path fill="#fff" d="M8.2 4.8 26 24 8.2 43.2c-.7-.7-1.1-1.8-1.1-3.1V7.9c0-1.3.4-2.4 1.1-3.1Z" opacity=".12" />
    </svg>
  );
}

function AppStoreIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="store-logo store-logo-apple">
      <path
        fill="currentColor"
        d="M31.3 5.1c.3 2.3-.7 4.6-2.1 6.2-1.6 1.8-4.2 3.2-6.5 3-.4-2.2.8-4.6 2.2-6.1 1.7-1.9 4.5-3.2 6.4-3.1Zm7.6 30.5c-1.2 2.8-1.8 4.1-3.4 6.6-2.2 3.3-5.2 7.4-9 7.4-3.3 0-4.1-2.1-8.6-2.1-4.4 0-5.4 2.1-8.6 2.1-3.8 0-6.7-3.8-8.9-7.1C-5.8 33.3-2.5 18.9 5.1 18.4c3.8-.2 6.5 2.4 8.6 2.4 2.1 0 6-2.9 10.1-2.5 1.7.1 6.7.7 9.9 5.3-8.7 4.8-7.3 17.1 5.2 20Z"
      />
    </svg>
  );
}

const storeLinks = [
  {
    title: "Play Store",
    href: "https://play.google.com/store",
    icon: <PlayStoreIcon />,
    meta: "Android tətbiqi",
  },
  {
    title: "App Store",
    href: "https://www.apple.com/app-store/",
    icon: <AppStoreIcon />,
    meta: "iOS tətbiqi",
  },
];

export default function AppLaunchPanel() {
  return (
    <section className="container page-section launch-section">
      <div className="launch-shell">
        <div className="launch-copy">
          <span className="launch-kicker">Mobil tətbiq</span>
          <h2 className="launch-title">Asimos tezliklə Play Store və App Store-da</h2>
          <div className="launch-buttons">
            {storeLinks.map((item) => (
              <a key={item.title} className="launch-button" href={item.href} target="_blank" rel="noreferrer">
                <span className="launch-button-icon">{item.icon}</span>
                <span className="launch-button-text">
                  <span className="launch-button-meta">{item.meta}</span>
                  <span className="launch-button-label">{item.title}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
