'use client';
import Link from 'next/link';
import styles from '../../_career/Career.module.css';
export default function ErrorPage({ reset }) { return <main className={styles.errorPage}><h1>Məqalə yüklənmədi</h1><p>Bir az sonra yenidən yoxlayın.</p><button onClick={reset}>Yenidən yoxla</button><p><Link href="/karyera-meslehetleri">Bütün məqalələrə qayıt →</Link></p></main>; }
