"use client";

import { useEffect, useRef, useState } from "react";
import JobCard from "../../../components/JobCard";

function getCompanyName(ctx) {
  return (
    ctx.companyName ||
    ctx.user?.companyName ||
    ctx.user?.company_name ||
    ctx.editingName ||
    ctx.user?.fullName ||
    "Şirkət"
  );
}

function getCompanyLogo(ctx) {
  return ctx.profileLogoPreview || ctx.user?.logoUrl || ctx.user?.logo_url || ctx.user?.profileLogoUrl || ctx.user?.profile_logo_url || "";
}

function getEmployerPhone(ctx) {
  return ctx.editingPhone || ctx.contactPhone || ctx.user?.phone || "+994";
}

function getEmployerWhatsapp(ctx) {
  return ctx.whatsapp || ctx.user?.whatsapp || ctx.user?.whatsapp_number || getEmployerPhone(ctx);
}

function getEmployerEmail(ctx) {
  return ctx.contactEmail || ctx.user?.contactEmail || ctx.user?.contact_email || ctx.user?.email || "";
}

function getEmployerAts(ctx) {
  return ctx.link || ctx.user?.atsLink || ctx.user?.ats_link || "";
}

function getEmployerVoen(ctx) {
  return ctx.voen || ctx.user?.voen || ctx.user?.taxId || ctx.user?.tax_id || "";
}

function formatMoney(job) {
  return job?.wage || job?.salary || job?.salary_text || "Maaş qeyd edilməyib";
}

function formatAddress(job) {
  return job?.location?.address || job?.address || job?.city || "Ünvan yoxdur";
}

function formatDuration(job) {
  const days = job?.durationDays ?? job?.duration_days;
  if (days) return `${days} gün`;
  return "";
}

function getStatusLabel(status) {
  const normalized = String(status || "open").toLowerCase();
  if (["open", "pending", "scheduled"].includes(normalized)) return "Aktiv";
  if (normalized === "draft") return "Qaralama";
  if (["closed", "inactive"].includes(normalized)) return "Deaktiv";
  if (normalized === "rejected") return "Rədd";
  if (normalized === "deleted") return "Silinib";
  return normalized;
}

function formatScheduledText(job, formatProfileJobDate) {
  const scheduledValue = job?.publishedAt || job?.published_at || job?.publishAt || job?.publish_at;
  const status = String(job?.status || job?.jobStatus || "").toLowerCase();
  if (!scheduledValue || !["scheduled", "open", "pending"].includes(status)) return "";
  return `📅 Planlı dərç: ${formatProfileJobDate(scheduledValue)}-dan aktiv olub`;
}

function normalizeEmployerJobStatus(job, fallback) {
  return String(fallback || job?.status || job?.jobStatus || "open").toLowerCase();
}

function formatEmployerJobSubtitle(job, status, formatProfileJobDate) {
  const city = job?.city || job?.location?.city || job?.location_address || job?.location?.address || "";
  const wage = job?.wage || job?.salary || job?.salary_text || "";
  const created = job?.created_at || job?.createdAt;
  const rejectedAt = job?.rejected_at || job?.updated_at || job?.updatedAt;
  const closedAt = job?.closed_at || job?.closedAt || job?.updated_at || job?.updatedAt;

  if (status === "draft") {
    const dateText = created ? ` · ${formatProfileJobDate(created)}` : "";
    return `Dərc edilməyib${dateText}`;
  }
  if (status === "rejected") return [city, wage].filter(Boolean).join(" · ") || (rejectedAt ? `Rədd edildi · ${formatProfileJobDate(rejectedAt)}` : "Rədd edildi");
  if (status === "deleted") return [city, wage].filter(Boolean).join(" · ") || (closedAt ? `Silindi · ${formatProfileJobDate(closedAt)}` : "Silinmiş elan");
  if (["closed", "inactive"].includes(status)) return [city, wage].filter(Boolean).join(" · ") || (closedAt ? `Deaktiv edildi · ${formatProfileJobDate(closedAt)}` : "Deaktiv elan");
  return [city, wage].filter(Boolean).join(" · ") || "Aktiv elan";
}

function getEmployerCardClass(status) {
  if (status === "draft") return "is-draft";
  if (status === "rejected") return "is-rejected";
  if (status === "deleted") return "is-deleted";
  if (["closed", "inactive"].includes(status)) return "is-closed";
  return "is-open";
}

function getEmployerStatusClass(status) {
  if (status === "rejected") return "is-rejected";
  if (status === "deleted") return "is-deleted";
  if (["closed", "inactive"].includes(status)) return "is-closed";
  if (status === "draft") return "is-draft";
  return "is-open";
}

