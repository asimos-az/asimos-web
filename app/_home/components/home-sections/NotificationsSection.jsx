"use client";

import Link from "next/link";
import JobCard from "../../../components/JobCard";
import LocationPermissionPrompt from "../LocationPermissionPrompt";
import AuthSection from "../AuthSection";
import AppLaunchPanel from "../AppLaunchPanel";
import LiveStatsPanel from "../LiveStatsPanel";
import SponsoredJobCard from "../SponsoredJobCard";
import FloatingHomeWidgets from "../FloatingHomeWidgets";

export default function NotificationsSection({ ctx }) {
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
      {activeSection === "notifications" ? (
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

          <div className="notifications-toolbar">
            <div>
              <strong>Son yeniliklər</strong>
              <p>{activeUnreadCount ? "Oxunmamış bildirişlər burada aktiv görünür. Kliklədikdə oxundu sayılır və siyahıdan bağlanır." : "Yeni oxunmamış bildiriş gəldikdə burada görünəcək."}</p>
            </div>
            <button type="button" className="btn-secondary notifications-read-button" onClick={handleMarkAllRead} disabled={!activeUnreadCount}>
              Hamısını oxundu et
            </button>
          </div>

          {activeUnreadCount ? (
            <div className="notifications-list">
              {unreadNotifications.map((item) => {
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
              <h3>Aktiv bildiriş yoxdur</h3>
              <p>Oxunmamış bildirişlər burada görünəcək. Oxuduğun bildirişlər avtomatik siyahıdan bağlanır.</p>
            </div>
          )}
        </section>
      ) : null}

    </>
  );
}
