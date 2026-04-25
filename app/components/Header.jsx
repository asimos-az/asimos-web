import Link from "next/link";
import { useState } from "react";

const Header = ({ activeSection, setActiveSection, navItems, user, handleSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavigate(section) {
    setActiveSection(section);
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <Link href="/">
            <img src="/logo.svg" alt="Asimos loqosu" />
          </Link>
          <div className="brand-copy">
            <strong>Asimos</strong>
            <span>Karyera platforması</span>
          </div>
        </div>
        <nav className={`main-nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={activeSection === item.key ? "active" : ""}
              onClick={() => handleNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <div className="user-chip">
            {user ? (
              <button type="button" className="btn-secondary" onClick={handleSignOut}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Çıxış
              </button>
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
