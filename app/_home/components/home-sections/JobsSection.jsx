"use client";
import JobCard from "../../../components/JobCard";
import { LocationOnOutlined, SearchRounded } from "@mui/icons-material";
import pageStyles from "./JobsSection.module.css";

const radiusOptions = [1000, 3000, 5000, 10000, 25000];

export default function JobsSection({ ctx }) {
  const { activeSection, jobsMode, setJobsMode, search, setSearch, city, setCity, cityOptions, loading, category, setCategory, homeCategoryOptions, jobType, setJobType, jobLevel, setJobLevel, minWage, setMinWage, maxWage, setMaxWage, setAppliedFilters, refreshJobs, shownJobs, visibleShownJobs, hasMoreShownJobs, jobsLoadMoreRef, user, favoriteJobIds, handleToggleFavorite, openJobDetail, prefetchJobDetail, startEditJob, focusedMapJobId, setFocusedMapJobId, JobsMap, effectiveLocation, homeRadiusM, handleHomeRadiusChange } = ctx;
  if (activeSection !== "jobs") return null;

  const runSearch = async (event) => {
    event?.preventDefault?.();
    const filters = { search, category, city, jobType, jobLevel, minWage, maxWage, radiusM: homeRadiusM };
    setAppliedFilters(filters);
    await refreshJobs(filters);
  };
  const resetFilters = async () => {
    setSearch(""); setCategory(""); setCity(""); setJobType(""); setJobLevel(""); setMinWage(""); setMaxWage("");
    const filters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "", radiusM: homeRadiusM };
    setAppliedFilters(filters);
    await refreshJobs(filters);
  };
  const activeFilters = [city && { label: city, clear: () => setCity("") }, category && { label: category, clear: () => setCategory("") }, jobType && { label: jobType, clear: () => setJobType("") }, jobLevel && { label: jobLevel, clear: () => setJobLevel("") }, minWage && { label: `${minWage} AZN-dən`, clear: () => setMinWage("") }, maxWage && { label: `${maxWage} AZN-dək`, clear: () => setMaxWage("") }].filter(Boolean);

  return <main className={pageStyles.page}>
    <div className={pageStyles.breadcrumb}>Ana səhifə <span>/</span> Vakansiyalar</div>
    <header className={pageStyles.heading}><div><h1>Vakansiyalar</h1><p>{city || "Azərbaycanda"}, {Number(homeRadiusM) / 1000} km radiusda <strong>{shownJobs.length}</strong> vakansiya</p></div><div className={pageStyles.modeTabs}><button className={jobsMode === "all" ? pageStyles.active : ""} onClick={() => setJobsMode("all")}>Bütün elanlar</button><button className={jobsMode === "daily" ? pageStyles.active : ""} onClick={() => setJobsMode("daily")}>Gündəlik</button></div></header>
    <section className={pageStyles.filterCard} aria-label="Vakansiya filterləri">
      <form className={pageStyles.primaryFilters} onSubmit={runSearch}>
        <label className={pageStyles.searchField}><SearchRounded aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Vəzifə, şirkət və ya açar söz" aria-label="Vakansiya axtar" /></label>
        <label className={pageStyles.selectField}><LocationOnOutlined aria-hidden="true" /><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Şəhər, rayon və ya metro"><option value="">Şəhər, rayon və ya metro</option>{cityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button className={pageStyles.searchButton} disabled={loading} type="submit"><SearchRounded aria-hidden="true" />{loading ? "Axtarılır..." : "Axtar"}</button>
        <div className={pageStyles.radius} role="group" aria-label="Axtarış radiusu"><span>Radius</span>{radiusOptions.map((radius) => <button type="button" key={radius} className={Number(homeRadiusM) === radius ? pageStyles.selectedRadius : ""} onClick={() => handleHomeRadiusChange(String(radius))}>{radius / 1000} km</button>)}</div>
      </form>
      <div className={pageStyles.secondaryFilters}>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Kateqoriya"><option value="">Kateqoriya</option>{homeCategoryOptions.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={jobType} onChange={(event) => setJobType(event.target.value)} aria-label="İş formatı"><option value="">İş formatı</option><option value="permanent">Tam ştat</option><option value="part-time">Part-time</option><option value="remote">Uzaqdan</option><option value="temporary">Müvəqqəti</option></select>
        <select value={jobLevel} onChange={(event) => setJobLevel(event.target.value)} aria-label="Təcrübə"><option value="">Təcrübə</option><option value="entry">Təcrübəsiz</option><option value="junior">Junior</option><option value="middle">Middle</option><option value="senior">Senior</option></select>
        <input value={minWage} onChange={(event) => setMinWage(event.target.value)} inputMode="numeric" placeholder="Min. maaş" aria-label="Minimum maaş" /><input value={maxWage} onChange={(event) => setMaxWage(event.target.value)} inputMode="numeric" placeholder="Maks. maaş" aria-label="Maksimum maaş" /><button type="button" onClick={runSearch}>Tətbiq et</button>
      </div>
      <div className={pageStyles.filterFooter}><div className={pageStyles.activeChips}>{activeFilters.map((filter) => <button type="button" key={filter.label} onClick={filter.clear}>{filter.label} <span>×</span></button>)}{activeFilters.length ? <button type="button" className={pageStyles.reset} onClick={resetFilters}>Filterləri sıfırla</button> : <span>Uyğun vakansiyaları siyahı və xəritədə müqayisə edin</span>}</div><strong>{shownJobs.length} nəticə</strong></div>
    </section>
    <section className={pageStyles.explorer}>
      <div className={pageStyles.results} aria-live="polite">{visibleShownJobs.map((job) => <div key={job.id} onMouseEnter={() => setFocusedMapJobId(job.id)} onFocus={() => setFocusedMapJobId(job.id)}><JobCard job={job} onClick={() => openJobDetail(job.id)} onPrefetch={() => prefetchJobDetail(job.id)} showEdit={(job?.createdBy || job?.created_by) === user?.id} onEdit={() => startEditJob(job)} isFavorite={favoriteJobIds.has(String(job.id))} onToggleFavorite={(event) => handleToggleFavorite(job, event)} /></div>)}{!shownJobs.length && !loading ? <div className={pageStyles.empty}><SearchRounded aria-hidden="true" /><h2>Uyğun vakansiya tapılmadı</h2><p>Radiusu artırın və ya filterləri sıfırlayıb yenidən axtarın.</p><button onClick={resetFilters}>Bütün elanları göstər</button></div> : null}{hasMoreShownJobs ? <div ref={jobsLoadMoreRef} className={pageStyles.loadingMore}>Daha çox vakansiya yüklənir...</div> : null}</div>
      <aside className={pageStyles.mapPanel}><JobsMap jobs={shownJobs} focusedJobId={focusedMapJobId} userLocation={effectiveLocation} radiusM={Number(homeRadiusM)} /></aside>
    </section>
  </main>;
}
