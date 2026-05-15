import Link from 'next/link';
import styles from './SeoLandingPage.module.css';
import { SITE_URL, seoPageList } from '../../lib/seo-pages';

function buildFaqSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

function buildBreadcrumbSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Asimos',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.title,
        item: `${SITE_URL}/${page.slug}`,
      },
    ],
  };
}

export default function SeoLandingPage({ page }) {
  const relatedPages = seoPageList.filter((item) => item.slug !== page.slug).slice(0, 6);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.shell}>
          <div className={styles.heroCard}>
            <span className={styles.eyebrow}>{page.eyebrow}</span>
            <h1 className={styles.title}>{page.h1}</h1>
            <p className={styles.lead}>{page.lead}</p>

            <div className={styles.actions}>
              <Link href="/" className={styles.primaryLink}>
                Elanları axtar
              </Link>
              <Link href="/is-elanlari" className={styles.secondaryLink}>
                İş elanlarına bax
              </Link>
            </div>

            <div className={styles.keywordGrid} aria-label="Açar sözlər">
              {page.primaryKeywords.map((keyword) => (
                <span key={keyword} className={styles.keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.shell}>
        <div className={styles.contentGrid}>
          <div className={styles.mainContent}>
            {page.sections.map((section) => (
              <article key={section.heading} className={styles.card}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </article>
            ))}

            <section className={styles.card}>
              <h2>Tez-tez verilən suallar</h2>
              <div className={styles.faq}>
                {page.faq.map(([question, answer]) => (
                  <div key={question} className={styles.faqItem}>
                    <h3>{question}</h3>
                    <p>{answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.cta}>
              <h2>Asimos ilə iş axtarışını daha ağıllı et</h2>
              <p>
                İş elanları, vakansiyalar, gündəlik işlər və xəritə əsaslı yaxın imkanları izləmək üçün Asimos platformasından istifadə et.
              </p>
              <div className={styles.actions}>
                <Link href="/" className={styles.primaryLink}>
                  Ana səhifəyə keç
                </Link>
              </div>
            </section>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h2>SEO bölmələri</h2>
              <p>Asimos-da ən çox axtarılan iş və vakansiya mövzuları.</p>
              <div className={styles.linkList}>
                {relatedPages.map((item) => (
                  <Link key={item.slug} href={`/${item.slug}`}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <h2>Populyar açar sözlər</h2>
              <div className={styles.keywordGrid}>
                {page.primaryKeywords.map((keyword) => (
                  <span key={keyword} className={styles.keyword}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(page)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(page)) }}
      />
    </main>
  );
}
