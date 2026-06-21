import styles from './AppLaunchPanel.module.css';

function PlayStoreIcon() {
  return (
    <span className={`${styles.storeIcon} ${styles.playIcon}`} aria-hidden="true">
      ▶
    </span>
  );
}

function AppStoreIcon() {
  return (
    <span className={`${styles.storeIcon} ${styles.appleIcon}`} aria-hidden="true">
      🍎
    </span>
  );
}

function AppGalleryIcon() {
  return (
    <span className={`${styles.storeIcon} ${styles.galleryIcon}`} aria-hidden="true">
      ◆
    </span>
  );
}

const storeLinks = [
  {
    title: 'App Store',
    href: 'https://www.apple.com/app-store/',
    icon: <AppStoreIcon />,
  },
  {
    title: 'Google Play',
    href: 'https://play.google.com/store',
    icon: <PlayStoreIcon />,
  },
  {
    title: 'AppGallery',
    href: 'https://appgallery.huawei.com/',
    icon: <AppGalleryIcon />,
  },
];

export default function AppLaunchPanel() {
  return (
    <section className="container page-section">
      <div className={styles.launchShell}>
        <div className={styles.launchHeader}>
          <div className={styles.launchTitleWrap}>
            <span className={styles.phoneIcon} aria-hidden="true">📱</span>
            <h2 className={styles.launchTitle}>Tətbiqi yükləyin</h2>
          </div>
          <span className={styles.launchMeta}>iOS · Android · HarmonyOS</span>
        </div>

        <div className={styles.launchButtons}>
          {storeLinks.map((item) => (
            <a
              key={item.title}
              className={styles.launchButton}
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              {item.icon}
              <span>{item.title}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
