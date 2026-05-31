import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <svg
            className="logo-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Custom geometric Islamic arch & open book motif */}
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <div className="brand-text-wrapper">
            <span className="brand-name">WISDOM</span>
            <span className="brand-tagline">Manjeri Community Portal</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className={isActive('/')}>
            All Events
          </Link>
          <Link to="/admin" className={isActive('/admin') || isActive('/admin/dashboard') ? 'nav-link active' : 'nav-link'}>
            <ShieldAlert size={16} /> Admin Portal
          </Link>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn flex-center"
            aria-label="Toggle light/dark theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </nav>

        {/* Mobile Action Controls */}
        <div className="mobile-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn flex-center"
            aria-label="Toggle light/dark theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn flex-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="mobile-nav-panel glass-card">
          <nav className="mobile-nav-links">
            <Link
              to="/"
              className={location.pathname === '/' ? 'mobile-nav-link active' : 'mobile-nav-link'}
              onClick={() => setMobileMenuOpen(false)}
            >
              All Events & Classes
            </Link>
            <Link
              to="/admin"
              className={
                location.pathname.startsWith('/admin') ? 'mobile-nav-link active' : 'mobile-nav-link'
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Dashboard
            </Link>
          </nav>
        </div>
      )}

      {/* Header Specific Styles inline in design system but we add localized spacing */}
      <style>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-glass);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--border);
          padding: 12px 0;
        }
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--primary);
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          color: var(--primary);
          filter: drop-shadow(0 2px 8px var(--primary-glow));
          transition: var(--transition);
        }
        .brand-logo:hover .logo-icon {
          transform: rotate(5deg) scale(1.05);
          color: var(--accent);
        }
        .brand-text-wrapper {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.4rem;
          letter-spacing: 1px;
          line-height: 1.1;
          color: var(--text-main);
        }
        .brand-tagline {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-muted);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
        }
        .nav-link:hover {
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .nav-link.active {
          color: var(--primary);
          background-color: var(--primary-light);
          border-bottom: 2px solid var(--primary);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        .theme-toggle-btn {
          background: transparent;
          border: 1px solid var(--border);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .theme-toggle-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
          background-color: var(--primary-light);
        }
        .mobile-actions {
          display: none;
          align-items: center;
          gap: 12px;
        }
        .mobile-menu-btn {
          background: transparent;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          padding: 4px;
        }
        .mobile-nav-panel {
          position: absolute;
          top: 100%;
          left: 16px;
          right: 16px;
          margin-top: 8px;
          padding: 16px;
          border-radius: var(--radius-md);
          z-index: 99;
          transform-origin: top;
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mobile-nav-link {
          display: block;
          padding: 14px 16px;
          border-radius: var(--radius-sm);
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          color: var(--primary);
          background-color: var(--primary-light);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: scaleY(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scaleY(1) translateY(0);
          }
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }
          .mobile-actions {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
};
