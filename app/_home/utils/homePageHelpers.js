export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isBase64DataUrl(value) {
  return typeof value === "string" && value.trim().startsWith("data:");
}

export function safeImageUrl(value) {
  const text = String(value || "").trim();

  if (!text) return undefined;

  if (isBase64DataUrl(text)) return undefined;

  return text;
}

export function getSafeUserLogo(user) {
  return (
    safeImageUrl(user?.logoUrl) ||
    safeImageUrl(user?.logo_url) ||
    safeImageUrl(user?.profileLogoUrl) ||
    safeImageUrl(user?.profile_logo_url) ||
    ""
  );
}

export function normalizeRole(role) {
  const raw = String(role || "").trim().toLowerCase();
  if (["seeker", "is axtaran", "alici", "jobseeker"].includes(raw)) return "seeker";
  if (["employer", "isci axtaran", "satici", "hirer", "company"].includes(raw)) return "employer";
  return null;
}

export function formatNotificationTime(value) {
  if (!value) return "Yeni";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Yeni";

  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getNotificationJobId(notification) {
  return notification?.data?.jobId || notification?.data?.job_id || notification?.jobId || notification?.job_id || null;
}

export function getNotificationCreatedAt(notification) {
  return notification?.createdAt || notification?.created_at || notification?.date || notification?.updatedAt || notification?.updated_at || null;
}

export function getNotificationTone(notification) {
  const text = `${notification?.title || ""} ${notification?.body || ""} ${notification?.message || ""}`.toLowerCase();
  if (text.includes("yaxın") || text.includes("near")) return "near";
  if (text.includes("müraciət") || text.includes("apply")) return "apply";
  if (text.includes("elan")) return "job";
  return "general";
}

export function normalizeList(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

export function flattenCategories(items) {
  const out = [];
  normalizeList(items).forEach((parent) => {
    if (parent?.name) out.push(String(parent.name));
    const children = Array.isArray(parent?.children) ? parent.children : [];
    children.forEach((child) => {
      if (child?.name) out.push(String(child.name));
    });
  });
  return out;
}

export function hasSavedLocation(candidateUser) {
  const latValue = Number(candidateUser?.location?.lat);
  const lngValue = Number(candidateUser?.location?.lng);

  return Number.isFinite(latValue) && Number.isFinite(lngValue);
}

export function buildJobDetailsText({
  companyObject,
  scheduleStart,
  scheduleEnd,
  publishMode,
  publishAt,
  durationLabel,
  contactEmail,
  description,
}) {
  const details = [];

  if (companyObject) details.push(`Şirkət / obyekt: ${companyObject}`);
  if (scheduleStart || scheduleEnd) details.push(`İş qrafiki: ${scheduleStart || "--:--"} - ${scheduleEnd || "--:--"}`);
  if (durationLabel) details.push(`Müddət: ${durationLabel}`);
  if (contactEmail) details.push(`Email: ${String(contactEmail).trim()}`);
  if (publishMode === "scheduled" && publishAt) details.push(`Planlı yayım: ${publishAt}`);

  return [description.trim(), details.length ? "" : null, ...details].filter(Boolean).join("\n");
}

export function extractWageNumber(wageText) {
  if (!wageText) return null;
  const match = String(wageText).replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function getJobStatus(job) {
  return String(job?.status || job?.jobStatus || "open").toLowerCase();
}

export function isPublicHomeJob(job) {
  if (!job?.id || !String(job?.title || "").trim()) return false;

  const status = getJobStatus(job);
  return !["closed", "deleted", "inactive", "rejected", "draft"].includes(status);
}

export function hasJobCoordinates(job) {
  const lat = Number(job?.location?.lat ?? job?.lat);
  const lng = Number(job?.location?.lng ?? job?.lng ?? job?.lon);

  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function formatTimeFromDateTime(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatProfileJobDate(value) {
  if (!value) return "Yeni";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Yeni";
  return date.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function getProfileJobCompany(job) {
  return job?.companyName || job?.company_name || job?.company || "Asimos işəgötürən";
}

export function getProfileJobLogo(job) {
  return job?.logoUrl || job?.logo_url || job?.imageUrl || job?.image_url || job?.companyLogo || job?.company_logo || "";
}

export function getTicketSubject(ticket) {
  return ticket?.subject || ticket?.category || "Müraciət";
}


export function getTicketMessages(ticket) {
  const source = Array.isArray(ticket?.support_messages)
    ? ticket.support_messages
    : Array.isArray(ticket?.replies)
      ? ticket.replies
      : [];

  return source
    .map((item, index) => ({
      id: item.id || `${ticket?.id || "ticket"}-${index}`,
      message: item.message || item.body || "",
      created_at: item.created_at || item.createdAt || item.created_at,
      is_admin: Boolean(item.is_admin || item.isAdmin || item.admin),
    }))
    .filter((item) => item.message)
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
}
