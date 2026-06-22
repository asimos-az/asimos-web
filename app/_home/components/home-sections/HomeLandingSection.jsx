"use client";

import Link from "next/link";
import JobCard from "../../../components/JobCard";
import LocationPermissionPrompt from "../LocationPermissionPrompt";
import AuthSection from "../AuthSection";
import AppLaunchPanel from "../AppLaunchPanel";
import LiveStatsPanel from "../LiveStatsPanel";
import SponsoredJobCard from "../SponsoredJobCard";
import FloatingHomeWidgets from "../FloatingHomeWidgets";

export default function HomeLandingSection({ ctx }) {
  const {
    styles,
    activeSection,
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
    effectiveLocation,
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
      {activeSection === "home" ? (
        <>


          {hasHomeJobs || sponsoredCard || recommendedCard ? (
            <section className="container page-section">
              <header className={`section-head ${styles.latestJobsHead}`}>
                <div>
                  <span className={styles.latestJobsKicker}>Yeni imkanlar</span>
                  <h2>Son elanlar</h2>
                  <p>Ən son əlavə edilən elanları buradan izləyə bilərsən.</p>
                </div>
                <div className={styles.latestJobsActions}>
                  {homeJobs.length > 8 ? (
                    <button
                      type="button"
                      className={styles.latestJobsMoreButton}
                      onClick={() => {
                        setJobsMode("all");
                        setFocusedMapJobId(null);
                        setActiveSection("jobs");
                        window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                      }}
                    >
                      Hamısına bax
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : null}
                </div>
              </header>
              <div className={styles.latestJobsGridList}>
                {sponsoredCard ? (
                  <div className={styles.latestJobsGridItem} key="sponsored-card">
                    <SponsoredJobCard card={sponsoredCard} />
                  </div>
                ) : null}
                {homeJobs.slice(0, 4).map((job) => (
                  <div className={styles.latestJobsGridItem} key={job.id}>
                    <JobCard
                      job={job}
                      onClick={() => openJobDetail(job.id)}
                      onPrefetch={() => prefetchJobDetail(job.id)}
                      isFavorite={favoriteJobIds.has(String(job.id))}
                      onToggleFavorite={(event) => handleToggleFavorite(job, event)}
                    />
                  </div>
                ))}
                {recommendedCard ? (
                  <div className={styles.latestJobsGridItem} key="recommended-card">
                    <SponsoredJobCard card={recommendedCard} />
                  </div>
                ) : null}
                {homeJobs.slice(4, 8).map((job) => (
                  <div className={styles.latestJobsGridItem} key={job.id}>
                    <JobCard
                      job={job}
                      onClick={() => openJobDetail(job.id)}
                      onPrefetch={() => prefetchJobDetail(job.id)}
                      isFavorite={favoriteJobIds.has(String(job.id))}
                      onToggleFavorite={(event) => handleToggleFavorite(job, event)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {hasHomeMapJobs ? (
            <div id="home-jobs-map">
              <JobsMap jobs={homeMapJobs} focusedJobId={focusedMapJobId} userLocation={effectiveLocation} />
            </div>
          ) : null}
          <AppLaunchPanel />

          <LiveStatsPanel siteStats={siteStats} />
        </>
      ) : null}

    </>
  );
}
