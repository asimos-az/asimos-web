import Link from 'next/link';

const Header = ({ activeSection, setActiveSection, navItems, user, handleSignOut }) => {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <Link href="/">
            <img src="/logo.svg" alt="xtragency logo" />
          </Link>
        </div>
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
            {user ? (
              <button type="button" className="btn-secondary" onClick={handleSignOut}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Cixis
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => setActiveSection("auth")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                Daxil ol
              </button>
            )}
          </div>
        <button className="menu-toggle">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
