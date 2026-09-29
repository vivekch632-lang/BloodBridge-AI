import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, User, Menu, X, ShieldAlert, Sparkles, LogOut, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const handleRoleToggle = () => {
    const nextRole = currentUser.role === 'donor' ? 'recipient' : 'donor';
    const updated = authService.switchRole(nextRole);
    setCurrentUser(updated);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    const guest = authService.logout();
    setCurrentUser(guest);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-header">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-brand">
            <div className="brand-icon-wrapper">
              <Heart className="brand-icon pulse-heart" size={22} fill="#dc2626" color="#dc2626" />
            </div>
            <div className="brand-text">
              <span className="brand-title">BloodBridge</span>
              <span className="brand-ai-badge">AI</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/find-blood" className={`nav-link ${isActive('/find-blood') ? 'active' : ''}`}>
              Find Blood
            </Link>
            <Link to="/become-donor" className={`nav-link ${isActive('/become-donor') ? 'active' : ''}`}>
              Become a Donor
            </Link>
            <Link to="/requests" className={`nav-link ${isActive('/requests') ? 'active' : ''}`}>
              Emergency Feed
            </Link>
            <Link to="/ai-assistant" className={`nav-link nav-link-ai ${isActive('/ai-assistant') ? 'active' : ''}`}>
              <Sparkles size={15} />
              AI Assistant
            </Link>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              Dashboard
            </Link>
          </nav>

          {/* User & Emergency CTA */}
          <div className="navbar-actions">
            <Link to="/find-blood" className="btn btn-primary btn-sm emergency-btn">
              <ShieldAlert size={16} />
              <span>Urgent Request</span>
            </Link>

            {currentUser && currentUser.email !== 'guest@bloodbridge.ai' ? (
              <div className="user-profile-menu">
                <button 
                  onClick={handleRoleToggle}
                  className="role-switch-pill"
                  title="Click to switch between Donor & Recipient views"
                >
                  <RefreshCw size={13} />
                  <span className="role-text">
                    {currentUser?.role === 'donor' ? 'Donor Mode' : 'Hospital Mode'}
                  </span>
                </button>

                <div
                  className="user-avatar-badge"
                  title={`${currentUser?.name || 'User'} (${currentUser?.role || 'donor'})`}
                >
                  <User size={16} />
                  <span className="user-short-name">
                    {(currentUser?.name || 'User').split(' ')[0]}
                  </span>
                </div>

                <button onClick={handleLogout} className="btn-icon-logout" title="Log out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="mobile-nav-drawer">
            <Link to="/" onClick={() => setIsOpen(false)} className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/find-blood" onClick={() => setIsOpen(false)} className={`mobile-nav-link ${isActive('/find-blood') ? 'active' : ''}`}>
              Find Blood / Emergency Request
            </Link>
            <Link to="/become-donor" onClick={() => setIsOpen(false)} className={`mobile-nav-link ${isActive('/become-donor') ? 'active' : ''}`}>
              Become a Donor
            </Link>
            <Link to="/requests" onClick={() => setIsOpen(false)} className={`mobile-nav-link ${isActive('/requests') ? 'active' : ''}`}>
              Emergency Appeals Feed
            </Link>
            <Link to="/ai-assistant" onClick={() => setIsOpen(false)} className={`mobile-nav-link ${isActive('/ai-assistant') ? 'active' : ''}`}>
              AI Blood Match Assistant
            </Link>
            <Link to="/dashboard" onClick={() => setIsOpen(false)} className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              Dashboard ({currentUser.role === 'donor' ? 'Donor View' : 'Recipient View'})
            </Link>
            <div className="mobile-nav-footer">
              <button onClick={handleRoleToggle} className="btn btn-secondary btn-sm btn-block">
                <RefreshCw size={14} />
                Switch to {currentUser.role === 'donor' ? 'Hospital/Recipient' : 'Donor'} Mode
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .navbar-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--slate-200);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          gap: 1.5rem;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-weight: 800;
          text-decoration: none;
        }
        .brand-icon-wrapper {
          background: var(--primary-50);
          border: 1px solid var(--primary-200);
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-text {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .brand-title {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--slate-900);
        }
        .brand-ai-badge {
          background: linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%);
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }
        .desktop-nav {
          display: none;
          align-items: center;
          gap: 0.25rem;
        }
        @media (min-width: 960px) {
          .desktop-nav {
            display: flex;
          }
        }
        .nav-link {
          padding: 0.5rem 0.85rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--slate-600);
          border-radius: var(--radius-md);
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .nav-link:hover {
          color: var(--slate-900);
          background: var(--slate-100);
        }
        .nav-link.active {
          color: var(--primary);
          background: var(--primary-50);
          font-weight: 700;
        }
        .nav-link-ai {
          color: #7c3aed;
        }
        .nav-link-ai.active {
          color: #7c3aed;
          background: #f5f3ff;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .role-switch-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          background: var(--slate-100);
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--slate-700);
          transition: var(--transition);
        }
        .role-switch-pill:hover {
          background: var(--slate-200);
          color: var(--slate-900);
        }
        .user-avatar-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--slate-800);
        }
        .btn-icon-logout {
          background: none;
          color: var(--slate-400);
          padding: 0.4rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: var(--transition);
        }
        .btn-icon-logout:hover {
          color: var(--primary);
          background: var(--primary-50);
        }
        .mobile-menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          color: var(--slate-700);
          padding: 0.4rem;
          border-radius: 8px;
        }
        @media (min-width: 960px) {
          .mobile-menu-btn {
            display: none;
          }
        }
        .mobile-nav-drawer {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem 0 1.5rem;
          border-top: 1px solid var(--slate-200);
        }
        .mobile-nav-link {
          padding: 0.75rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--slate-700);
          border-radius: var(--radius-md);
        }
        .mobile-nav-link.active {
          background: var(--primary-50);
          color: var(--primary);
        }
        .mobile-nav-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed var(--slate-200);
        }
      `}</style>
    </header>
  );
}