function EmployerLockedField({
  fieldKey,
  label,
  value,
  required,
  placeholder,
  onValueChange,
  onRequest,
}) {
  const initialValueRef = useRef(String(value || "").trim());
  const [inputValue, setInputValue] = useState(value || "");
  const [unlocked, setUnlocked] = useState(!initialValueRef.current);
  const hasSavedValue = Boolean(initialValueRef.current);

  useEffect(() => {
    setInputValue(value || "");
    if (!String(value || "").trim()) {
      setUnlocked(true);
    }
  }, [value]);

  const locked = hasSavedValue && !unlocked;

  function handleInputChange(event) {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    onValueChange?.(nextValue);
  }

  function handleRequestClick() {
    const nextValue = String(inputValue || "").trim();
    if (!nextValue) return;

    onRequest?.({
      fieldKey,
      fieldLabel: label,
      oldValue: initialValueRef.current,
      newValue: nextValue,
      hasSavedValue,
    });
  }

  return (
    <div className={`employer-field employer-field-locked ${locked ? "is-locked" : "is-open"}`}>
      <div className="employer-field-top">
        <label>{label} {required ? <span>*</span> : null}</label>
        <div className="employer-lock-actions">
          {hasSavedValue ? (
            <button
              type="button"
              className={`employer-lock-toggle ${locked ? "" : "open"}`}
              onClick={() => setUnlocked(true)}
              disabled={!locked}
            >
              {locked ? "🔒 Kilidi aç" : "🔓 Açıq"}
            </button>
          ) : (
            <span className="employer-lock-toggle open">🔓 Açıq</span>
          )}
          <button
            type="button"
            className="employer-request-button"
            onClick={handleRequestClick}
            disabled={locked || !String(inputValue || "").trim()}
          >
            Dəyişiklik sorğusu
          </button>
        </div>
      </div>
      <input
        value={inputValue}
        disabled={locked}
        readOnly={locked}
        onChange={handleInputChange}
        placeholder={placeholder}
      />
    </div>
  );
}

