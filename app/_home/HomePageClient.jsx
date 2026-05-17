"use client";

import Header from "../components/Header";
import JobCard from "../components/JobCard";
import LocationPicker from "../components/LocationPicker";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { api, clearAuthToken, setAuthToken, setRefreshToken, setTokenUpdateHandler } from "../../lib/api";
import { clearAuth, loadAuth, saveAuth } from "../../lib/auth-store";

import styles from "./HomePage.module.css";
import AuthSection from "./components/AuthSection";
import AppLaunchPanel from "./components/AppLaunchPanel";
import LocationPermissionPrompt from "./components/LocationPermissionPrompt";

const JobsMap = dynamic(() => import("../components/JobsMap"), {
  ssr: false,
  loading: () => (
    <section className="container page-section jobs-map-section">
      <header className="section-head jobs-map-head">
        <h2>Elanların xəritədə görünüşü</h2>
        <p>Xəritə yüklənir...</p>
      </header>
      <div className="jobs-map-shell card">
        <p className="jobs-map-empty">Xəritə modulu hazırlanır.</p>
      </div>
    </section>
  ),
});

const guestNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "about", label: "Haqqımızda" },
];

const seekerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "Elanlar" },
];

const employerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "Elanlar" },
];

const employerSupportCategories = [
  "Elan yükləyə bilmirəm",
  "Namizədlərlə əlaqə problemi",
  "Ödəniş problemi",
  "Hesab ilə bağlı problem",
  "Təklif və İradlar",
  "Digər",
];

const seekerSupportCategories = [
  "İşə müraciət edə bilmirəm",
  "Profilimi tamamlaya bilmirəm",
  "Hesab ilə bağlı problem",
  "Təklif və İradlar",
  "Digər",
];

const cityOptions = [
  "Bakı",
  "Sumqayıt",
  "Gəncə",
  "Mingəçevir",
  "Şəki",
  "Lənkəran",
  "Şirvan",
  "Naxçıvan",
  "Quba",
  "Xaçmaz",
  "Masallı",
  "Salyan",
];

const vacancyTypeOptions = [
  { label: "Növbə əsasında", value: "shift" },
  { label: "Tam ştat", value: "full_time" },
  { label: "Daimi", value: "permanent" },
  { label: "Frilans", value: "freelance" },
  { label: "Komisyon haqqı", value: "commission" },
  { label: "Könüllü", value: "volunteer" },
  { label: "Mövsümi", value: "seasonal" },
  { label: "Müvəqqəti", value: "temporary" },
  { label: "Təcrübə", value: "internship" },
  { label: "Təqaüd proqramı", value: "scholarship" },
  { label: "Yarım ştat", value: "part_time" },
];

const jobLevelOptions = [
  { label: "Təcrübəsiz", value: "entry" },
  { label: "Junior", value: "junior" },
  { label: "Middle", value: "middle" },
  { label: "Senior", value: "senior" },
  { label: "Menecer", value: "manager" },
  { label: "Rəhbər", value: "lead" },
];

const salaryRangeOptions = [
  { label: "0 - 500 AZN", min: "0", max: "500" },
  { label: "500 - 1000 AZN", min: "500", max: "1000" },
  { label: "1000 - 1500 AZN", min: "1000", max: "1500" },
  { label: "1500 - 2500 AZN", min: "1500", max: "2500" },
  { label: "2500+ AZN", min: "2500", max: "" },
];


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeRole(role) {
  const raw = String(role || "").trim().toLowerCase();
  if (["seeker", "is axtaran", "alici", "jobseeker"].includes(raw)) return "seeker";
  if (["employer", "isci axtaran", "satici", "hirer", "company"].includes(raw)) return "employer";
  return null;
}

