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

function getCompanyInitials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "Ş";
  return words.slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
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
  if (normalized === "open") return "Aktiv";
  if (normalized === "pending") return "Gözləmədə";
  if (normalized === "scheduled") return "Planlaşdırılıb";
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
  if (status === "pending") return "Admin yoxlamasındadır · Təsdiqdən sonra paylaşılacaq";
  if (status === "rejected") return [city, wage].filter(Boolean).join(" · ") || (rejectedAt ? `Rədd edildi · ${formatProfileJobDate(rejectedAt)}` : "Rədd edildi");
  if (status === "deleted") return [city, wage].filter(Boolean).join(" · ") || (closedAt ? `Silindi · ${formatProfileJobDate(closedAt)}` : "Silinmiş elan");
  if (["closed", "inactive"].includes(status)) return [city, wage].filter(Boolean).join(" · ") || (closedAt ? `Deaktiv edildi · ${formatProfileJobDate(closedAt)}` : "Deaktiv elan");
  return [city, wage].filter(Boolean).join(" · ") || "Aktiv elan";
}

function getEmployerCardClass(status) {
  if (status === "pending") return "is-pending";
  if (status === "draft") return "is-draft";
  if (status === "rejected") return "is-rejected";
  if (status === "deleted") return "is-deleted";
  if (["closed", "inactive"].includes(status)) return "is-closed";
  return "is-open";
}

