"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SearchRounded from "@mui/icons-material/SearchRounded";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import { AppHeader } from "../../_home/components/redesign/HomepageRedesign";
import JobCard from "../../components/JobCard";
import { getRouteForSection } from "../../_home/sectionRoutes";
import { api } from "../../../lib/api";
import { loadAuth } from "../../../lib/auth-store";
import { useI18n } from "../../../lib/i18n";
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
  const { t, tv } = useI18n();

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
          <Link href="/">{t("home")}</Link><span>/</span><Link href="/sirketler">{t("nav_companies")}</Link>{company ? <><span>/</span><b>{company.companyName}</b></> : null}
        </nav>

        {loading ? <section className="company-profile-state">{t("loading_company")}</section> : null}
        {!loading && error ? <section className="company-profile-state company-profile-error"><h1>{t("company_not_found")}</h1><p>{error}</p><Link href="/sirketler">{t("back_companies")}</Link></section> : null}

        {!loading && company ? <>
          <section className="company-profile-hero">
            <div className="company-profile-logo">{logo ? <Image src={logo} alt={`${company.companyName} loqosu`} width={112} height={112} unoptimized /> : <span>{company.companyName?.charAt(0)}</span>}</div>
            <div className="company-profile-title"><div>{company.verified ? <span>✓ {t("verified_company")}</span> : <span>{t("company_profile")}</span>}<small>{tv(company.category)}</small></div><h1>{company.companyName}</h1><p>⌖ {location}</p></div>
            <div className="company-profile-stat"><strong>{company.activeJobs || 0}</strong><span>{t("active_vacancy")}</span></div>
          </section>

          <section className="company-jobs-section">
            <header><div><small>{t("opportunities").toLocaleUpperCase()}</small><h2>{t("company_vacancies", { company: company.companyName })}</h2><p>{t("company_jobs_help")}</p></div><span>{t("result", { count: visibleJobs.length })}</span></header>
            <div className="company-job-filters">
              <label className="company-filter-search"><span><SearchRounded /></span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("search_job")} /></label>
              <label><span>{t("category")}</span><div className="company-select-wrap"><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">{t("all_categories")}</option>{categories.map((item) => <option key={item} value={item}>{tv(item)}</option>)}</select><KeyboardArrowDownRounded /></div></label>
              <label><span>{t("work_format")}</span><div className="company-select-wrap"><select value={jobType} onChange={(event) => setJobType(event.target.value)}><option value="all">{t("all_formats")}</option><option value="permanent">{t("permanent")}</option><option value="temporary">{t("temporary")}</option><option value="daily">{t("daily")}</option><option value="remote">{t("remote")}</option></select><KeyboardArrowDownRounded /></div></label>
              <label><span>{t("sort")}</span><div className="company-select-wrap"><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">{t("newest")}</option><option value="oldest">{t("oldest")}</option></select><KeyboardArrowDownRounded /></div></label>
              <button type="button" onClick={() => { setSearch(""); setCategory("all"); setJobType("all"); setSort("newest"); }}>{t("reset_filters")}</button>
            </div>
            <div className="company-jobs-grid">{visibleJobs.map((job) => <JobCard key={job.id} job={{ ...job, category: tv(job.category) }} />)}{!visibleJobs.length ? <div className="company-jobs-empty"><b>{t("no_jobs")}</b><p>{t("no_jobs_help")}</p></div> : null}</div>
          </section>
        </> : null}
      </div>
    </main>
  );
}