function formatNotificationTime(value) {
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

function getNotificationJobId(notification) {
  return notification?.data?.jobId || notification?.data?.job_id || notification?.jobId || notification?.job_id || null;
}

function getNotificationCreatedAt(notification) {
  return notification?.createdAt || notification?.created_at || notification?.date || notification?.updatedAt || notification?.updated_at || null;
}

function getNotificationTone(notification) {
  const text = `${notification?.title || ""} ${notification?.body || ""} ${notification?.message || ""}`.toLowerCase();
  if (text.includes("yaxın") || text.includes("near")) return "near";
  if (text.includes("müraciət") || text.includes("apply")) return "apply";
  if (text.includes("elan")) return "job";
  return "general";
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

function isPublicHomeJob(job) {
  if (!job?.id || !String(job?.title || "").trim()) return false;

  const status = getJobStatus(job);
  return !["closed", "deleted", "inactive", "rejected", "draft"].includes(status);
}

function hasJobCoordinates(job) {
  const lat = Number(job?.location?.lat ?? job?.lat);
  const lng = Number(job?.location?.lng ?? job?.lng ?? job?.lon);

  return Number.isFinite(lat) && Number.isFinite(lng);
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

function getTicketSubject(ticket) {
  return ticket?.subject || ticket?.category || "Müraciət";
}

function getTicketMessages(ticket) {
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

export default function HomePageClient() {
  const router = useRouter();
  const prefetchedJobIds = useRef(new Set());
  const latestJobsCarouselRef = useRef(null);
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
  const [deviceLocation, setDeviceLocation] = useState(null);

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
  const [jobFilterOptions, setJobFilterOptions] = useState({ vacancyTypes: vacancyTypeOptions, jobLevels: jobLevelOptions, salaryRanges: salaryRangeOptions });
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [siteStats, setSiteStats] = useState(null);
  const [terms, setTerms] = useState("");
  const [unread, setUnread] = useState(0);

  const [search, setSearch] = useState("");
  const [searchSurface, setSearchSurface] = useState("global");
  const [focusedMapJobId, setFocusedMapJobId] = useState(null);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [activeHomeFilterTab, setActiveHomeFilterTab] = useState("type");
  const [activeCreateFilterTab, setActiveCreateFilterTab] = useState("type");
  const [dailyOnly, setDailyOnly] = useState(false);
  const [jobsMode, setJobsMode] = useState("all");
  const [minWage, setMinWage] = useState("");
  const [maxWage, setMaxWage] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "",
    city: "",
    jobType: "",
    jobLevel: "",
    minWage: "",
    maxWage: "",
  });
  const [radiusM, setRadiusM] = useState("0");
  const [myJobsStatus, setMyJobsStatus] = useState("open");
  const [editingJobId, setEditingJobId] = useState(null);

  const [title, setTitle] = useState("");
  const [companyObject, setCompanyObject] = useState("");
  const [wage, setWage] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("+994");
  const [contactPhone, setContactPhone] = useState("+994");
  const [contactEmail, setContactEmail] = useState("");
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
  const [jobImagePreview, setJobImagePreview] = useState("");
  const [lat, setLat] = useState("40.4093");
  const [lng, setLng] = useState("49.8671");

  const [alertCategory, setAlertCategory] = useState("");
  const [alertRadius, setAlertRadius] = useState("500");
  const [alertKeywords, setAlertKeywords] = useState("");

  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketReply, setTicketReply] = useState({});
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportMode, setSupportMode] = useState("list");
  const [activeTicketId, setActiveTicketId] = useState(null);

  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [switchCompany, setSwitchCompany] = useState("");
  const [switchVoen, setSwitchVoen] = useState("");
  const [roleSwitchStatus, setRoleSwitchStatus] = useState(null);
  const [roleSwitchConfirmOpen, setRoleSwitchConfirmOpen] = useState(false);

  const roleName = normalizeRole(user?.role);
  const canCreateJob = roleName === "employer";
  const navItems = roleName === "employer" ? employerNav : roleName === "seeker" ? seekerNav : guestNav;

  const navTitle = roleName === "employer" ? "İşçi axtaran" : roleName === "seeker" ? "İş axtaran" : "Qonaq";
  const nextRoleName = roleName === "seeker" ? "employer" : roleName === "employer" ? "seeker" : null;
  const nextRoleLabel = nextRoleName === "employer" ? "İşçi axtaran" : nextRoleName === "seeker" ? "İş axtaran" : "Yeni rol";
  const supportCategories = roleName === "employer" ? employerSupportCategories : seekerSupportCategories;
  const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) || null;
  const effectiveLocation = user?.location || deviceLocation || null;
  const homeJobs = useMemo(() => jobs.filter(isPublicHomeJob), [jobs]);
  const homeMapJobs = useMemo(() => homeJobs.filter(hasJobCoordinates), [homeJobs]);
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !Boolean(item.readAt || item.read_at)),
    [notifications]
  );
  const activeUnreadCount = unreadNotifications.length;
  const hasHomeJobs = homeJobs.length > 0;
  const hasHomeMapJobs = homeMapJobs.length > 0;

  useEffect(() => {
    if (!user && activeSection !== "home" && activeSection !== "about" && activeSection !== "auth") {
      setActiveSection("auth");
    }
  }, [user, activeSection]);

  useEffect(() => {
    if (activeSection === "daily") {
      setJobsMode("daily");
    } else if (activeSection === "jobs") {
      setJobsMode("all");
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "create" && roleName !== "employer") {
      setActiveSection(user ? "profile" : "auth");
    }
  }, [activeSection, roleName, user]);

  useEffect(() => {
    const savedDeviceLocation = (() => {
      try {
        return JSON.parse(window.localStorage.getItem("asimos_device_location") || "null");
      } catch {
        return null;
      }
    })();

    if (savedDeviceLocation?.lat && savedDeviceLocation?.lng) {
      setDeviceLocation(savedDeviceLocation);
      setLat(String(savedDeviceLocation.lat));
      setLng(String(savedDeviceLocation.lng));
      setLocationText(savedDeviceLocation.address || "Cari məkan");
    }

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
        setContactEmail(saved.user.email || "");
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

    const hasAnyLocation = hasSavedLocation(saved?.user) || Boolean(savedDeviceLocation?.lat && savedDeviceLocation?.lng);
    if (!hasAnyLocation && typeof navigator !== "undefined" && navigator.geolocation) {
      window.setTimeout(() => setLocationPromptOpen(true), 500);
    }
  }, []);

  async function loadBaseData() {
    const [categoryRes, jobsRes, termsRes, filterOptionsRes] = await Promise.all([
      api.listCategories().catch(() => ({ items: [] })),
      api
        .listJobsWithSearch({
          q: appliedFilters.search || undefined,
          lat: effectiveLocation?.lat,
          lng: effectiveLocation?.lng,
          daily: jobsMode === "daily" || dailyOnly || undefined,
          jobType: appliedFilters.jobType || undefined,
          jobLevel: appliedFilters.jobLevel || undefined,
          city: appliedFilters.city || undefined,
          minWage: appliedFilters.minWage || undefined,
          maxWage: appliedFilters.maxWage || undefined,
          categories: appliedFilters.category || undefined,
        })
        .catch(() => ({ items: [] })),
      api.getContent("terms").catch(() => null),
      api.getJobFilterOptions().catch(() => null),
    ]);

    setCategories(flattenCategories(categoryRes?.items || categoryRes));
    if (filterOptionsRes) {
      setJobFilterOptions({
        vacancyTypes: Array.isArray(filterOptionsRes.vacancyTypes) && filterOptionsRes.vacancyTypes.length ? filterOptionsRes.vacancyTypes : vacancyTypeOptions,
        jobLevels: Array.isArray(filterOptionsRes.jobLevels) && filterOptionsRes.jobLevels.length ? filterOptionsRes.jobLevels : jobLevelOptions,
        salaryRanges: Array.isArray(filterOptionsRes.salaryRanges) && filterOptionsRes.salaryRanges.length ? filterOptionsRes.salaryRanges : salaryRangeOptions,
      });
    }
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

    const latestRoleRequest = switchRes?.request || null;
    setRoleSwitchStatus(latestRoleRequest);

    const approvedRole = normalizeRole(latestRoleRequest?.status === "approved" ? latestRoleRequest?.to_role : null);
    const currentRole = normalizeRole(currentUser?.role);

    if (approvedRole && approvedRole !== currentRole) {
      const nextUser = {
        ...(currentUser || {}),
        role: approvedRole,
        companyName: approvedRole === "employer" ? latestRoleRequest?.company_name || currentUser?.companyName : null,
        company_name: approvedRole === "employer" ? latestRoleRequest?.company_name || currentUser?.company_name : null,
      };

      setUser(nextUser);
      saveAuth({ token, refreshToken, user: nextUser });
      setOk(`Rolunuz admin tərəfindən təsdiqləndi və profil ${approvedRole === "employer" ? "İşçi axtaran" : "İş axtaran"} olaraq yeniləndi`);
    }
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
  }, [booting, user, effectiveLocation?.lat, effectiveLocation?.lng]);

  async function refreshJobs(nextFilters = appliedFilters) {
    const filters = {
      search: nextFilters?.search ?? appliedFilters.search,
      category: nextFilters?.category ?? appliedFilters.category,
      city: nextFilters?.city ?? appliedFilters.city,
      jobType: nextFilters?.jobType ?? appliedFilters.jobType,
      jobLevel: nextFilters?.jobLevel ?? appliedFilters.jobLevel,
      minWage: nextFilters?.minWage ?? appliedFilters.minWage,
      maxWage: nextFilters?.maxWage ?? appliedFilters.maxWage,
    };

    const res = await api.listJobsWithSearch({
      q: filters.search || undefined,
      lat: effectiveLocation?.lat,
      lng: effectiveLocation?.lng,
      daily: jobsMode === "daily" || dailyOnly || undefined,
      jobType: filters.jobType || undefined,
      jobLevel: filters.jobLevel || undefined,
      city: filters.city || undefined,
      minWage: filters.minWage || undefined,
      maxWage: filters.maxWage || undefined,
      categories: filters.category || undefined,
    });
    const nextJobs = normalizeList(res);
    setJobs(nextJobs);
    return nextJobs;
  }

  useEffect(() => {
    if (booting) return;
    refreshJobs(appliedFilters).catch((err) => setError(err.message || "Elanlar yenilənmədi"));
  }, [jobsMode]);

  async function handleHeroSearchSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const heroFilters = { search, category, city, jobType, jobLevel, minWage, maxWage };
      setAppliedFilters(heroFilters);
      const nextJobs = await refreshJobs(heroFilters);

      if (searchSurface === "map") {
        const jobsWithCoords = nextJobs.filter((job) => {
          const latValue = Number(job?.location?.lat ?? job?.lat);
          const lngValue = Number(job?.location?.lng ?? job?.lng ?? job?.lon);
          return Number.isFinite(latValue) && Number.isFinite(lngValue);
        });

        if (!jobsWithCoords.length) {
          setFocusedMapJobId(null);
          setError("Bu axtarış üzrə xəritədə göstəriləcək koordinatlı elan tapılmadı.");
          return;
        }

        const normalizedSearch = String(search || "").trim().toLowerCase();
        const matchedJob =
          jobsWithCoords.find((job) => {
            if (!normalizedSearch) return true;

            const haystack = [
              job?.title,
              job?.companyName,
              job?.company_name,
              job?.category,
              job?.description,
              job?.location?.address,
              job?.address,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizedSearch);
          }) || jobsWithCoords[0];

        setFocusedMapJobId(matchedJob.id);
        window.setTimeout(() => {
          const mapSection = document.getElementById("home-jobs-map");
          mapSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        return;
      }

      setFocusedMapJobId(null);
      setJobsMode(search.toLowerCase().includes("gündəlik") ? "daily" : "all");
      setActiveSection("jobs");
    } catch (e) {
      setError(e.message || "Axtarış zamanı xəta baş verdi");
    } finally {
      setLoading(false);
    }
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

  function maybeOpenLocationPrompt(nextUser = user) {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    if (hasSavedLocation(nextUser) || deviceLocation) return;
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
          setDeviceLocation(userWithLocation.location);
          window.localStorage.setItem("asimos_device_location", JSON.stringify(userWithLocation.location));
          if (nextUser) {
            setUser(userWithLocation);
            saveAuth({
              token: authTokenValue || null,
              refreshToken: refreshTokenValue || null,
              user: userWithLocation,
            });
          }
          setLocationPromptOpen(false);

          if (nextUser) {
            try {
              await api.updateMyLocation(userWithLocation.location);
              setOk("Lokasiya uğurla aktivləşdirildi");
            } catch (locationError) {
              setError(locationError.message || "Lokasiya yenilənmədi");
            }
          } else {
            setOk("Cihaz lokasiyası aktivləşdirildi");
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

  async function openSupportModal() {
    if (!user) {
      setActiveSection("auth");
      return;
    }

    setSupportModalOpen(true);
    setSupportMode("list");
    setActiveTicketId(null);
    if (!ticketCategory) setTicketCategory((roleName === "employer" ? employerSupportCategories : seekerSupportCategories)[0] || "");
    await loadAuthedData(user);
  }

  function closeSupportModal() {
    setSupportModalOpen(false);
    setSupportMode("list");
    setActiveTicketId(null);
  }

  async function openTicketDetail(ticket) {
    setActiveTicketId(ticket.id);
    setSupportMode("detail");
    if (ticket.is_answered || ticket.status === "replied") {
      await api.markTicketRead(ticket.id).catch(() => null);
      await loadAuthedData();
    }
  }

  function resetJobForm() {
    setEditingJobId(null);
    setTitle("");
    setCompanyObject("");
    setWage("");
    setDescription("");
    setContactEmail(user?.email || "");
    setLink("");
    setVoen("");
    setScheduleStart("");
    setScheduleEnd("");
    setDurationPreset("1");
    setCustomDurationDays("");
    setDurationDays("1");
    setCategory("");
    setJobType("");
    setJobLevel("");
    setActiveCreateFilterTab("type");
    setPublishMode("instant");
    setPublishAt("");
    setJobImagePreview("");
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
    setContactEmail(job.email || job.contactEmail || job.contact_email || "");
    setLink(job.link || "");
    setVoen(job.voen || "");
    setDescription(job.description || "");
    setJobType(nextJobType || "permanent");
    setDurationPreset(nextDurationPreset);
    setCustomDurationDays(nextDurationPreset === "other" ? String(nextDuration || "") : "");
    setDurationDays(String(nextDuration || "1"));
    setWorkType(job.work_type || "full_time");
    setJobLevel(job.jobLevel || job.job_level || job.positionLevel || job.level || "");
    setPublishMode(nextPublishAt ? "scheduled" : "instant");
    setPublishAt(toDateTimeLocal(nextPublishAt));
    setJobImagePreview(job.imageUrl || job.image_url || job.logoUrl || job.logo_url || "");

    if (job.location) {
      setLocationText(job.location.address || "");
      setLat(String(job.location.lat || "40.4093"));
      setLng(String(job.location.lng || "49.8671"));
    }

    setActiveSection("create");
    setOk("Elan redaktə rejimində açıldı");
  }

  async function handleCreateJob(e, saveAsDraft = false) {
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
      if (!title.trim()) throw new Error("Elanın adını yazın");
      if (!category) throw new Error("Kateqoriya seçin");
      if (!jobType) throw new Error("Vakansiyanın növünü seçin");

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
        contactPhone,
        email: contactEmail,
        contactEmail,
        contact_email: contactEmail,
        link,
        voen,
        description: buildJobDetailsText({
          companyObject,
          scheduleStart,
          scheduleEnd,
          publishMode,
          publishAt,
          durationLabel,
          contactEmail,
          description,
        }),
        companyName: roleName === "employer" ? companyName || user?.companyName : undefined,
        createdBy: user.id,
        jobType: jobType || (roleName === "seeker" ? "seeker" : "permanent"),
        jobLevel: jobLevel || undefined,
        job_level: jobLevel || undefined,
        isDaily: jobType === "temporary",
        durationDays: jobType === "temporary" ? Number(resolvedDuration || 0) : undefined,
        work_type: workType || undefined,
        start_time: formatTimeFromDateTime(scheduleStart),
        end_time: formatTimeFromDateTime(scheduleEnd),
        notifyRadiusM: Number(radiusM) > 0 ? Number(radiusM) : 500,
        publishMode,
        publishedAt: saveAsDraft ? null : (publishMode === "scheduled" ? new Date(publishAt).toISOString() : null),
        status: saveAsDraft ? "draft" : undefined,
        saveAsDraft,
        imageUrl: jobImagePreview || undefined,
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
        setOk(saveAsDraft ? "Elan yadda saxlanıldı" : "Elan yayımlandı");
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


  async function handlePublishJob(id) {
    try {
      await api.publishJob(id);
      setOk("Elan aktiv edildi");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Elan aktiv edilmədi");
    }
  }

  async function handleDeleteJob(id) {
    if (!window.confirm("Elanı silinmiş elanlara göndərmək istəyirsiniz?")) return;
    try {
      await api.deleteJob(id);
      setOk("Elan silinmiş elanlara göndərildi");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Elan silinmədi");
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
      setNotifications((items) =>
        items.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
          read_at: item.read_at || new Date().toISOString(),
        }))
      );
      setUnread(0);
      setOk("Bütün bildirişlər oxundu kimi işarələndi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Əməliyyat alınmadı");
    }
  }

  async function handleOpenNotification(notification) {
    try {
      await api.markNotificationRead(notification.id);
      const wasUnread = !Boolean(notification.readAt || notification.read_at);
      const readTime = new Date().toISOString();

      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: item.readAt || readTime, read_at: item.read_at || readTime }
            : item
        )
      );

      if (wasUnread) {
        setUnread((count) => Math.max(0, Number(count || 0) - 1));
      }

      const jobId = getNotificationJobId(notification);
      if (jobId) {
        router.push(`/jobs/${jobId}`);
        return;
      }

      setOk("Bildiriş oxundu");
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
      setTicketCategory(supportCategories[0] || "");
      setOk("Dəstək bileti yaradıldı");
      await loadAuthedData();
      setSupportMode("list");
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
      setActiveTicketId(ticketId);
    } catch (err) {
      setError(err.message || "Cavab göndərilmədi");
    }
  }

  async function handleDeleteTicket(ticketId) {
    try {
      await api.deleteTicket(ticketId);
      setOk("Müraciət sonlandırıldı");
      await loadAuthedData();
      setSupportMode("list");
      setActiveTicketId(null);
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

  function handleRoleSwitch(e) {
    e.preventDefault();
    setError("");
    setOk("");

    if (!nextRoleName) {
      setError("Rol dəyişikliyi üçün əvvəlcə hesabınıza daxil olun");
      return;
    }

    if (roleName === "seeker" && !switchCompany.trim()) {
      setError("İşçi axtaran profilinə keçmək üçün şirkət adını yazın");
      return;
    }

    setRoleSwitchConfirmOpen(true);
  }

  async function confirmRoleSwitchRequest() {
    const currentRole = normalizeRole(user?.role);
    setRoleSwitchConfirmOpen(false);
    setLoading(true);
    setError("");
    setOk("");

    try {
      let res;

      if (currentRole === "seeker") {
        res = await api.requestRoleSwitch({
          toRole: "employer",
          companyName: switchCompany,
          voen: switchVoen || undefined,
          category: category || undefined,
        });
      } else {
        res = await api.requestRoleSwitch({ toRole: "seeker" });
      }

      if (res?.newRole || res?.immediate) {
        const updatedRole = normalizeRole(res?.newRole) || "seeker";
        const nextUser = {
          ...(user || {}),
          role: updatedRole,
          companyName: updatedRole === "employer" ? user?.companyName : null,
          company_name: updatedRole === "employer" ? user?.company_name : null,
        };

        setUser(nextUser);
        saveAuth({ token, refreshToken, user: nextUser });
        setOk(`Rol uğurla dəyişdirildi. Profiliniz ${updatedRole === "employer" ? "İşçi axtaran" : "İş axtaran"} oldu.`);
        await loadAuthedData(nextUser);
        return;
      }

      setOk("Sorğu adminə göndərildi. Təsdiqdən sonra rolunuz avtomatik yenilənəcək.");
      await loadAuthedData(user);
    } catch (err) {
      setError(err.message || "Rol dəyişikliyi alınmadı");
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = useMemo(() => {
    const appliedSearch = String(appliedFilters.search || "").trim().toLowerCase();
    const appliedCategory = String(appliedFilters.category || "").trim().toLowerCase();
    const appliedCity = String(appliedFilters.city || "").trim().toLowerCase();
    const appliedJobLevel = String(appliedFilters.jobLevel || "").trim().toLowerCase();
    const minN = appliedFilters.minWage ? Number(appliedFilters.minWage) : null;
    const maxN = appliedFilters.maxWage ? Number(appliedFilters.maxWage) : null;

    return jobs.filter((job) => {
      const matchSearch =
        !appliedSearch ||
        [job?.title, job?.companyName, job?.company_name, job?.category, job?.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(appliedSearch);
      const matchCategory = !appliedCategory || String(job?.category || "").toLowerCase().includes(appliedCategory);
      const matchCity = !appliedCity || String(job?.location?.address || job?.address || "").toLowerCase().includes(appliedCity);
      const matchJobType = !appliedFilters.jobType || String(job?.jobType || job?.job_type || job?.workType || "").toLowerCase() === String(appliedFilters.jobType).toLowerCase();
      const matchJobLevel = !appliedJobLevel || [job?.jobLevel, job?.job_level, job?.positionLevel, job?.level, job?.title, job?.description].filter(Boolean).join(" ").toLowerCase().includes(appliedJobLevel);
      const normalizedJobType = String(job?.jobType || job?.job_type || job?.workType || job?.work_type || "").toLowerCase();
      const dailyHaystack = [job?.title, job?.category, job?.description, job?.durationLabel, job?.duration_label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchDaily = jobsMode !== "daily" || Boolean(
        job?.isDaily ||
        job?.is_daily ||
        ["temporary", "daily", "gundelik", "gündəlik", "muveqqeti", "müvəqqəti", "shift"].includes(normalizedJobType) ||
        dailyHaystack.includes("gündəlik") ||
        dailyHaystack.includes("gundelik") ||
        dailyHaystack.includes("müvəqqəti") ||
        dailyHaystack.includes("muveqqeti")
      );
      const wageNumber = extractWageNumber(job?.wage);
      const matchMin = minN === null || !Number.isFinite(minN) || (wageNumber !== null && wageNumber >= minN);
      const matchMax = maxN === null || !Number.isFinite(maxN) || (wageNumber !== null && wageNumber <= maxN);
      return matchSearch && matchCategory && matchCity && matchJobType && matchJobLevel && matchDaily && matchMin && matchMax;
    });
  }, [jobs, appliedFilters, jobsMode]);

  const homeFilterTabs = useMemo(() => ([
    { key: "type", label: "Vakansiyanın növü" },
    { key: "category", label: "Kateqoriyalar" },
    { key: "level", label: "Vəzifə dərəcəsi" },
    { key: "salary", label: "Maaş aralığı" },
  ]), []);

  const activeVacancyTypeOptions = useMemo(() => jobFilterOptions.vacancyTypes || vacancyTypeOptions, [jobFilterOptions]);
  const activeJobLevelOptions = useMemo(() => jobFilterOptions.jobLevels || jobLevelOptions, [jobFilterOptions]);
  const activeSalaryRangeOptions = useMemo(() => jobFilterOptions.salaryRanges || salaryRangeOptions, [jobFilterOptions]);

  const homeCategoryOptions = useMemo(() => categories.slice(0, 12), [categories]);

  const activeSalaryLabel = useMemo(() => {
    const match = activeSalaryRangeOptions.find((item) => item.min === minWage && item.max === maxWage);
    return match?.label || "";
  }, [minWage, maxWage, activeSalaryRangeOptions]);

  const activeCreateSalaryLabel = useMemo(() => {
    const selected = activeSalaryRangeOptions.find((item) => wage === item.label);
    return selected?.label || "";
  }, [wage, activeSalaryRangeOptions]);

  const shownJobs = filteredJobs;
  const profileJobs = useMemo(() => {
    return myJobs.filter((job) => {
      const status = getJobStatus(job);
      if (myJobsStatus === "open") return status === "open" || status === "scheduled" || status === "pending";
      if (myJobsStatus === "draft") return status === "draft";
      if (myJobsStatus === "closed") return status === "closed" || status === "inactive";
      if (myJobsStatus === "rejected") return status === "rejected";
      if (myJobsStatus === "deleted") return status === "deleted";
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

  function scrollLatestJobs(direction) {
    const node = latestJobsCarouselRef.current;
    if (!node) return;
    const amount = Math.max(node.clientWidth * 0.85, 320);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }


  useEffect(() => {
    let ignore = false;
    const sessionKey = "asimos_web_session_id";
    let sessionId = "";
    try {
      sessionId = window.localStorage.getItem(sessionKey) || "";
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        window.localStorage.setItem(sessionKey, sessionId);
      }
      api.trackVisit({ path: window.location.pathname, sessionId }).catch(() => {});
    } catch {}

    api.getSiteStats()
      .then((data) => { if (!ignore) setSiteStats(data || null); })
      .catch(() => { if (!ignore) setSiteStats(null); });

    return () => { ignore = true; };
  }, []);

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
        onOpenSupport={openSupportModal}
        unreadNotificationsCount={activeUnreadCount}
      />
      {activeSection === "home" ? (
        <section className={styles.homeFilterSection}>
          <div className="container">
            <form className={styles.homeFilterCard} onSubmit={handleHeroSearchSubmit}>
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

                <button type="submit" className={styles.homeFilterSubmit} disabled={loading}>
                  {loading ? "Axtarılır..." : "Axtar"}
                </button>
              </div>

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
      <LocationPermissionPrompt
        isOpen={locationPromptOpen}
        user={user}
        locationLoading={locationLoading}
        onActivate={handleLocationActivation}
        onDismiss={() => setLocationPromptOpen(false)}
      />
      {error ? <div className="container notice error">{error}</div> : null}
      {ok ? <div className="toast-notice success" role="status">{ok}</div> : null}

      {supportModalOpen ? (
        <div className="support-modal-backdrop" role="dialog" aria-modal="true" aria-label="Dəstək müraciətləri" onMouseDown={closeSupportModal}>
          <div className="support-modal" onMouseDown={(event) => event.stopPropagation()}>
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
                <h2>{supportMode === "create" ? "Yeni Müraciət" : supportMode === "detail" ? "Adminlə Əlaqə" : "Dəstək"}</h2>
                <p>{supportMode === "list" ? "Müraciətləriniz və cavablarınız" : "Asimos dəstək komandası ilə yazışma"}</p>
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
                  <div className="support-message user">
                    <p>{activeTicket.message}</p>
                    <small>{activeTicket.created_at || activeTicket.createdAt ? new Date(activeTicket.created_at || activeTicket.createdAt).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : ""}</small>
                  </div>
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

      {activeSection === "home" ? (
        <>

          <section className={`container page-section ${styles.statsSection}`}>
            <div className={styles.statsCard}>
              <div className={styles.statsIntro}>
                <span>Asimos statistikası</span>
                <h2>Platformanın canlı göstəriciləri</h2>
                <p>Qeydiyyat, aktiv elanlar və sayt ziyarətləri burada avtomatik yenilənən formada göstərilir.</p>
              </div>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <strong>{siteStats?.users ?? 0}</strong>
                  <span>Qeydiyyatdan keçən istifadəçi</span>
                </div>
                <div className={styles.statItem}>
                  <strong>{siteStats?.activeJobs ?? 0}</strong>
                  <span>Aktiv elan</span>
                </div>
                <div className={styles.statItem}>
                  <strong>{siteStats?.onlineUsers ?? 0}</strong>
                  <span>Hazırda online</span>
                </div>
                <div className={styles.statItem}>
                  <strong>{siteStats?.visitsToday ?? 0}</strong>
                  <span>Bu gün giriş</span>
                </div>
                <div className={styles.statItem}>
                  <strong>{siteStats?.visitsThisMonth ?? 0}</strong>
                  <span>Bu ay giriş</span>
                </div>
              </div>
            </div>
          </section>

          {hasHomeJobs ? (
            <section className="container page-section">
              <header className={`section-head ${styles.latestJobsHead}`}>
                <div>
                  <span className={styles.latestJobsKicker}>Yeni imkanlar</span>
                  <h2>Son elanlar</h2>
                  <p>Ən son əlavə edilən elanları buradan izləyə bilərsən.</p>
                </div>
                <div className={styles.latestJobsActions}>
                  {homeJobs.length > 1 ? (
                    <div className={styles.latestJobsControls} aria-label="Elan carousel idarəsi">
                      <button type="button" onClick={() => scrollLatestJobs(-1)} aria-label="Əvvəlki elanlar">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M15 6l-6 6 6 6" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => scrollLatestJobs(1)} aria-label="Növbəti elanlar">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  ) : null}
                  {homeJobs.length > 6 ? (
                    <button
                      type="button"
                      className={styles.latestJobsMoreButton}
                      onClick={() => {
                        setJobsMode("all");
                        setFocusedMapJobId(null);
                        setActiveSection("jobs");
                        window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                      }}
                    >
                      Daha çox elan
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : null}
                </div>
              </header>
              <div className={styles.latestJobsCarousel} ref={latestJobsCarouselRef}>
                {homeJobs.slice(0, 10).map((job) => (
                  <div className={styles.latestJobsSlide} key={job.id}>
                    <JobCard job={job} onClick={() => openJobDetail(job.id)} onPrefetch={() => prefetchJobDetail(job.id)} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {hasHomeMapJobs ? (
            <div id="home-jobs-map">
              <JobsMap jobs={homeMapJobs} focusedJobId={focusedMapJobId} userLocation={effectiveLocation} />
            </div>
          ) : null}
          <AppLaunchPanel />
        </>
      ) : null}

      {activeSection === "jobs" ? (
        <section className="container page-section">
          <header className="mobile-web-head">
            <div>
              <span className="mobile-web-kicker">Asimos</span>
              <h2>{jobsMode === "daily" ? "Gündəlik işlər" : "İş elanları"}</h2>
              <p>{jobsMode === "daily" ? "Yalnız müvəqqəti və günlük elanlar" : "Mobil tətbiqdəki elanlar axınına uyğun axtarış"}</p>
            </div>
          </header>

          <div className="segmented-tabs">
            <button type="button" className={jobsMode === "all" ? "active" : ""} onClick={() => setJobsMode("all")}>
              Elanlar
            </button>
            <button type="button" className={jobsMode === "daily" ? "active" : ""} onClick={() => setJobsMode("daily")}>
              Gündəlik
            </button>
          </div>

          <form className={styles.homeFilterCard} onSubmit={(e) => {
              e.preventDefault();
              const nextFilters = { search, category, city, jobType, jobLevel, minWage, maxWage };
              setAppliedFilters(nextFilters);
              refreshJobs(nextFilters);
            }}>
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
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Vakansiya adı və ya açar söz" />
              </label>

              <label className={styles.homeFilterSelectWrap}>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Şəhəri seç">
                  <option value="">Şəhəri seç</option>
                  {cityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <button type="submit" className={styles.homeFilterSubmit} disabled={loading}>
                {loading ? "Axtarılır..." : "Axtar"}
              </button>
            </div>

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

              {activeHomeFilterTab === "salary" ? (
                <>
                  {activeSalaryRangeOptions.map((item) => (
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
                  ))}
                  <input
                    className={styles.homeFilterOption}
                    style={{ textAlign: "left", cursor: "text" }}
                    value={minWage}
                    onChange={(e) => setMinWage(e.target.value)}
                    inputMode="numeric"
                    placeholder="Min maaş: məsələn 400"
                  />
                  <input
                    className={styles.homeFilterOption}
                    style={{ textAlign: "left", cursor: "text" }}
                    value={maxWage}
                    onChange={(e) => setMaxWage(e.target.value)}
                    inputMode="numeric"
                    placeholder="Max maaş: məsələn 1200"
                  />
                </>
              ) : null}
            </div>

            <div className={styles.homeFilterFooter}>
              <button
                type="button"
                className={styles.homeFilterReset}
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setCity("");
                  setJobType("");
                  setJobLevel("");
                  setMinWage("");
                  setMaxWage("");
                  setRadiusM("0");
                  const emptyFilters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "" };
                  setAppliedFilters(emptyFilters);
                  refreshJobs(emptyFilters);
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

          {shownJobs.length === 0 ? (
            <div className="empty-state-card">
              <strong>Elan tapılmadı</strong>
              <p>Seçilən filterlərə uyğun elan yoxdur. Filterləri sıfırlayıb bütün elanlara baxa bilərsiniz.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setCity("");
                  setJobType("");
                  setJobLevel("");
                  setMinWage("");
                  setMaxWage("");
                  setJobsMode("all");
                  const emptyFilters = { search: "", category: "", city: "", jobType: "", jobLevel: "", minWage: "", maxWage: "" };
                  setAppliedFilters(emptyFilters);
                  refreshJobs(emptyFilters);
                }}
              >
                Bütün elanları göstər
              </button>
            </div>
          ) : null}

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
              <div className={`${styles.homeFilterCard} full-row`}>
                <div className={styles.homeFilterTitle}>
                  <span className={styles.homeFilterTitleIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <h1>Elan yerləşdir</h1>
                </div>

                <div className={styles.homeFilterSearchRow}>
                  <div className={styles.homeFilterInputWrap}>
                    <span aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Vakansiya adı və ya açar söz"
                    />
                  </div>

                  <div className={styles.homeFilterSelectWrap}>
                    <span aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </span>
                    <select
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (e.target.value) setLocationText(e.target.value);
                      }}
                      aria-label="Şəhəri seç"
                    >
                      <option value="">Şəhəri seç</option>
                      {cityOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className={styles.homeFilterSubmit} disabled={loading}>
                    {loading ? "Saxlanılır..." : editingJobId ? "Yenilə" : "Yerləşdir"}
                  </button>
                </div>

                <div className={styles.homeFilterTabs} role="tablist" aria-label="Elan yerləşdirmə filterləri">
                  {homeFilterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={activeCreateFilterTab === tab.key ? styles.homeFilterTabActive : styles.homeFilterTab}
                      onClick={() => setActiveCreateFilterTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className={styles.homeFilterOptions}>
                  {activeCreateFilterTab === "type" ? activeVacancyTypeOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={jobType === item.value ? styles.homeFilterOptionActive : styles.homeFilterOption}
                      onClick={() => setJobType((current) => current === item.value ? "" : item.value)}
                    >
                      {item.label}
                    </button>
                  )) : null}

                  {activeCreateFilterTab === "category" ? (homeCategoryOptions.length ? homeCategoryOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={category === item ? styles.homeFilterOptionActive : styles.homeFilterOption}
                      onClick={() => setCategory((current) => current === item ? "" : item)}
                    >
                      {item}
                    </button>
                  )) : <p className={styles.homeFilterEmpty}>Kateqoriyalar yüklənir...</p>) : null}

                  {activeCreateFilterTab === "level" ? activeJobLevelOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={jobLevel === item.value ? styles.homeFilterOptionActive : styles.homeFilterOption}
                      onClick={() => setJobLevel((current) => current === item.value ? "" : item.value)}
                    >
                      {item.label}
                    </button>
                  )) : null}

                  {activeCreateFilterTab === "salary" ? (
                    <>
                      {activeSalaryRangeOptions.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className={activeCreateSalaryLabel === item.label ? styles.homeFilterOptionActive : styles.homeFilterOption}
                          onClick={() => setWage((current) => current === item.label ? "" : item.label)}
                        >
                          {item.label}
                        </button>
                      ))}
                      <input
                        className={styles.homeFilterOption}
                        style={{ textAlign: "left", cursor: "text" }}
                        value={wage}
                        onChange={(e) => setWage(e.target.value)}
                        placeholder="Maaşı əl ilə yaz: məsələn 900 AZN"
                      />
                    </>
                  ) : null}
                </div>

                <div className={styles.homeFilterFooter}>
                  <button type="button" className={styles.homeFilterReset} onClick={resetJobForm}>
                    Sıfırla
                  </button>
                </div>
              </div>

              <label>
                Şirkət / obyekt
                <input value={companyObject} onChange={(e) => setCompanyObject(e.target.value)} placeholder="Direkt və ya obyekt adı" />
              </label>

              <label className="asimos-upload-field">
                Şirkət loqosu / elan şəkli
                <div className="asimos-file-upload">
                  <input
                    id="job-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) { setJobImagePreview(""); return; }
                      if (file.size > 800 * 1024) {
                        setError("Şəkil maksimum 800KB olmalıdır. Loqo üçün kiçik ölçü seçin.");
                        e.target.value = "";
                        return;
                      }
                      const dataUrl = await fileToDataUrl(file);
                      setJobImagePreview(dataUrl);
                    }}
                  />
                  <label htmlFor="job-image-upload" className="asimos-file-button">Şəkil seç</label>
                  <span>{jobImagePreview ? "Şəkil seçildi" : "Şəkil seçilməyib"}</span>
                </div>
                {jobImagePreview ? (
                  <div className="asimos-upload-preview">
                    <img src={jobImagePreview} alt="Seçilmiş loqo" />
                    <button type="button" className="btn-secondary" onClick={() => setJobImagePreview("")}>Şəkli sil</button>
                  </div>
                ) : null}
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
                <input value={wage} onChange={(e) => setWage(e.target.value)} placeholder="Məs: 800 AZN və ya razılaşma yolu ilə" />
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
                Email
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="mail@example.com"
                />
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

              <div className="full-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {!editingJobId ? (
                  <button type="button" className="btn-secondary" disabled={loading} onClick={(e) => handleCreateJob(e, true)}>
                    Yadda saxla
                  </button>
                ) : null}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {editingJobId ? "Dəyişiklikləri saxla" : "Yerləşdir"}
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
        <section className="container page-section notifications-page">
          <div className="notifications-hero">
            <div className="notifications-hero-content">
              <span className="notifications-eyebrow">Asimos iş bildirişləri</span>
              <h2>İş bildirişləri</h2>
              <p>Yaxınlığındakı yeni elanları, müraciət yeniliklərini və vacib hesab məlumatlarını bir yerdə izlə.</p>
            </div>

            <div className="notifications-hero-actions">
              <div className="notifications-stat-card primary">
                <span>{activeUnreadCount}</span>
                <small>Aktiv</small>
              </div>
              <div className="notifications-stat-card">
                <span>{notifications.length}</span>
                <small>Ümumi bildiriş</small>
              </div>
            </div>
          </div>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <>
              <div className="notifications-toolbar">
                <div>
                  <strong>Son yeniliklər</strong>
                  <p>{notifications.length ? "Bütün bildirişlər default olaraq burada görünür. Bildirişə klikləyərək bağlı elana keçə bilərsən." : "Yeni bildiriş gəldikdə burada görünəcək."}</p>
                </div>
                <button type="button" className="btn-secondary notifications-read-button" onClick={handleMarkAllRead} disabled={!notifications.length}>
                  Hamısını oxundu et
                </button>
              </div>

              {notifications.length ? (
                <div className="notifications-list">
                  {notifications.map((item) => {
                    const isRead = Boolean(item.readAt || item.read_at);
                    const jobId = getNotificationJobId(item);
                    const tone = getNotificationTone(item);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`notification-card ${isRead ? "read" : "unread"} tone-${tone}`}
                        onClick={() => handleOpenNotification(item)}
                      >
                        <span className="notification-icon" aria-hidden="true">
                          {tone === "near" ? "📍" : tone === "apply" ? "💼" : tone === "job" ? "✨" : "🔔"}
                        </span>

                        <span className="notification-content">
                          <span className="notification-title-row">
                            <strong>{item.title || "Bildiriş"}</strong>
                            {!isRead ? <span className="notification-unread-dot">Yeni</span> : null}
                          </span>
                          <span className="notification-message">{item.body || item.message || "Mesaj yoxdur"}</span>
                          <span className="notification-meta">
                            <span>{formatNotificationTime(getNotificationCreatedAt(item))}</span>
                            {jobId ? <span>Elana keçid aktivdir</span> : <span>Ümumi məlumat</span>}
                          </span>
                        </span>

                        <span className="notification-arrow" aria-hidden="true">→</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="notifications-empty">
                  <div className="notifications-empty-icon">🔕</div>
                  <h3>Hələ bildiriş yoxdur</h3>
                  <p>Yaxınlığında yeni elan və ya hesabında vacib yenilik olduqda burada görünəcək.</p>
                </div>
              )}

              <div className="notifications-toolbar alerts-create-toolbar">
                <div>
                  <strong>Yeni bildiriş kriteriyası yarat</strong>
                  <p>Kateqoriya, radius və açar söz seçərək gələcək elanlar üçün ayrıca xəbərdarlıq qura bilərsən.</p>
                </div>
              </div>

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

              {alerts.length ? (
                <div className="stack-list alerts-rules-list">
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
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {activeSection === "notifications" ? (
        <section className="container page-section notifications-page">
          <div className="notifications-hero">
            <div className="notifications-hero-content">
              <span className="notifications-eyebrow">Asimos iş bildirişləri</span>
              <h2>İş bildirişləri</h2>
              <p>Yaxınlığındakı yeni elanları, müraciət yeniliklərini və vacib hesab məlumatlarını bir yerdə izlə.</p>
            </div>

            <div className="notifications-hero-actions">
              <div className="notifications-stat-card primary">
                <span>{activeUnreadCount}</span>
                <small>Aktiv</small>
              </div>
              <div className="notifications-stat-card">
                <span>{notifications.length}</span>
                <small>Ümumi bildiriş</small>
              </div>
            </div>
          </div>

          <div className="notifications-toolbar">
            <div>
              <strong>Son yeniliklər</strong>
              <p>{activeUnreadCount ? "Oxunmamış bildirişlər burada aktiv görünür. Kliklədikdə oxundu sayılır və siyahıdan bağlanır." : "Yeni oxunmamış bildiriş gəldikdə burada görünəcək."}</p>
            </div>
            <button type="button" className="btn-secondary notifications-read-button" onClick={handleMarkAllRead} disabled={!activeUnreadCount}>
              Hamısını oxundu et
            </button>
          </div>

          {activeUnreadCount ? (
            <div className="notifications-list">
              {unreadNotifications.map((item) => {
                const isRead = Boolean(item.readAt || item.read_at);
                const jobId = getNotificationJobId(item);
                const tone = getNotificationTone(item);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`notification-card ${isRead ? "read" : "unread"} tone-${tone}`}
                    onClick={() => handleOpenNotification(item)}
                  >
                    <span className="notification-icon" aria-hidden="true">
                      {tone === "near" ? "📍" : tone === "apply" ? "💼" : tone === "job" ? "✨" : "🔔"}
                    </span>

                    <span className="notification-content">
                      <span className="notification-title-row">
                        <strong>{item.title || "Bildiriş"}</strong>
                        {!isRead ? <span className="notification-unread-dot">Yeni</span> : null}
                      </span>
                      <span className="notification-message">{item.body || item.message || "Mesaj yoxdur"}</span>
                      <span className="notification-meta">
                        <span>{formatNotificationTime(getNotificationCreatedAt(item))}</span>
                        {jobId ? <span>Elana keçid aktivdir</span> : <span>Ümumi məlumat</span>}
                      </span>
                    </span>

                    <span className="notification-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="notifications-empty">
              <div className="notifications-empty-icon">🔕</div>
              <h3>Aktiv bildiriş yoxdur</h3>
              <p>Oxunmamış bildirişlər burada görünəcək. Oxuduğun bildirişlər avtomatik siyahıdan bağlanır.</p>
            </div>
          )}
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
                <span>{activeUnreadCount}</span>
                <small>Aktiv</small>
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
                        ["open", "Aktiv elanlar"],
                        ["draft", "Yadda saxlanılanlar"],
                        ["closed", "Deaktiv elanlar"],
                        ["rejected", "Rədd edilmiş"],
                        ["deleted", "Silinmiş elanlar"],
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
                            {["draft", "closed", "rejected"].includes(getJobStatus(job)) ? (
                              <button type="button" className="btn-secondary" onClick={() => handlePublishJob(job.id)}>
                                Aktiv et
                              </button>
                            ) : null}
                            {getJobStatus(job) === "open" || getJobStatus(job) === "pending" || getJobStatus(job) === "scheduled" ? (
                              <button type="button" className="btn-secondary" onClick={() => handleCloseJob(job.id)}>
                                Deaktiv et
                              </button>
                            ) : null}
                            {getJobStatus(job) !== "deleted" ? (
                              <button type="button" className="btn-secondary" onClick={() => handleDeleteJob(job.id)}>
                                Sil
                              </button>
                            ) : null}
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

      {activeSection === "about" ? (
        <section className="container page-section about-page">
          <header className="section-head">
            <span className="section-kicker">Asimos haqqında</span>
            <h2>Yaxınındakı elanları və gündəlik fürsətləri bir yerdə tap.</h2>
            <p>Asimos iş axtaranları, xidmət göstərənləri və işçi axtaranları lokasiya əsaslı sadə platformada birləşdirir.</p>
          </header>
          <div className="about-grid">
            <article className="about-card">
              <strong>Lokasiya əsaslı axtarış</strong>
              <span>Cihaz lokasiyasını aktiv etdikdə sənə ən yaxın elanları xəritədə görə bilərsən.</span>
            </article>
            <article className="about-card">
              <strong>Elanlar və gündəlik işlər</strong>
              <span>Daimi və günlük fürsətləri ayrıca filtrlə, uyğun olanı sürətli tap.</span>
            </article>
            <article className="about-card">
              <strong>Bildiriş sistemi</strong>
              <span>Maraqlı kateqoriyalar üzrə iş bildirişləri yarat və yeni elanlardan xəbərdar ol.</span>
            </article>
          </div>
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


      {roleSwitchConfirmOpen ? (
        <div className="confirm-modal-backdrop" role="presentation" onClick={() => setRoleSwitchConfirmOpen(false)}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="role-switch-confirm-title" onClick={(event) => event.stopPropagation()}>
            <div className="confirm-modal-icon" aria-hidden="true">↔</div>
            <h3 id="role-switch-confirm-title">Sorğunuzu dəyişməyə əminsiniz?</h3>
            <p>
              Profil rolunuzu <strong>{nextRoleLabel}</strong> olaraq dəyişmək üçün sorğu göndəriləcək.
              {roleName === "seeker" ? " Admin təsdiqlədikdən sonra profiliniz avtomatik yenilənəcək." : " Bu keçid üçün admin təsdiqi lazım deyil, rolunuz dərhal iş axtaran olaraq yenilənəcək."}
            </p>
            {roleName === "seeker" ? (
              <div className="confirm-modal-summary">
                <span>Şirkət</span>
                <strong>{switchCompany || "Qeyd edilməyib"}</strong>
                {switchVoen ? <small>VOEN: {switchVoen}</small> : null}
              </div>
            ) : null}
            <div className="confirm-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setRoleSwitchConfirmOpen(false)} disabled={loading}>
                Xeyr
              </button>
              <button type="button" className="btn-primary" onClick={confirmRoleSwitchRequest} disabled={loading}>
                {roleName === "seeker" ? "Bəli, sorğu göndər" : "Bəli, rolu dəyiş"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

    </main>
  );
}
