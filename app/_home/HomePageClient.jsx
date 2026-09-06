"use client";

import LocationPicker from "../components/LocationPicker";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { api, clearAuthToken, setAuthToken, setRefreshToken, setTokenUpdateHandler } from "../../lib/api";

import { clearAuth, loadAuth, saveAuth } from "../../lib/auth-store";

import styles from "./HomePage.module.css";
import AppLaunchPanel from "./components/AppLaunchPanel";
import LiveStatsPanel from "./components/LiveStatsPanel";
import HomeJobsMap from "./components/HomeJobsMap";
import HomePageLoadingScreen from "./components/HomePageLoadingScreen";
import HomePageSections from "./components/HomePageSections";
import { AppHeader } from "./components/redesign/HomepageRedesign";
import { getRouteForSection, getSectionForPath } from "./sectionRoutes";
import {
  SOCKET_URL,
  cityOptions,
  employerNav,
  employerSupportCategories,
  guestNav,
  jobLevelOptions,
  salaryRangeOptions,
  seekerNav,
  seekerSupportCategories,
  vacancyTypeOptions,
} from "./config/homePageConfig";
import {
  fileToDataUrl,
  safeImageUrl,
  getSafeUserLogo,
  normalizeRole,
  formatNotificationTime,
  getNotificationJobId,
  getNotificationCreatedAt,
  getNotificationTone,
  normalizeList,
  flattenCategories,
  hasSavedLocation,
  buildJobDetailsText,
  extractWageNumber,
  getJobStatus,
  isPublicHomeJob,
  hasJobCoordinates,
  toDateTimeLocal,
  toDateInputValue,
  getDateInputValue,
  formatTimeFromDateTime,
  formatProfileJobDate,
  getProfileJobCompany,
  getProfileJobLogo,
  getTicketSubject,
  getTicketMessages,
} from "./utils/homePageHelpers";

function toJobSlug(value, fallback = "elan") {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/ə/g, "e")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

