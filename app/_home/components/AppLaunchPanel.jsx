import styles from "../HomePage.module.css";

function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3.2 2.6c-.3.3-.5.8-.5 1.4v16c0 .6.2 1.1.5 1.4l9.1-9.4-9.1-9.4zm11.8 6.3-2-1.2-2.6 2.7 2.6 2.7 2-1.2c1.8-1.1 3-1.9 3-2.1s-1.2-1-3-2.1zm-2 4.6-2.6 2.7 2 1.2c1.8 1.1 3 1.9 3 2.1s-1.2 1-3 2.1l-8.2-8.1 8.8-0.2zm-8.8-.2 8.2-8.1c1.8 1.1 3 1.9 3 2.1s-1.2 1-3 2.1l-2 1.2-2.6 2.7-3.6-.1z" />
    </svg>
  );
}

function AppStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.7 2.6c.1 1-.3 2-1 2.8-.8.8-1.9 1.3-2.9 1.2-.1-1 .3-2 .9-2.7.8-.9 2-1.4 3-1.3zM19.4 17.5c-.6 1.3-.9 1.8-1.7 3-.9 1.3-2.1 2.8-3.6 2.8-1.3 0-1.7-.8-3.4-.8s-2.1.8-3.4.8c-1.5 0-2.6-1.4-3.6-2.7-2.8-3.8-3.1-8.2-1.4-10.8 1.2-1.8 3-2.8 4.7-2.8 1.4 0 2.4.8 3.7.8 1.2 0 2-.8 3.7-.8 1.5 0 3.2.8 4.3 2.3-3.7 2-3.1 7.2.7 8.2z"
      />
    </svg>
  );
}

const storeLinks = [
  {
    title: "Play Store",
    href: "https://play.google.com/store",
    icon: <PlayStoreIcon />,
  },
  {
    title: "App Store",
    href: "https://www.apple.com/app-store/",
    icon: <AppStoreIcon />,
  },
];

export default function AppLaunchPanel() {
  return (
    <section className={`container page-section ${styles.launchSection}`}>
      <div className={styles.launchShell}>
        <div className={styles.launchCopy}>
          <h2 className={styles.launchTitle}>Asimos tezliklə Play Store və App Store-da</h2>
          <div className={styles.launchButtons}>
            {storeLinks.map((item) => (
              <a key={item.title} className={styles.launchButton} href={item.href} target="_blank" rel="noreferrer">
                <span className={styles.launchButtonIcon}>{item.icon}</span>
                <span className={styles.launchButtonLabel}>{item.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
