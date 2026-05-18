import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 17a2 2 0 004 0" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1116 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 15v-2a2 2 0 012-2h1v6H8a2 2 0 01-2-2zm12-4a2 2 0 012 2v2a2 2 0 01-2 2h-1v-6h1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19h2" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h8v8" />
    </svg>
  );
}


function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 10.5V20h13v-9.5" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V6a3 3 0 0 1 3-3v0a3 3 0 0 1 3 3v1" />
      <rect x="4" y="7" width="16" height="13" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M10 12v1.5h4V12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 11v5" />
      <path strokeLinecap="round" d="M12 8h.01" />
    </svg>
  );
}

function getNavIcon(key) {
  if (key === "home") return <HomeIcon />;
  if (key === "jobs" || key === "daily") return <BriefcaseIcon />;
  if (key === "about") return <InfoIcon />;
  if (key === "create") return <PlusIcon />;
  return <ArrowUpRightIcon />;
}

const Header = ({ activeSection, setActiveSection, navItems, user, handleSignOut, canCreateJob = false, onOpenSupport, showSupport = false, unreadNotificationsCount = 0 }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 86);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNavigate(section) {
    if (section === "daily") {
      setActiveSection("daily");
      setMenuOpen(false);
      setAccountMenuOpen(false);
      return;
    }

    if (section === "support" && typeof onOpenSupport === "function") {
      onOpenSupport();
      setMenuOpen(false);
      setAccountMenuOpen(false);
      return;
    }

    setActiveSection(section);
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }

  const displayName = user?.fullName || user?.full_name || user?.name || user?.companyName || user?.company_name || "İstifadəçi";
  const displayEmail = user?.email || "";


  function handleBrandClick(event) {
    if (typeof window === "undefined") return;

    const isHomeRoute = window.location.pathname === "/";

    if (isHomeRoute && typeof setActiveSection === "function") {
      event.preventDefault();
      setActiveSection("home");
      setMenuOpen(false);
      setAccountMenuOpen(false);
      window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // From pages like /policy or /jobs/[id], always go back to the real home page.
    window.location.href = "/";
  }

  const accountMenuItems = [
    { key: "profile", label: "Profil", icon: <ProfileIcon /> },
    { key: "alerts", label: "Elan bildirişləri", icon: <BellIcon /> },
    { key: "notifications", label: "İş bildirişləri", icon: <BellIcon /> },
    ...(showSupport ? [{ key: "support", label: "Əlaqə", icon: <SupportIcon /> }] : []),
  ];

  return (
    <>
    <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`.trim()}>
      <div className="site-header-top">
        <div className="container header-inner">
          <div className="brand">
            <Link href="/" onClick={handleBrandClick} aria-label="Ana səhifəyə keç">
              <img src="/logo.svg" alt="Asimos loqosu" />
            </Link>
          </div>
        <div className="header-actions">
          {user && canCreateJob ? (
            <button type="button" className={`create-action ${activeSection === "create" ? "active" : ""}`} onClick={() => handleNavigate("create")}>
              <PlusIcon />
              <span>Elan yarat</span>
            </button>
          ) : null}
          <div className="user-chip">
            {user ? (
              <div className="header-user-actions">
                <button
                  type="button"
                  className="header-notification-button"
                  onClick={() => handleNavigate("notifications")}
                  aria-label="Bildirişlər"
                >
                  <BellIcon />
                  {unreadNotificationsCount > 0 ? <span>{unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}</span> : null}
                </button>
              <div className="account-menu" ref={accountMenuRef}>
                <div className="account-inline">
                  <div className="account-info" title={`${displayName}${displayEmail ? ` • ${displayEmail}` : ""}`}>
                    <strong>{displayName}</strong>
                    {displayEmail ? <span>{displayEmail}</span> : null}
                  </div>
                  <button
                    type="button"
                    className={`account-trigger ${accountMenuOpen ? "open" : ""}`}
                    onClick={() => setAccountMenuOpen((value) => !value)}
                    aria-label="Hesab menyusu"
                  >
                    <ProfileIcon />
                  </button>
                </div>

                {accountMenuOpen ? (
                  <div className="account-dropdown">
                    {accountMenuItems.map((item) => (
                      <button key={item.key} type="button" className="account-dropdown-item" onClick={() => handleNavigate(item.key)}>
                        <span className="account-dropdown-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                    <button type="button" className="account-dropdown-item account-dropdown-signout" onClick={handleSignOut}>
                      <span className="account-dropdown-icon">
                        <SignOutIcon />
                      </span>
                      <span>Çıxış</span>
                    </button>
                  </div>
                ) : null}
              </div>
              </div>
            ) : (
              <button type="button" className="login-action" onClick={() => handleNavigate("auth")}>
                <span>Daxil ol</span>
                <ArrowUpRightIcon />
              </button>
            )}
          </div>
          <button className={`menu-toggle ${menuOpen ? "open" : ""}`} type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Menyu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        </div>
      </div>
      <div className={`site-header-nav ${menuOpen ? "open" : ""}`}>
        <nav className={`container main-nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${activeSection === item.key ? "active" : ""} ${item.key === "create" ? "nav-cta" : ""}`.trim()}
              onClick={() => handleNavigate(item.key)}
            >
              <span className="nav-item-icon">{getNavIcon(item.key)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>

      <nav className="mobile-bottom-nav" aria-label="Mobil əsas menyu">
        <button type="button" className={activeSection === "home" ? "active" : ""} onClick={() => handleNavigate("home")} aria-label="Ana səhifə">
          <HomeIcon />
          <span>Ana səhifə</span>
        </button>
        <button type="button" className={activeSection === "jobs" ? "active" : ""} onClick={() => handleNavigate("jobs")} aria-label="Elanlar">
          <BriefcaseIcon />
          <span>Elanlar</span>
        </button>
        {user && canCreateJob ? (
          <button type="button" className={`mobile-bottom-create ${activeSection === "create" ? "active" : ""}`} onClick={() => handleNavigate("create")} aria-label="Elan yarat">
            <PlusIcon />
            <span>Yarat</span>
          </button>
        ) : null}
        {user ? (
          <button type="button" className={activeSection === "notifications" ? "active" : ""} onClick={() => handleNavigate("notifications")} aria-label="Bildirişlər">
            <span className="mobile-bottom-badge-wrap">
              <BellIcon />
              {unreadNotificationsCount > 0 ? <em>{unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}</em> : null}
            </span>
            <span>Bildiriş</span>
          </button>
        ) : null}
        {user ? (
          <button type="button" className={activeSection === "profile" ? "active" : ""} onClick={() => handleNavigate("profile")} aria-label="Profil">
            <ProfileIcon />
            <span>Profil</span>
          </button>
        ) : (
          <button type="button" className={activeSection === "auth" ? "active" : ""} onClick={() => handleNavigate("auth")} aria-label="Daxil ol">
            <ProfileIcon />
            <span>Daxil ol</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default Header;
