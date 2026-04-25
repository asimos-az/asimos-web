import styles from "../HomePage.module.css";

const trustMetrics = [
  { value: "10k+", label: "Görüntülənən elan" },
  { value: "24 saat", label: "Daha çevik yenilənmə" },
  { value: "AZ", label: "Yerli karyera odağı" },
];

export default function HomeHero({ search, setSearch, onSubmit, jobsCount, categoriesCount }) {
  return (
    <section className={styles.heroStage}>
      <div className={`container ${styles.homeHero}`}>
        <div className={styles.heroTexture} aria-hidden="true" />
        <div className={styles.heroGlowLeft} aria-hidden="true" />
        <div className={styles.heroGlowRight} aria-hidden="true" />
        <div className={styles.heroBackdrop} aria-hidden="true" />
        <article className={styles.heroContent}>
          <span className={styles.heroEyebrow}>Asimos Platforması</span>
          <h1 className={styles.heroTitle}>İş axtaranla işəgötürəni birləşdirən daha ciddi və güvənli bir təcrübə</h1>
          <p className={styles.heroText}>
            Elanları daha rahat kəşf edin, doğru namizədi daha tez tapın və platforma üzərində peşəkar karyera axını qurun.
          </p>
          <div className={styles.heroPills}>
            <span>Vakansiya və freelancer axını</span>
            <span>Lokasiya əsaslı kəşfiyyat</span>
            <span>Sürətli qeydiyyat</span>
          </div>
          <form className={styles.heroSearch} onSubmit={onSubmit}>
            <div className={styles.heroSearchField}>
              <span className={styles.heroSearchLabel}>Axtarış</span>
              <input
                className={styles.heroSearchInput}
                placeholder="Peşə, şirkət və ya açar söz..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">
              Elanları gör
            </button>
          </form>
          <div className={styles.heroSignature}>
            <span />
            Daha estetik, daha aydın, daha sürətli karyera axını
          </div>
        </article>
        <aside className={styles.heroPanel}>
          <div className={styles.heroPanelCard}>
            <span className={styles.heroPanelLabel}>Canlı bazar görüntüsü</span>
            <strong>{jobsCount} aktiv elan</strong>
            <p>Fərqli sahələrdən gələn elanlar bir yerdə toplanır və daha aydın seçim imkanı yaradır.</p>
          </div>
          <div className={styles.heroPanelGrid}>
            <div>
              <strong>{categoriesCount}</strong>
              <span>Kateqoriya</span>
            </div>
            <div>
              <strong>Sadə</strong>
              <span>İstifadə axını</span>
            </div>
          </div>
          <div className={styles.heroMetrics}>
            {trustMetrics.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