function EmployerProfilePanel({ ctx }) {
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
    profileLogoPreview,
    setProfileLogoPreview,
    handleProfileLogoFileChange,
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

  const logo = getCompanyLogo(ctx);
  const displayCompany = getCompanyName(ctx);
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
    ["open", "Aktiv"],
    ["draft", "Qaralama"],
    ["closed", "Deaktiv"],
    ["rejected", "Rədd"],
    ["deleted", "Silinmiş"],
  ];

  return (
    <section className="employer-dashboard-shell">
      <style jsx global>{`
        .employer-dashboard-shell {
          width: min(100%, 900px);
          margin: 0 auto;
          padding: 12px 10px 34px;
          background: #eef3fb;
        }
        .employer-hero {
          min-height: 150px;
          border-radius: 18px;
          padding: 22px 24px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 22px;
          color: #ffffff;
          background: linear-gradient(135deg, #22a478 0%, #078052 100%);
          box-shadow: 0 18px 44px rgba(6, 128, 82, 0.18);
        }
        .employer-hero-main {
          display: flex;
          gap: 16px;
          align-items: center;
          min-width: 0;
        }
        .employer-logo-upload input { display: none; }
        .employer-logo-box {
          width: 76px;
          height: 76px;
          border: 3px dashed rgba(255,255,255,0.55);
          border-radius: 18px;
          display: grid;
          place-items: center;
          overflow: hidden;
          cursor: pointer;
          text-align: center;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.25;
          background: rgba(255,255,255,0.08);
        }
        .employer-logo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .employer-logo-empty span {
          display: block;
          font-size: 21px;
          margin-bottom: 6px;
        }
        .employer-hero-copy h1 {
          margin: 0 0 12px;
          font-size: clamp(22px, 3vw, 30px);
          line-height: 1.1;
          font-weight: 800;
        }
        .employer-role-pill {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 4px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.22);
          color: #ffffff;
          font-size: 17px;
          margin-bottom: 14px;
        }
        .employer-hero-copy p {
          margin: 0;
          font-size: 16px;
          line-height: 1.35;
          opacity: 0.9;
        }
        .employer-hero-logout {
          border: 1px solid rgba(255,255,255,0.28);
          border-radius: 14px;
          background: rgba(255,255,255,0.16);
          color: #ffffff;
          min-width: 82px;
          min-height: 46px;
          font-size: 16px;
          cursor: pointer;
        }
        .employer-card {
          margin-top: 22px;
          border: 1px solid #dce2ee;
          border-radius: 18px;
          background: #ffffff;
          padding: 24px 26px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }
        .employer-section-title {
          margin: 0 0 24px;
          color: #9a9a9a;
          font-size: 16px;
          letter-spacing: 0.12em;
          font-weight: 700;
          text-transform: uppercase;
        }
        .employer-form-grid {
          display: grid;
          gap: 16px;
        }
        .employer-field label,
        .employer-field-top label {
          color: #686868;
          font-size: 16px;
          line-height: 1.2;
        }
        .employer-field label span,
        .employer-field-top label span { color: #ef4444; }
        .employer-field-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 12px;
        }
        .employer-lock-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .employer-lock-badge {
          display: inline-flex;
          align-items: center;
          min-height: 40px;
          padding: 5px 14px;
          border-radius: 999px;
          background: #eff6ff;
          color: #2368b8;
          font-size: 14px;
          white-space: nowrap;
        }
        .employer-lock-actions button {
          border: 1px solid #13a873;
          color: #13a873;
          background: #ffffff;
          border-radius: 16px;
          min-height: 52px;
          padding: 0 22px;
          font-size: 15px;
          cursor: pointer;
          white-space: nowrap;
        }
        .employer-field input,
        .employer-field-locked input {
          width: 100%;
          min-height: 48px;
          border: 1px solid #d8deea;
          border-radius: 14px;
          padding: 0 16px;
          font-size: 18px;
          color: #111827;
          outline: none;
          box-sizing: border-box;
          background: #ffffff;
        }
        .employer-field input:focus {
          border-color: #13a873;
          box-shadow: 0 0 0 4px rgba(19,168,115,0.12);
        }
        .employer-field-locked.is-locked input {
          background: #f5f7fc;
          color: #9a9a9a;
        }
        .employer-field-locked.is-open input {
          background: #ffffff;
          color: #111827;
        }
        .employer-save-button {
          margin-top: 4px;
          border: 0;
          border-radius: 22px;
          min-height: 50px;
          width: 100%;
          background: #1ea476;
          color: #ffffff;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
        }
        .employer-tabs {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 28px;
        }
        .employer-tabs button {
          border: 0;
          background: transparent;
          min-height: 56px;
          color: #8a8a8a;
          font-size: 17px;
          cursor: pointer;
          border-bottom: 4px solid transparent;
        }
        .employer-tabs button.active {
          color: #13a873;
          border-bottom-color: #13a873;
        }
        .employer-jobs-list {
          display: grid;
          gap: 18px;
        }
        .employer-job-card {
          border: 1px solid #dde3ee;
          border-radius: 18px;
          padding: 18px 20px;
          background: #ffffff;
        }
        .employer-job-card.is-draft {
          border-color: #acd1ff;
          border-style: dashed;
          background: #f7fbff;
        }
        .employer-job-card.is-rejected {
          border-color: #e0e4ee;
          background: #ffffff;
        }
        .employer-job-card.is-closed {
          border-color: #f0d5a8;
          background: #fffaf2;
        }
        .employer-job-card.is-deleted {
          border-color: #f1b9b9;
          background: #fff7f7;
          opacity: 0.92;
        }
        .employer-job-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }
        .employer-job-card h3 {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 21px;
          line-height: 1.2;
          font-weight: 800;
        }
        .employer-job-card p {
          margin: 0 0 18px;
          color: #8a8a8a;
          font-size: 16px;
          line-height: 1.35;
        }
        .employer-job-status {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 4px 18px;
          border-radius: 999px;
          background: #dff8ee;
          color: #087d55;
          font-size: 15px;
          white-space: nowrap;
        }
        .employer-job-status.is-draft { background: #eaf3ff; color: #1558a8; }
        .employer-job-status.is-rejected { background: #fde8e8; color: #c33131; }
        .employer-job-status.is-closed { background: #fff0d6; color: #96520a; }
        .employer-job-status.is-deleted { background: #fee2e2; color: #991b1b; }
        .employer-job-note {
          margin: 12px 0 16px;
          border-radius: 16px;
          padding: 14px 18px;
          background: #fff0d6;
          color: #96520a;
          font-size: 15px;
        }
        .employer-job-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .employer-job-actions button {
          min-height: 40px;
          border-radius: 16px;
          padding: 0 20px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #555555;
          font-size: 15px;
          cursor: pointer;
        }
        .employer-job-actions .edit { border-color: #7bb4ff; background: #eff6ff; color: #1558a8; }
        .employer-job-actions .publish { border-color: #13a873; color: #0f8a62; background: #f0fff8; }
        .employer-job-actions .pause { border-color: #e5b567; color: #96520a; background: #fff9ed; }
        .employer-job-actions .reason { border-color: #d1d5db; color: #606060; background: #ffffff; }
        .employer-job-actions .danger {
          border-color: #ff8a8a;
          background: #fff1f1;
          color: #c91f1f;
        }
        .employer-empty {
          color: #8a8a8a;
          font-size: 15px;
          margin: 0;
        }
        .employer-logout-card {
          margin-top: 22px;
          border: 1px solid #fed7d7;
          border-radius: 18px;
          background: #fffdfc;
          padding: 22px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }
        .employer-logout-card h3 {
          margin: 0 0 10px;
          font-size: 21px;
          color: #111827;
        }
        .employer-logout-card p {
          margin: 0;
          color: #8a8a8a;
          font-size: 16px;
        }
        .employer-logout-card button {
          min-height: 50px;
          border-radius: 22px;
          border: 1px solid #ff8080;
          background: #fff1f1;
          color: #c72626;
          font-size: 18px;
          padding: 0 34px;
          cursor: pointer;
        }

        .employer-field-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-direction: row;
          gap: 12px;
          margin-bottom: 10px;
        }
        .employer-lock-actions {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }
        .employer-lock-toggle,
        .employer-request-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          border-radius: 999px;
          padding: 0 12px;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }
        .employer-lock-toggle {
          border: 0;
          background: #eff6ff;
          color: #2368b8;
          cursor: pointer;
        }
        .employer-lock-toggle.open {
          background: #ecfdf5;
          color: #0f8a62;
          cursor: default;
        }
        .employer-request-button {
          border: 1px solid #13a873;
          color: #13a873;
          background: #ffffff;
          cursor: pointer;
        }
        .employer-request-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .employer-field label,
        .employer-field-top label {
          font-size: 14px;
        }
        .employer-field input,
        .employer-field-locked input {
          min-height: 58px;
          border-radius: 16px;
          padding: 0 18px;
          font-size: 15px;
        }
        .employer-form-grid {
          gap: 20px;
        }
        .employer-card {
          padding: 28px 32px;
        }
        .employer-save-button {
          min-height: 58px;
          border-radius: 18px;
          font-size: 15px;
        }
        .employer-dashboard-shell {
          width: min(100%, 860px);
          padding: 10px 8px 30px;
        }
        .employer-hero {
          min-height: 128px;
          padding: 18px 20px;
          border-radius: 20px;
        }
        .employer-logo-box {
          width: 66px;
          height: 66px;
          border-radius: 16px;
          font-size: 12px;
        }
        .employer-logo-empty span {
          font-size: 20px;
          margin-bottom: 3px;
        }
        .employer-hero-copy h1 {
          font-size: clamp(20px, 2.4vw, 26px);
          margin-bottom: 8px;
        }
        .employer-role-pill {
          min-height: 28px;
          padding: 3px 12px;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .employer-hero-copy p {
          font-size: 14px;
        }
        .employer-hero-logout {
          min-width: 72px;
          min-height: 40px;
          border-radius: 14px;
          font-size: 14px;
        }
        .employer-card {
          margin-top: 16px;
          border-radius: 20px;
          padding: 20px 22px;
        }
        .employer-section-title {
          margin-bottom: 18px;
          font-size: 15px;
          letter-spacing: 0.11em;
        }
        .employer-form-grid {
          gap: 14px;
        }
        .employer-field-top {
          margin-bottom: 7px;
          gap: 10px;
        }
        .employer-field label,
        .employer-field-top label {
          font-size: 15px;
        }
        .employer-field input,
        .employer-field-locked input {
          min-height: 44px;
          border-radius: 13px;
          padding: 0 14px;
          font-size: 15px;
        }
        .employer-lock-actions {
          gap: 8px;
        }
        .employer-lock-toggle,
        .employer-request-button {
          min-height: 30px;
          padding: 0 11px;
          font-size: 13px;
        }
        .employer-save-button {
          min-height: 46px;
          border-radius: 15px;
          font-size: 16px;
        }
        @media (max-width: 720px) {
          .employer-dashboard-shell { padding: 12px 10px 34px; }
          .employer-hero { padding: 22px; border-radius: 18px; }
          .employer-hero-main { gap: 16px; align-items: flex-start; }
          .employer-logo-box { width: 84px; height: 84px; border-radius: 14px; font-size: 15px; }
          .employer-hero-copy h1 { font-size: 27px; }
          .employer-role-pill { min-height: 36px; font-size: 15px; padding: 4px 16px; }
          .employer-hero-copy p { font-size: 14px; }
          .employer-hero-logout { min-width: 88px; min-height: 58px; font-size: 19px; }
          .employer-card { padding: 28px 22px; border-radius: 18px; }
          .employer-field-top { align-items: center; flex-direction: row; }
          .employer-lock-actions { width: auto; justify-content: flex-end; gap: 8px; }
          .employer-lock-toggle, .employer-request-button { font-size: 13px; padding: 0 10px; min-height: 30px; }
          .employer-field input, .employer-field-locked input { min-height: 54px; font-size: 14px; }
          .employer-tabs { overflow-x: auto; grid-template-columns: repeat(5, minmax(116px, 1fr)); }
          .employer-tabs button { font-size: 19px; }
          .employer-job-card h3 { font-size: 25px; }
          .employer-job-card p { font-size: 15px; }
        }
      `}</style>

      <header className="employer-hero">
        <div className="employer-hero-main">
          <div className="employer-logo-upload">
            <input id="employer-logo-upload" type="file" accept="image/*" onChange={handleProfileLogoFileChange} />
            <label className="employer-logo-box" htmlFor="employer-logo-upload">
              {logo ? (
                <img src={logo} alt="Şirkət loqosu" />
              ) : (
                <span className="employer-logo-empty"><span>🖼️</span>Loqo yüklə</span>
              )}
            </label>
          </div>
          <div className="employer-hero-copy">
            <h1>{displayCompany}</h1>
            <span className="employer-role-pill">İşəgötürən</span>
            <p>Şirkət loqonuzu yerləşdirin — hər elanda görünəcək</p>
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
          {tabs.map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={myJobsStatus === value ? "active" : ""}
              onClick={() => setMyJobsStatus(value)}
            >
              {label}
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

                  {["open", "pending", "scheduled"].includes(status) ? (
                    <>
                      <button type="button" className="edit" onClick={() => startEditJob(job)}>✏️ Düzəliş</button>
                      <button type="button" className="pause" onClick={() => handleCloseJob(job.id)}>Ⅱ Deaktiv et</button>
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

function SeekerProfilePanel({ ctx }) {
  const {
    user,
    editingName,
    setEditingName,
    editingPhone,
    setEditingPhone,
    locationText,
    setLocationText,
    lat,
    setLat,
    lng,
    setLng,
    loading,
    handleProfileSave,
    handleDeleteAccount,
    favoriteJobs,
    openJobDetail,
    prefetchJobDetail,
    handleToggleFavorite,
  } = ctx;

  return (
    <section className="container page-section profile-page">
      {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}
      {user ? (
        <div className="profile-layout">
          <div className="profile-main-column">
            <form className="profile-panel profile-form" onSubmit={handleProfileSave}>
              <div className="profile-panel-head">
                <div>
                  <span>Hesab məlumatları</span>
                  <h3>Profil detalları</h3>
                </div>
              </div>

              <div className="profile-fields">
                <label>Ad Soyad<input value={editingName} onChange={(e) => setEditingName(e.target.value)} required /></label>
                <label>Telefon<input value={editingPhone} onChange={(e) => setEditingPhone(e.target.value)} required /></label>
                <label className="full-row">Ünvan<input value={locationText} onChange={(e) => setLocationText(e.target.value)} /></label>
                <label>Lat<input value={lat} onChange={(e) => setLat(e.target.value)} /></label>
                <label>Lng<input value={lng} onChange={(e) => setLng(e.target.value)} /></label>
              </div>

              <div className="profile-actions">
                <button type="submit" className="btn-primary" disabled={loading}>Profili yenilə</button>
                <button type="button" className="btn-danger" onClick={handleDeleteAccount}>Hesabı sil</button>
              </div>
            </form>

            <section className="profile-panel profile-favorites-section">
              <div className="profile-panel-head">
                <div><span>Favoritlər</span><h3>Yadda saxlanılan elanlar</h3></div>
                <small>{favoriteJobs.length} elan</small>
              </div>
              {favoriteJobs.length ? (
                <div className="profile-favorites-list">
                  {favoriteJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={() => openJobDetail(job.id)}
                      onPrefetch={() => prefetchJobDetail(job.id)}
                      isFavorite={true}
                      onToggleFavorite={(event) => handleToggleFavorite(job, event)}
                    />
                  ))}
                </div>
              ) : <p className="muted">Favorit elan yoxdur.</p>}
            </section>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function ProfileSection({ ctx }) {
  if (ctx.activeSection !== "profile") return null;
  if (ctx.roleName === "employer") return <EmployerProfilePanel ctx={ctx} />;
  return <SeekerProfilePanel ctx={ctx} />;
}
