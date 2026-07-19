"use client";

import Link from "next/link";
import JobCard from "../../../components/JobCard";
import LocationPermissionPrompt from "../LocationPermissionPrompt";
import AuthSection from "../AuthSection";
import AppLaunchPanel from "../AppLaunchPanel";
import LiveStatsPanel from "../LiveStatsPanel";
import SponsoredJobCard from "../SponsoredJobCard";
import FloatingHomeWidgets from "../FloatingHomeWidgets";

export default function JobsSection({ ctx }) {
  const {
    styles,
    activeSection,
    jobsMode,
    setJobsMode,
    search,
    setSearch,
    city,
    setCity,
    cityOptions,
    loading,
    handleHeroSearchSubmit,
    homeFilterTabs,
    activeHomeFilterTab,
    setActiveHomeFilterTab,
    activeVacancyTypeOptions,
    jobType,
    setJobType,
    homeCategoryOptions,
    category,
    setCategory,
    activeJobLevelOptions,
    jobLevel,
    setJobLevel,
    activeSalaryRangeOptions,
    activeSalaryLabel,
    minWage,
    maxWage,
    setMinWage,
    setMaxWage,
    setAppliedFilters,
    refreshJobs,
    homeWidgets,
    locationPromptOpen,
    user,
    locationLoading,
    handleLocationActivation,
    setLocationPromptOpen,
    error,
    ok,
    supportModalOpen,
    closeSupportModal,
    supportMode,
    setSupportMode,
    setActiveTicketId,
    getTicketSubject,
    activeTicket,
    setTicketCategory,
    supportCategories,
    setTicketMessage,
    tickets,
    openTicketDetail,
    handleCreateTicket,
    ticketCategory,
    ticketMessage,
    getTicketMessages,
    ticketReply,
    setTicketReply,
    handleReply,
    handleDeleteTicket,
    siteStats,
    homeJobs,
    hasHomeJobs,
    latestJobsCarouselRef,
    scrollLatestJobs,
    sponsoredCard,
    recommendedCard,
    favoriteJobIds,
    handleToggleFavorite,
    openJobDetail,
    prefetchJobDetail,
    hasHomeMapJobs,
    homeMapJobs,
    focusedMapJobId,
    JobsMap,
    AppLaunchPanel,
    LiveStatsPanel,
    shownJobs,
    visibleShownJobs,
    hasMoreShownJobs,
    jobsLoadMoreRef,
    canCreateJob,
    editingJobId,
    title,
    setTitle,
    companyObject,
    setCompanyObject,
    vacancyStartDate,
    setVacancyStartDate,
    vacancyEndDate,
    setVacancyEndDate,
    contactVisibility,
    setContactVisibility,
    primaryContact,
    setPrimaryContact,
    wageMode,
    setWageMode,
    wageMin,
    setWageMin,
    wageMax,
    setWageMax,
    activeCreateSalaryLabel,
    description,
    setDescription,
    contactPhone,
    setContactPhone,
    whatsapp,
    setWhatsapp,
    contactEmail,
    setContactEmail,
    link,
    setLink,
    voen,
    setVoen,
    durationPreset,
    setDurationPreset,
    customDurationDays,
    setCustomDurationDays,
    workType,
    setWorkType,
    scheduleStart,
    setScheduleStart,
    scheduleEnd,
    setScheduleEnd,
    publishMode,
    setPublishMode,
    publishAt,
    setPublishAt,
    locationText,
    setLocationText,
    lat,
    setLat,
    lng,
    setLng,
    radiusM,
    setRadiusM,
    activeCreateFilterTab,
    setActiveCreateFilterTab,
    handleCreateJob,
    resetJobForm,
    LocationPicker,
    alerts,
    alertCategory,
    setAlertCategory,
    alertRadius,
    setAlertRadius,
    alertKeywords,
    setAlertKeywords,
    handleCreateAlert,
    handleDeleteAlert,
    notifications,
    unread,
    handleMarkAllRead,
    handleOpenNotification,
    formatNotificationTime,
    getNotificationTone,
    getNotificationJobId,
    getNotificationCreatedAt,
    roleName,
    navTitle,
    editingName,
    setEditingName,
    editingPhone,
    setEditingPhone,
    profileLogoPreview,
    setProfileLogoPreview,
    handleProfileLogoFileChange,
    handleProfileSave,
    handleDeleteAccount,
    myJobsStatus,
    setMyJobsStatus,
    profileJobs,
    formatProfileJobDate,
    getProfileJobLogo,
    getProfileJobCompany,
    startEditJob,
    handlePublishJob,
    handleCloseJob,
    handleReopenJob,
    handleDeleteJob,
    favoriteJobs,
    roleSwitchStatus,
    handleRoleSwitch,
    nextRoleLabel,
    switchCompany,
    setSwitchCompany,
    switchVoen,
    setSwitchVoen,
    setRoleSwitchConfirmOpen,
    terms,
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    confirmPassword,
    setConfirmPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    fullName,
    setFullName,
    companyName,
    setCompanyName,
    registerLogoPreview,
    setRegisterLogoPreview,
    handleRegisterLogoFileChange,
    phone,
    setPhone,
    role,
    setRole,
    registerCategory,
    setRegisterCategory,
    categories,
    otp,
    setOtp,
    forgotEmail,
    setForgotEmail,
    resetCode,
    setResetCode,
    resetPassword,
    setResetPassword,
    showResetPassword,
    setShowResetPassword,
    handleLogin,
    handleRegister,
    handleVerifyOtp,
    handleForgotPassword,
    handleResetPassword,
    setActiveSection,
    roleSwitchConfirmOpen,
    confirmRoleSwitchRequest
  } = ctx;

  return (
    <>
      {activeSection === "jobs" ? (
        <section className="container page-section">
          <header className="mobile-web-head">
            <div>
              <span className="mobile-web-kicker">Asimos</span>
              <h2>{jobsMode === "daily" ? "Gündəlik işlər" : "İş elanları"}</h2>
              <p>{jobsMode === "daily" ? "Yalnız müvəqqəti və günlük elanlar" : "Mobil tətbiqdəki elanlar axınına uyğun axtarış"}</p>
            </div>
          </header>

          <div className="segmented-tabs">
            <button type="button" className={jobsMode === "all" ? "active" : ""} onClick={() => setJobsMode("all")}>
              Elanlar
            </button>
            <button type="button" className={jobsMode === "daily" ? "active" : ""} onClick={() => setJobsMode("daily")}>
              Gündəlik
            </button>
          </div>

          <form className={`${styles.homeFilterCard} ${styles.compactSearchFilter}`} onSubmit={(e) => {
            e.preventDefault();
            const nextFilters = { search, category, city, jobType, jobLevel, minWage, maxWage };
            setAppliedFilters(nextFilters);
            refreshJobs(nextFilters);
          }}>
            <div className={styles.homeFilterTitle}>
              <span className={styles.homeFilterTitleIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </span>
              <h1>İş axtarışı</h1>
            </div>

            <div className={styles.homeFilterSearchRow}>
              <label className={styles.homeFilterInputWrap}>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Vakansiya adı və ya açar söz" />
              </label>

              <label className={styles.homeFilterSelectWrap}>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Şəhəri seç">
                  <option value="">Şəhəri seç</option>
                  {cityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <button type="submit" className={styles.homeFilterSubmit} disabled={loading} aria-label="Axtar">
                <svg className={styles.homeFilterSubmitIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <span className={styles.homeFilterSubmitText}>{loading ? "Axtarılır..." : "Axtar"}</span>
              </button>

              <label className={styles.mobileFilterButton} htmlFor="jobs-filter-toggle" aria-label="Filterləri göstər">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 6h16" strokeLinecap="round" />
                  <path d="M7 12h10" strokeLinecap="round" />
                  <path d="M10 18h4" strokeLinecap="round" />
                </svg>
                <span>Filter</span>
              </label>
            </div>

            <input id="jobs-filter-toggle" className={styles.mobileFilterCheckbox} type="checkbox" />

            <div className={styles.homeFilterTabs} role="tablist" aria-label="Elan filterləri">
              {homeFilterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeHomeFilterTab === tab.key ? styles.homeFilterTabActive : styles.homeFilterTab}
                  onClick={() => setActiveHomeFilterTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.homeFilterOptions}>
              {activeHomeFilterTab === "type" ? activeVacancyTypeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={jobType === item.value ? styles.homeFilterOptionActive : styles.homeFilterOption}
                  onClick={() => setJobType((current) => current === item.value ? "" : item.value)}
                >
                  {item.label}
                </button>
              )) : null}

              {activeHomeFilterTab === "category" ? (homeCategoryOptions.length ? homeCategoryOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={category === item ? styles.homeFilterOptionActive : styles.homeFilterOption}
                  onClick={() => setCategory((current) => current === item ? "" : item)}
                >
                  {item}
                </button>
              )) : <p className={styles.homeFilterEmpty}>Kateqoriyalar yüklənir...</p>) : null}

              {activeHomeFilterTab === "level" ? activeJobLevelOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={jobLevel === item.value ? styles.homeFilterOptionActive : styles.homeFilterOption}
                  onClick={() => setJobLevel((current) => current === item.value ? "" : item.value)}
                >
                  {item.label}
                </button>
              )) : null}

              {activeHomeFilterTab === "salary" ? (
                <>
                  {activeSalaryRangeOptions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={activeSalaryLabel === item.label ? styles.homeFilterOptionActive : styles.homeFilterOption}
                      onClick={() => {
                        const same = minWage === item.min && maxWage === item.max;
                        setMinWage(same ? "" : item.min);
                        setMaxWage(same ? "" : item.max);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                  <input
                    className={styles.homeFilterOption}
                    style={{ textAlign: "left", cursor: "text" }}
                    value={minWage}
                    onChange={(e) => setMinWage(e.target.value)}
                    inputMode="numeric"
                    placeholder="Min maaş: məsələn 400"
                  />
                  <input
                    className={styles.homeFilterOption}
                    style={{ textAlign: "left", cursor: "text" }}
                    value={maxWage}
                    onChange={(e) => setMaxWage(e.target.value)}
                    inputMode="numeric"
                    placeholder="Max maaş: məsələn 1200"
                  />
                </>
              ) : null}
            </div>

            <div className={styles.homeFilterFooter}>
              <button
                type="button"
                className={styles.homeFilterReset}
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setCity("");
                  setJobType("");
                  setJobLevel("");
                  setMinWage("");
                  setMaxWage("");
                  setRadiusM("0");
                  const emptyFilters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "" };
                  setAppliedFilters(emptyFilters);
                  refreshJobs(emptyFilters);
                }}
              >
                Sıfırla
              </button>
            </div>
          </form>

          <div className="mobile-job-list">
            {sponsoredCard ? <SponsoredJobCard card={sponsoredCard} /> : null}
            {visibleShownJobs.slice(0, 4).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => openJobDetail(job.id)}
                onPrefetch={() => prefetchJobDetail(job.id)}
                showEdit={(job?.createdBy || job?.created_by) === user?.id}
                onEdit={() => startEditJob(job)}
                isFavorite={favoriteJobIds.has(String(job.id))}
                onToggleFavorite={(event) => handleToggleFavorite(job, event)}
              />
            ))}
            {recommendedCard ? <SponsoredJobCard card={recommendedCard} /> : null}
            {visibleShownJobs.slice(4).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => openJobDetail(job.id)}
                onPrefetch={() => prefetchJobDetail(job.id)}
                showEdit={(job?.createdBy || job?.created_by) === user?.id}
                onEdit={() => startEditJob(job)}
                isFavorite={favoriteJobIds.has(String(job.id))}
                onToggleFavorite={(event) => handleToggleFavorite(job, event)}
              />
            ))}
          </div>

          {hasMoreShownJobs ? (
            <div className="jobs-lazy-load" ref={jobsLoadMoreRef}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setJobsVisibleCount((current) => Math.min(current + 10, shownJobs.length))}
              >
                Daha 10 elan göstər
              </button>
              <span>{visibleShownJobs.length} / {shownJobs.length}</span>
            </div>
          ) : shownJobs.length > 10 ? (
            <div className="jobs-lazy-load completed">Bütün elanlar göstərildi</div>
          ) : null}

          {shownJobs.length === 0 && !sponsoredCard && !recommendedCard ? (
            <div className="empty-state-card">
              <strong>Elan tapılmadı</strong>
              <p>Seçilən filterlərə uyğun elan yoxdur. Filterləri sıfırlayıb bütün elanlara baxa bilərsiniz.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setCity("");
                  setJobType("");
                  setJobLevel("");
                  setMinWage("");
                  setMaxWage("");
                  setJobsMode("all");
                  const emptyFilters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "" };
                  setAppliedFilters(emptyFilters);
                  refreshJobs(emptyFilters);
                }}
              >
                Bütün elanları göstər
              </button>
            </div>
          ) : null}

        </section>
      ) : null}

    </>
  );
}
