'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { articleHref, fetchCareer } from '../../lib/career';
import styles from './Career.module.css';

export function ArticleCover({ article, large = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [article.cover_url]);
  const themes = ['mint', 'peach', 'blue', 'lilac'];
  return <div className={`${styles.cover} ${styles[themes.includes(article.cover_style) ? article.cover_style : 'mint']} ${large ? styles.largeCover : ''}`}>
    {article.cover_url && !failed ? <Image src={article.cover_url} alt="" fill unoptimized sizes={large ? '100vw' : '(max-width: 700px) 100vw, 33vw'} onError={() => setFailed(true)} /> : <div className={styles.art} aria-hidden="true">
      <span className={styles.artLabel}>ASIMOS JOURNAL</span><span className={styles.artWord}>{article.category || 'Karyera'}</span>
      <div className={styles.paper}><span className={styles.paperMark}>a<span>↗</span></span><i /><i /><i /><div className={styles.paperBottom}><span>Bir addım irəli.</span><b>↗</b></div></div>
      <span className={styles.artCircle} /><span className={styles.artDots}>＋<br />＋<br />＋</span>
    </div>}
    <span className={styles.coverCategory}>{article.category}</span>
  </div>;
}

export function ArticleCard({ article }) {
  return <Link href={articleHref(article)} className={styles.card}>
    <ArticleCover article={article} />
    <div className={styles.cardContent}><div className={styles.cardMeta}><span>{article.featured ? 'SEÇİLMİŞ MƏQALƏ' : 'KARYERA BƏLƏDÇİSİ'}</span><span>{article.reading_minutes} dəq oxu</span></div>
      <h3>{article.title}</h3><p>{article.excerpt}</p><div className={styles.cardFooter}><span>Məqaləni oxu</span><span className={styles.arrow}>↗</span></div>
    </div>
  </Link>;
}

function useArticles(query) {
  const [state, setState] = useState({ items: [], total: 0, loading: true, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
    setState(previous => ({ ...previous, loading: true, error: '' }));
    fetchCareer(query, { signal: controller.signal }).then(data => {
      if (active) setState({ items: data?.items || [], total: data?.total || 0, loading: false, error: '' });
    }).catch(() => {
      if (active) setState({ items: [], total: 0, loading: false, error: 'Məqalələr yüklənmədi. Yenidən yoxlayın.' });
    }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, retry]);
  return { ...state, retry: () => setRetry(value => value + 1) };
}

function ArticleResults({ state, excludeSlug = '' }) {
  if (state.loading) return <div className={styles.grid} role="status" aria-label="Məqalələr yüklənir">{[1, 2, 3].map(n => <div className={styles.skeleton} key={n} />)}</div>;
  if (state.error) return <div className={styles.empty} role="alert"><p>{state.error}</p><button type="button" onClick={state.retry}>Yenidən yoxla ↻</button></div>;
  const articles = state.items.filter(article => article.slug !== excludeSlug).slice(0, excludeSlug ? 3 : undefined);
  if (!articles.length) return <div className={styles.empty}><h3>Hələ məqalə yoxdur</h3><p>Yeni karyera məsləhətləri üçün tezliklə yenidən baxın.</p></div>;
  return <div className={styles.grid}>{articles.map(article => <ArticleCard key={article.id} article={article} />)}</div>;
}

export function CareerPreview({ excludeSlug = '' }) {
  const state = useArticles(`?limit=${excludeSlug ? 4 : 3}`);
  return <section data-no-translate lang="az" className={styles.preview} aria-labelledby="career-preview-title"><div className={styles.sectionHead}><div><span className={styles.eyebrow}>ÖYRƏN. HAZIRLAŞ. İRƏLİLƏ.</span><h2 id="career-preview-title">{excludeSlug ? 'Oxumağa davam edin' : 'Karyera məsləhətləri'}</h2><p>İş həyatında növbəti addımınız üçün faydalı məsləhətlər.</p></div><Link href="/karyera-meslehetleri" className={styles.allLink}>Hamısına bax <span>↗</span></Link></div><ArticleResults state={state} excludeSlug={excludeSlug} /></section>;
}

export function CareerDirectory() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const state = useArticles(`?limit=9&page=${page}&q=${encodeURIComponent(search)}`);
  return <main data-no-translate lang="az" className={styles.directory}>
    <section className={styles.hero}><div className={styles.heroInner}><Link href="/" className={styles.breadcrumb}>Ana səhifə / <span>Karyera məsləhətləri</span></Link><span className={styles.eyebrow}>ASIMOS KARYERA JURNALI</span><h1>Növbəti addımınız<br /><em>daha inamlı olsun.</em></h1><p>İlk CV-dən yeni karyera hədəflərinə qədər — iş həyatınız üçün aydın, praktik və faydalı bələdçilər.</p><span className={styles.heroNote}>Kiçik bir məsləhət. Böyük bir başlanğıc. ↗</span></div><span className={styles.heroDecoration} aria-hidden="true">a<span>↗</span></span></section>
    <section className={styles.directoryBody} aria-label="Bütün məqalələr"><div className={styles.directoryToolbar}><div><span className={styles.eyebrow}>OXUMAĞA BAŞLAYIN</span><h2>Bütün məqalələr <span className={styles.count}>{state.loading ? '…' : state.total}</span></h2></div><form className={styles.search} onSubmit={event => { event.preventDefault(); setSearch(query.trim()); setPage(1); }}><input aria-label="Məqalə axtar" placeholder="Maraqlandığınız mövzunu axtarın…" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} /><button type="submit" aria-label="Axtar">⌕</button></form></div>
      {search && <div className={styles.searchResult}>“{search}” üçün nəticələr <button onClick={() => { setSearch(''); setQuery(''); setPage(1); }}>Axtarışı təmizlə ×</button></div>}
      <ArticleResults state={state} />
      {state.total > 9 && <nav className={styles.pagination} aria-label="Məqalə səhifələri"><button disabled={page === 1 || state.loading} onClick={() => setPage(n => n - 1)}>← Əvvəlki</button><span>{page} / {Math.ceil(state.total / 9)}</span><button disabled={page >= Math.ceil(state.total / 9) || state.loading} onClick={() => setPage(n => n + 1)}>Növbəti →</button></nav>}
    </section><section className={styles.cta}><div><span className={styles.eyebrow}>İNDİ İSƏ HƏRƏKƏTƏ KEÇİN</span><h2>Yeni imkanınız sizi gözləyir.</h2><p>Öyrəndiklərinizi tətbiq edin, sizə uyğun vakansiyanı tapın.</p></div><Link href="/vakansiyalar">Vakansiyalara bax ↗</Link></section>
  </main>;
}

export function ShareArticle() {
  const [copied, setCopied] = useState('');
  return <button className={styles.share} onClick={async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied('Keçid kopyalandı ✓'); }
    catch { setCopied('Keçidi brauzerin ünvan sətrindən kopyalaya bilərsiniz.'); }
  }}><span aria-live="polite">{copied || 'Məqalənin keçidini kopyala ↗'}</span></button>;
}
