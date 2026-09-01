import styles from "../HomePage.module.css";

export default function HomePageLoadingScreen() {
  return (
    <main className={styles.loadingScreen}>
      <div className={styles.loadingCard}>
        <div className={styles.loadingSpinner} aria-hidden="true" />
        <h2 className={styles.loadingTitle}>Yüklənir</h2>
        <p className={styles.loadingText}>Platforma hazırlanır, zəhmət olmasa bir neçə saniyə gözləyin.</p>
      </div>
    </main>
  );
}
