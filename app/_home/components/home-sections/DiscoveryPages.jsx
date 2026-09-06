"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../../../../lib/api";

const advice = [
  ["Müsahibə", "Müsahibəyə necə hazırlaşmalı?", "İlk təəssüratdan düzgün cavablara qədər uğurlu müsahibənin əsas mərhələləri.", "5 dəq"],
  ["CV", "İşəgötürənin diqqətini çəkən CV", "Təcrübənizi aydın göstərən, qısa və nəticəyönümlü CV hazırlamaq üçün praktiki bələdçi.", "7 dəq"],
  ["Karyera", "Doğru vakansiyanı necə seçməli?", "Maaşdan əlavə iş mühiti, inkişaf imkanı və lokasiyanı düzgün qiymətləndirin.", "4 dəq"],
  ["İş axtarışı", "Vakansiyaya müraciətdə 7 səhv", "Namizədlərin tez-tez etdiyi səhvləri tanıyın və müraciətinizi daha güclü edin.", "6 dəq"],
  ["Uzaqdan iş", "Remote işdə məhsuldarlıq", "Vaxt bölgüsü, fokus və komanda əlaqəsini qorumaq üçün işlək üsullar.", "5 dəq"],
  ["İnkişaf", "Yeni bacarıqları necə seçməli?", "Bazar tələblərini izləyərək karyeranıza ən çox fayda verən bacarıqlara fokuslanın.", "8 dəq"],
];

function companyName(job) { return job?.companyName || job?.company_name || job?.company || "Asimos şirkəti"; }
function companyLogo(job) { return job?.companyLogo || job?.company_logo || job?.logoUrl || job?.logo_url || ""; }

