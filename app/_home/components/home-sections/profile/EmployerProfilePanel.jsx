"use client";

import EmployerLockedField from "./EmployerLockedField";
import { getCompanyName, getCompanyInitials, getEmployerPhone, getEmployerWhatsapp, getEmployerEmail, getEmployerAts, getEmployerVoen, formatMoney, formatAddress, formatDuration, getStatusLabel, formatScheduledText, normalizeEmployerJobStatus, formatEmployerJobSubtitle, getEmployerCardClass, getEmployerStatusClass } from "./employerProfileHelpers";

export default function EmployerProfilePanel({ ctx }) {
  const {
    user,
    loading,
    companyName,
    setCompanyName,
    voen,
    setVoen,
    contactPhone,
    setContactPhone,
    whatsapp,
    setWhatsapp,
    editingPhone,
    setEditingPhone,
    contactEmail,
    setContactEmail,
    link,
    setLink,
    handleProfileSave,
    myJobsStatus,
    setMyJobsStatus,
    profileJobs,
    myJobs,
    getJobStatus,
    formatProfileJobDate,
    startEditJob,
    handlePublishJob,
    handleCloseJob,
    handleDeleteJob,
    handleSignOut,
    setTicketCategory,
    setTicketMessage,
    supportCategories,
    openSupportModal,
    setActiveSection,
    handleEmployerFieldChangeRequest,
  } = ctx;

  const displayCompany = getCompanyName(ctx);
  const companyInitials = getCompanyInitials(displayCompany);
  const companyFieldValue = companyName || user?.companyName || user?.company_name || "";
  const displayVoen = getEmployerVoen(ctx);
  const displayPhone = getEmployerPhone(ctx);
  const companyPhoneValue = (() => {
    const raw = editingPhone || contactPhone || user?.phone || "";
    return String(raw || "").trim() === "+994" ? "" : raw;
  })();
  const displayWhatsapp = getEmployerWhatsapp(ctx);
  const companyWhatsappValue = (() => {
    const raw = whatsapp || user?.whatsapp || user?.whatsapp_number || "";
    return String(raw || "").trim() === "+994" ? "" : raw;
  })();
  const displayEmail = getEmployerEmail(ctx);
  const displayAts = getEmployerAts(ctx);

  function requestChange({ fieldKey, fieldLabel, oldValue, newValue, hasSavedValue }) {
    const category = (supportCategories || []).find((item) => String(item).toLowerCase().includes("hesab")) || "Hesab ilə bağlı problem";

    if (handleEmployerFieldChangeRequest) {
      handleEmployerFieldChangeRequest({ fieldKey, fieldLabel, oldValue, newValue, hasSavedValue });
      return;
    }

    setTicketCategory?.(category);
    setTicketMessage?.(
      `${fieldLabel} məlumatı üçün dəyişiklik sorğusu.\n` +
      `Köhnə dəyər: ${oldValue || "Boş idi"}\n` +
      `Yeni dəyər: ${newValue || ""}`
    );
    if (openSupportModal) {
      openSupportModal();
    } else {
      setActiveSection?.("support");
    }
  }

  const tabs = [
    ["open", "Aktiv elanlar", "✓"],
    ["pending", "Gözləmədə olan", "⏳"],
    ["draft", "Qaralama", "✎"],
    ["closed", "Deaktiv", "Ⅱ"],
    ["rejected", "Rədd", "✕"],
    ["deleted", "Silinmiş", "🗑"],
  ];

  return (
    <section className="employer-dashboard-shell">

      <header className="employer-hero">
        <div className="employer-hero-main">
          <div className="employer-logo-upload" aria-label={`${displayCompany} baş hərfləri`}>
            <div className="employer-logo-box">
              <span className="employer-company-initials" aria-hidden="true">{companyInitials}</span>
            </div>
          </div>
          <div className="employer-hero-copy">
            <h1>{displayCompany}</h1>
            <span className="employer-role-pill">İşəgötürən</span>
            <p>Şirkətinizin baş hərfləri profil və elanlarda görünür</p>
          </div>
        </div>
        <button type="button" className="employer-hero-logout" onClick={handleSignOut}>Çıxış</button>
      </header>

      <form className="employer-card" onSubmit={handleProfileSave}>
        <h2 className="employer-section-title">Şirkət məlumatları</h2>
        <div className="employer-form-grid">
          <EmployerLockedField
            fieldKey="companyName"
            label="Şirkət adı"
            value={companyFieldValue}
            placeholder="Şirkət adını yazın"
            onValueChange={setCompanyName}
            onRequest={requestChange}
          />
          <EmployerLockedField
            fieldKey="voen"
            label="VÖEN"
            value={displayVoen}
            placeholder="VÖEN yazın"
            onValueChange={setVoen}
            onRequest={requestChange}
          />
          <EmployerLockedField
            fieldKey="phone"
            label="Telefon"
            required
            value={companyPhoneValue}
            placeholder="+994"
            onValueChange={(nextValue) => {
              setEditingPhone?.(nextValue);
              setContactPhone?.(nextValue);
            }}
            onRequest={requestChange}
          />
          <EmployerLockedField
            fieldKey="whatsapp"
            label="WhatsApp"
            required
            value={companyWhatsappValue}
            placeholder="+994"
            onValueChange={setWhatsapp}
            onRequest={requestChange}
          />

          <div className="employer-field">
            <label>E-poçt <span>*</span></label>
            <input
              type="email"
              value={contactEmail || displayEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="hr@sirketiniz.az"
              required
            />
          </div>

          <div className="employer-field">
            <label>ATS linki</label>
            <input
              value={link || displayAts}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://ats.sirketiniz.az"
            />
          </div>

          <button type="submit" className="employer-save-button" disabled={loading}>
            {loading ? "Yadda saxlanılır..." : "Yadda saxla"}
          </button>
        </div>
      </form>

      <section className="employer-card">
        <h2 className="employer-section-title">Elanlarım</h2>
        <div className="employer-tabs">
          {tabs.map(([value, label, icon]) => (
            <button
              type="button"
              key={value}
              className={myJobsStatus === value ? "active" : ""}
              onClick={() => setMyJobsStatus(value)}
              aria-label={label}
              title={label}
            >
              <span className="employer-tab-label">{label}</span>
              <span className="employer-tab-icon" aria-hidden="true">{icon}</span>
            </button>
          ))}
        </div>

        <div className="employer-jobs-list">
          {(profileJobs || []).map((job) => {
            const status = normalizeEmployerJobStatus(job, getJobStatus ? getJobStatus(job) : null);
            const note = formatScheduledText(job, formatProfileJobDate);
            const meta = formatEmployerJobSubtitle(job, status, formatProfileJobDate);
            const reason = job?.rejection_reason || job?.reject_reason || job?.admin_note || "Rədd səbəbi qeyd edilməyib";
            return (
              <article className={`employer-job-card ${getEmployerCardClass(status)}`} key={job.id}>
                <div className="employer-job-head">
                  <div>
                    <h3>{job.title || "Adsız elan"}</h3>
                    <p>{meta}</p>
                  </div>
                  <span className={`employer-job-status ${getEmployerStatusClass(status)}`}>{getStatusLabel(status)}</span>
                </div>

                {note ? <div className="employer-job-note">{note}</div> : null}

                <div className="employer-job-actions">
                  {status === "draft" ? (
                    <>
                      <button type="button" className="edit" onClick={() => startEditJob(job)}>✏️ Davam et</button>
                      <button type="button" className="publish" onClick={() => handlePublishJob(job.id)}>📤 Göndər</button>
                      <button type="button" className="danger" onClick={() => handleDeleteJob(job.id)}>🗑️ Sil</button>
                    </>
                  ) : null}

                  {status === "rejected" ? (
                    <>
                      <button type="button" className="reason" onClick={() => alert(reason)}>💬 Səbəbə bax</button>
                      <button type="button" className="edit" onClick={() => startEditJob(job)}>↻ Yenidən göndər</button>
                    </>
                  ) : null}

                  {["closed", "inactive"].includes(status) ? (
                    <>
                      <button type="button" className="edit" onClick={() => startEditJob(job)}>✏️ Düzəliş</button>
                      <button type="button" className="publish" onClick={() => handlePublishJob(job.id)}>📤 Yenidən aktiv et</button>
                      <button type="button" className="danger" onClick={() => handleDeleteJob(job.id)}>🗑️ Sil</button>
                    </>
                  ) : null}

                  {["open", "scheduled"].includes(status) ? (
                    <>
                      <button type="button" className="edit" onClick={() => startEditJob(job)}>✏️ Düzəliş</button>
                      <button type="button" className="pause" onClick={() => handleCloseJob(job.id)}>Ⅱ Deaktiv et</button>
                      <button type="button" className="danger" onClick={() => handleDeleteJob(job.id)}>🗑️ Sil</button>
                    </>
                  ) : null}

                  {status === "pending" ? (
                    <>
                      <button type="button" className="edit" onClick={() => startEditJob(job)}>✏️ Düzəliş</button>
                      <button type="button" className="danger" onClick={() => handleDeleteJob(job.id)}>🗑️ Sil</button>
                    </>
                  ) : null}

                  {status === "deleted" ? (
                    <>
                      <button type="button" className="reason" disabled>🗑️ Silinmiş elan</button>
                      <button type="button" className="edit" onClick={() => startEditJob(job)}>✏️ Kopya kimi aç</button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
          {!profileJobs?.length ? <p className="employer-empty">Bu bölmədə elan yoxdur.</p> : null}
        </div>
      </section>

      <section className="employer-logout-card">
        <div>
          <h3>Hesabdan çıxış</h3>
          <p>Cihazdan çıxış edəcəksiniz</p>
        </div>
        <button type="button" onClick={handleSignOut}>Çıxış et</button>
      </section>
    </section>
  );
}