function getEmployerStatusClass(status) {
  if (status === "pending") return "is-pending";
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
      <style jsx global>{`
        .employer-dashboard-shell {
          width: min(100%, 760px);
          margin: 0 auto;
          padding: 10px 8px 28px;
          background: #eef3fb;
        }
        .employer-hero {
          min-height: 150px;
          border-radius: 14px;
          padding: 22px 24px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          color: #ffffff;
          background: linear-gradient(135deg, #22a478 0%, #078052 100%);
          box-shadow: 0 18px 44px rgba(6, 128, 82, 0.18);
        }
        .employer-hero-main {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 0;
        }
        .employer-logo-box {
          width: 76px;
          height: 76px;
          border: 2px solid rgba(255,255,255,0.42);
          border-radius: 14px;
          display: grid;
          place-items: center;
          overflow: hidden;
          cursor: default;
          text-align: center;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.25;
          background: rgba(255,255,255,0.08);
        }
        .employer-company-initials {
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.04em;
        }
        .employer-hero-copy h1 {
          margin: 0 0 8px;
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
          font-size: 13px;
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
          border-radius: 14px;
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
          gap: 12px;
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
          gap: 8px;
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
          font-size: 14px;
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
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }
        .employer-tabs {
          display: grid;
          grid-template-columns: repeat(6, minmax(125px, 1fr));
          gap: 0;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 28px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
        }
        .employer-tabs button {
          border: 0;
          background: transparent;
          min-height: 56px;
          color: #8a8a8a;
          font-size: 13px;
          cursor: pointer;
          border-bottom: 4px solid transparent;
        }
        .employer-tabs button.active {
          color: #13a873;
          border-bottom-color: #13a873;
        }
        .employer-tab-icon { display: none; }
        .employer-jobs-list {
          display: grid;
          gap: 18px;
        }
        .employer-job-card {
          border: 1px solid #dde3ee;
          border-radius: 14px;
          padding: 18px 20px;
          background: #ffffff;
        }
        .employer-job-card.is-draft {
          border-color: #acd1ff;
          border-style: dashed;
          background: #f7fbff;
        }
        .employer-job-card.is-pending {
          border-color: #f2c66d;
          background: #fffbeb;
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
          gap: 12px;
          align-items: flex-start;
        }
        .employer-job-card h3 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 15px;
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
        .employer-job-status.is-pending { background: #fff0c2; color: #8a5600; }
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
          gap: 8px;
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
          border-radius: 14px;
          background: #fffdfc;
          padding: 22px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }
        .employer-logout-card h3 {
          margin: 0 0 6px;
          font-size: 15px;
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
          font-size: 14px;
          padding: 0 20px;
          cursor: pointer;
        }

        .employer-field-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-direction: row;
          gap: 8px;
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
          min-height: 44px;
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
          min-height: 44px;
          border-radius: 14px;
          font-size: 15px;
        }
        .employer-dashboard-shell {
          width: min(100%, 860px);
          padding: 10px 8px 30px;
        }
        .employer-hero {
          min-height: 104px;
          padding: 18px 20px;
          border-radius: 14px;
        }
        .employer-logo-box {
          width: 66px;
          height: 66px;
          border-radius: 16px;
          font-size: 12px;
        }
        .employer-logo-empty span {
          font-size: 15px;
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
          min-width: 54px;
          min-height: 40px;
          border-radius: 14px;
          font-size: 14px;
        }
        .employer-card {
          margin-top: 16px;
          border-radius: 14px;
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
          .employer-tabs {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            overflow: hidden;
          }
          .employer-tabs button {
            min-width: 0;
            min-height: 52px;
            padding: 0;
          }
          .employer-tab-label { display: none; }
          .employer-tab-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            line-height: 1;
          }
          .seeker-dashboard-shell {
            padding: 10px 8px 28px;
          }
          .seeker-hero {
            min-height: 104px;
            padding: 18px 20px;
            border-radius: 18px;
            gap: 14px;
          }
          .seeker-hero-main {
            gap: 14px;
          }
          .seeker-avatar {
            width: 66px;
            height: 66px;
            font-size: 26px;
          }
          .seeker-hero-copy h1 {
            font-size: 22px;
          }
          .seeker-role-pill {
            min-height: 30px;
            font-size: 14px;
            padding: 4px 13px;
          }
          .seeker-hero-logout {
            min-width: 78px;
            min-height: 44px;
            font-size: 15px;
          }
          .seeker-card {
            margin-top: 16px;
            padding: 22px 20px;
            border-radius: 18px;
          }
          .seeker-section-title {
            font-size: 13px;
            margin-bottom: 18px;
          }
          .seeker-form-grid {
            gap: 16px;
          }
          .seeker-field {
            font-size: 14px;
            gap: 8px;
          }
          .seeker-field input {
            min-height: 50px;
            border-radius: 14px;
            font-size: 16px;
            padding: 0 16px;
          }
          .seeker-save-button {
            min-height: 50px;
            border-radius: 14px;
            font-size: 17px;
          }
          .seeker-switch-card {
            align-items: flex-start;
            gap: 14px;
          }
          .seeker-switch-icon {
            width: 52px;
            height: 52px;
            font-size: 22px;
          }
          .seeker-switch-content h3 {
            font-size: 18px;
          }
          .seeker-switch-content p {
            font-size: 14px;
          }
          .seeker-switch-button {
            min-height: 42px;
            font-size: 15px;
            padding: 0 18px;
          }
          .seeker-logout-card {
            padding: 20px;
          }
          .seeker-logout-card h3 {
            font-size: 18px;
          }
          .seeker-logout-card p {
            font-size: 14px;
          }
          .seeker-logout-card button {
            min-height: 42px;
            font-size: 15px;
            padding: 0 18px;
          }
        }
        @media (max-width: 520px) {
          .seeker-hero {
            padding: 16px;
            min-height: 96px;
          }
          .seeker-avatar {
            width: 58px;
            height: 58px;
            font-size: 23px;
          }
          .seeker-hero-copy h1 {
            font-size: 19px;
          }
          .seeker-role-pill {
            font-size: 13px;
            min-height: 28px;
          }
          .seeker-hero-logout {
            min-width: 68px;
            min-height: 40px;
            font-size: 14px;
          }
          .seeker-card {
            padding: 20px 16px;
          }
          .seeker-field input {
            min-height: 48px;
            font-size: 15px;
          }
          .seeker-save-button {
            min-height: 48px;
            font-size: 16px;
          }
          .seeker-switch-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }
          .seeker-switch-content h3,
          .seeker-logout-card h3 {
            font-size: 17px;
          }
          .seeker-switch-content p,
          .seeker-logout-card p {
            font-size: 13px;
          }
          .seeker-switch-button,
          .seeker-logout-card button {
            min-height: 40px;
            font-size: 14px;
            padding: 0 16px;
          }
        }
      `}</style>

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

function getSeekerInitial(name) {
  const clean = String(name || "").trim();
  return clean ? clean.charAt(0).toUpperCase() : "İ";
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
    handleSignOut,
    favoriteJobs,
    openJobDetail,
    prefetchJobDetail,
    handleToggleFavorite,
    handleRoleSwitch,
    confirmRoleSwitchRequest,
    switchCompany,
    setSwitchCompany,
    switchVoen,
    setSwitchVoen,
    switchCategory,
    setSwitchCategory,
    categories = [],
    setRoleSwitchConfirmOpen,
  } = ctx;

  const displayName = editingName || user?.fullName || user?.full_name || user?.name || "İş axtaran";
  const displayPhone = editingPhone || user?.phone || "";
  const displayEmail = user?.email || user?.contactEmail || user?.contact_email || "";
  const [roleRequestOpen, setRoleRequestOpen] = useState(false);
  const [roleRequestCompany, setRoleRequestCompany] = useState(switchCompany || "");
  const [roleRequestCategory, setRoleRequestCategory] = useState(switchCategory || "");
  const [roleRequestVoen, setRoleRequestVoen] = useState(switchVoen || "");
  const [roleRequestError, setRoleRequestError] = useState("");

  const roleCategoryOptions = Array.isArray(categories) ? categories : [];

  function handleSeekerRoleSwitch(event) {
    event.preventDefault();
    setRoleRequestCompany(switchCompany || "");
    setRoleRequestCategory(switchCategory || "");
    setRoleRequestVoen(switchVoen || "");
    setRoleRequestError("");
    setRoleRequestOpen(true);
  }

  async function submitRoleRequest(event) {
    event.preventDefault();
    const company = String(roleRequestCompany || "").trim();
    const categoryValue = String(roleRequestCategory || "").trim();
    const voenValue = String(roleRequestVoen || "").replace(/\D/g, "").trim();

    if (!company) {
      setRoleRequestError("Şirkət adını yazın");
      return;
    }
    if (!categoryValue) {
      setRoleRequestError("Kateqoriya seçin");
      return;
    }
    if (!voenValue) {
      setRoleRequestError("Şirkətin VÖEN nömrəsini yazın");
      return;
    }

    setSwitchCompany?.(company);
    setSwitchCategory?.(categoryValue);
    setSwitchVoen?.(voenValue);
    setRoleRequestError("");
    setRoleRequestOpen(false);

    if (typeof confirmRoleSwitchRequest === "function") {
      await confirmRoleSwitchRequest({ companyName: company, category: categoryValue, voen: voenValue });
      return;
    }

    setRoleSwitchConfirmOpen?.(true);
  }

  return (
    <section className="seeker-dashboard-shell">
      <style jsx global>{`
        .seeker-dashboard-shell {
          width: min(100%, 760px);
          margin: 0 auto;
          padding: 10px 8px 28px;
          background: #eef3fb;
        }
        .seeker-hero {
          min-height: 104px;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #ffffff;
          background: linear-gradient(135deg, #22a478 0%, #078052 100%);
          box-shadow: 0 18px 44px rgba(6, 128, 82, 0.16);
        }
        .seeker-hero-main {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
        }
        .seeker-avatar {
          width: 66px;
          height: 66px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          background: rgba(255, 255, 255, 0.24);
          color: #ffffff;
          font-size: 26px;
          font-weight: 800;
        }
        .seeker-hero-copy {
          min-width: 0;
        }
        .seeker-hero-copy h1 {
          margin: 0 0 8px;
          color: #ffffff;
          font-size: clamp(20px, 2.3vw, 25px);
          line-height: 1.1;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .seeker-role-pill {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 4px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 14px;
          line-height: 1;
        }
        .seeker-hero-logout {
          min-width: 78px;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.32);
          border-radius: 14px;
          background: rgba(255,255,255,0.15);
          color: #ffffff;
          font-size: 15px;
          cursor: pointer;
        }
        .seeker-card {
          margin-top: 16px;
          border: 1px solid #dce2ee;
          border-radius: 14px;
          background: #ffffff;
          padding: 22px 24px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }
        .seeker-section-title {
          margin: 0 0 18px;
          color: #9a9a9a;
          font-size: 13px;
          letter-spacing: 0.12em;
          font-weight: 700;
          text-transform: uppercase;
        }
        .seeker-form-grid {
          display: grid;
          gap: 18px;
        }
        .seeker-field {
          display: grid;
          gap: 8px;
          color: #696969;
          font-size: 14px;
          line-height: 1.2;
        }
        .seeker-field span {
          color: #ef4444;
        }
        .seeker-field input {
          width: 100%;
          min-height: 50px;
          border: 1px solid #d8deea;
          border-radius: 14px;
          padding: 0 16px;
          font-size: 16px;
          color: #111827;
          outline: none;
          box-sizing: border-box;
          background: #ffffff;
        }
        .seeker-field input::placeholder {
          color: #a3aab7;
        }
        .seeker-field input:focus {
          border-color: #13a873;
          box-shadow: 0 0 0 4px rgba(19,168,115,0.12);
        }
        .seeker-save-button {
          margin-top: 4px;
          border: 0;
          border-radius: 14px;
          min-height: 50px;
          width: 100%;
          background: #1ea476;
          color: #ffffff;
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
        }
        .seeker-save-button:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .seeker-switch-card {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .seeker-switch-icon {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          background: #fff3d9;
          color: #0f172a;
          font-size: 22px;
        }
        .seeker-switch-content {
          flex: 1 1 auto;
          min-width: 0;
        }
        .seeker-switch-content h3 {
          margin: 0 0 6px;
          color: #111827;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 800;
        }
        .seeker-switch-content p {
          margin: 0 0 12px;
          color: #7b7b7b;
          font-size: 15px;
          line-height: 1.35;
        }
        .seeker-switch-button {
          min-height: 42px;
          border: 1px solid #7bb4ff;
          border-radius: 14px;
          padding: 0 18px;
          background: #eff6ff;
          color: #1558a8;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }
        .seeker-logout-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          background: #fffdfc;
          border-color: #fed7d7;
        }
        .seeker-logout-card h3 {
          margin: 0 0 6px;
          color: #111827;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 800;
        }
        .seeker-logout-card p {
          margin: 0;
          color: #8a8a8a;
          font-size: 15px;
        }
        .seeker-logout-card button {
          min-height: 44px;
          border-radius: 14px;
          border: 1px solid #ff8080;
          background: #fff1f1;
          color: #c72626;
          font-size: 15px;
          font-weight: 800;
          padding: 0 20px;
          cursor: pointer;
          white-space: nowrap;
        }
        .seeker-favorites-list {
          display: grid;
          gap: 12px;
        }
        .seeker-muted {
          margin: 0;
          color: #8a8a8a;
          font-size: 14px;
        }
        .seeker-hidden-location {
          display: none;
        }
        .seeker-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.42);
          backdrop-filter: blur(6px);
        }
        .seeker-role-modal {
          width: min(100%, 520px);
          border: 1px solid #dce2ee;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.26);
          overflow: hidden;
        }
        .seeker-role-modal-head {
          padding: 22px 24px 18px;
          background: linear-gradient(135deg, #22a478 0%, #078052 100%);
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }
        .seeker-role-modal-head h3 {
          margin: 0 0 7px;
          font-size: 21px;
          line-height: 1.2;
          font-weight: 850;
          color: #ffffff;
        }
        .seeker-role-modal-head p {
          margin: 0;
          color: rgba(255,255,255,0.82);
          font-size: 14px;
          line-height: 1.45;
        }
        .seeker-modal-close {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,0.34);
          border-radius: 12px;
          background: rgba(255,255,255,0.14);
          color: #ffffff;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }
        .seeker-role-modal-body {
          padding: 22px 24px 24px;
          display: grid;
          gap: 14px;
        }
        .seeker-modal-field {
          display: grid;
          gap: 8px;
          color: #5f6876;
          font-size: 14px;
          font-weight: 650;
        }
        .seeker-modal-field span {
          color: #ef4444;
        }
        .seeker-modal-field input,
        .seeker-modal-field select {
          width: 100%;
          min-height: 48px;
          border: 1px solid #d8deea;
          border-radius: 14px;
          padding: 0 14px;
          font-size: 15px;
          color: #111827;
          outline: none;
          background: #ffffff;
          box-sizing: border-box;
        }
        .seeker-modal-field input:focus,
        .seeker-modal-field select:focus {
          border-color: #13a873;
          box-shadow: 0 0 0 4px rgba(19,168,115,0.12);
        }
        .seeker-modal-error {
          margin: 0;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 10px 12px;
          background: #fff1f2;
          color: #be123c;
          font-size: 14px;
          font-weight: 700;
        }
        .seeker-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }
        .seeker-modal-cancel,
        .seeker-modal-submit {
          min-height: 44px;
          border-radius: 14px;
          padding: 0 18px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }
        .seeker-modal-cancel {
          border: 1px solid #d8deea;
          background: #ffffff;
          color: #596275;
        }
        .seeker-modal-submit {
          border: 0;
          background: #1ea476;
          color: #ffffff;
        }
        @media (max-width: 720px) {
          .seeker-dashboard-shell {
            padding: 10px 8px 28px;
          }
          .seeker-hero {
            min-height: 104px;
            padding: 18px 20px;
            border-radius: 14px;
          }
          .seeker-hero-main {
            gap: 12px;
          }
          .seeker-avatar {
            width: 88px;
            height: 88px;
            font-size: 35px;
          }
          .seeker-hero-copy h1 {
            font-size: 28px;
          }
          .seeker-role-pill {
            min-height: 30px;
            font-size: 14px;
          }
          .seeker-hero-logout {
            min-width: 78px;
            min-height: 44px;
            font-size: 15px;
          }
          .seeker-card {
            margin-top: 16px;
            padding: 32px 32px;
            border-radius: 14px;
          }
          .seeker-section-title {
            font-size: 13px;
            margin-bottom: 28px;
          }
          .seeker-form-grid {
            gap: 18px;
          }
          .seeker-field {
            font-size: 15px;
          }
          .seeker-field input {
            min-height: 50px;
            border-radius: 14px;
            font-size: 17px;
            padding: 0 16px;
          }
          .seeker-save-button {
            min-height: 50px;
            border-radius: 14px;
            font-size: 17px;
          }
          .seeker-switch-card {
            align-items: flex-start;
          }
          .seeker-switch-content h3 {
            font-size: 18px;
          }
          .seeker-switch-content p {
            font-size: 15px;
          }
          .seeker-switch-button {
            min-height: 42px;
            font-size: 15px;
          }
          .seeker-logout-card h3 {
            font-size: 18px;
          }
          .seeker-logout-card p {
            font-size: 15px;
          }
          .seeker-logout-card button {
            min-height: 44px;
            font-size: 15px;
          }
        }
        @media (max-width: 520px) {
          .seeker-hero { padding: 20px; gap: 14px; }
          .seeker-hero-main { gap: 14px; }
          .seeker-avatar { width: 70px; height: 70px; font-size: 30px; }
          .seeker-hero-copy h1 { font-size: 15px; }
          .seeker-role-pill { font-size: 15px; min-height: 32px; }
          .seeker-hero-logout { min-width: 76px; min-height: 48px; font-size: 16px; }
          .seeker-card { padding: 24px 20px; }
          .seeker-field input { min-height: 44px; font-size: 15px; }
          .seeker-save-button { min-height: 44px; font-size: 15px; }
          .seeker-switch-card { gap: 12px; }
          .seeker-switch-icon { width: 56px; height: 56px; font-size: 17px; }
          .seeker-switch-content h3 { font-size: 15px; }
          .seeker-switch-content p { font-size: 13px; }
          .seeker-switch-button { min-height: 52px; font-size: 14px; padding: 0 22px; }
          .seeker-logout-card { padding: 24px 20px; }
          .seeker-logout-card h3 { font-size: 15px; }
          .seeker-logout-card p { font-size: 13px; }
          .seeker-logout-card button { min-height: 52px; font-size: 14px; padding: 0 22px; }
        }
      `}</style>

      {!user ? <p className="seeker-muted">Bu bölmə üçün daxil olun.</p> : null}
      {user ? (
        <>
          <header className="seeker-hero">
            <div className="seeker-hero-main">
              <div className="seeker-avatar" aria-hidden="true">{getSeekerInitial(displayName)}</div>
              <div className="seeker-hero-copy">
                <h1>{displayName}</h1>
                <span className="seeker-role-pill">İş axtaran</span>
              </div>
            </div>
            <button type="button" className="seeker-hero-logout" onClick={handleSignOut}>Çıxış</button>
          </header>

          <form className="seeker-card" onSubmit={handleProfileSave}>
            <h2 className="seeker-section-title">Şəxsi məlumatlar</h2>
            <div className="seeker-form-grid">
              <label className="seeker-field">
                Ad, soyad <span>*</span>
                <input value={editingName} onChange={(event) => setEditingName(event.target.value)} required />
              </label>

              <label className="seeker-field">
                Telefon <span>*</span>
                <input value={editingPhone} onChange={(event) => setEditingPhone(event.target.value)} required />
              </label>

              {displayEmail ? (
                <label className="seeker-field">
                  E-poçt
                  <input value={displayEmail} readOnly />
                </label>
              ) : null}

              <label className="seeker-field">
                Ünvan
                <input value={locationText} onChange={(event) => setLocationText(event.target.value)} placeholder="Məsələn: Bakı" />
              </label>

              <div className="seeker-hidden-location">
                <input value={lat} onChange={(event) => setLat(event.target.value)} aria-label="Lat" />
                <input value={lng} onChange={(event) => setLng(event.target.value)} aria-label="Lng" />
              </div>

              <button type="submit" className="seeker-save-button" disabled={loading}>
                {loading ? "Yadda saxlanılır..." : "Yadda saxla"}
              </button>
            </div>
          </form>

          <section className="seeker-card seeker-switch-card">
            <div className="seeker-switch-icon" aria-hidden="true">🏢</div>
            <div className="seeker-switch-content">
              <h3>İşəgötürən olmaq istəyirsiniz?</h3>
              <p>Şirkətiniz adından elan yerləşdirmək üçün sorğu göndərin.</p>
              <button type="button" className="seeker-switch-button" onClick={handleSeekerRoleSwitch}>Sorğu göndər →</button>
            </div>
          </section>

          {roleRequestOpen ? (
            <div className="seeker-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="seekerRoleRequestTitle">
              <form className="seeker-role-modal" onSubmit={submitRoleRequest}>
                <div className="seeker-role-modal-head">
                  <div>
                    <h3 id="seekerRoleRequestTitle">İşəgötürən sorğusu</h3>
                    <p>Şirkət məlumatlarını göndərin. Admin təsdiqlədikdən sonra profiliniz işəgötürən kimi yenilənəcək.</p>
                  </div>
                  <button type="button" className="seeker-modal-close" onClick={() => setRoleRequestOpen(false)} aria-label="Bağla">×</button>
                </div>
                <div className="seeker-role-modal-body">
                  <label className="seeker-modal-field">
                    Şirkət adı <span>*</span>
                    <input value={roleRequestCompany} onChange={(event) => setRoleRequestCompany(event.target.value)} placeholder="Məsələn: Asimos MMC" autoFocus />
                  </label>
                  <label className="seeker-modal-field">
                    Kateqoriya <span>*</span>
                    <select value={roleRequestCategory} onChange={(event) => setRoleRequestCategory(event.target.value)}>
                      <option value="">Kateqoriya seçin</option>
                      {roleCategoryOptions.map((item) => (
                        <option key={String(item)} value={String(item)}>{String(item)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="seeker-modal-field">
                    Şirkətin VÖEN-i <span>*</span>
                    <input value={roleRequestVoen} onChange={(event) => setRoleRequestVoen(event.target.value.replace(/\D/g, ""))} placeholder="Məsələn: 1234567890" inputMode="numeric" />
                  </label>
                  {roleRequestError ? <p className="seeker-modal-error">{roleRequestError}</p> : null}
                  <div className="seeker-modal-actions">
                    <button type="button" className="seeker-modal-cancel" onClick={() => setRoleRequestOpen(false)}>Ləğv et</button>
                    <button type="submit" className="seeker-modal-submit" disabled={loading}>{loading ? "Göndərilir..." : "Sorğu göndər"}</button>
                  </div>
                </div>
              </form>
            </div>
          ) : null}

          <section className="seeker-card">
            <h2 className="seeker-section-title">Favoritlər</h2>
            {favoriteJobs.length ? (
              <div className="seeker-favorites-list">
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
            ) : <p className="seeker-muted">Favorit elan yoxdur.</p>}
          </section>

          <section className="seeker-card seeker-logout-card">
            <div>
              <h3>Hesabdan çıxış</h3>
              <p>Cihazdan çıxış edəcəksiniz</p>
            </div>
            <button type="button" onClick={handleSignOut}>Çıxış et</button>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default function ProfileSection({ ctx }) {
  if (ctx.activeSection !== "profile") return null;
  if (ctx.roleName === "employer") return <EmployerProfilePanel ctx={ctx} />;
  return <SeekerProfilePanel ctx={ctx} />;
}