export default function HomePageClient({ initialSection = "home" }) {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedJobIds = useRef(new Set());
  const latestJobsCarouselRef = useRef(null);
  const jobsLoadMoreRef = useRef(null);
  const [booting, setBooting] = useState(true);
  const [activeSection, setActiveSectionState] = useState(initialSection === "daily" ? "jobs" : initialSection);

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
  const [registerLogoPreview, setRegisterLogoPreview] = useState("");
  const [profileLogoPreview, setProfileLogoPreview] = useState("");
  const [phone, setPhone] = useState("+994");
  const [role, setRole] = useState("seeker");
  const [registerCategory, setRegisterCategory] = useState("");
  const [otp, setOtp] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  const [jobs, setJobs] = useState([]);
  const [sponsoredCard, setSponsoredCard] = useState(null);
  const [recommendedCard, setRecommendedCard] = useState(null);
  const [homeWidgets, setHomeWidgets] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [favoriteJobIds, setFavoriteJobIds] = useState(() => new Set());
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
    radiusM: "1000",
  });
  const [radiusM, setRadiusM] = useState("0");
  const [homeRadiusM, setHomeRadiusM] = useState("1000");
  const [myJobsStatus, setMyJobsStatus] = useState("open");
  const [jobsVisibleCount, setJobsVisibleCount] = useState(10);
  const [editingJobId, setEditingJobId] = useState(null);

  const setActiveSection = useCallback((section, navigation = "push") => {
    const nextSection = section === "daily" ? "jobs" : section;
    if (section === "daily") setJobsMode("daily");
    else if (section === "jobs") setJobsMode("all");
    setActiveSectionState(nextSection);
    const nextRoute = getRouteForSection(section);
    if (pathname !== nextRoute) {
      navigation === "replace" ? router.replace(nextRoute) : router.push(nextRoute);
    }
  }, [pathname, router]);

  const [title, setTitle] = useState("");
  const [companyObject, setCompanyObject] = useState("");
  const [vacancyStartDate, setVacancyStartDate] = useState(() => getDateInputValue(0));
  const [vacancyEndDate, setVacancyEndDate] = useState(() => getDateInputValue(30));
  const [contactVisibility, setContactVisibility] = useState({ phone: true, whatsapp: true, email: true });
  const [primaryContact, setPrimaryContact] = useState("phone");
  const [wage, setWage] = useState("");
  const [wageMode, setWageMode] = useState("agreement");
  const [wageMin, setWageMin] = useState("");
  const [wageMax, setWageMax] = useState("");
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
  const supportSocketRef = useRef(null);

  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [switchCompany, setSwitchCompany] = useState("");
  const [switchVoen, setSwitchVoen] = useState("");
  const [switchCategory, setSwitchCategory] = useState("");
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
  // Cihazdan son alınmış lokasiya profildə saxlanmış köhnə lokasiyadan daha aktualdır.
  const effectiveLocation = deviceLocation || user?.location || null;
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
    if (!user || !token) {
      if (supportSocketRef.current) {
        supportSocketRef.current.disconnect();
        supportSocketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 800,
    });

    supportSocketRef.current = socket;

    const refreshSupport = async (payload = {}) => {
      try {
        if (payload?.type === "profile_change_request_approved") {
          const profileRes = await fetch(`${SOCKET_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => (res.ok ? res.json() : null)).catch(() => null);

          if (profileRes?.user) {
            setUser(profileRes.user);
            saveAuth({ token, refreshToken, user: profileRes.user });
          }

          setOk("Dəyişiklik sorğunuz admin tərəfindən təsdiqləndi və məlumatlarınız yeniləndi");
        }

        if (payload?.type === "profile_change_request_rejected") {
          setOk("Dəyişiklik sorğunuz admin tərəfindən cavablandırıldı");
        }

        const res = await api.listTickets();
        const nextTickets = res.items || [];
        setTickets(nextTickets);
        if (payload.ticketId && activeTicketId === payload.ticketId) {
          setActiveTicketId(payload.ticketId);
          await api.markTicketRead(payload.ticketId).catch(() => null);
        }
        const notifRes = await api.listMyNotifications({ limit: 50 }).catch(() => null);
        if (notifRes?.items) setNotifications(notifRes.items);
      } catch { }
    };

    socket.on("support:updated", refreshSupport);
    socket.on("connect", () => {
      if (activeTicketId) socket.emit("support:join", { ticketId: activeTicketId });
    });

    return () => {
      socket.off("support:updated", refreshSupport);
      socket.disconnect();
      if (supportSocketRef.current === socket) supportSocketRef.current = null;
    };
  }, [user?.id, token, activeTicketId]);

  useEffect(() => {
    const socket = supportSocketRef.current;
    if (!socket || !activeTicketId) return;
    socket.emit("support:join", { ticketId: activeTicketId });
    return () => socket.emit("support:leave", { ticketId: activeTicketId });
  }, [activeTicketId]);

  useEffect(() => {
    const routeSection = getSectionForPath(pathname, initialSection);
    if (routeSection === "daily") {
      setJobsMode("daily");
      setActiveSectionState("jobs");
      return;
    }
    setActiveSectionState(routeSection);
  }, [pathname, initialSection]);

  useEffect(() => {
    if (!booting && !user && !["home", "about", "auth", "jobs", "daily"].includes(activeSection)) {
      setActiveSection("auth", "replace");
    }
  }, [booting, user, activeSection, setActiveSection]);

  useEffect(() => {
    if (activeSection === "daily") {
      setJobsMode("daily");
    } else if (activeSection === "jobs") {
      setJobsMode("all");
    }
  }, [activeSection]);

  useEffect(() => {
    if (!booting && activeSection === "create" && roleName !== "employer") {
      setActiveSection(user ? "profile" : "auth");
    }
  }, [booting, activeSection, roleName, user, setActiveSection]);

  useEffect(() => {
    if (activeSection !== "create" || editingJobId || !effectiveLocation) return;

    const nextLat = Number(effectiveLocation.lat);
    const nextLng = Number(effectiveLocation.lng);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;

    setLat(String(nextLat));
    setLng(String(nextLng));
    setLocationText(effectiveLocation.address || "Cari məkan");
  }, [activeSection, editingJobId, effectiveLocation?.lat, effectiveLocation?.lng, effectiveLocation?.address]);

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
        setContactEmail(saved.user.contactEmail || saved.user.contact_email || saved.user.email || "");
        setWhatsapp(saved.user.whatsapp || saved.user.whatsapp_number || saved.user.phone);
      }

      if (saved.user?.voen) setVoen(String(saved.user.voen || ""));
      if (saved.user?.atsLink || saved.user?.ats_link) setLink(String(saved.user.atsLink || saved.user.ats_link || ""));

      setEditingName(saved.user?.fullName || "");
      setEditingPhone(saved.user?.phone || "");
      setCompanyName(saved.user?.companyName || saved.user?.company_name || "");
      const savedLogo = getSafeUserLogo(saved.user);

      setProfileLogoPreview(savedLogo);
      setJobImagePreview(savedLogo);
      if (saved.user?.companyName || saved.user?.company_name) setCompanyObject(saved.user.companyName || saved.user.company_name || "");
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


  useEffect(() => {
    if (roleName !== "employer" || !user) return;

    const userCompany = user.companyName || user.company_name || "";
    const userLogo = getSafeUserLogo(user);

    if (userCompany && !companyName) {
      setCompanyName(userCompany);
    }

    if (userCompany && !companyObject) {
      setCompanyObject(userCompany);
    }

    if (userLogo && !profileLogoPreview) {
      setProfileLogoPreview(userLogo);
    }

    if (userLogo && !jobImagePreview) {
      setJobImagePreview(userLogo);
    }

    if (user.phone) {
      if (!contactPhone || contactPhone === "+994") {
        setContactPhone(user.phone);
      }

      if (!whatsapp || whatsapp === "+994") {
        setWhatsapp(user.phone);
      }
    }

    if ((user.contactEmail || user.contact_email || user.email) && !contactEmail) {
      setContactEmail(user.contactEmail || user.contact_email || user.email);
    }

    if ((user.atsLink || user.ats_link) && !link) {
      setLink(user.atsLink || user.ats_link);
    }

    if (user.voen && !voen) {
      setVoen(String(user.voen || ""));
    }
  }, [roleName, user?.id]);


  useEffect(() => {
    let ignore = false;

    fetch(`${SOCKET_URL}/sponsored-cards`)
      .then((res) => (res.ok ? res.json() : { sponsored: null, recommended: null }))
      .then((data) => {
        if (!ignore) {
          setSponsoredCard(data?.sponsored || data?.item || null);
          setRecommendedCard(data?.recommended || null);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSponsoredCard(null);
          setRecommendedCard(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch(`${SOCKET_URL}/home-widgets`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore) setHomeWidgets(data || null);
      })
      .catch(() => {
        if (!ignore) setHomeWidgets(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function loadBaseData() {
    const [categoryRes, jobsRes, termsRes, filterOptionsRes] = await Promise.all([
      api.listCategories().catch(() => ({ items: [] })),
      api
        .listJobsWithSearch({
          q: appliedFilters.search || undefined,
          lat: effectiveLocation?.lat,
          lng: effectiveLocation?.lng,
          radius_m: effectiveLocation && Number(appliedFilters.radiusM || 0) > 0 ? Number(appliedFilters.radiusM) : undefined,
          daily: jobsMode === "daily" || dailyOnly || undefined,
          jobType: appliedFilters.jobType || undefined,
          jobLevel: appliedFilters.jobLevel || undefined,
          city: appliedFilters.city || undefined,
          minWage: appliedFilters.minWage || undefined,
          maxWage: appliedFilters.maxWage || undefined,
          categories: appliedFilters.category || undefined,
          limit: 1000,
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

    const [myJobsRes, favoritesRes, alertsRes, notificationsRes, unreadRes, ticketsRes, switchRes] = await Promise.all([
      api.listMyJobs(currentUser.id).catch(() => ({ items: [] })),
      api.listMyFavorites().catch(() => ({ items: [] })),
      api.listMyAlerts().catch(() => ({ items: [] })),
      api.listMyNotifications({ limit: 100, offset: 0 }).catch(() => ({ items: [] })),
      api.getUnreadNotificationsCount().catch(() => ({ unread: 0 })),
      api.listTickets().catch(() => ({ items: [] })),
      api.getRoleSwitchStatus().catch(() => null),
    ]);

    setMyJobs(normalizeList(myJobsRes));
    const nextFavorites = normalizeList(favoritesRes);
    setFavoriteJobs(nextFavorites);
    setFavoriteJobIds(new Set(nextFavorites.map((job) => String(job.id)).filter(Boolean)));
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
      radiusM: nextFilters?.radiusM ?? appliedFilters.radiusM ?? homeRadiusM,
    };

    const res = await api.listJobsWithSearch({
      q: filters.search || undefined,
      lat: effectiveLocation?.lat,
      lng: effectiveLocation?.lng,
      radius_m: effectiveLocation && Number(filters.radiusM || 0) > 0 ? Number(filters.radiusM) : undefined,
      daily: jobsMode === "daily" || dailyOnly || undefined,
      jobType: filters.jobType || undefined,
      jobLevel: filters.jobLevel || undefined,
      city: filters.city || undefined,
      minWage: filters.minWage || undefined,
      maxWage: filters.maxWage || undefined,
      categories: filters.category || undefined,
      limit: 1000,
    });
    const nextJobs = normalizeList(res);
    setJobs(nextJobs);
    return nextJobs;
  }

  async function handleHomeRadiusChange(nextRadiusM) {
    const nextFilters = { ...appliedFilters, radiusM: nextRadiusM };
    setHomeRadiusM(nextRadiusM);
    setAppliedFilters(nextFilters);
    try {
      setLoading(true);
      await refreshJobs(nextFilters);
    } catch (nextError) {
      setError(nextError.message || "Radius üzrə elanlar yenilənmədi");
    } finally {
      setLoading(false);
    }
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
      const heroFilters = { search, category, city, jobType, jobLevel, minWage, maxWage, radiusM: homeRadiusM };
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

  async function handleRegisterLogoFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setRegisterLogoPreview("");
      return;
    }

    if (file.size > 900 * 1024) {
      setError("Loqo maksimum 900KB olmalıdır. Kiçik ölçülü şəkil seçin.");
      event.target.value = "";
      setRegisterLogoPreview("");
      return;
    }

    const dataUrl = await fileToDataUrl(file);

    setRegisterLogoPreview(dataUrl);
  }

  async function handleProfileLogoFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setProfileLogoPreview("");
      return;
    }

    if (file.size > 900 * 1024) {
      setError("Profil loqosu maksimum 900KB olmalıdır.");
      event.target.value = "";
      setProfileLogoPreview("");
      return;
    }

    const dataUrl = await fileToDataUrl(file);

    setProfileLogoPreview(dataUrl);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      if (password !== confirmPassword) throw new Error("Şifrələr eyni deyil");

      const safeRegisterLogo = safeImageUrl(registerLogoPreview);

      const payload = {
        role,
        fullName,
        companyName: role === "employer" ? companyName : undefined,

        logoUrl: role === "employer" ? safeRegisterLogo : undefined,
        profileLogoUrl: role === "employer" ? safeRegisterLogo : undefined,

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
        await handleLogin({ preventDefault: () => { } });
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
        logoUrl: base.logoUrl || base.profileLogoUrl || null,
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
    setFavoriteJobs([]);
    setFavoriteJobIds(new Set());
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
    const safeUserLogo = getSafeUserLogo(user);

    setEditingJobId(null);
    setTitle("");
    setCompanyObject("");
    setVacancyStartDate(getDateInputValue(0));
    setVacancyEndDate(getDateInputValue(30));
    setContactVisibility({ phone: true, whatsapp: true, email: true });
    setPrimaryContact("phone");
    setWage("Razılaşma əsasında");
    setWageMode("agreement");
    setWageMin("");
    setWageMax("");
    setDescription("");
    setContactEmail(user?.contactEmail || user?.contact_email || user?.email || "");
    setLink(user?.atsLink || user?.ats_link || "");
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

    setJobImagePreview(safeUserLogo || "");
  }

  function startEditJob(job) {
    if (!job) return;

    const nextJobType = job.jobType || job.job_type || (job.isDaily ? "temporary" : "permanent");
    const nextDuration = Number(job.durationDays ?? job.duration_days ?? 1);
    const nextDurationPreset = [1, 3, 10].includes(nextDuration) ? String(nextDuration) : "other";
    const nextPublishAt = job.publishedAt || job.published_at || "";

    setEditingJobId(job.id);
    setTitle(job.title || "");
    setCompanyObject(job.workplace || job.work_place || job.branch || job.companyObject || job.companyName || job.company_name || "");
    setVacancyStartDate(toDateInputValue(job.vacancyStartDate || job.vacancy_start_date || job.startDate || job.start_date) || getDateInputValue(0));
    setVacancyEndDate(toDateInputValue(job.vacancyEndDate || job.vacancy_end_date || job.endDate || job.end_date || job.expiresAt || job.expires_at) || getDateInputValue(30));
    setContactVisibility(job.contactVisibility || job.contact_visibility || { phone: true, whatsapp: true, email: true });
    setPrimaryContact(job.primaryContact || job.primary_contact || "phone");
    const nextWage = job.wage || "";
    const nextWageLower = String(nextWage).toLowerCase();
    setWage(nextWage || "Razılaşma əsasında");
    if (nextWageLower.includes("bacar")) {
      setWageMode("skill");
      setWageMin("");
      setWageMax("");
    } else if (/\d/.test(nextWageLower)) {
      const wageNumbers = String(nextWage).match(/\d+/g) || [];
      setWageMode("range");
      setWageMin(wageNumbers[0] || "");
      setWageMax(wageNumbers[1] || "");
    } else {
      setWageMode("agreement");
      setWageMin("");
      setWageMax("");
    }
    setCategory(job.category || "");
    setWhatsapp(job.whatsapp || "+994");
    setContactPhone(job.phone || "+994");
    setContactEmail(job.email || job.contactEmail || job.contact_email || "");
    setLink(job.atsLink || job.ats_link || job.link || "");
    setVoen(job.voen || "");
    setDescription(job.description || "");
    setJobType(nextJobType || "permanent");
    setDurationPreset(nextDurationPreset);
    setCustomDurationDays(nextDurationPreset === "other" ? String(nextDuration || "") : "");
    setDurationDays(String(nextDuration || "1"));
    setWorkType(job.work_type || "full_time");
    setScheduleStart(formatTimeFromDateTime(job.start_time || job.startTime || job.schedule_start || "") || "");
    setScheduleEnd(formatTimeFromDateTime(job.end_time || job.endTime || job.schedule_end || "") || "");
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

  function getResolvedWageValue() {
    if (wageMode === "agreement") return "Razılaşma əsasında";
    if (wageMode === "skill") return "Bacarığa uyğun";
    const min = String(wageMin || "").replace(/[^0-9]/g, "");
    const max = String(wageMax || "").replace(/[^0-9]/g, "");
    if (min && max) return `${min} - ${max} AZN`;
    if (min) return `${min} AZN`;
    return "";
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
      if (!saveAsDraft && !title.trim()) {
        throw new Error("Elanın adını yazın");
      }

      if (!saveAsDraft && !category) {
        throw new Error("Kateqoriya seçin");
      }

      const selectedJobType = jobType === "temporary" ? "temporary" : "permanent";

      const resolvedDuration =
        selectedJobType === "temporary"
          ? durationPreset === "other"
            ? customDurationDays
            : durationPreset
          : "";

      if (!saveAsDraft && selectedJobType === "temporary" && (!resolvedDuration || Number(resolvedDuration) < 1)) {
        throw new Error("Günəmuzd elan üçün müddət seçin");
      }

      const durationLabel = selectedJobType === "temporary" ? `${resolvedDuration} gün` : "";

      if (
        !saveAsDraft && publishMode === "scheduled" &&
        (!publishAt || new Date(publishAt).getTime() <= Date.now())
      ) {
        throw new Error("Planlı yayım üçün gələcək tarix və saat seçin");
      }

      const resolvedWage = getResolvedWageValue();

      if (!saveAsDraft && wageMode === "range" && !resolvedWage) {
        throw new Error("Minimum və ya maksimum maaş rəqəmini yazın");
      }

      const safeLogo =
        safeImageUrl(jobImagePreview) ||
        safeImageUrl(profileLogoPreview) ||
        getSafeUserLogo(user) ||
        undefined;

      const resolvedContactPhone =
        String(contactPhone || "").trim() && String(contactPhone || "").trim() !== "+994"
          ? String(contactPhone).trim()
          : String(user?.phone || "").trim();
      const resolvedWhatsapp =
        String(whatsapp || "").trim() && String(whatsapp || "").trim() !== "+994"
          ? String(whatsapp).trim()
          : resolvedContactPhone;
      const resolvedContactEmail =
        String(contactEmail || "").trim() || String(user?.email || "").trim();
      const resolvedContactVisibility = {
        phone: Boolean(contactVisibility?.phone),
        whatsapp: Boolean(contactVisibility?.whatsapp),
        email: Boolean(contactVisibility?.email),
      };

      const payload = {
        title: title.trim() || "Adsız qaralama",
        wage: resolvedWage,
        category,

        whatsapp: resolvedWhatsapp,
        contact_whatsapp: resolvedWhatsapp,
        phone: resolvedContactPhone,
        contactPhone: resolvedContactPhone,
        contact_phone: resolvedContactPhone,

        email: resolvedContactEmail,
        contactEmail: resolvedContactEmail,
        contact_email: resolvedContactEmail,

        link,
        atsLink: link,
        ats_link: link,
        workplace: companyObject,
        workplace_name: companyObject,
        vacancyStartDate: selectedJobType === "temporary" ? vacancyStartDate : null,
        vacancy_start_date: selectedJobType === "temporary" ? (vacancyStartDate || null) : null,
        vacancyEndDate: selectedJobType === "temporary" ? vacancyEndDate : null,
        vacancy_end_date: selectedJobType === "temporary" ? (vacancyEndDate || null) : null,
        contactVisibility: resolvedContactVisibility,
        contact_visibility: resolvedContactVisibility,
        primaryContact,
        primary_contact: primaryContact,
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

        companyName:
          roleName === "employer"
            ? companyObject || companyName || user?.companyName || user?.company_name
            : undefined,

        // ƏSAS DÜZƏLİŞ:
        // Buraya artıq data:image/png;base64,... getməyəcək
        company_logo_url: safeLogo,
        logoUrl: safeLogo,
        imageUrl: safeLogo,

        createdBy: user.id,

        jobType: selectedJobType,

        jobLevel: jobLevel || undefined,
        job_level: jobLevel || undefined,

        isDaily: selectedJobType === "temporary",

        durationDays:
          selectedJobType === "temporary"
            ? Number(resolvedDuration || 0)
            : undefined,

        work_type: workType || undefined,

        start_time: scheduleStart || null,
        end_time: scheduleEnd || null,

        notifyRadiusM: Number(radiusM) > 0 ? Number(radiusM) : 500,

        publishMode,

        publishedAt: saveAsDraft
          ? null
          : publishMode === "scheduled"
            ? new Date(publishAt).toISOString()
            : null,

        // Yeni elan heç bir halda birbaşa aktivləşməməlidir.
        // Köhnə backend versiyalarında default `open` ola bildiyi üçün statusu explicit göndəririk.
        status: saveAsDraft ? "draft" : "pending",

        saveAsDraft,

        location: {
          address: locationText || "Bakı",
          lat: Number(lat),
          lng: Number(lng),
        },
      };

      let submittedProfileJob = null;

      if (editingJobId) {
        const response = await api.updateJob(editingJobId, payload);
        if (!saveAsDraft) {
          const responseJob = response?.job || response?.item || response;
          const pendingJob = responseJob?.id ? { ...responseJob, status: "pending", jobStatus: "pending" } : null;
          submittedProfileJob = pendingJob;
          if (pendingJob) {
            setMyJobs((items) => [pendingJob, ...items.filter((item) => String(item.id) !== String(pendingJob.id))]);
          }
          setMyJobsStatus("pending");
          setOk("Elan admin yoxlamasına göndərildi. Təsdiq edildikdən sonra paylaşılacaq.");
        } else {
          const responseJob = response?.job || response?.item || response;
          const draftJob = responseJob?.id ? { ...responseJob, status: "draft", jobStatus: "draft" } : null;
          submittedProfileJob = draftJob;
          if (draftJob) setMyJobs((items) => [draftJob, ...items.filter((item) => String(item.id) !== String(draftJob.id))]);
          setMyJobsStatus("draft");
          setOk("Qaralama yeniləndi");
        }
      } else {
        const response = await api.createJob(payload);
        if (!saveAsDraft) {
          const responseJob = response?.job || response?.item || response;
          const pendingJob = responseJob?.id ? { ...responseJob, status: "pending", jobStatus: "pending" } : null;
          submittedProfileJob = pendingJob;
          if (pendingJob) {
            setMyJobs((items) => [pendingJob, ...items.filter((item) => String(item.id) !== String(pendingJob.id))]);
          }
          setMyJobsStatus("pending");
          setOk("Elan admin yoxlamasına göndərildi. Təsdiq edildikdən sonra paylaşılacaq.");
        } else {
          const responseJob = response?.job || response?.item || response;
          const draftJob = responseJob?.id ? { ...responseJob, status: "draft", jobStatus: "draft" } : null;
          submittedProfileJob = draftJob;
          if (draftJob) setMyJobs((items) => [draftJob, ...items.filter((item) => String(item.id) !== String(draftJob.id))]);
          setMyJobsStatus("draft");
          setOk("Elan qaralama olaraq yadda saxlanıldı");
        }
      }

      resetJobForm();

      await loadAuthedData();
      if (submittedProfileJob) {
        setMyJobs((items) => [submittedProfileJob, ...items.filter((item) => String(item.id) !== String(submittedProfileJob.id))]);
        setMyJobsStatus(saveAsDraft ? "draft" : "pending");
      }
      await refreshJobs();

      if (roleName === "employer") {
        setActiveSection("profile");
      }
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

  async function handleEmployerFieldChangeRequest({ fieldKey, fieldLabel, oldValue, newValue, hasSavedValue }) {
    const nextValue = String(newValue || "").trim();
    if (!nextValue) {
      setError(`${fieldLabel} üçün yeni dəyər yazın`);
      return;
    }

    setLoading(true);
    setError("");
    setOk("");

    try {
      const response = await fetch(`${SOCKET_URL}/profile-change-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fieldKey,
          fieldLabel,
          oldValue: oldValue || "",
          newValue: nextValue,
          hasSavedValue: Boolean(hasSavedValue),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Dəyişiklik sorğusu göndərilmədi");

      await loadAuthedData();
      setOk("Məlumatlarınız yoxlanış üçün adminə göndərildi. Admin təsdiqlədikdən sonra məlumat hesabınızda görünəcək.");
    } catch (err) {
      setError(err.message || "Dəyişiklik sorğusu göndərilmədi");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSave(e, seekerProfile) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");

    try {
      const nextLocation = {
        address: locationText || user?.location?.address || "Bakı",
        lat: Number(lat),
        lng: Number(lng),
      };
      const payload = {
        fullName: editingName,
        phone: editingPhone,
        location: nextLocation,
        companyName: roleName === "employer"
          ? companyName || user?.companyName || user?.company_name || ""
          : undefined,

        voen: roleName === "employer" ? voen || user?.voen || "" : undefined,
        whatsapp: roleName === "employer" ? whatsapp || user?.whatsapp || "" : undefined,
        contactEmail: roleName === "employer" ? contactEmail || user?.email || "" : undefined,
        atsLink: roleName === "employer" ? link || user?.atsLink || user?.ats_link || "" : undefined,
        seekerProfile: roleName === "seeker" ? seekerProfile : undefined,
      };
      const response = await api.updateProfile(payload);
      const nextUser = response?.user || {
        ...(user || {}),
        fullName: editingName,
        phone: editingPhone,
        location: nextLocation,
        companyName: payload.companyName ?? user?.companyName,
        voen: payload.voen ?? user?.voen,
        whatsapp: payload.whatsapp ?? user?.whatsapp,
        contactEmail: payload.contactEmail ?? user?.contactEmail,
        atsLink: payload.atsLink ?? user?.atsLink,
        ats_link: payload.atsLink ?? user?.ats_link,
        seekerProfile: payload.seekerProfile ?? user?.seekerProfile ?? user?.seeker_profile,
        seeker_profile: payload.seekerProfile ?? user?.seeker_profile ?? user?.seekerProfile,
      };

      setUser(nextUser);
      setCompanyName(nextUser?.companyName || nextUser?.company_name || "");
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

  async function confirmRoleSwitchRequest(overrides = {}) {
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
          companyName: overrides.companyName ?? switchCompany,
          voen: (overrides.voen ?? switchVoen) || undefined,
          category: (overrides.category ?? switchCategory ?? category) || undefined,
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
    if (wageMode === "agreement") return "Razılaşma əsasında";
    if (wageMode === "skill") return "Bacarığa uyğun";
    if (wageMode === "range") return "Minimum / maksimum";
    return "";
  }, [wageMode]);

  const shownJobs = filteredJobs;
  const visibleShownJobs = useMemo(() => shownJobs.slice(0, jobsVisibleCount), [shownJobs, jobsVisibleCount]);
  const hasMoreShownJobs = shownJobs.length > visibleShownJobs.length;
  useEffect(() => {
    setJobsVisibleCount(10);
  }, [appliedFilters, jobsMode]);

  useEffect(() => {
    if (activeSection !== "jobs") return;
    if (!hasMoreShownJobs) return;
    const node = jobsLoadMoreRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setJobsVisibleCount((current) => Math.min(current + 10, shownJobs.length));
      }
    }, { rootMargin: "240px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeSection, hasMoreShownJobs, shownJobs.length]);

  const profileJobs = useMemo(() => {
    return myJobs.filter((job) => {
      const status = getJobStatus(job);
      if (myJobsStatus === "open") return status === "open" || status === "scheduled";
      if (myJobsStatus === "pending") return status === "pending";
      if (myJobsStatus === "draft") return status === "draft";
      if (myJobsStatus === "closed") return status === "closed" || status === "inactive";
      if (myJobsStatus === "rejected") return status === "rejected";
      if (myJobsStatus === "deleted") return status === "deleted";
      return status === myJobsStatus;
    });
  }, [myJobs, myJobsStatus]);


  async function handleToggleFavorite(job, event) {
    event?.stopPropagation?.();
    if (!job?.id) return;
    if (!user) {
      setActiveSection("auth");
      setError("Elanı yadda saxlamaq üçün əvvəlcə daxil olun.");
      return;
    }

    const id = String(job.id);
    const alreadySaved = favoriteJobIds.has(id);
    setFavoriteJobIds((current) => {
      const next = new Set(current);
      alreadySaved ? next.delete(id) : next.add(id);
      return next;
    });
    setFavoriteJobs((current) => alreadySaved ? current.filter((item) => String(item.id) !== id) : [{ ...job, isFavorite: true, is_favorite: true }, ...current]);

    try {
      if (alreadySaved) {
        await api.removeFavoriteJob(id);
        setOk("Elan favoritlərdən silindi");
      } else {
        await api.addFavoriteJob(id);
        setOk("Elan favoritlərə əlavə edildi");
      }
      await loadAuthedData(user);
    } catch (e) {
      setFavoriteJobIds((current) => {
        const next = new Set(current);
        alreadySaved ? next.add(id) : next.delete(id);
        return next;
      });
      setError(e.message || "Favorit əməliyyatı alınmadı");
    }
  }

  function openJobDetail(jobId) {
    const id = String(jobId || "");
    const job = [...jobs, ...myJobs, ...favoriteJobs].find(
      (item) => String(item?.id || item?._id || "") === id
    );
    const categorySlug = toJobSlug(
      job?.category || job?.categoryName || job?.category_name || job?.jobCategory || job?.job_category
    );
    const titleSlug = toJobSlug(job?.title || job?.name, "vakansiya");
    router.push(`/jobs/${categorySlug}/${titleSlug}?id=${encodeURIComponent(id)}`);
  }

  function prefetchJobDetail(jobId) {
    if (!jobId || prefetchedJobIds.current.has(jobId)) return;

    prefetchedJobIds.current.add(jobId);
    const id = String(jobId);
    const job = [...jobs, ...myJobs, ...favoriteJobs].find(
      (item) => String(item?.id || item?._id || "") === id
    );
    const categorySlug = toJobSlug(
      job?.category || job?.categoryName || job?.category_name || job?.jobCategory || job?.job_category
    );
    const titleSlug = toJobSlug(job?.title || job?.name, "vakansiya");
    router.prefetch(`/jobs/${categorySlug}/${titleSlug}?id=${encodeURIComponent(id)}`);
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
      api.trackVisit({ path: window.location.pathname, sessionId }).catch(() => { });
    } catch { }

    api.getSiteStats()
      .then((data) => { if (!ignore) setSiteStats(data || null); })
      .catch(() => { if (!ignore) setSiteStats(null); });

    return () => { ignore = true; };
  }, []);

  if (booting) {
    return <HomePageLoadingScreen />;
  }


  const sectionCtx = {
    styles,
    activeSection, jobsMode, setJobsMode, search, setSearch, city, setCity, cityOptions, loading, handleHeroSearchSubmit,
    homeFilterTabs, activeHomeFilterTab, setActiveHomeFilterTab, activeVacancyTypeOptions, jobType, setJobType, homeCategoryOptions, category, setCategory, activeJobLevelOptions, jobLevel, setJobLevel, activeSalaryRangeOptions, activeSalaryLabel, minWage, maxWage, setMinWage, setMaxWage, setAppliedFilters, refreshJobs,
    homeWidgets, locationPromptOpen, user, locationLoading, handleLocationActivation, setLocationPromptOpen, error, ok, supportModalOpen, closeSupportModal, supportMode, setSupportMode, setActiveTicketId, getTicketSubject, activeTicket, setTicketCategory, supportCategories, setTicketMessage, tickets, openTicketDetail, handleCreateTicket, ticketCategory, ticketMessage, getTicketMessages, ticketReply, setTicketReply, handleReply, handleDeleteTicket, handleEmployerFieldChangeRequest,
    siteStats, homeJobs, hasHomeJobs, latestJobsCarouselRef, scrollLatestJobs, sponsoredCard, recommendedCard, favoriteJobIds, handleToggleFavorite, openJobDetail, prefetchJobDetail, hasHomeMapJobs, homeMapJobs, focusedMapJobId, setFocusedMapJobId, effectiveLocation, homeRadiusM, handleHomeRadiusChange, JobsMap: HomeJobsMap, AppLaunchPanel, LiveStatsPanel,
    shownJobs, visibleShownJobs, hasMoreShownJobs, jobsLoadMoreRef, canCreateJob, editingJobId, title, setTitle, companyObject, setCompanyObject, vacancyStartDate, setVacancyStartDate, vacancyEndDate, setVacancyEndDate, contactVisibility, setContactVisibility, primaryContact, setPrimaryContact, wage, setWage, wageMode, setWageMode, wageMin, setWageMin, wageMax, setWageMax, activeCreateSalaryLabel, description, setDescription, contactPhone, setContactPhone, whatsapp, setWhatsapp, contactEmail, setContactEmail, link, setLink, voen, setVoen, durationPreset, setDurationPreset, customDurationDays, setCustomDurationDays, durationDays, setDurationDays, workType, setWorkType, scheduleStart, setScheduleStart, scheduleEnd, setScheduleEnd, publishMode, setPublishMode, publishAt, setPublishAt, locationText, setLocationText, lat, setLat, lng, setLng, radiusM, setRadiusM, activeCreateFilterTab, setActiveCreateFilterTab, handleCreateJob, resetJobForm, LocationPicker,
    alerts, alertCategory, setAlertCategory, alertRadius, setAlertRadius, alertKeywords, setAlertKeywords, handleCreateAlert, handleDeleteAlert, notifications, unread, handleMarkAllRead, handleOpenNotification, formatNotificationTime, getNotificationTone, getNotificationJobId, getNotificationCreatedAt,
    roleName, navTitle, editingName, setEditingName, editingPhone, setEditingPhone, profileLogoPreview, setProfileLogoPreview, handleProfileLogoFileChange, handleProfileSave, handleDeleteAccount, handleSignOut, openSupportModal, myJobs, activeUnreadCount, hasSavedLocation, getJobStatus, myJobsStatus, setMyJobsStatus, profileJobs, formatProfileJobDate, getProfileJobLogo, getProfileJobCompany, startEditJob, handlePublishJob, handleCloseJob, handleReopenJob, handleDeleteJob, favoriteJobs, roleSwitchStatus, handleRoleSwitch, nextRoleLabel, switchCompany, setSwitchCompany, switchVoen, setSwitchVoen, switchCategory, setSwitchCategory, setRoleSwitchConfirmOpen, terms,
    mode, setMode, email, setEmail, password, setPassword, showPassword, setShowPassword, confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword, fullName, setFullName, companyName, setCompanyName, registerLogoPreview, setRegisterLogoPreview, handleRegisterLogoFileChange, phone, setPhone, role, setRole, registerCategory, setRegisterCategory, categories, otp, setOtp, forgotEmail, setForgotEmail, resetCode, setResetCode, resetPassword, setResetPassword, showResetPassword, setShowResetPassword, handleLogin, handleRegister, handleVerifyOtp, handleForgotPassword, handleResetPassword, setActiveSection, roleSwitchConfirmOpen, confirmRoleSwitchRequest,
  };

  return (
    <main className="site-shell">
      <AppHeader ctx={sectionCtx} />
      <HomePageSections ctx={sectionCtx} />
    </main>
  );
}
