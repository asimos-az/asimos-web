"use client";

import Header from "../components/Header";
import JobCard from "../components/JobCard";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearAuthToken, setAuthToken, setRefreshToken, setTokenUpdateHandler } from "../../lib/api";
import { clearAuth, loadAuth, saveAuth } from "../../lib/auth-store";

import JobsMap from "../components/JobsMap";
import styles from "./HomePage.module.css";
import AuthSection from "./components/AuthSection";
import HomeHero from "./components/HomeHero";
import LocationPermissionPrompt from "./components/LocationPermissionPrompt";

const guestNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
  { key: "terms", label: "Qaydalar" },
];

const seekerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "İş elanları" },
  { key: "create", label: "Elan yarat" },
  { key: "alerts", label: "Bildirişlər" },
  { key: "notifications", label: "Push" },
  { key: "profile", label: "Profil" },
  { key: "support", label: "Dəstək" },
  { key: "terms", label: "Qaydalar" },
];

const employerNav = [
  { key: "home", label: "Ana səhifə" },
  { key: "jobs", label: "Bazadakı işlər" },
  { key: "myJobs", label: "Mənim elanlarım" },
  { key: "create", label: "Elan yarat" },
  { key: "notifications", label: "Bildirişlər" },
  { key: "profile", label: "Profil" },
  { key: "support", label: "Dəstək" },
  { key: "terms", label: "Qaydalar" },
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

export default function HomePageClient() {
  const router = useRouter();
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

  const [title, setTitle] = useState("");
  const [wage, setWage] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("+994");
  const [contactPhone, setContactPhone] = useState("+994");
  const [link, setLink] = useState("");
  const [voen, setVoen] = useState("");
  const [workType, setWorkType] = useState("full_time");
  const [durationDays, setDurationDays] = useState("1");
  const [notifyRadiusM, setNotifyRadiusM] = useState("500");
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
  const navItems = roleName === "employer" ? employerNav : roleName === "seeker" ? seekerNav : guestNav;

  const navTitle = roleName === "employer" ? "İşçi axtaran" : roleName === "seeker" ? "İş axtaran" : "Qonaq";

  useEffect(() => {
    if (!user && activeSection !== "home" && activeSection !== "jobs" && activeSection !== "terms" && activeSection !== "auth") {
      setActiveSection("auth");
    }
  }, [user, activeSection]);

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
          daily: dailyOnly || undefined,
          jobType: jobType || undefined,
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
      daily: dailyOnly || undefined,
      jobType: jobType || undefined,
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

  async function handleCreateJob(e) {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError("");
    setOk("");

    try {
      const payload = {
        title,
        wage,
        category,
        whatsapp,
        phone: contactPhone,
        link,
        voen,
        description,
        companyName: roleName === "employer" ? companyName || user?.companyName : undefined,
        createdBy: user.id,
        jobType: roleName === "seeker" ? "seeker" : jobType || "permanent",
        isDaily: roleName === "seeker" ? false : jobType === "temporary",
        durationDays: roleName === "employer" && jobType === "temporary" ? Number(durationDays) : undefined,
        work_type: roleName === "employer" ? workType : undefined,
        notifyRadiusM: roleName === "seeker" ? 0 : Number(notifyRadiusM || 0),
        location: {
          address: locationText || "Bakı",
          lat: Number(lat),
          lng: Number(lng),
        },
      };

      await api.createJob(payload);
      setOk("Elan yaradıldı");

      setTitle("");
      setWage("");
      setDescription("");
      setLink("");
      setVoen("");

      await loadAuthedData();
      await refreshJobs();
      if (roleName === "employer") setActiveSection("myJobs");
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
    return jobs.filter((job) => {
      const matchSearch = !search || String(job?.title || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = !category || String(job?.category || "").toLowerCase().includes(category.toLowerCase());
      const matchDaily = !dailyOnly || job?.isDaily;
      return matchSearch && matchCategory && matchDaily;
    });
  }, [jobs, search, category, dailyOnly]);

  const shownJobs =
    activeSection === "daily"
      ? filteredJobs.filter((job) => job?.isDaily || job?.jobType === "temporary")
      : filteredJobs;

  function openJobDetail(jobId) {
    router.push(`/jobs/${jobId}`);
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
                <JobCard key={job.id} job={job} onClick={() => openJobDetail(job.id)} />
              ))}
            </div>
          </section>

          <JobsMap jobs={jobs} />
        </>
      ) : null}

      {activeSection === "jobs" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>İş elanları</h2>
          </header>

          <form
            className="filter-row"
            onSubmit={(e) => {
              e.preventDefault();
              refreshJobs();
            }}
          >
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Başlığa görə axtar" />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Bütün kateqoriyalar</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="">Növ fərq etmir</option>
              <option value="permanent">Daimi</option>
              <option value="temporary">Müvəqqəti</option>
              <option value="seeker">İş axtaran elanı</option>
            </select>
            <label className="checkbox-inline">
              <input type="checkbox" checked={dailyOnly} onChange={(e) => setDailyOnly(e.target.checked)} />
              Günlük işlər
            </label>
            <button type="submit" className="btn-primary">
              Tətbiq et
            </button>
          </form>

          <div className="cards-grid">
            {shownJobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => openJobDetail(job.id)} />
            ))}
          </div>

          {shownJobs.length === 0 ? <p className="muted">Elan tapılmadı.</p> : null}

        </section>
      ) : null}

      {activeSection === "myJobs" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Mənim elanlarım</h2>
          </header>
          <div className="cards-grid">
            {myJobs.map((job) => (
              <article key={job.id} className="job-card">
                <h3>{job.title || "Adsız elan"}</h3>
                <p>{job.description || "Təsvir yoxdur"}</p>
                <div className="meta-row">
                  <span>{job.status || "active"}</span>
                  <span>{job.jobType || "permanent"}</span>
                </div>
                <div className="actions-row">
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
          {myJobs.length === 0 ? <p className="muted">Heç bir elanınız yoxdur.</p> : null}
        </section>
      ) : null}

      {activeSection === "create" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>{roleName === "seeker" ? "İş axtaran elanı yarat" : "İş elanı yarat"}</h2>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <form className="form-grid" onSubmit={handleCreateJob}>
              <label>
                Başlıq
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>

              <label>
                Maa$
                <input value={wage} onChange={(e) => setWage(e.target.value)} />
              </label>

              <label>
                Kateqoriya
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Secin</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Whatsapp
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </label>

              <label>
                Əlaqə nömrəsi
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </label>

              {roleName === "employer" ? (
                <>
                  <label>
                    Link
                    <input value={link} onChange={(e) => setLink(e.target.value)} />
                  </label>

                  <label>
                    VOEN
                    <input value={voen} onChange={(e) => setVoen(e.target.value)} />
                  </label>

                  <label>
                    İş növü
                    <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                      <option value="permanent">Daimi</option>
                      <option value="temporary">Müvəqqəti</option>
                    </select>
                  </label>

                  {jobType === "temporary" ? (
                    <label>
                      Müddət (gün)
                      <input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
                    </label>
                  ) : null}

                  <label>
                    İş qrafiki
                    <select value={workType} onChange={(e) => setWorkType(e.target.value)}>
                      <option value="full_time">Tam ştat</option>
                      <option value="part_time">Yarım ştat</option>
                      <option value="agreement">Razılaşma</option>
                    </select>
                  </label>

                  <label>
                    Bildiriş radiusu
                    <input value={notifyRadiusM} onChange={(e) => setNotifyRadiusM(e.target.value)} />
                  </label>
                </>
              ) : null}

              <label>
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

              <label className="full-row">
                Təsvir
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} required />
              </label>

              <div className="full-row">
                <button type="submit" className="btn-primary" disabled={loading}>
                  Elanı yadda saxla
                </button>
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
        <section className="container page-section">
          <header className="section-head">
            <h2>Profil</h2>
          </header>

          {!user ? <p className="muted">Bu bölmə üçün daxil olun.</p> : null}

          {user ? (
            <>
              <form className="form-grid" onSubmit={handleProfileSave}>
                <label>
                  Ad Soyad
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} required />
                </label>

                <label>
                  Telefon
                  <input value={editingPhone} onChange={(e) => setEditingPhone(e.target.value)} required />
                </label>

                <label>
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

                <div className="full-row actions-row">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    Profili yenilə
                  </button>
                  <button type="button" className="btn-danger" onClick={handleDeleteAccount}>
                    Hesabı sil
                  </button>
                </div>
              </form>

              <form className="switch-box" onSubmit={handleRoleSwitch}>
                <h3>Rol dəyişikliyi</h3>
                {roleName === "seeker" ? (
                  <>
                    <label>
                      Şirkət adı
                      <input value={switchCompany} onChange={(e) => setSwitchCompany(e.target.value)} required />
                    </label>
                    <label>
                      VOEN
                      <input value={switchVoen} onChange={(e) => setSwitchVoen(e.target.value)} />
                    </label>
                  </>
                ) : null}
                <button type="submit" className="btn-secondary" disabled={loading}>
                  Sorğu göndər
                </button>
                {roleSwitchStatus ? <p className="muted">Cari status: {roleSwitchStatus.status}</p> : null}
              </form>
            </>
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
