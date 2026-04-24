import styles from "../HomePage.module.css";

export default function HomeHero({ search, setSearch, onSubmit }) {
  return (
    <section className={`container ${styles.homeHero}`}>
      <article className={styles.heroContent}>
        <h1 className={styles.heroTitle}>İş Axtaranla İşəgötürəni Birləşdirən Müasir Platforma</h1>
        <p className={styles.heroText}>
          Asimos ilə karyeranızda növbəti addımı atın və ya komandanız üçün ən yaxşı namizədi tapın.
        </p>
        <form className={styles.heroSearch} onSubmit={onSubmit}>
          <input
            className={styles.heroSearchInput}
            placeholder="Peşə, şirkət və ya açar söz..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="btn-primary">
            Axtar
          </button>
        </form>
      </article>
    </section>
  );
}
