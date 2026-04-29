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

const Header = ({ activeSection, setActiveSection, navItems, user, handleSignOut, canCreateJob = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

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
    setActiveSection(section);
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }

  const accountMenuItems = [
    { key: "profile", label: "Profil", icon: <ProfileIcon /> },
    { key: "support", label: "Dəstək", icon: <SupportIcon /> },
    { key: "alerts", label: "Bildirişlər", icon: <BellIcon /> },
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <Link href="/">
            <img src="/logo.svg" alt="Asimos loqosu" />
          </Link>
        </div>
        <nav className={`main-nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${activeSection === item.key ? "active" : ""} ${item.key === "create" ? "nav-cta" : ""}`.trim()}
              onClick={() => handleNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          {user && canCreateJob ? (
            <button type="button" className={`create-action ${activeSection === "create" ? "active" : ""}`} onClick={() => handleNavigate("create")}>
              <PlusIcon />
              <span>Elan yarat</span>
            </button>
          ) : null}
          <div className="user-chip">
            {user ? (
              <div className="account-menu" ref={accountMenuRef}>
                <button
                  type="button"
                  className={`account-trigger ${accountMenuOpen ? "open" : ""}`}
                  onClick={() => setAccountMenuOpen((value) => !value)}
                  aria-label="Hesab menyusu"
                >
                  <ProfileIcon />
                </button>

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
            ) : (
              <button type="button" className="btn-secondary" onClick={() => handleNavigate("auth")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                Daxil ol
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
    </header>
  );
};

export default Header;
