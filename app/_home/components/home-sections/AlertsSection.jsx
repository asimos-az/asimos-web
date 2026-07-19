"use client";

import Link from "next/link";
import JobCard from "../../../components/JobCard";
import LocationPermissionPrompt from "../LocationPermissionPrompt";
import AuthSection from "../AuthSection";
import AppLaunchPanel from "../AppLaunchPanel";
import LiveStatsPanel from "../LiveStatsPanel";
import SponsoredJobCard from "../SponsoredJobCard";
import FloatingHomeWidgets from "../FloatingHomeWidgets";

export default function AlertsSection({ ctx }) {
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
    activeUnreadCount,
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
      {activeSection === "alerts" ? (
        <section className="container page-section notifications-page">
          <div className="notifications-hero">
            <div className="notifications-hero-content">
              <span className="notifications-eyebrow">Asimos iş bildirişləri</span>
              <h2>İş bildirişləri</h2>
              <p>Yaxınlığındakı yeni elanları, müraciət yeniliklərini və vacib hesab məlumatlarını bir yerdə izlə.</p>
            </div>

            <div className="notifications-hero-actions">
              <div className="notifications-stat-card primary">
                <span>{activeUnreadCount}</span>
                <small>Aktiv</small>
              </div>
              <div className="notifications-stat-card">
                <span>{notifications.length}</span>
                <small>Ümumi bildiriş</small>
              </div>
            </div>
          </div>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <>
              <div className="notifications-toolbar">
                <div>
                  <strong>Son yeniliklər</strong>
                  <p>{notifications.length ? "Bütün bildirişlər default olaraq burada görünür. Bildirişə klikləyərək bağlı elana keçə bilərsən." : "Yeni bildiriş gəldikdə burada görünəcək."}</p>
                </div>
                <button type="button" className="btn-secondary notifications-read-button" onClick={handleMarkAllRead} disabled={!notifications.length}>
                  Hamısını oxundu et
                </button>
              </div>

              {notifications.length ? (
                <div className="notifications-list">
                  {notifications.map((item) => {
                    const isRead = Boolean(item.readAt || item.read_at);
                    const jobId = getNotificationJobId(item);
                    const tone = getNotificationTone(item);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`notification-card ${isRead ? "read" : "unread"} tone-${tone}`}
                        onClick={() => handleOpenNotification(item)}
                      >
                        <span className="notification-icon" aria-hidden="true">
                          {tone === "near" ? "📍" : tone === "apply" ? "💼" : tone === "job" ? "✨" : "🔔"}
                        </span>

                        <span className="notification-content">
                          <span className="notification-title-row">
                            <strong>{item.title || "Bildiriş"}</strong>
                            {!isRead ? <span className="notification-unread-dot">Yeni</span> : null}
                          </span>
                          <span className="notification-message">{item.body || item.message || "Mesaj yoxdur"}</span>
                          <span className="notification-meta">
                            <span>{formatNotificationTime(getNotificationCreatedAt(item))}</span>
                            {jobId ? <span>Elana keçid aktivdir</span> : <span>Ümumi məlumat</span>}
                          </span>
                        </span>

                        <span className="notification-arrow" aria-hidden="true">→</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="notifications-empty">
                  <div className="notifications-empty-icon">🔕</div>
                  <h3>Hələ bildiriş yoxdur</h3>
                  <p>Yaxınlığında yeni elan və ya hesabında vacib yenilik olduqda burada görünəcək.</p>
                </div>
              )}

              <div className="notifications-toolbar alerts-create-toolbar">
                <div>
                  <strong>Yeni bildiriş kriteriyası yarat</strong>
                  <p>Kateqoriya, radius və açar söz seçərək gələcək elanlar üçün ayrıca xəbərdarlıq qura bilərsən.</p>
                </div>
              </div>

              <form className="form-grid compact" onSubmit={handleCreateAlert}>
                <label>
                  Kateqoriya
                  <select value={alertCategory} onChange={(e) => setAlertCategory(e.target.value)}>
                    <option value="">Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Radius (m)
                  <input value={alertRadius} onChange={(e) => setAlertRadius(e.target.value)} />
                </label>

                <label>
                  Açar sözlər
                  <input value={alertKeywords} onChange={(e) => setAlertKeywords(e.target.value)} />
                </label>

                <div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    Yarat
                  </button>
                </div>
              </form>

              {alerts.length ? (
                <div className="stack-list alerts-rules-list">
                  {alerts.map((item) => (
                    <div key={item.id} className="line-item">
                      <div>
                        <strong>{item.category || "Ümumi"}</strong>
                        <p>
                          Radius: {item.radius_m || item.radius || "-"}m | Söz: {item.q || item.query || "-"}
                        </p>
                      </div>
                      <button type="button" className="btn-secondary" onClick={() => handleDeleteAlert(item.id)}>
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

    </>
  );
}
