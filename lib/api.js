const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com").replace(/\/+$/, "");

let authToken = null;
let refreshToken = null;
let tokenUpdateHandler = null;
let refreshPromise = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function setRefreshToken(token) {
  refreshToken = token || null;
}

export function clearAuthToken() {
  authToken = null;
  refreshToken = null;
}

export function setTokenUpdateHandler(fn) {
  tokenUpdateHandler = typeof fn === "function" ? fn : null;
}

async function tryRefresh() {
  if (!refreshToken) throw new Error("No refresh token");
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(data?.error || "Refresh failed");
      err.status = res.status;
      throw err;
    }

    authToken = data?.token || authToken;
    refreshToken = data?.refreshToken || refreshToken;

    if (tokenUpdateHandler) {
      tokenUpdateHandler({
        token: authToken,
        refreshToken,
        user: data?.user || null,
      });
    }

    return data;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function request(path, { method = "GET", body, retry = 0 } = {}) {
  const finalPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${finalPath}`;

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 401 && retry === 0 && refreshToken) {
    await tryRefresh();
    return request(path, { method, body, retry: 1 });
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function qs(params) {
  const pairs = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!pairs.length) return "";
  const query = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return `?${query}`;
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  verifyOtp: (payload) => request("/auth/verify-otp", { method: "POST", body: payload }),
  resendOtp: ({ email }) => request("/auth/resend-otp", { method: "POST", body: { email } }),
  refresh: (refreshTokenValue) => request("/auth/refresh", { method: "POST", body: { refreshToken: refreshTokenValue } }),

  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload }),

  listJobsWithSearch: ({ q, lat, lng, radius_m, daily, jobType, minWage, maxWage, categories, page, limit }) =>
    request(`/jobs${qs({ q, lat, lng, radius_m, daily, jobType, minWage, maxWage, categories: Array.isArray(categories) ? categories.join(",") : categories, page, limit })}`),
  listJobs: () => request("/jobs"),
  listMyJobs: (createdBy) => request(`/jobs${qs({ createdBy })}`),
  activateDueJobs: () => request("/jobs/activate-due", { method: "POST" }),
  getJobById: (id) => request(`/jobs/${encodeURIComponent(String(id))}`),
  createJob: (payload) => request("/jobs", { method: "POST", body: payload }),
  updateJob: (id, payload) => request(`/jobs/${encodeURIComponent(String(id))}`, { method: "PATCH", body: payload }),
  closeJob: (id, payload) => request(`/jobs/${encodeURIComponent(String(id))}/close`, { method: "PATCH", body: payload || {} }),
  reopenJob: (id) => request(`/jobs/${encodeURIComponent(String(id))}/reopen`, { method: "PATCH" }),

  listCategories: () => request("/categories"),
  getContent: (slug) => request(`/content/${encodeURIComponent(slug)}`),

  listMyNotifications: ({ limit = 50, offset = 0 } = {}) => request(`/me/notifications${qs({ limit, offset })}`),
  getUnreadNotificationsCount: () => request("/me/notifications/unread-count"),
  markNotificationRead: (id) => request(`/me/notifications/${encodeURIComponent(String(id))}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/me/notifications/read-all", { method: "POST" }),

  listMyAlerts: () => request("/me/alerts"),
  createAlert: (payload) => request("/me/alerts", { method: "POST", body: payload }),
  deleteAlert: (id) => request(`/me/alerts/${encodeURIComponent(String(id))}`, { method: "DELETE" }),

  updateProfile: (payload) => {
    if ("fullName" in payload) return request("/me/name", { method: "PATCH", body: payload });
    if ("phone" in payload) return request("/me/phone", { method: "PATCH", body: payload });
    return Promise.resolve(null);
  },
  updateMyLocation: (location) => request("/me/location", { method: "PATCH", body: { location } }),
  deleteMyAccount: (reason) => request("/me/account", { method: "DELETE", body: reason ? { reason } : {} }),

  requestRoleSwitch: (payload) => request("/me/request-role-switch", { method: "POST", body: payload }),
  getRoleSwitchStatus: () => request("/me/role-switch-status"),

  listTickets: () => request("/support"),
  createTicket: (payload) => request("/support", { method: "POST", body: payload }),
  replyTicket: (id, message) => request(`/support/${encodeURIComponent(String(id))}/reply`, { method: "POST", body: { message } }),
  markTicketRead: (id) => request(`/support/${encodeURIComponent(String(id))}/read`, { method: "PATCH" }),
  deleteTicket: (id) => request(`/support/${encodeURIComponent(String(id))}`, { method: "DELETE" }),
};
