"use client";

import Link from "next/link";
import JobCard from "../../../components/JobCard";
import LocationPermissionPrompt from "../LocationPermissionPrompt";
import AuthSection from "../AuthSection";
import AppLaunchPanel from "../AppLaunchPanel";
import LiveStatsPanel from "../LiveStatsPanel";
import SponsoredJobCard from "../SponsoredJobCard";
import FloatingHomeWidgets from "../FloatingHomeWidgets";

export default function CreateJobSection({ ctx }) {
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
      {activeSection === "create" && canCreateJob ? (
        <section className="container page-section" style={{ maxWidth: 760 }}>
          <header className="section-head" style={{ marginBottom: 10, padding: "0 4px" }}>
            <h2>{editingJobId ? "Elanı redaktə et" : "Yeni vakansiya yerləşdir"}</h2>
            <p>{editingJobId ? "Vakansiya məlumatlarını yeniləyin və yenidən təsdiqə göndərin." : "Məlumatları tam doldurun. Elan admin təsdiqindən sonra yayımlanacaq."}</p>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <form onSubmit={handleCreateJob} style={{ display: "grid", gap: 10 }} className="asimos-compact-job-form">
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Vakansiya məlumatları</div>
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>
                    Vakansiya adı <span style={{ color: "#ef4444" }}>*</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Məs: Mühasib, React proqramçısı..." required style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 46, padding: "0 14px", fontSize: 15, outline: "none" }} />
                  </label>

                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>
                    Filial / iş yeri
                    <input value={companyObject} onChange={(e) => setCompanyObject(e.target.value)} placeholder="Məs: Nərimanov filialı, Mərkəzi ofis..." style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 46, padding: "0 14px", fontSize: 15, outline: "none" }} />
                  </label>

                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>
                    Kateqoriya <span style={{ color: "#ef4444" }}>*</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 46, padding: "0 14px", fontSize: 15, background: "#fff", outline: "none" }}>
                      <option value="">Kateqoriya seçin</option>
                      {homeCategoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>
                    Dərəcə
                    <select value={jobLevel} onChange={(e) => setJobLevel(e.target.value)} style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 46, padding: "0 14px", fontSize: 15, background: "#fff", outline: "none" }}>
                      <option value="">Seçin (məcburi deyil)</option>
                      {activeJobLevelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Maaş <span style={{ color: "#ef4444" }}>*</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: wageMode === "range" ? 12 : 4 }}>
                  {[
                    ["agreement", "Razılaşma"],
                    ["skill", "Bacarığa əsasən"],
                    ["range", "Rəqəm göstər"],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => { setWageMode(value); if (value === "agreement") setWage("Razılaşma əsasında"); if (value === "skill") setWage("Bacarığa uyğun"); }} style={{ border: "1px solid #dbe3ee", borderRadius: 999, minHeight: 42, padding: "0 18px", fontSize: 15, fontWeight: 700, background: wageMode === value ? "#1fa276" : "#fff", color: wageMode === value ? "#fff" : "#666", cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {wageMode === "range" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <input value={wageMin} onChange={(event) => { const value = event.target.value.replace(/[^0-9]/g, ""); setWageMin(value); const max = String(wageMax || "").replace(/[^0-9]/g, ""); setWage(value && max ? `${value} - ${max} AZN` : value ? `${value} AZN` : ""); }} inputMode="numeric" placeholder="Minimum maaş" style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                    <input value={wageMax} onChange={(event) => { const value = event.target.value.replace(/[^0-9]/g, ""); setWageMax(value); const min = String(wageMin || "").replace(/[^0-9]/g, ""); setWage(min && value ? `${min} - ${value} AZN` : min ? `${min} AZN` : value ? `${value} AZN` : ""); }} inputMode="numeric" placeholder="Maksimum maaş" style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                  </div>
                ) : <p style={{ margin: "10px 0 0", color: "#9a9a9a", fontSize: 13 }}>Elanda "{wageMode === "skill" ? "Bacarığa uyğun" : "Razılaşma əsasında"}" görünəcək</p>}
              </div>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>İş növü <span style={{ color: "#ef4444" }}>*</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  <button type="button" onClick={() => { setJobType("permanent"); setDurationPreset("1"); }} style={{ border: "1px solid #dbe3ee", borderRadius: 999, minHeight: 42, padding: "0 18px", fontSize: 15, fontWeight: 700, background: jobType !== "temporary" ? "#1fa276" : "#fff", color: jobType !== "temporary" ? "#fff" : "#666", cursor: "pointer" }}>Daimi iş</button>
                  <button type="button" onClick={() => { setJobType("temporary"); setDurationPreset("1"); setDurationDays("1"); }} style={{ border: "1px solid #dbe3ee", borderRadius: 999, minHeight: 42, padding: "0 18px", fontSize: 15, fontWeight: 700, background: jobType === "temporary" ? "#1fa276" : "#fff", color: jobType === "temporary" ? "#fff" : "#666", cursor: "pointer" }}>Günəmuzd</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>Başlama tarixi
                    <input type="date" value={vacancyStartDate} onChange={(e) => setVacancyStartDate(e.target.value)} style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                  </label>
                  <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>Bitmə tarixi <span style={{ color: "#ef4444" }}>*</span>
                    <input type="date" value={vacancyEndDate} onChange={(e) => setVacancyEndDate(e.target.value)} required style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                  </label>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Əlaqə məlumatları</div>
                <div style={{ background: "#eef4ff", borderRadius: 14, padding: 12, display: "grid", gap: 14 }}>
                  <div style={{ color: "#9a9a9a", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>🔄 Profildən avtomatik — elanda görünməsini seçin</div>
                  {[
                    ["phone", "📞", contactPhone || user?.phone || "+994"],
                    ["whatsapp", "💬", whatsapp || user?.phone || "+994"],
                    ["email", "✉️", contactEmail || user?.email || "email@example.com"],
                  ].map(([key, icon, value]) => (
                    <div key={key} style={{ display: "grid", gridTemplateColumns: "54px 24px minmax(0, 1fr) auto", gap: 8, alignItems: "center" }}>
                      <button type="button" onClick={() => setContactVisibility((prev) => ({ ...prev, [key]: !prev[key] }))} aria-pressed={Boolean(contactVisibility[key])} style={{ width: 46, height: 26, borderRadius: 999, border: 0, padding: 4, background: contactVisibility[key] ? "#1fa276" : "#cfd3d8", cursor: "pointer", display: "flex", justifyContent: contactVisibility[key] ? "flex-end" : "flex-start" }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", display: "block" }} /></button>
                      <span style={{ fontSize: 17 }}>{icon}</span>
                      <span style={{ fontSize: 15, color: "#111827", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
                      {primaryContact === key ? <span style={{ background: "#dcfce7", color: "#147555", borderRadius: 999, padding: "6px 10px", fontWeight: 800 }}>İlk göstərilməlidir</span> : <button type="button" onClick={() => setPrimaryContact(key)} style={{ border: "1px solid #6ee7b7", color: "#15956d", background: "#fff", borderRadius: 14, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>İlk et</button>}
                    </div>
                  ))}
                  <p style={{ margin: 0, color: "#9a9a9a", fontSize: 13 }}>Aktiv etdiyiniz əlaqə yolları elanda göstərilir. “İlk göstərilməlidir” seçimi həmin əlaqə vasitəsini siyahının başına çıxarır.</p>
                </div>
                <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700, marginTop: 18 }}>ATS linki
                  <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://ats.sirketiniz.az/apply" style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                </label>
              </div>

              <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                Təsvir
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required placeholder="Vakansiyanın tələbləri, vəzifələr və əlavə qeydlər..." style={{ width: "100%", border: "1px solid #dbe3ee", borderRadius: 14, padding: 12, fontSize: 14, resize: "vertical" }} />
              </label>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 26px rgba(15,23,42,.045)" }}>
                <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Lokasiya <span style={{ color: "#ef4444" }}>*</span></div>
                <div style={{ border: "1px solid #a7f3d0", borderRadius: 14, overflow: "hidden", minHeight: 150 }}>
                  <LocationPicker lat={lat} lng={lng} address={locationText} onChange={({ lat: nextLat, lng: nextLng, address: nextAddress }) => { setLat(nextLat); setLng(nextLng); setLocationText(nextAddress); }} />
                </div>
              </div>

              <div style={{ background: "#f8fbff", border: "1px solid #bfdbfe", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
                <strong style={{ color: "#1d5fae", fontSize: 17 }}>📅 Yayımlanma planlaması</strong>
                <button type="button" onClick={() => setPublishMode((value) => value === "scheduled" ? "instant" : "scheduled")} aria-pressed={publishMode === "scheduled"} style={{ width: 56, height: 32, borderRadius: 999, border: 0, padding: 4, background: publishMode === "scheduled" ? "#1fa276" : "#cfd3d8", cursor: "pointer", display: "flex", justifyContent: publishMode === "scheduled" ? "flex-end" : "flex-start" }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", display: "block" }} /></button>
              </div>

              {publishMode === "scheduled" ? (
                <label style={{ display: "grid", gap: 6, fontSize: 14, color: "#5f5f64", fontWeight: 700 }}>Yayım tarixi və saatı
                  <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} style={{ border: "1px solid #dbe3ee", borderRadius: 14, minHeight: 44, padding: "0 12px", fontSize: 15 }} />
                </label>
              ) : null}

              <p style={{ color: "#747b87", fontSize: 14, lineHeight: 1.4, margin: "4px 0" }}>🛡️ Elan adminə göndəriləcək. Təsdiqləndikdən sonra yayımlanacaq. Daha sürətli təsdiq almaq üçün elanı qaydalara uyğun və ətraflı formada doldurun.</p>

              <div style={{ display: "grid", gap: 12 }}>
                {!editingJobId ? <button type="button" disabled={loading} onClick={(e) => handleCreateJob(e, true)} style={{ minHeight: 46, border: "1px solid #dbe3ee", borderRadius: 16, background: "#fff", color: "#555", fontSize: 17, fontWeight: 800, cursor: "pointer" }}>✏️ Qaralama olaraq saxla</button> : null}
                <button type="submit" disabled={loading} style={{ minHeight: 48, border: 0, borderRadius: 16, background: "#1fa276", color: "#fff", fontSize: 17, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1 }}>{loading ? "Göndərilir..." : editingJobId ? "Dəyişiklikləri saxla" : "📥 Elanı adminə göndər"}</button>
                {editingJobId ? <button type="button" onClick={resetJobForm} style={{ minHeight: 42, border: "1px solid #dbe3ee", borderRadius: 18, background: "#fff", color: "#555", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Redaktəni ləğv et</button> : null}
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

    </>
  );
}
