"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "../../_home/components/redesign/HomepageRedesign";
import JobCard from "../../components/JobCard";
import { getRouteForSection } from "../../_home/sectionRoutes";
import { api } from "../../../lib/api";
import { loadAuth } from "../../../lib/auth-store";
import "./company-profile.css";

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  return ["employer", "isci axtaran", "satici", "hirer", "company"].includes(value) ? "employer" : value;
}

function jobTypeValue(job) {
  if (job?.isDaily || job?.is_daily) return "daily";
  return String(job?.jobType || job?.job_type || "other").toLowerCase();
}

export default function CompanyProfileClient() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    setUser(loadAuth()?.user || null);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.getCompany(params?.id)
      .then((data) => {
        if (!active) return;
        setCompany(data?.company || null);
        setJobs((data?.jobs || []).map((job) => ({ ...job, logoUrl: job.logoUrl || data?.company?.logoUrl || "" })));
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || "Şirkət tapılmadı");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [params?.id]);

  const categories = useMemo(() => Array.from(new Set(jobs.map((job) => job.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "az")), [jobs]);

  const visibleJobs = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("az");
    return jobs
      .filter((job) => !term || [job.title, job.category, job.description, job.wage].filter(Boolean).join(" ").toLocaleLowerCase("az").includes(term))
      .filter((job) => category === "all" || job.category === category)
      .filter((job) => jobType === "all" || jobTypeValue(job) === jobType)
      .sort((a, b) => {
        const left = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const right = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return sort === "oldest" ? left - right : right - left;
      });
  }, [jobs, search, category, jobType, sort]);

  const canCreateJob = normalizeRole(user?.role) === "employer";
  const goToSection = (section) => router.push(getRouteForSection(section));
  const location = company?.location?.address || company?.location?.city || "Azərbaycan";
  const logo = company?.logoUrl || "";

  return (
    <main className="site-shell company-profile-page">
      <AppHeader ctx={{ activeSection: "companies", setActiveSection: goToSection, user, canCreateJob }} />
      <div className="company-profile-wrap">
        <nav className="company-breadcrumb" aria-label="Naviqasiya">
          <Link href="/">Ana səhifə</Link><span>/</span><Link href="/sirketler">Şirkətlər</Link>{company ? <><span>/</span><b>{company.companyName}</b></> : null}
        </nav>

        {loading ? <section className="company-profile-state">Şirkət profili yüklənir...</section> : null}
        {!loading && error ? <section className="company-profile-state company-profile-error"><h1>Şirkət tapılmadı</h1><p>{error}</p><Link href="/sirketler">Şirkətlərə qayıt</Link></section> : null}

        {!loading && company ? <>
          <section className="company-profile-hero">
            <div className="company-profile-logo">{logo ? <Image src={logo} alt={`${company.companyName} loqosu`} width={112} height={112} unoptimized /> : <span>{company.companyName?.charAt(0)}</span>}</div>
            <div className="company-profile-title"><div>{company.verified ? <span>✓ Təsdiqlənmiş şirkət</span> : <span>Şirkət profili</span>}<small>{company.category}</small></div><h1>{company.companyName}</h1><p>⌖ {location}</p></div>
            <div className="company-profile-stat"><strong>{company.activeJobs || 0}</strong><span>aktiv vakansiya</span></div>
          </section>

          <section className="company-jobs-section">
            <header><div><small>İŞ İMKANLARI</small><h2>{company.companyName} vakansiyaları</h2><p>Şirkətə məxsus aktiv elanları axtarın və filtrləyin.</p></div><span>{visibleJobs.length} nəticə</span></header>
            <div className="company-job-filters">
              <label className="company-filter-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Vəzifə və ya açar söz" /></label>
              <label><span>Kateqoriya</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Bütün kateqoriyalar</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label><span>İş formatı</span><select value={jobType} onChange={(event) => setJobType(event.target.value)}><option value="all">Bütün formatlar</option><option value="permanent">Daimi</option><option value="temporary">Müvəqqəti</option><option value="daily">Gündəlik</option><option value="remote">Uzaqdan</option></select></label>
              <label><span>Sıralama</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Ən yeni</option><option value="oldest">Ən köhnə</option></select></label>
              <button type="button" onClick={() => { setSearch(""); setCategory("all"); setJobType("all"); setSort("newest"); }}>Filtrləri sıfırla</button>
            </div>
            <div className="company-jobs-grid">{visibleJobs.map((job) => <JobCard key={job.id} job={job} />)}{!visibleJobs.length ? <div className="company-jobs-empty"><b>Uyğun aktiv vakansiya tapılmadı</b><p>Filtrləri dəyişin və ya daha sonra yenidən yoxlayın.</p></div> : null}</div>
          </section>
        </> : null}
      </div>
    </main>
  );
}
