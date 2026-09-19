import { cache } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { articleBlocks, articleHref, fetchCareer } from '../../../lib/career';
import ArticleContent from '../../_career/ArticleContent';
import { ArticleCover, CareerPreview, ShareArticle } from '../../_career/CareerArticles';
import styles from '../../_career/Career.module.css';

export const dynamic = 'force-dynamic';
const getArticle = cache(slug => fetchCareer(`/${encodeURIComponent(slug)}`));

export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Məqalə tapılmadı', robots: { index: false } };
  return { title: article.title, description: article.excerpt, alternates: { canonical: articleHref(article) },
    openGraph: { type: 'article', title: article.title, description: article.excerpt, url: articleHref(article),
      publishedTime: article.published_at, modifiedTime: article.updated_at, ...(article.cover_url ? { images: [article.cover_url] } : {}) } };
}

export default async function ArticlePage({ params }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();
  const headings = articleBlocks(article.body).filter(block => block.type === 'heading');
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.excerpt,
    datePublished: article.published_at, dateModified: article.updated_at, author: { '@type': 'Person', name: article.author },
    mainEntityOfPage: `https://asimos.az${articleHref(article)}`, ...(article.cover_url ? { image: article.cover_url } : {}) };
  return <main data-no-translate lang="az" className={styles.directory}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <nav className={styles.articleNav} aria-label="Əsas menyu"><Link className={styles.brand} href="/"><Image src="/logo.svg" alt="Asimos" width={150} height={40} priority /></Link><Link className={styles.jobsLink} href="/vakansiyalar">İş elanları ↗</Link></nav>
    <article><header className={styles.articleHeader}><Link href="/karyera-meslehetleri" className={styles.breadcrumb}>← Bütün məqalələrə qayıt</Link><span className={styles.eyebrow}>{article.category}</span><h1>{article.title}</h1><p>{article.excerpt}</p><div className={styles.articleMeta}><span>{article.author}</span><span>·</span><time dateTime={article.published_at}>{new Intl.DateTimeFormat('az-AZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Baku' }).format(new Date(article.published_at))}</time><span>·</span><span>{article.reading_minutes} dəq oxu</span></div></header>
      <div className={styles.detailCover}><ArticleCover article={article} large /></div><div className={styles.articleLayout}><aside className={styles.toc}>{headings.length > 0 && <><b>BU MƏQALƏDƏ</b>{headings.map(heading => <a key={heading.id} href={`#${heading.id}`}>{heading.text}</a>)}</>}</aside><div><ArticleContent body={article.body} /><div className={styles.articleEnd}><ShareArticle /></div></div></div>
    </article><CareerPreview excludeSlug={article.slug} />
  </main>;
}
