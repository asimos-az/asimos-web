"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, clearAuthToken, setAuthToken, setRefreshToken, setTokenUpdateHandler } from "../lib/api";
import { clearAuth, loadAuth, saveAuth } from "../lib/auth-store";

const guestNav = [
  { key: "home", label: "Ana sehife" },
  { key: "jobs", label: "Is elanlari" },
  { key: "terms", label: "Qaydalar" },
  { key: "auth", label: "Giris" },
];

const seekerNav = [
  { key: "home", label: "Ana sehife" },
  { key: "jobs", label: "Is elanlari" },
  { key: "create", label: "Elan yarat" },
  { key: "alerts", label: "Bildirisler" },
  { key: "notifications", label: "Push" },
  { key: "profile", label: "Profil" },
  { key: "support", label: "Destek" },
  { key: "terms", label: "Qaydalar" },
];

const employerNav = [
  { key: "home", label: "Ana sehife" },
  { key: "jobs", label: "Bazadaki isler" },
  { key: "myJobs", label: "Menim elanlar" },
  { key: "create", label: "Elan yarat" },
  { key: "notifications", label: "Bildirisler" },
  { key: "profile", label: "Profil" },
  { key: "support", label: "Destek" },
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

export default function HomePage() {
  const [booting, setBooting] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [mode, setMode] = useState("login");
  const [otpPayload, setOtpPayload] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const [selectedJob, setSelectedJob] = useState(null);
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

  const mapLat = Number(lat) || 40.4093;
  const mapLng = Number(lng) || 49.8671;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.02}%2C${mapLat - 0.02}%2C${mapLng + 0.02}%2C${mapLat + 0.02}&layer=mapnik&marker=${mapLat}%2C${mapLng}`;

  const navTitle = roleName === "employer" ? "Isci axtaran" : roleName === "seeker" ? "Is axtaran" : "Qonaq";

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
    setTerms(termsRes?.content || termsRes?.body || "Qaydalar melumati movcud deyil.");
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
        if (alive) setError(e.message || "Yuklenme xetasi");
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
      setOk("Ugurlu giris edildi");
      await loadAuthedData(nextUser);
    } catch (err) {
      setError(err.message || "Giris ugursuz oldu");
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
      if (password !== confirmPassword) throw new Error("Sifreler eyni deyil");

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
        setOk("OTP kod email-e gonderildi");
      } else if (res?.token) {
        await handleLogin({ preventDefault: () => {} });
      }
    } catch (err) {
      setError(err.message || "Qeydiyyat ugursuz oldu");
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
        setOk("Hesabiniz yoxlanis ucun gonderildi");
      } else if (res?.token) {
        const nextUser = { ...(res.user || {}), role: normalizeRole(res?.user?.role) || base.role };
        setUser(nextUser);
        setToken(res.token);
        setRefreshTokenState(res.refreshToken || null);
        setAuthToken(res.token);
        setRefreshToken(res.refreshToken || null);
        saveAuth({ token: res.token, refreshToken: res.refreshToken || null, user: nextUser });
        setActiveSection("home");
        await loadAuthedData(nextUser);
      }
    } catch (err) {
      setError(err.message || "OTP tesdiqi ugursuz oldu");
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
      setOk("Berpa kodu email-e gonderildi");
      setMode("resetPassword");
      setEmail(forgotEmail);
    } catch (err) {
      setError(err.message || "Sifre berpa sorgusu ugursuz oldu");
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
      }
      setOk("Sifre ugurla yenilendi");
    } catch (err) {
      setError(err.message || "Sifre yenilenmedi");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    setUser(null);
    setToken(null);
    setRefreshTokenState(null);
    setSelectedJob(null);
    clearAuthToken();
    clearAuth();
    setActiveSection("home");
    setOk("Hesabdan cixis edildi");
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
          address: locationText || "Baku",
          lat: Number(lat),
          lng: Number(lng),
        },
      };

      await api.createJob(payload);
      setOk("Elan yaradildi");

      setTitle("");
      setWage("");
      setDescription("");
      setLink("");
      setVoen("");

      await loadAuthedData();
      await refreshJobs();
      if (roleName === "employer") setActiveSection("myJobs");
    } catch (err) {
      setError(err.message || "Elan yaradilmasi ugursuz oldu");
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseJob(id) {
    try {
      await api.closeJob(id, { reason: "filled" });
      setOk("Elan baglandi");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Baglama mumkun olmadi");
    }
  }

  async function handleReopenJob(id) {
    try {
      await api.reopenJob(id);
      setOk("Elan yeniden acildi");
      await loadAuthedData();
      await refreshJobs();
    } catch (err) {
      setError(err.message || "Yeniden acmaq mumkun olmadi");
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
      setOk("Is bildirisi yaradildi");

      setAlertCategory("");
      setAlertRadius("500");
      setAlertKeywords("");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bildiris yaradilmasi ugursuz oldu");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAlert(id) {
    try {
      await api.deleteAlert(id);
      setOk("Bildiris silindi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bildiris silinmedi");
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setOk("Butun bildirisler oxundu kimi isarelendi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Emeliyyat ugursuz oldu");
    }
  }

  async function handleOpenNotification(notification) {
    try {
      await api.markNotificationRead(notification.id);
      const jobId = notification?.data?.jobId;
      if (jobId) {
        const job = await api.getJobById(jobId);
        setSelectedJob(job);
        setActiveSection("jobs");
      }
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bildiris acilmadi");
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
      setOk("Destek bileti yaradildi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Bilet yaradilmasi ugursuz oldu");
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
      setOk("Cavab gonderildi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Cavab gonderilmedi");
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
          address: locationText || user?.location?.address || "Baku",
          lat: Number(lat),
          lng: Number(lng),
        },
      };

      await api.updateProfile({ fullName: editingName });
      await api.updateProfile({ phone: editingPhone });
      await api.updateMyLocation(nextUser.location);

      setUser(nextUser);
      saveAuth({ token, refreshToken, user: nextUser });
      setOk("Profil yenilendi");
    } catch (err) {
      setError(err.message || "Profil yenilenmedi");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Hesabi silmek istediyinizden eminsiniz?")) return;

    try {
      await api.deleteMyAccount("Istifadeci webden hesabini sildi");
      handleSignOut();
    } catch (err) {
      setError(err.message || "Hesab silinmedi");
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

      setOk("Rol deyisikliyi sorgusu gonderildi");
      await loadAuthedData();
    } catch (err) {
      setError(err.message || "Rol deyisikliyi ugursuz oldu");
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

  if (booting) {
    return <main className="site-loading">Yuklenir...</main>;
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <button className="brand" type="button" onClick={() => setActiveSection("home")}>
            <span className="brand-mark">A</span>
            <span>
              <strong>Asimos</strong>
              <small>Mobil tetbiqin web formasi</small>
            </span>
          </button>

          <nav className="main-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={activeSection === item.key ? "active" : ""}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="user-chip">
            <span>{navTitle}</span>
            <span className="dot" />
            <span>{unread} unread</span>
            {user ? (
              <button type="button" className="btn-secondary" onClick={handleSignOut}>
                Cixis
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => setActiveSection("auth")}>
                Daxil ol
              </button>
            )}
          </div>
        </div>
      </header>

      {error ? <div className="container notice error">{error}</div> : null}
      {ok ? <div className="container notice success">{ok}</div> : null}

      {activeSection === "home" ? (
        <section className="container home-hero">
          <article className="hero-content">
            <h1>Is axtaranla isci axtarani birlesdiren platforma</h1>
            <p>
              Asimos mobilde olan funksiyalarin eynisini webde de verir: elan yaratmaq, axtaris, bildiris,
              destek, profil ve rol deyisikliyi.
            </p>
            <form
              className="hero-search"
              onSubmit={(e) => {
                e.preventDefault();
                setActiveSection("jobs");
              }}
            >
              <input
                placeholder="Ise gore axtar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Axtar
              </button>
            </form>
            <div className="hero-stats">
              <div>
                <strong>{jobs.length}</strong>
                <span>umumi elan</span>
              </div>
              <div>
                <strong>{myJobs.length}</strong>
                <span>menim elanlar</span>
              </div>
              <div>
                <strong>{notifications.length}</strong>
                <span>bildiris</span>
              </div>
            </div>
          </article>
          <aside className="hero-map">
            <iframe src={mapSrc} title="baku-map" />
          </aside>
        </section>
      ) : null}

      {activeSection === "jobs" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Is elanlari</h2>
          </header>

          <form
            className="filter-row"
            onSubmit={(e) => {
              e.preventDefault();
              refreshJobs();
            }}
          >
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Basliga gore axtar" />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Butun kateqoriyalar</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="">Nov ferq etmir</option>
              <option value="permanent">Daimi</option>
              <option value="temporary">Muveqqeti</option>
              <option value="seeker">Is axtaran elani</option>
            </select>
            <label className="checkbox-inline">
              <input type="checkbox" checked={dailyOnly} onChange={(e) => setDailyOnly(e.target.checked)} />
              Gunluk isler
            </label>
            <button type="submit" className="btn-primary">
              Tetbiq et
            </button>
          </form>

          <div className="cards-grid">
            {shownJobs.map((job) => (
              <article key={job.id} className="job-card" onClick={() => setSelectedJob(job)}>
                <h3>{job.title || "Adsiz elan"}</h3>
                <p>{job.companyName || job.company_name || "Sirket qeyd edilmeyib"}</p>
                <p>{job.wage || "Maa$ qeyd edilmayib"}</p>
                <div className="meta-row">
                  <span>{job.category || "Kateqoriya yoxdur"}</span>
                  <span>{job.status || "active"}</span>
                </div>
              </article>
            ))}
          </div>

          {shownJobs.length === 0 ? <p className="muted">Elan tapilmadi.</p> : null}

          {selectedJob ? (
            <article className="detail-box">
              <h3>{selectedJob.title}</h3>
              <p>{selectedJob.description || "Tesvir yoxdur"}</p>
              <p>Kateqoriya: {selectedJob.category || "-"}</p>
              <p>Maa$: {selectedJob.wage || "-"}</p>
              <p>Elaqe: {selectedJob.phone || selectedJob.whatsapp || "-"}</p>
              <p>Unvan: {selectedJob?.location?.address || "-"}</p>
              <button type="button" className="btn-secondary" onClick={() => setSelectedJob(null)}>
                Bagla
              </button>
            </article>
          ) : null}
        </section>
      ) : null}

      {activeSection === "myJobs" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Menim elanlarim</h2>
          </header>
          <div className="cards-grid">
            {myJobs.map((job) => (
              <article key={job.id} className="job-card">
                <h3>{job.title || "Adsiz elan"}</h3>
                <p>{job.description || "Tesvir yoxdur"}</p>
                <div className="meta-row">
                  <span>{job.status || "active"}</span>
                  <span>{job.jobType || "permanent"}</span>
                </div>
                <div className="actions-row">
                  <button type="button" className="btn-secondary" onClick={() => handleCloseJob(job.id)}>
                    Bagla
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => handleReopenJob(job.id)}>
                    Yeniden ac
                  </button>
                </div>
              </article>
            ))}
          </div>
          {myJobs.length === 0 ? <p className="muted">Hec bir elaniniz yoxdur.</p> : null}
        </section>
      ) : null}

      {activeSection === "create" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>{roleName === "seeker" ? "Is axtaran elani yarat" : "Is elani yarat"}</h2>
          </header>

          {!user ? <p className="muted">Bu bolme ucun daxil olun.</p> : null}

          {user ? (
            <form className="form-grid" onSubmit={handleCreateJob}>
              <label>
                Basliq
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
                Elaqe nomresi
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
                    Is novu
                    <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                      <option value="permanent">Daimi</option>
                      <option value="temporary">Muveqqeti</option>
                    </select>
                  </label>

                  {jobType === "temporary" ? (
                    <label>
                      Muddet (gun)
                      <input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
                    </label>
                  ) : null}

                  <label>
                    Is qrafiki
                    <select value={workType} onChange={(e) => setWorkType(e.target.value)}>
                      <option value="full_time">Tam stat</option>
                      <option value="part_time">Yarim stat</option>
                      <option value="agreement">Razilasma</option>
                    </select>
                  </label>

                  <label>
                    Bildiris radiusu
                    <input value={notifyRadiusM} onChange={(e) => setNotifyRadiusM(e.target.value)} />
                  </label>
                </>
              ) : null}

              <label>
                Unvan
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
                Tesvir
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} required />
              </label>

              <div className="full-row">
                <button type="submit" className="btn-primary" disabled={loading}>
                  Elani yadda saxla
                </button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      {activeSection === "alerts" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Is bildirisleri</h2>
          </header>

          {!user ? <p className="muted">Bu bolme ucun daxil olun.</p> : null}

          {user ? (
            <>
              <form className="form-grid compact" onSubmit={handleCreateAlert}>
                <label>
                  Kateqoriya
                  <select value={alertCategory} onChange={(e) => setAlertCategory(e.target.value)}>
                    <option value="">Secin</option>
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
                  Acar sozler
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
                      <strong>{item.category || "Umumi"}</strong>
                      <p>
                        Radius: {item.radius_m || item.radius || "-"}m | Soz: {item.q || item.query || "-"}
                      </p>
                    </div>
                    <button type="button" className="btn-secondary" onClick={() => handleDeleteAlert(item.id)}>
                      Sil
                    </button>
                  </div>
                ))}
                {alerts.length === 0 ? <p className="muted">Hec bir bildiris yoxdur.</p> : null}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activeSection === "notifications" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Bildirisler</h2>
            <button type="button" className="btn-secondary" onClick={handleMarkAllRead}>
              Hamisini oxundu et
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
                <strong>{item.title || "Bildiris"}</strong>
                <p>{item.body || item.message || "Mesaj yoxdur"}</p>
              </button>
            ))}
            {notifications.length === 0 ? <p className="muted">Bildiris yoxdur.</p> : null}
          </div>
        </section>
      ) : null}

      {activeSection === "profile" ? (
        <section className="container page-section">
          <header className="section-head">
            <h2>Profil</h2>
          </header>

          {!user ? <p className="muted">Bu bolme ucun daxil olun.</p> : null}

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
                  Unvan
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
                    Profili yenile
                  </button>
                  <button type="button" className="btn-danger" onClick={handleDeleteAccount}>
                    Hesabi sil
                  </button>
                </div>
              </form>

              <form className="switch-box" onSubmit={handleRoleSwitch}>
                <h3>Rol deyisikliyi</h3>
                {roleName === "seeker" ? (
                  <>
                    <label>
                      Sirket adi
                      <input value={switchCompany} onChange={(e) => setSwitchCompany(e.target.value)} required />
                    </label>
                    <label>
                      VOEN
                      <input value={switchVoen} onChange={(e) => setSwitchVoen(e.target.value)} />
                    </label>
                  </>
                ) : null}
                <button type="submit" className="btn-secondary" disabled={loading}>
                  Sorqu gonder
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
            <h2>Destek merkezi</h2>
          </header>

          {!user ? <p className="muted">Bu bolme ucun daxil olun.</p> : null}

          {user ? (
            <>
              <form className="form-grid" onSubmit={handleCreateTicket}>
                <label>
                  Kateqoriya
                  <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                    <option value="general">Umumi</option>
                    <option value="technical">Texniki</option>
                    <option value="account">Hesab</option>
                    <option value="payment">Odenis</option>
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
                        Gonder
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
            <h2>Qaydalar ve sertler</h2>
          </header>
          <div className="terms-box">{terms}</div>
          <div className="actions-row">
            <Link href="/policy" className="btn-secondary">
              Policy sehifesine kec
            </Link>
          </div>
        </section>
      ) : null}

      {activeSection === "auth" ? (
        <section className="container page-section auth-section">
          <header className="section-head">
            <h2>Hesab paneli</h2>
          </header>

          <div className="auth-switch">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Giris
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              Qeydiyyat
            </button>
            <button
              type="button"
              className={mode === "forgotPassword" ? "active" : ""}
              onClick={() => setMode("forgotPassword")}
            >
              Sifre berpa
            </button>
          </div>

          {mode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label>
                Sifre
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              <button type="submit" className="btn-primary" disabled={loading}>
                Daxil ol
              </button>
            </form>
          ) : null}

          {mode === "register" ? (
            <form className="auth-form" onSubmit={handleRegister}>
              <label>
                Rol
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="seeker">Is axtaran</option>
                  <option value="employer">Isci axtaran</option>
                </select>
              </label>
              <label>
                Ad Soyad
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>
              {role === "employer" ? (
                <>
                  <label>
                    Sirket adi
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </label>
                  <label>
                    Kateqoriya
                    <select value={registerCategory} onChange={(e) => setRegisterCategory(e.target.value)}>
                      <option value="">Secin</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
              <label>
                Telefon
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </label>
              <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label>
                Sifre
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              <label>
                Sifreni tesdiq et
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </label>
              <button type="submit" className="btn-primary" disabled={loading}>
                Qeydiyyat et
              </button>
            </form>
          ) : null}

          {mode === "verifyOtp" ? (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <label>
                OTP kod
                <input value={otp} onChange={(e) => setOtp(e.target.value)} required />
              </label>
              <button type="submit" className="btn-primary" disabled={loading}>
                Tesdiq et
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  try {
                    await api.resendOtp({ email: otpPayload?.email || email });
                    setOk("OTP yeniden gonderildi");
                  } catch (e) {
                    setError(e.message || "OTP gonderilmedi");
                  }
                }}
              >
                OTP yeniden gonder
              </button>
            </form>
          ) : null}

          {mode === "forgotPassword" ? (
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <label>
                Email
                <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
              </label>
              <button type="submit" className="btn-primary" disabled={loading}>
                Kod gonder
              </button>
            </form>
          ) : null}

          {mode === "resetPassword" ? (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label>
                Berpa kodu
                <input value={resetCode} onChange={(e) => setResetCode(e.target.value)} required />
              </label>
              <label>
                Yeni sifre
                <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required />
              </label>
              <button type="submit" className="btn-primary" disabled={loading}>
                Sifreni yenile
              </button>
            </form>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