export default function DiscoveryPages({ ctx }) {
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyData, setCompanyData] = useState({ items: [], total: 0 });
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  useEffect(() => {
    if (ctx.activeSection !== "companies") return undefined;
    let active = true;
    setCompaniesLoading(true);
    setCompaniesError("");
    api.listCompanies({ limit: 100 })
      .then((data) => {
        if (active) setCompanyData({ items: data?.items || [], total: data?.total || 0 });
      })
      .catch((error) => {
        if (active) setCompaniesError(error?.message || "Şirkətlər yüklənmədi");
      })
      .finally(() => {
        if (active) setCompaniesLoading(false);
      });
    return () => { active = false; };
  }, [ctx.activeSection]);

  const companies = useMemo(() => {
    const query = companyQuery.trim().toLocaleLowerCase("az");
    if (!query) return companyData.items;
    return companyData.items.filter((company) => [companyName(company), company.category, company.location?.address]
      .filter(Boolean).join(" ").toLocaleLowerCase("az").includes(query));
  }, [companyData.items, companyQuery]);

  if (ctx.activeSection === "companies") return (
    <main className="discovery-page">
      <section className="discovery-hero"><span>Şirkətlər</span><h1>Doğru şirkəti kəşf et</h1><p>Azərbaycanda aktiv vakansiya paylaşan şirkətləri araşdırın və sizə uyğun iş imkanlarını görün.</p><div className="discovery-search"><span>⌕</span><input value={companyQuery} onChange={(event) => setCompanyQuery(event.target.value)} placeholder="Şirkət adı və ya sahə üzrə axtar" /><button onClick={() => ctx.setActiveSection("jobs")}>Vakansiyalara bax</button></div></section>
      <section className="discovery-shell"><div className="discovery-heading"><div><small>Real işəgötürənlər</small><h2>Platformadakı şirkətlər</h2></div><span>{companyQuery ? companies.length : companyData.total} şirkət</span></div><div className="company-directory">{companies.length ? companies.map((job) => { const name=companyName(job); const count=Number(job.activeJobs || 0); const logo=companyLogo(job); return <article className="company-directory-card" key={job.id || name}><div className="company-directory-logo">{logo?<img src={logo} alt=""/>:name.charAt(0)}</div>{job.verified ? <span className="company-verified">✓ Təsdiqlənib</span> : null}<h3>{name}</h3><p>{job.category || "Müxtəlif sahələr"}</p><div><span>▣ {count} aktiv vakansiya</span><span>⌖ {job?.location?.address || job?.location?.city || job?.city || "Azərbaycan"}</span></div><Link className="company-directory-action" href={`/sirketler/${encodeURIComponent(String(job.id))}`}>Vakansiyalara bax →</Link></article>; }) : <div className="discovery-empty"><b>{companiesLoading ? "Şirkətlər yüklənir" : companiesError ? "Şirkətləri yükləmək mümkün olmadı" : "Şirkət tapılmadı"}</b><p>{companiesError || (companyQuery ? "Axtarış sözünü dəyişərək yenidən yoxlayın." : "İşəgötürənlər burada görünəcək.")}</p></div>}</div></section>
      <section className="discovery-cta"><div><small>İşəgötürənsiniz?</small><h2>Şirkətinizi minlərlə namizədə tanıdın</h2><p>Vakansiyanızı yerləşdirin, yaxınlıqdakı uyğun namizədlərə daha tez çatın.</p></div><button onClick={() => ctx.setActiveSection(ctx.canCreateJob ? "create" : "auth")}>Elan yerləşdir →</button></section>
    </main>
  );

  if (ctx.activeSection === "career") return (
    <main className="discovery-page">
      <section className="discovery-hero career-hero"><span>Karyera mərkəzi</span><h1>Karyeranı inamla qur</h1><p>İş axtarışından müsahibəyə, CV-dən peşəkar inkişafa qədər ehtiyacınız olan praktik məsləhətlər.</p></section>
      <section className="discovery-shell"><div className="featured-advice"><div><span>Seçilmiş məqalə</span><h2>İş axtarışını sistemli aparmağın 6 addımı</h2><p>Məqsədinizi müəyyənləşdirin, profilinizi tamamlayın və uyğun vakansiyalara daha effektiv müraciət edin.</p><button>Oxumağa başla →</button></div><div className="featured-advice-art"><i>✓</i><b>Planla</b><i>⌕</i><b>Axtar</b><i>↗</i><b>Müraciət et</b></div></div><div className="discovery-heading"><div><small>Faydalı materiallar</small><h2>Karyera məsləhətləri</h2></div></div><div className="advice-directory">{advice.map(([tag,title,text,time], index)=><article key={title}><div className={`advice-visual visual-${index%3}`}><span>{index%3===0?"◎":index%3===1?"▤":"↗"}</span></div><div><small>{tag}</small><h3>{title}</h3><p>{text}</p><footer><span>{time} oxu</span><button aria-label={`${title} məqaləsini aç`}>→</button></footer></div></article>)}</div></section>
      <section className="discovery-newsletter"><div><small>Yeniliklərdən xəbərdar olun</small><h2>Yeni vakansiyalar və məsləhətlər e-poçtunuza gəlsin</h2></div><form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="E-poçt ünvanınız"/><button type="submit">Abunə ol</button></form></section>
    </main>
  );

  if (ctx.activeSection !== "about") return null;
  return (
    <main className="discovery-page">
      <section className="discovery-hero about-hero"><span>Asimos haqqında</span><h1>Doğru iş, doğru yer</h1><p>İnsanları yaxınlıqdakı real iş imkanları ilə birləşdirən, sadə və etibarlı karyera platformasıyıq.</p></section>
      <section className="discovery-shell about-story"><div><small>Bizim hekayəmiz</small><h2>İş axtarışını daha yaxın və daha insani edirik</h2><p>Asimos iş axtaranlarla etibarlı işəgötürənləri lokasiya əsaslı texnologiya vasitəsilə bir araya gətirir. Məqsədimiz uyğun vakansiyanı tapmaq üçün sərf olunan vaxtı azaltmaq və hər kəs üçün şəffaf iş bazarı yaratmaqdır.</p><p>Platformamız daimi, gündəlik, part-time və uzaqdan iş imkanlarını vahid, istifadəsi rahat təcrübədə təqdim edir.</p></div><div className="about-orbit"><span>⌖</span><b>Yaxınlıqdakı imkanlar</b><i>Asimos</i></div></section>
      <section className="discovery-values"><article><span>◎</span><h3>Missiyamız</h3><p>Hər kəsin yaşadığı yerə və bacarıqlarına uyğun iş imkanına rahat çatmasını təmin etmək.</p></article><article><span>◉</span><h3>Vizyonumuz</h3><p>Azərbaycanın ən etibarlı və lokasiya əsaslı aparıcı karyera platformasına çevrilmək.</p></article><article><span>♢</span><h3>Dəyərlərimiz</h3><p>Şəffaflıq, təhlükəsizlik, bərabər imkan və istifadəçiyə real fayda verən sadəlik.</p></article></section>
      <section className="discovery-trust"><div><small>Niyə Asimos?</small><h2>Təhlükəsiz və ağıllı iş axtarışı</h2></div><ul><li><b>✓</b><span><strong>Təsdiqlənmiş şirkətlər</strong><small>İşəgötürən məlumatları nəzarətdən keçirilir.</small></span></li><li><b>✓</b><span><strong>Lokasiya əsaslı nəticələr</strong><small>Ən yaxın vakansiyaları məsafəyə görə kəşf edin.</small></span></li><li><b>✓</b><span><strong>Məlumatların qorunması</strong><small>Şəxsi məlumatlarınız təhlükəsiz saxlanılır.</small></span></li><li><b>✓</b><span><strong>İstifadəçi dəstəyi</strong><small>Sual və problemləriniz üçün yanınızdayıq.</small></span></li></ul></section>
      <section className="discovery-cta"><div><small>Başlamağa hazırsınız?</small><h2>Sizə uyğun işi bu gün kəşf edin</h2><p>Yaxınlıqdakı aktiv vakansiyalara baxın və bir addım daha irəli gedin.</p></div><button onClick={() => ctx.setActiveSection("jobs")}>Vakansiyalara bax →</button></section>
    </main>
  );
}
