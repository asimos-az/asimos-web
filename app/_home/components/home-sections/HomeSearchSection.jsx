"use client";

import Link from "next/link";
import JobCard from "../../../components/JobCard";
import LocationPermissionPrompt from "../LocationPermissionPrompt";
import AuthSection from "../AuthSection";
import AppLaunchPanel from "../AppLaunchPanel";
import LiveStatsPanel from "../LiveStatsPanel";
import SponsoredJobCard from "../SponsoredJobCard";
import FloatingHomeWidgets from "../FloatingHomeWidgets";

export default function HomeSearchSection({ ctx }) {
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
      {activeSection === "home" ? (
        <section className={styles.homeFilterSection}>
          <div className="container">
            <form className={`${styles.homeFilterCard} ${styles.compactSearchFilter}`} onSubmit={handleHeroSearchSubmit}>
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
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Vakansiya adı və ya açar söz"
                  />
                </label>

                <label className={styles.homeFilterSelectWrap}>
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>
                  <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Şəhəri seç">
                    <option value="">Şəhəri seç</option>
                    {cityOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <button type="submit" className={styles.homeFilterSubmit} disabled={loading} aria-label="Axtar">
                  <svg className={styles.homeFilterSubmitIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <span className={styles.homeFilterSubmitText}>{loading ? "Axtarılır..." : "Axtar"}</span>
                </button>

                <label className={styles.mobileFilterButton} htmlFor="home-filter-toggle" aria-label="Filterləri göstər">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 6h16" strokeLinecap="round" />
                    <path d="M7 12h10" strokeLinecap="round" />
                    <path d="M10 18h4" strokeLinecap="round" />
                  </svg>
                  <span>Filter</span>
                </label>
              </div>

              <input id="home-filter-toggle" className={styles.mobileFilterCheckbox} type="checkbox" />

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

                {activeHomeFilterTab === "salary" ? activeSalaryRangeOptions.map((item) => (
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
                )) : null}
              </div>

              <div className={styles.homeFilterFooter}>
                <button
                  type="button"
                  className={styles.homeFilterReset}
                  onClick={() => {
                    setSearch("");
                    setCity("");
                    setCategory("");
                    setJobType("");
                    setJobLevel("");
                    setMinWage("");
                    setMaxWage("");
                    const emptyFilters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "" };
                    setAppliedFilters(emptyFilters);
                    refreshJobs(emptyFilters);
                  }}
                >
                  Sıfırla
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
      {activeSection === "home" && homeWidgets ? <FloatingHomeWidgets config={homeWidgets} /> : null}

      <LocationPermissionPrompt
        isOpen={locationPromptOpen}
        user={user}
        locationLoading={locationLoading}
        onActivate={handleLocationActivation}
        onDismiss={() => setLocationPromptOpen(false)}
      />
      {error ? <div className="toast-notice app-toast error" role="alert">{error}</div> : null}
      {ok ? <div className="toast-notice app-toast success" role="status">{ok}</div> : null}

      {supportModalOpen ? (
        <div className="support-modal-backdrop" role="dialog" aria-modal="true" aria-label="Dəstək müraciətləri" onMouseDown={closeSupportModal}>
          <div className={`support-modal ${supportMode === "detail" ? "support-modal-chat" : ""}`} onMouseDown={(event) => event.stopPropagation()}>
            <header className="support-modal-header">
              <button
                type="button"
                className="support-back-button"
                onClick={() => {
                  if (supportMode === "list") closeSupportModal();
                  else {
                    setSupportMode("list");
                    setActiveTicketId(null);
                  }
                }}
                aria-label="Geri"
              >
                ‹
              </button>
              <div>
                <h2>{supportMode === "create" ? "Yeni müraciət" : supportMode === "detail" ? getTicketSubject(activeTicket) : "Dəstək"}</h2>
                <p>{supportMode === "detail" ? "Asimos dəstək komandası ilə canlı yazışma" : supportMode === "list" ? "Müraciətləriniz və cavablarınız" : "Probleminizi qısa yazın"}</p>
              </div>
              <button type="button" className="support-close-button" onClick={closeSupportModal} aria-label="Bağla">
                ×
              </button>
            </header>

            {supportMode === "list" ? (
              <div className="support-modal-body">
                <button
                  type="button"
                  className="btn-primary support-new-ticket"
                  onClick={() => {
                    setTicketCategory(supportCategories[0] || "");
                    setTicketMessage("");
                    setSupportMode("create");
                  }}
                >
                  + Yeni Müraciət
                </button>

                <div className="support-ticket-list">
                  {tickets.map((ticket) => {
                    const status = String(ticket.status || "open").toLowerCase();
                    const hasReply = status === "replied" || ticket.is_answered;
                    return (
                      <button key={ticket.id} type="button" className="support-ticket-card" onClick={() => openTicketDetail(ticket)}>
                        <div className="support-ticket-card-head">
                          <strong>{getTicketSubject(ticket)}</strong>
                          <span className={`support-ticket-status ${status === "closed" ? "closed" : hasReply ? "replied" : ""}`}>
                            {status === "closed" ? "Bağlı" : hasReply ? "Cavab var" : "Açıq"}
                          </span>
                        </div>
                        <p>{ticket.message || "Mesaj yoxdur"}</p>
                        <small>{ticket.created_at || ticket.createdAt ? new Date(ticket.created_at || ticket.createdAt).toLocaleDateString("az-AZ") : ""}</small>
                      </button>
                    );
                  })}
                  {tickets.length === 0 ? (
                    <div className="support-empty">
                      <strong>Sualınız var?</strong>
                      <p>Bizə yazın, ən qısa zamanda cavablandıraq.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {supportMode === "create" ? (
              <form className="support-modal-body support-create-form" onSubmit={handleCreateTicket}>
                <label>
                  Mövzu
                  <select value={ticketCategory} onChange={(event) => setTicketCategory(event.target.value)} required>
                    <option value="">Mövzunu seçin</option>
                    {supportCategories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Mesajınız
                  <textarea
                    value={ticketMessage}
                    onChange={(event) => setTicketMessage(event.target.value)}
                    rows={6}
                    placeholder="Problemi ətraflı təsvir edin..."
                    required
                  />
                </label>
                <button type="submit" className="btn-primary" disabled={loading}>
                  Müraciəti Göndər
                </button>
              </form>
            ) : null}

            {supportMode === "detail" && activeTicket ? (
              <div className="support-detail">
                <div className="support-ticket-banner">
                  <strong>{getTicketSubject(activeTicket)}</strong>
                  <span>{String(activeTicket.status || "open").toLowerCase() === "closed" ? "BAĞLANDI" : "AÇIQ"}</span>
                </div>

                <div className="support-chat">
                  {getTicketMessages(activeTicket).map((message) => (
                    <div key={message.id} className={`support-message ${message.is_admin ? "admin" : "user"}`}>
                      {message.is_admin ? <strong>ASIMOS DƏSTƏK</strong> : null}
                      <p>{message.message}</p>
                      <small>{message.created_at ? new Date(message.created_at).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : ""}</small>
                    </div>
                  ))}
                </div>

                {String(activeTicket.status || "open").toLowerCase() !== "closed" ? (
                  <div className="support-chat-footer">
                    <textarea
                      value={ticketReply[activeTicket.id] || ""}
                      onChange={(event) => setTicketReply((prev) => ({ ...prev, [activeTicket.id]: event.target.value }))}
                      placeholder="Mesaj yazın..."
                      rows={2}
                    />
                    <button type="button" className="btn-primary" onClick={() => handleReply(activeTicket.id)} disabled={loading || !ticketReply[activeTicket.id]?.trim()}>
                      Göndər
                    </button>
                  </div>
                ) : (
                  <p className="support-closed-note">Bu müraciət artıq bağlanıb.</p>
                )}

                <div className="support-detail-actions">
                  <button type="button" className="btn-danger" onClick={() => handleDeleteTicket(activeTicket.id)} disabled={loading}>
                    Müraciəti sonlandır
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setSupportMode("create")}>
                    Yeni müraciət yarat
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

    </>
  );
}
