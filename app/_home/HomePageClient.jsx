"use client";

import Header from "../components/Header";
import JobCard from "../components/JobCard";
import LocationPicker from "../components/LocationPicker";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearAuthToken, setAuthToken, setRefreshToken, setTokenUpdateHandler } from "../../lib/api";
import { clearAuth, loadAuth, saveAuth } from "../../lib/auth-store";

import JobsMap from "../components/JobsMap";
import styles from "./HomePage.module.css";
import AuthSection from "./components/AuthSection";
import AppLaunchPanel from "./components/AppLaunchPanel";
import HomeHero from "./components/HomeHero";
import LocationPermissionPrompt from "./components/LocationPermissionPrompt";

const guestNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
];

const seekerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
];

const employerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
];

function normalizeRole(role) {
  const raw = String(role || "").trim().toLowerCase();
  if (["seeker", "is axtaran", "alici", "jobseeker"].includes(raw)) return "seeker";
  if (["employer", "isci axtaran", "satici", "hirer", "company"].includes(raw)) return "employer";
  return null;
}

function normalizeList(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function flattenCategories(items) {
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

function hasSavedLocation(candidateUser) {
  const latValue = Number(candidateUser?.location?.lat);
  const lngValue = Number(candidateUser?.location?.lng);

  return Number.isFinite(latValue) && Number.isFinite(lngValue);
}

function buildJobDetailsText({
  companyObject,
  scheduleStart,
  scheduleEnd,
  publishMode,
  publishAt,
  durationLabel,
  description,
}) {
  const details = [];

  if (companyObject) details.push(`Şirkət / obyekt: ${companyObject}`);
  if (scheduleStart || scheduleEnd) details.push(`İş qrafiki: ${scheduleStart || "--:--"} - ${scheduleEnd || "--:--"}`);
  if (durationLabel) details.push(`Müddət: ${durationLabel}`);
  if (publishMode === "scheduled" && publishAt) details.push(`Planlı yayım: ${publishAt}`);

  return [description.trim(), details.length ? "" : null, ...details].filter(Boolean).join("\n");
}

function extractWageNumber(wageText) {
  if (!wageText) return null;
  const match = String(wageText).replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function getJobStatus(job) {
  return String(job?.status || job?.jobStatus || "open").toLowerCase();
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatTimeFromDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
}

export default function HomePageClient() {
  const router = useRouter();
  const prefetchedJobIds = useRef(new Set());
  const [booting, setBooting] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);

  const [mode, setMode] = useState("login");
  const [otpPayload, setOtpPayload] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("+994");
  const [role, setRole] = useState("seeker");
  const [registerCategory, setRegisterCategory] = useState("");
  const [otp, setOtp] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [terms, setTerms] = useState("");
  const [unread, setUnread] = useState(0);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [dailyOnly, setDailyOnly] = useState(false);
  const [jobsMode, setJobsMode] = useState("all");
  const [minWage, setMinWage] = useState("");
  const [maxWage, setMaxWage] = useState("");
  const [radiusM, setRadiusM] = useState("0");
  const [myJobsStatus, setMyJobsStatus] = useState("open");
  const [editingJobId, setEditingJobId] = useState(null);

  const [title, setTitle] = useState("");
  const [companyObject, setCompanyObject] = useState("");
  const [wage, setWage] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("+994");
  const [contactPhone, setContactPhone] = useState("+994");
  const [link, setLink] = useState("");
  const [voen, setVoen] = useState("");
  const [workType, setWorkType] = useState("permanent");
  const [durationPreset, setDurationPreset] = useState("1");
  const [customDurationDays, setCustomDurationDays] = useState("");
  const [durationDays, setDurationDays] = useState("1");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [publishMode, setPublishMode] = useState("instant");
  const [publishAt, setPublishAt] = useState("");
  const [locationText, setLocationText] = useState("");
  const [lat, setLat] = useState("40.4093");
  const [lng, setLng] = useState("49.8671");

  const [alertCategory, setAlertCategory] = useState("");
  const [alertRadius, setAlertRadius] = useState("500");
  const [alertKeywords, setAlertKeywords] = useState("");

  const [ticketCategory, setTicketCategory] = useState("general");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketReply, setTicketReply] = useState({});

  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [switchCompany, setSwitchCompany] = useState("");
  const [switchVoen, setSwitchVoen] = useState("");
  const [roleSwitchStatus, setRoleSwitchStatus] = useState(null);

  const roleName = normalizeRole(user?.role);
  const canCreateJob = roleName === "employer";
  const navItems = roleName === "employer" ? employerNav : roleName === "seeker" ? seekerNav : guestNav;

  const navTitle = roleName === "employer" ? "İşçi axtaran" : roleName === "seeker" ? "İş axtaran" : "Qonaq";

  useEffect(() => {
    if (!user && activeSection !== "home" && activeSection !== "jobs" && activeSection !== "terms" && activeSection !== "auth") {
      setActiveSection("auth");
    }
  }, [user, activeSection]);

  useEffect(() => {
    if (activeSection === "create" && roleName !== "employer") {
      setActiveSection(user ? "profile" : "auth");
    }
  }, [activeSection, roleName, user]);

  useEffect(() => {
    const saved = loadAuth();
    if (saved?.token) {
      setToken(saved.token);
      setRefreshTokenState(saved.refreshToken || null);
      setUser(saved.user || null);
      setAuthToken(saved.token);
      setRefreshToken(saved.refreshToken || null);

      if (saved.user?.location) {
        setLat(String(saved.user.location.lat || "40.4093"));
        setLng(String(saved.user.location.lng || "49.8671"));
        setLocationText(saved.user.location.address || "");
      }

      if (saved.user?.phone) {
        setPhone(saved.user.phone);
        setContactPhone(saved.user.phone);
        setWhatsapp(saved.user.phone);
      }

      setEditingName(saved.user?.fullName || "");
      setEditingPhone(saved.user?.phone || "");
    }

    setTokenUpdateHandler(({ token: nextToken, refreshToken: nextRefresh, user: nextUser }) => {
      setToken(nextToken || null);
      setRefreshTokenState(nextRefresh || null);
      if (nextUser) setUser(nextUser);
      saveAuth({ token: nextToken || null, refreshToken: nextRefresh || null, user: nextUser || user || null });
    });

    setBooting(false);
  }, []);

  async function loadBaseData() {
    const [categoryRes, jobsRes, termsRes] = await Promise.all([
      api.listCategories().catch(() => ({ items: [] })),
      api
        .listJobsWithSearch({
          q: search,
          lat: user?.location?.lat,
          lng: user?.location?.lng,
          radius_m: Number(radiusM) > 0 ? Number(radiusM) : undefined,
          daily: jobsMode === "daily" || dailyOnly || undefined,
          jobType: jobType || undefined,
          minWage: minWage || undefined,
          maxWage: maxWage || undefined,
          categories: category || undefined,
        })
        .catch(() => ({ items: [] })),
      api.getContent("terms").catch(() => null),
    ]);

    setCategories(flattenCategories(categoryRes?.items || categoryRes));
    setJobs(normalizeList(jobsRes));
    setTerms(termsRes?.content || termsRes?.body || "Qaydalar məlumatı mövcud deyil.");
  }

  async function loadAuthedData(currentUser = user) {
    if (!currentUser?.id) return;

    const [myJobsRes, alertsRes, notificationsRes, unreadRes, ticketsRes, switchRes] = await Promise.all([
      api.listMyJobs(currentUser.id).catch(() => ({ items: [] })),
      api.listMyAlerts().catch(() => ({ items: [] })),
      api.listMyNotifications({ limit: 100, offset: 0 }).catch(() => ({ items: [] })),
      api.getUnreadNotificationsCount().catch(() => ({ unread: 0 })),
      api.listTickets().catch(() => ({ items: [] })),
      api.getRoleSwitchStatus().catch(() => null),
    ]);

    setMyJobs(normalizeList(myJobsRes));
    setAlerts(normalizeList(alertsRes));
    setNotifications(normalizeList(notificationsRes));
    setUnread(Number(unreadRes?.unread || 0));
    setTickets(normalizeList(ticketsRes));
    setRoleSwitchStatus(switchRes?.request || null);
  }

  useEffect(() => {
    if (booting) return;
    let alive = true;

    (async () => {
      setError("");
      try {
        await loadBaseData();
        if (user && alive) {
          await loadAuthedData(user);
        }
      } catch (e) {
        if (alive) setError(e.message || "Yükləmə xətası baş verdi");
      }
    })();

    return () => {
      alive = false;
    };
  }, [booting, user]);

  async function refreshJobs() {
    const res = await api.listJobsWithSearch({
      q: search,
      lat: user?.location?.lat,
      lng: user?.location?.lng,
      radius_m: Number(radiusM) > 0 ? Number(radiusM) : undefined,
      daily: jobsMode === "daily" || dailyOnly || undefined,
      jobType: jobType || undefined,
      minWage: minWage || undefined,
      maxWage: maxWage || undefined,
      categories: category || undefined,
    });
    setJobs(normalizeList(res));
  }

  async function reverseGeocode(latValue, lngValue) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(latValue))}&lon=${encodeURIComponent(String(lngValue))}&accept-language=az`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) throw new Error("Lokasiya ünvanı tapılmadı");
      const data = await res.json();
      return data?.display_name || "Cari məkan";
    } catch {
      return "Cari məkan";
    }
  }

  function maybeOpenLocationPrompt(nextUser) {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    if (hasSavedLocation(nextUser)) return;
    setLocationPromptOpen(true);
  }

  async function requestLocationActivation(nextUser, authTokenValue = token, refreshTokenValue = refreshToken) {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Bu cihazda lokasiya xidməti dəstəklənmir");
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const nextLat = position.coords.latitude;
          const nextLng = position.coords.longitude;
          const address = await reverseGeocode(nextLat, nextLng);
          const userWithLocation = {
            ...(nextUser || {}),
            location: {
              address,
              lat: nextLat,
              lng: nextLng,
            },
          };

          setLat(String(nextLat));
          setLng(String(nextLng));
          setLocationText(address);
          setUser(userWithLocation);
          setLocationPromptOpen(false);
          saveAuth({
            token: authTokenValue || null,
            refreshToken: refreshTokenValue || null,
            user: userWithLocation,
          });

          try {
            await api.updateMyLocation(userWithLocation.location);
            setOk("Lokasiya uğurla aktivləşdirildi");
          } catch (locationError) {
            setError(locationError.message || "Lokasiya yenilənmədi");
          }

          resolve(true);
        },
        () => {
          setOk("Yaxınlıqdakı elanları görmək üçün lokasiya icazəsini aktivləşdirə bilərsiniz");
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  async function handleLocationActivation() {
    if (!user) return;

    setLocationLoading(true);
    setError("");

    try {
      await requestLocationActivation(user, token, refreshToken);
    } finally {
      setLocationLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const res = await api.login({ email, password });
      const nextUser = { ...(res.user || {}), role: normalizeRole(res?.user?.role) || role };

      setUser(nextUser);
      setToken(res.token);
      setRefreshTokenState(res.refreshToken || null);
      setAuthToken(res.token);
      setRefreshToken(res.refreshToken || null);
      saveAuth({ token: res.token, refreshToken: res.refreshToken || null, user: nextUser });

      setActiveSection("home");
      setOk("Giriş uğurla tamamlandı");
      maybeOpenLocationPrompt(nextUser);
      await loadAuthedData(nextUser);
    } catch (err) {
      setError(err.message || "Giriş alınmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      if (password !== confirmPassword) throw new Error("Şifrələr eyni deyil");

      const payload = {
        role,
        fullName,
        companyName: role === "employer" ? companyName : undefined,
        category: role === "employer" ? registerCategory || undefined : undefined,
        email,
        password,
        phone,
      };

      const res = await api.register(payload);
      if (res?.needsOtp) {
        setOtpPayload(payload);
        setMode("verifyOtp");
        setOk("OTP kodu e-poçt ünvanınıza göndərildi");
      } else if (res?.token) {
        await handleLogin({ preventDefault: () => {} });
      }
    } catch (err) {
      setError(err.message || "Qeydiyyat alınmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const base = otpPayload || {
        email,
        password,
        role,
        fullName,
        companyName,
        phone,
      };

      const res = await api.verifyOtp({
        email: base.email,
        password: base.password,
        role: base.role,
        fullName: base.fullName,
        companyName: base.companyName,
        phone: base.phone,
        code: otp,
      });

      if (res?.pendingApproval) {
        setMode("login");
        setOk("Hesabınız yoxlanış üçün göndərildi");
      } else if (res?.token) {
        const nextUser = { ...(res.user || {}), role: normalizeRole(res?.user?.role) || base.role };
        setUser(nextUser);
        setToken(res.token);
        setRefreshTokenState(res.refreshToken || null);
        setAuthToken(res.token);
        setRefreshToken(res.refreshToken || null);
        saveAuth({ token: res.token, refreshToken: res.refreshToken || null, user: nextUser });
        setActiveSection("home");
        setOk("Hesabınız təsdiqləndi və giriş tamamlandı");
        maybeOpenLocationPrompt(nextUser);
        await loadAuthedData(nextUser);
      }
    } catch (err) {
      setError(err.message || "OTP təsdiqi alınmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      await api.forgotPassword(forgotEmail);
      setOk("Bərpa kodu e-poçt ünvanınıza göndərildi");
      setMode("resetPassword");
      setEmail(forgotEmail);
    } catch (err) {
      setError(err.message || "Şifrə bərpa sorğusu alınmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const res = await api.resetPassword({ email, code: resetCode, password: resetPassword });
      if (res?.token) {
        const nextUser = { ...(res.user || {}), role: normalizeRole(res?.user?.role) || null };
        setUser(nextUser);
        setToken(res.token);
        setRefreshTokenState(res.refreshToken || null);
        setAuthToken(res.token);
        setRefreshToken(res.refreshToken || null);
        saveAuth({ token: res.token, refreshToken: res.refreshToken || null, user: nextUser });
        setActiveSection("home");
        maybeOpenLocationPrompt(nextUser);
      }
      setOk("Şifrə uğurla yeniləndi");
    } catch (err) {
      setError(err.message || "Şifrə yenilənmədi");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    setUser(null);
    setToken(null);
    setRefreshTokenState(null);
    clearAuthToken();
    clearAuth();
    setActiveSection("home");
    setLocationPromptOpen(false);
    setOk("Hesabdan çıxış edildi");
  }

  function resetJobForm() {
    setEditingJobId(null);
    setTitle("");
    setCompanyObject("");
    setWage("");
    setDescription("");
    setLink("");
    setVoen("");
    setScheduleStart("");
    setScheduleEnd("");
    setDurationPreset("1");
    setCustomDurationDays("");
    setDurationDays("1");
    setPublishMode("instant");
    setPublishAt("");
  }

  function startEditJob(job) {
    if (!job) return;

    const nextJobType = job.jobType || job.job_type || (job.isDaily ? "temporary" : "permanent");
    const nextDuration = Number(job.durationDays ?? job.duration_days ?? 1);
    const nextDurationPreset = [1, 3, 10].includes(nextDuration) ? String(nextDuration) : "other";
    const nextPublishAt = job.publishedAt || job.published_at || "";

    setEditingJobId(job.id);
    setTitle(job.title || "");
    setCompanyObject(job.companyName || job.company_name || "");
    setWage(job.wage || "");
    setCategory(job.category || "");
    setWhatsapp(job.whatsapp || "+994");
    setContactPhone(job.phone || "+994");
    setLink(job.link || "");
    setVoen(job.voen || "");
    setDescription(job.description || "");
    setJobType(nextJobType || "permanent");
    setDurationPreset(nextDurationPreset);
    setCustomDurationDays(nextDurationPreset === "other" ? String(nextDuration || "") : "");
    setDurationDays(String(nextDuration || "1"));
    setWorkType(job.work_type || "full_time");
    setPublishMode(nextPublishAt ? "scheduled" : "instant");
    setPublishAt(toDateTimeLocal(nextPublishAt));

    if (job.location) {
      setLocationText(job.location.address || "");
      setLat(String(job.location.lat || "40.4093"));
      setLng(String(job.location.lng || "49.8671"));
    }

    setActiveSection("create");
    setOk("Elan redaktə rejimində açıldı");
  }

  async function handleCreateJob(e) {
    e.preventDefault();
    if (!user?.id) return;
    if (roleName !== "employer") {
      setError("Elan yaratmaq yalnız işçi axtaran profili üçün aktivdir");
      setActiveSection("profile");
      return;
    }

    setLoading(true);
    setError("");
    setOk("");

    try {
      const resolvedDuration =
        jobType === "temporary"
          ? durationPreset === "other"
            ? customDurationDays
            : durationPreset
          : "";
      const durationLabel = jobType === "temporary" ? `${resolvedDuration} gün` : "";
      if (publishMode === "scheduled" && (!publishAt || new Date(publishAt).getTime() <= Date.now())) {
        throw new Error("Planlı yayım üçün gələcək tarix və saat seçin");
      }

      const payload = {
        title,
        wage,
        category,
        whatsapp,
        phone: contactPhone,
        link,
        voen,
        description: buildJobDetailsText({
          companyObject,
          scheduleStart,
          scheduleEnd,
          publishMode,
          publishAt,
          durationLabel,
          description,
        }),
        companyName: roleName === "employer" ? companyName || user?.companyName : undefined,
        createdBy: user.id,
        jobType: jobType || (roleName === "seeker" ? "seeker" : "permanent"),
        isDaily: jobType === "temporary",
        durationDays: jobType === "temporary" ? Number(resolvedDuration || 0) : undefined,
        work_type: workType || undefined,
        start_time: formatTimeFromDateTime(scheduleStart),
        end_time: formatTimeFromDateTime(scheduleEnd),
        notifyRadiusM: Number(radiusM) > 0 ? Number(radiusM) : 500,
        publishMode,
        publishedAt: publishMode === "scheduled" ? new Date(publishAt).toISOString() : null,
        location: {
          address: locationText || "Bakı",
          lat: Number(lat),
          lng: Number(lng),
        },
      };

      if (editingJobId) {
        await api.updateJob(editingJobId, payload);
        setOk("Elan yeniləndi");
      } else {
        await api.createJob(payload);
        setOk("Elan yaradıldı");
      }

      resetJobForm();

      await loadAuthedData();
      await refreshJobs();
      if (roleName === "employer") setActiveSection("profile");
    } catch (err) {
      setError(err.message || "Elan yaradılmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseJob(id) {
    try {
      await api.closeJob(id, { reason: "filled" });
      setOk("Elan bağlandı");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Bağlama mümkün olmadı");
    }
  }

  async function handleReopenJob(id) {
    try {
      await api.reopenJob(id);
      setOk("Elan yenidən açıldı");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Yenidən açmaq mümkün olmadı");
    }
  }

  async function handleCreateAlert(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      await api.createAlert({
        category: alertCategory || undefined,
        radius_m: Number(alertRadius || 0),
        q: alertKeywords || undefined,
      });
      setOk("İş bildirişi yaradıldı");

      setAlertCategory("");
      setAlertRadius("500");
      setAlertKeywords("");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bildiriş yaradılmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAlert(id) {
    try {
      await api.deleteAlert(id);
      setOk("Bildiriş silindi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bildiriş silinmədi");
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setOk("Bütün bildirişlər oxundu kimi işarələndi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Əməliyyat alınmadı");
    }
  }

  async function handleOpenNotification(notification) {
    try {
      await api.markNotificationRead(notification.id);
      const jobId = notification?.data?.jobId;
      if (jobId) {
        router.push(`/jobs/${jobId}`);
        return;
      }
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bildiriş açılmadı");
    }
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      await api.createTicket({ category: ticketCategory, message: ticketMessage });
      setTicketMessage("");
      setOk("Dəstək bileti yaradıldı");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bilet yaradılmadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(ticketId) {
    const text = ticketReply[ticketId]?.trim();
    if (!text) return;

    try {
      await api.replyTicket(ticketId, text);
      setTicketReply((prev) => ({ ...prev, [ticketId]: "" }));
      setOk("Cavab göndərildi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Cavab göndərilmədi");
    }
  }

  async function handleDeleteTicket(ticketId) {
    try {
      await api.deleteTicket(ticketId);
      setOk("Bilet silindi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bilet silinmedi");
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const nextUser = {
        ...(user || {}),
        fullName: editingName,
        phone: editingPhone,
        location: {
          address: locationText || user?.location?.address || "Bakı",
          lat: Number(lat),
          lng: Number(lng),
        },
      };

      await api.updateProfile({ fullName: editingName });
      await api.updateProfile({ phone: editingPhone });
      await api.updateMyLocation(nextUser.location);

      setUser(nextUser);
      saveAuth({ token, refreshToken, user: nextUser });
      setOk("Profil yeniləndi");
    } catch (err) {
      setError(err.message || "Profil yenilənmədi");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Hesabı silmək istədiyinizə əminsiniz?")) return;

    try {
      await api.deleteMyAccount("İstifadəçi veb üzərindən hesabını sildi");
      handleSignOut();
    } catch (err) {
      setError(err.message || "Hesab silinmədi");
    }
  }

  async function handleRoleSwitch(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      if (roleName === "seeker") {
        await api.requestRoleSwitch({
          toRole: "employer",
          companyName: switchCompany,
          voen: switchVoen || undefined,
          category: category || undefined,
        });
      } else {
        await api.requestRoleSwitch({ toRole: "seeker" });
      }

      setOk("Rol dəyişikliyi sorğusu göndərildi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Rol dəyişikliyi alınmadı");
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = useMemo(() => {
    const minN = minWage ? Number(minWage) : null;
    const maxN = maxWage ? Number(maxWage) : null;

    return jobs.filter((job) => {
      const matchSearch = !search || String(job?.title || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = !category || String(job?.category || "").toLowerCase().includes(category.toLowerCase());
      const matchDaily = jobsMode !== "daily" || job?.isDaily || job?.jobType === "temporary";
      const wageNumber = extractWageNumber(job?.wage);
      const matchMin = minN === null || !Number.isFinite(minN) || (wageNumber !== null && wageNumber >= minN);
      const matchMax = maxN === null || !Number.isFinite(maxN) || (wageNumber !== null && wageNumber <= maxN);
      return matchSearch && matchCategory && matchDaily && matchMin && matchMax;
    });
  }, [jobs, search, category, jobsMode, minWage, maxWage]);

  const shownJobs = filteredJobs;
  const profileJobs = useMemo(() => {
    return myJobs.filter((job) => {
      const status = getJobStatus(job);
      if (myJobsStatus === "pending") return status === "pending" || status === "scheduled";
      return status === myJobsStatus;
    });
  }, [myJobs, myJobsStatus]);

  function openJobDetail(jobId) {
    router.push(`/jobs/${jobId}`);
  }

  function prefetchJobDetail(jobId) {
    if (!jobId || prefetchedJobIds.current.has(jobId)) return;

    prefetchedJobIds.current.add(jobId);
    router.prefetch(`/jobs/${jobId}`);
  }

  if (booting) {
    return (
      <main className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <h2 className={styles.loadingTitle}>Yüklənir</h2>
          <p className={styles.loadingText}>Platforma hazırlanır, zəhmət olmasa bir neçə saniyə gözləyin.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        navItems={navItems}
        user={user}
        handleSignOut={handleSignOut}
        canCreateJob={canCreateJob}
      />
      <LocationPermissionPrompt
        isOpen={locationPromptOpen}
        user={user}
        locationLoading={locationLoading}
        onActivate={handleLocationActivation}
        onDismiss={() => setLocationPromptOpen(false)}
      />
      {error ? <div className="container notice error">{error}</div> : null}
      {ok ? <div className="container notice success">{ok}</div> : null}

      {activeSection === "home" ? (
        <>
          <HomeHero
            search={search}
            setSearch={setSearch}
            jobsCount={jobs.length}
            categoriesCount={categories.length}
            onSubmit={(event) => {
              event.preventDefault();
              setActiveSection("jobs");
            }}
          />

          <section className="container page-section">
            <header className="section-head">
              <h2>Son elanlar</h2>
            </header>
            <div className={`cards-grid ${styles.latestJobsGrid}`}>
              {jobs.slice(0, 6).map((job) => (
                <JobCard key={job.id} job={job} onClick={() => openJobDetail(job.id)} onPrefetch={() => prefetchJobDetail(job.id)} />
              ))}
            </div>
          </section>

          <JobsMap jobs={jobs} />
          <AppLaunchPanel />
        </>
      ) : null}

      {activeSection === "jobs" ? (
        <section className="container page-section">
          <header className="mobile-web-head">
            <div>
              <span className="mobile-web-kicker">Asimos</span>
              <h2>{jobsMode === "daily" ? "Gündəlik işlər" : "İş elanları"}</h2>
              <p>{jobsMode === "daily" ? "Yalnız müvəqqəti və günlük elanlar" : "Mobil tətbiqdəki Jobs axınına uyğun axtarış"}</p>
            </div>
            <div className="mobile-web-actions">
              {user ? <button type="button" className="icon-action" onClick={() => setActiveSection("notifications")}>{unread || ""}</button> : null}
              <button type="button" className="icon-action" onClick={() => setActiveSection("jobs")}>⌕</button>
            </div>
          </header>

          <div className="segmented-tabs">
            <button type="button" className={jobsMode === "all" ? "active" : ""} onClick={() => setJobsMode("all")}>
              Jobs
            </button>
            <button type="button" className={jobsMode === "daily" ? "active" : ""} onClick={() => setJobsMode("daily")}>
              Daily
            </button>
          </div>

          <form
            className="filter-panel"
            onSubmit={(e) => {
              e.preventDefault();
              refreshJobs();
            }}
          >
            <label>
              Açar sözlər
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Məs: ofisiant, kuryer" />
            </label>
            <label>
              Kateqoriya
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">İstənilən kateqoriya</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label>
              İş rejimi
              <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                <option value="">Fərqi yoxdur</option>
                <option value="permanent">Daimi</option>
                <option value="temporary">Müvəqqəti</option>
                <option value="seeker">İş axtaran elanı</option>
              </select>
            </label>
            <label>
              Min maaş
              <input value={minWage} onChange={(e) => setMinWage(e.target.value)} inputMode="numeric" placeholder="məs: 400" />
            </label>
            <label>
              Max maaş
              <input value={maxWage} onChange={(e) => setMaxWage(e.target.value)} inputMode="numeric" placeholder="məs: 1200" />
            </label>
            <label>
              Məsafə
              <select value={radiusM} onChange={(e) => setRadiusM(e.target.value)}>
                <option value="0">Ölkə üzrə</option>
                <option value="1000">1 km</option>
                <option value="5000">5 km</option>
                <option value="10000">10 km</option>
              </select>
            </label>
            <div className="filter-actions">
              <button type="submit" className="btn-primary">Axtar</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setJobType("");
                  setMinWage("");
                  setMaxWage("");
                  setRadiusM("0");
                  setJobsMode("all");
                }}
              >
                Sıfırla
              </button>
            </div>
          </form>

          <div className="mobile-job-list">
            {shownJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => openJobDetail(job.id)}
                onPrefetch={() => prefetchJobDetail(job.id)}
                showEdit={(job?.createdBy || job?.created_by) === user?.id}
                onEdit={() => startEditJob(job)}
              />
            ))}
          </div>

          {shownJobs.length === 0 ? <p className="muted">Elan tapılmadı.</p> : null}

        </section>
      ) : null}

      {activeSection === "create" && canCreateJob ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>{editingJobId ? "Elanı redaktə et" : "İşçi axtaran profili üçün elan yarat"}</h2>
            <p>{editingJobId ? "Məlumatları yeniləyin və yenidən yadda saxlayın." : "Elan məlumatlarını doldurun, xəritədə ünvan seçin və yayımlanma formasını müəyyən edin."}</p>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <form className="form-grid" onSubmit={handleCreateJob}>
              <label>
                Elanın adı
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>

              <label>
                Şirkət / obyekt
                <input value={companyObject} onChange={(e) => setCompanyObject(e.target.value)} placeholder="Direkt və ya obyekt adı" />
              </label>

              <label>
                İş növü
                <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                  <option value="permanent">Daimi iş</option>
                  <option value="temporary">Müvəqqəti iş</option>
                </select>
              </label>

              <label>
                Kateqoriya
                <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                  <option value="">Seçin</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              {jobType === "temporary" ? (
                <>
                  <label>
                    Müddət
                    <select
                      value={durationPreset}
                      onChange={(e) => {
                        setDurationPreset(e.target.value);
                        setDurationDays(e.target.value);
                      }}
                    >
                      <option value="1">1 gün</option>
                      <option value="3">3 gün</option>
                      <option value="10">10 gün</option>
                      <option value="other">Digər</option>
                    </select>
                  </label>

                  {durationPreset === "other" ? (
                    <label>
                      Gün sayı
                      <input value={customDurationDays} onChange={(e) => setCustomDurationDays(e.target.value)} placeholder="Məsələn 7" />
                    </label>
                  ) : null}
                </>
              ) : null}

              <label>
                Maaş
                <input value={wage} onChange={(e) => setWage(e.target.value)} />
              </label>

              <label>
                Başlama saatı
                <input type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} />
              </label>

              <label>
                Bitmə saatı
                <input type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} />
              </label>

              <label>
                Link əlavə et
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
              </label>

              <label>
                VOEN
                <input value={voen} onChange={(e) => setVoen(e.target.value)} />
              </label>

              <label>
                Whatsapp
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </label>

              <label>
                Əlaqə nömrəsi
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </label>

              <label>
                Elanın yayımı
                <select value={publishMode} onChange={(e) => setPublishMode(e.target.value)}>
                  <option value="instant">Dərhal</option>
                  <option value="scheduled">Planlı</option>
                </select>
              </label>

              {publishMode === "scheduled" ? (
                <label>
                  Tarix və saat
                  <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
                </label>
              ) : null}

              <label className="full-row">
                Təsvir
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} required />
              </label>

              <div className="full-row create-map-shell">
                <div className="create-map-head">
                  <strong>Lokasiya</strong>
                  <span>Azərbaycan xəritəsi üzərində ünvan axtarın və ya xəritədən birbaşa seçin.</span>
                </div>
                <LocationPicker
                  lat={lat}
                  lng={lng}
                  address={locationText}
                  onChange={({ lat: nextLat, lng: nextLng, address: nextAddress }) => {
                    setLat(nextLat);
                    setLng(nextLng);
                    setLocationText(nextAddress);
                  }}
                />
              </div>

              <div className="full-row">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {editingJobId ? "Dəyişiklikləri saxla" : "Elanı yadda saxla"}
                </button>
                {editingJobId ? (
                  <button type="button" className="btn-secondary" onClick={resetJobForm}>
                    Redaktəni ləğv et
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      {activeSection === "alerts" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>İş bildirişləri</h2>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <>
              <form className="form-grid compact" onSubmit={handleCreateAlert}>
                <label>
                  Kateqoriya
                  <select value={alertCategory} onChange={(e) => setAlertCategory(e.target.value)}>
                    <option value="">Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Radius (m)
                  <input value={alertRadius} onChange={(e) => setAlertRadius(e.target.value)} />
                </label>

                <label>
                  Açar sözlər
                  <input value={alertKeywords} onChange={(e) => setAlertKeywords(e.target.value)} />
                </label>

                <div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    Yarat
                  </button>
                </div>
              </form>

              <div className="stack-list">
                {alerts.map((item) => (
                  <div key={item.id} className="line-item">
                    <div>
                      <strong>{item.category || "Ümumi"}</strong>
                      <p>
                        Radius: {item.radius_m || item.radius || "-"}m | Söz: {item.q || item.query || "-"}
                      </p>
                    </div>
                    <button type="button" className="btn-secondary" onClick={() => handleDeleteAlert(item.id)}>
                      Sil
                    </button>
                  </div>
                ))}
                {alerts.length === 0 ? <p className="muted">Heç bir bildiriş yoxdur.</p> : null}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activeSection === "notifications" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Bildirişlər</h2>
            <button type="button" className="btn-secondary" onClick={handleMarkAllRead}>
              Hamısını oxundu et
            </button>
          </header>

          <div className="stack-list">
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`notification-card ${item.readAt || item.read_at ? "read" : ""}`}
                onClick={() => handleOpenNotification(item)}
              >
                <strong>{item.title || "Bildiriş"}</strong>
                <p>{item.body || item.message || "Mesaj yoxdur"}</p>
              </button>
            ))}
            {notifications.length === 0 ? <p className="muted">Bildiriş yoxdur.</p> : null}
          </div>
        </section>
      ) : null}

      {activeSection === "profile" ? (
        <section className="container page-section profile-page">
          <header className="profile-hero">
            <div className="profile-identity">
              <div className="profile-avatar">{String(editingName || user?.fullName || user?.companyName || "A").trim()[0]?.toUpperCase()}</div>
              <div>
                <span className="profile-eyebrow">{roleName === "employer" ? "İşçi axtaran profil" : "İş axtaran profil"}</span>
                <h2>{editingName || user?.fullName || user?.companyName || "Profil"}</h2>
                <p>{editingPhone || user?.phone || "Telefon qeyd edilməyib"}</p>
              </div>
            </div>
            <div className="profile-stats">
              <div>
                <span>{roleName === "employer" ? myJobs.length : alerts.length}</span>
                <small>{roleName === "employer" ? "Elan" : "Bildiriş"}</small>
              </div>
              <div>
                <span>{unread}</span>
                <small>Oxunmamış</small>
              </div>
              <div>
                <span>{hasSavedLocation(user) ? "Aktiv" : "Yoxdur"}</span>
                <small>Lokasiya</small>
              </div>
            </div>
          </header>

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
                    <small>Görünən ad, telefon və əsas lokasiya</small>
                  </div>

                  <div className="profile-fields">
                    <label>
                      Ad Soyad
                      <input value={editingName} onChange={(e) => setEditingName(e.target.value)} required />
                    </label>

                    <label>
                      Telefon
                      <input value={editingPhone} onChange={(e) => setEditingPhone(e.target.value)} required />
                    </label>

                    <label className="full-row">
                      Ünvan
                      <input value={locationText} onChange={(e) => setLocationText(e.target.value)} />
                    </label>

                    <label>
                      Lat
                      <input value={lat} onChange={(e) => setLat(e.target.value)} />
                    </label>

                    <label>
                      Lng
                      <input value={lng} onChange={(e) => setLng(e.target.value)} />
                    </label>
                  </div>

                  <div className="profile-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      Profili yenilə
                    </button>
                    <button type="button" className="btn-danger" onClick={handleDeleteAccount}>
                      Hesabı sil
                    </button>
                  </div>
                </form>

                {roleName === "employer" ? (
                  <section className="profile-panel profile-jobs-section">
                    <div className="profile-panel-head">
                      <div>
                        <span>İdarəetmə</span>
                        <h3>Mənim elanlarım</h3>
                      </div>
                      <small>{myJobs.length} aktiv və ya arxiv elan</small>
                    </div>

                    <div className="status-tabs">
                      {[
                        ["open", "Aktiv"],
                        ["pending", "Gözləyən"],
                        ["rejected", "Rədd edilib"],
                        ["closed", "Deaktiv"],
                      ].map(([value, label]) => (
                        <button key={value} type="button" className={myJobsStatus === value ? "active" : ""} onClick={() => setMyJobsStatus(value)}>
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="profile-jobs-list">
                      {profileJobs.map((job) => (
                        <article key={job.id} className="profile-job-card">
                          <div>
                            <h3>{job.title || "Adsız elan"}</h3>
                            <p>{job.description || "Təsvir yoxdur"}</p>
                            <div className="meta-row">
                              <span>{getJobStatus(job)}</span>
                              <span>{job.jobType || "permanent"}</span>
                            </div>
                          </div>
                          <div className="profile-job-actions">
                            <button type="button" className="btn-secondary" onClick={() => startEditJob(job)}>
                              Redaktə et
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => handleCloseJob(job.id)}>
                              Bağla
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => handleReopenJob(job.id)}>
                              Yenidən aç
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    {profileJobs.length === 0 ? <p className="muted">Bu statusda elan yoxdur.</p> : null}
                  </section>
                ) : null}
              </div>

              <aside className="profile-side-column">
                <form className="profile-panel role-panel" onSubmit={handleRoleSwitch}>
                  <div className="profile-panel-head">
                    <div>
                      <span>Rol</span>
                      <h3>Rol dəyişikliyi</h3>
                    </div>
                    <small>{roleSwitchStatus ? `Status: ${roleSwitchStatus.status}` : "Yeni sorğu göndərin"}</small>
                  </div>
                  {roleName === "seeker" ? (
                    <div className="profile-fields single">
                      <label>
                        Şirkət adı
                        <input value={switchCompany} onChange={(e) => setSwitchCompany(e.target.value)} required />
                      </label>
                      <label>
                        VOEN
                        <input value={switchVoen} onChange={(e) => setSwitchVoen(e.target.value)} />
                      </label>
                    </div>
                  ) : (
                    <p className="muted">Hazırda işçi axtaran profili ilə istifadə edirsiniz.</p>
                  )}
                  <button type="submit" className="btn-secondary" disabled={loading}>
                    Sorğu göndər
                  </button>
                </form>
              </aside>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeSection === "support" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Dəstək mərkəzi</h2>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <>
              <form className="form-grid" onSubmit={handleCreateTicket}>
                <label>
                  Kateqoriya
                  <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                    <option value="general">Ümumi</option>
                    <option value="technical">Texniki</option>
                    <option value="account">Hesab</option>
                    <option value="payment">Ödəniş</option>
                  </select>
                </label>

                <label className="full-row">
                  Mesaj
                  <textarea value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} rows={4} required />
                </label>

                <div className="full-row">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    Bilet yarat
                  </button>
                </div>
              </form>

              <div className="stack-list">
                {tickets.map((ticket) => (
                  <article key={ticket.id} className="ticket-item">
                    <h4>{ticket.category || "Ticket"}</h4>
                    <p>{ticket.message}</p>

                    {Array.isArray(ticket.replies) ? (
                      <div className="reply-block">
                        {ticket.replies.map((reply) => (
                          <p key={reply.id}>- {reply.message}</p>
                        ))}
                      </div>
                    ) : null}

                    <div className="actions-row">
                      <input
                        value={ticketReply[ticket.id] || ""}
                        onChange={(e) => setTicketReply((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                        placeholder="Cavab yaz"
                      />
                      <button type="button" className="btn-secondary" onClick={() => handleReply(ticket.id)}>
                        Göndər
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => handleDeleteTicket(ticket.id)}>
                        Sil
                      </button>
                    </div>
                  </article>
                ))}
                {tickets.length === 0 ? <p className="muted">Bilet yoxdur.</p> : null}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activeSection === "terms" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Qaydalar və şərtlər</h2>
          </header>
          <div className="terms-box">{terms}</div>
          <div className="actions-row">
            <Link href="/policy" className="btn-secondary">
              Siyasət səhifəsinə keç
            </Link>
          </div>
        </section>
      ) : null}

      {activeSection === "auth" ? (
        <AuthSection
          mode={mode}
          setMode={setMode}
          loading={loading}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          fullName={fullName}
          setFullName={setFullName}
          companyName={companyName}
          setCompanyName={setCompanyName}
          phone={phone}
          setPhone={setPhone}
          role={role}
          setRole={setRole}
          registerCategory={registerCategory}
          setRegisterCategory={setRegisterCategory}
          categories={categories}
          otp={otp}
          setOtp={setOtp}
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          resetCode={resetCode}
          setResetCode={setResetCode}
          resetPassword={resetPassword}
          setResetPassword={setResetPassword}
          showResetPassword={showResetPassword}
          setShowResetPassword={setShowResetPassword}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          handleVerifyOtp={handleVerifyOtp}
          handleForgotPassword={handleForgotPassword}
          handleResetPassword={handleResetPassword}
        />
      ) : null}
    </main>
  );
}
