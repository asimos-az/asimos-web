export function getCompanyName(ctx) {
  return (
    ctx.companyName ||
    ctx.user?.companyName ||
    ctx.user?.company_name ||
    ctx.editingName ||
    ctx.user?.fullName ||
    "Şirkət"
  );
}

export function getCompanyInitials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "Ş";
  return words.slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

export function getEmployerPhone(ctx) {
  return ctx.editingPhone || ctx.contactPhone || ctx.user?.phone || "+994";
}

export function getEmployerWhatsapp(ctx) {
  return ctx.whatsapp || ctx.user?.whatsapp || ctx.user?.whatsapp_number || getEmployerPhone(ctx);
}

export function getEmployerEmail(ctx) {
  return ctx.contactEmail || ctx.user?.contactEmail || ctx.user?.contact_email || ctx.user?.email || "";
}

export function getEmployerAts(ctx) {
  return ctx.link || ctx.user?.atsLink || ctx.user?.ats_link || "";
}

export function getEmployerVoen(ctx) {
  return ctx.voen || ctx.user?.voen || ctx.user?.taxId || ctx.user?.tax_id || "";
}

export function formatMoney(job) {
  return job?.wage || job?.salary || job?.salary_text || "Maaş qeyd edilməyib";
}

export function formatAddress(job) {
  return job?.location?.address || job?.address || job?.city || "Ünvan yoxdur";
}

export function formatDuration(job) {
  const days = job?.durationDays ?? job?.duration_days;
  if (days) return `${days} gün`;
  return "";
}

export function getStatusLabel(status) {
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

export function formatScheduledText(job, formatProfileJobDate) {
  const scheduledValue = job?.publishedAt || job?.published_at || job?.publishAt || job?.publish_at;
  const status = String(job?.status || job?.jobStatus || "").toLowerCase();
  if (!scheduledValue || !["scheduled", "open", "pending"].includes(status)) return "";
  return `📅 Planlı dərç: ${formatProfileJobDate(scheduledValue)}-dan aktiv olub`;
}

export function normalizeEmployerJobStatus(job, fallback) {
  return String(fallback || job?.status || job?.jobStatus || "open").toLowerCase();
}

export function formatEmployerJobSubtitle(job, status, formatProfileJobDate) {
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

export function getEmployerCardClass(status) {
  if (status === "pending") return "is-pending";
  if (status === "draft") return "is-draft";
  if (status === "rejected") return "is-rejected";
  if (status === "deleted") return "is-deleted";
  if (["closed", "inactive"].includes(status)) return "is-closed";
  return "is-open";
}

export function getEmployerStatusClass(status) {
  if (status === "pending") return "is-pending";
  if (status === "rejected") return "is-rejected";
  if (status === "deleted") return "is-deleted";
  if (["closed", "inactive"].includes(status)) return "is-closed";
  if (status === "draft") return "is-draft";
  return "is-open";
}
