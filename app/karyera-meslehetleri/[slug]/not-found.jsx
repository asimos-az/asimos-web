import Link from 'next/link';
import styles from '../../_career/Career.module.css';
export default function NotFound() { return <main className={styles.errorPage}><h1>Məqalə tapılmadı</h1><p>Bu məqalə silinib və ya hələ yayımlanmayıb.</p><Link href="/karyera-meslehetleri">Bütün məqalələrə qayıt →</Link></main>; }
