"use client";

import { useState } from "react";
import { BusinessOutlined, CheckCircleRounded, LogoutRounded, WorkOutlineRounded } from "@mui/icons-material";
import JobCard from "../../../../components/JobCard";
import EmployerLockedField from "./EmployerLockedField";
import { getCompanyName, getCompanyInitials, getEmployerPhone, getEmployerWhatsapp, getEmployerEmail, getEmployerAts, getEmployerVoen, formatMoney, formatAddress, formatDuration, getStatusLabel, formatScheduledText, normalizeEmployerJobStatus, formatEmployerJobSubtitle, getEmployerCardClass, getEmployerStatusClass } from "./employerProfileHelpers";

export default function EmployerProfilePanel({ ctx }) {
  const [openSection, setOpenSection] = useState("company");
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
  const completionChecks = [companyFieldValue, displayVoen, companyPhoneValue, companyWhatsappValue, contactEmail || displayEmail, link || displayAts];
  const completionPercent = Math.round((completionChecks.filter((value) => String(value || "").trim()).length / completionChecks.length) * 100);

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

  const renderMobileToggle = (id, label, Icon) => (
    <button
      type="button"
      className="employer-mobile-toggle"
      onClick={() => setOpenSection(openSection === id ? "" : id)}
      aria-expanded={openSection === id}
    >
      <Icon />
      <span>{label}</span>
      <b aria-hidden="true">⌄</b>
    </button>
  );

  return (
    <main className="employer-workspace">
      <div className="employer-workspace-top">
        <strong><span>Λ</span>simos</strong>
        <span className="employer-cabinet-label">İşəgötürən kabineti</span>
        <button type="button" className="employer-top-logout" onClick={handleSignOut} aria-label="Hesabdan çıxış"><LogoutRounded /></button>
      </div>

      <form onSubmit={handleProfileSave}>
        <header className="employer-workspace-heading">
          <div className="employer-company-mark" aria-label={`${displayCompany} baş hərfləri`}>{companyInitials}</div>
          <div>
            <h1>{displayCompany}</h1>
            <p>Şirkət profilinizi tamamlayın və elanlarınızı bir yerdən idarə edin.</p>
          </div>
          <span>İşəgötürən</span>
        </header>

        <div className="employer-workspace-layout">
          <div className="employer-workspace-main">
            <section className={`employer-workspace-section ${openSection === "company" ? "open" : ""}`}>
              {renderMobileToggle("company", "Şirkət məlumatları", BusinessOutlined)}
              <div className="employer-section-content">
                <h2>Şirkət məlumatları</h2>
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
              placeholder="hr@sirketiniz.az"
              disabled
              readOnly
              required
            />
            <small className="employer-field-hint">E-poçt ünvanı hesabınıza bağlıdır və dəyişdirilə bilməz.</small>
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
                    {loading ? "Yadda saxlanılır..." : "Məlumatları yadda saxla"}
                  </button>
                </div>
              </div>
            </section>

            <section className={`employer-workspace-section employer-jobs-section ${openSection === "jobs" ? "open" : ""}`}>
              {renderMobileToggle("jobs", "Elanlarım", WorkOutlineRounded)}
              <div className="employer-section-content">
                <h2>Elanlarım</h2>
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
              <div className={`employer-managed-job ${getEmployerCardClass(status)}`} key={job.id}>
                <JobCard job={job} />
                <div className="employer-managed-job-footer">
                  <div className="employer-managed-job-state">
                    <span className={`employer-job-status ${getEmployerStatusClass(status)}`}>{getStatusLabel(status)}</span>
                    {note ? <span className="employer-job-note">{note}</span> : null}
                    {!note && meta ? <span className="employer-job-meta">{meta}</span> : null}
                  </div>
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
                </div>
              </div>
            );
          })}
          {!profileJobs?.length ? <p className="employer-empty">Bu bölmədə elan yoxdur.</p> : null}
                </div>
              </div>
            </section>
          </div>

          <aside className="employer-workspace-aside">
            <section>
              <h3>Profil tamamlanma faizi</h3>
              <strong className="employer-percent">{completionPercent}%</strong>
              <div className="employer-progress"><span style={{ width: `${completionPercent}%` }} /></div>
              <p>{completionPercent === 100 ? "Şirkət profiliniz tam hazırdır." : "Bir az da məlumat əlavə edin."}</p>
            </section>
            <section>
              <h3>Tövsiyə olunanlar</h3>
              {[
                [companyFieldValue, "Şirkət adını tamamlayın"],
                [displayVoen, "VÖEN məlumatını əlavə edin"],
                [companyPhoneValue && companyWhatsappValue, "Əlaqə nömrələrini tamamlayın"],
                [contactEmail || displayEmail, "E-poçt ünvanını əlavə edin"],
                [link || displayAts, "ATS linkini əlavə edin"],
              ].map(([done, label]) => <span className={done ? "done" : ""} key={label}><CheckCircleRounded />{label}</span>)}
            </section>
            <section className="employer-summary">
              <h3>Elanlarınız</h3>
              <strong>{myJobs?.length || 0}</strong>
              <p>ümumi elan</p>
              <button type="button" onClick={() => setOpenSection("jobs")}>Elanlara bax <span>→</span></button>
            </section>
            <button type="button" className="employer-aside-logout" onClick={handleSignOut}><LogoutRounded /> Hesabdan çıxış</button>
          </aside>
        </div>

        <footer className="employer-workspace-footer">
          <button type="button" onClick={() => setOpenSection("company")}>Geri</button>
          <button type="submit" disabled={loading}>{loading ? "Yadda saxlanılır..." : "Yadda saxla"}</button>
        </footer>
      </form>
    </main>
  );
}
