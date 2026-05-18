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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="store-logo store-logo-apple" focusable="false">
      <path
        fill="currentColor"
        d="M16.37 1.43c.03 1.17-.43 2.26-1.24 3.1-.87.9-2.22 1.58-3.43 1.48-.15-1.13.47-2.33 1.25-3.13.9-.9 2.42-1.55 3.42-1.45Zm4.2 15.72c-.55 1.26-.82 1.82-1.55 2.92-.99 1.49-2.4 3.34-4.08 3.36-1.5.02-1.89-.98-3.93-.98-2.05 0-2.48 1-3.98.97-1.68-.02-2.96-1.7-3.95-3.18C.39 16.18.09 11.35 1.75 8.78c1.18-1.83 3.05-2.9 4.82-2.9 1.8 0 2.93 1 4.42 1 1.44 0 2.32-1 4.4-1 1.58 0 3.24.86 4.42 2.34-3.88 2.13-3.25 7.67.76 8.93Z"
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
