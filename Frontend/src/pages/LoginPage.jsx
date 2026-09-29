import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, Lock, Mail, UserCheck, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { showToast } from '../services/toastService';

export default function LoginPage() {
  const [role, setRole] = useState('donor'); // 'donor' | 'recipient'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      authService.login(email, password, role);
      setIsLoading(false);
      showToast(`Welcome back! Logged in as ${role === 'donor' ? 'Blood Donor' : 'Hospital Coordinator'}.`, 'success');
      navigate('/dashboard');
    }, 450);
  };

  const handleQuickDemoFill = (type) => {
    if (type === 'donor') {
      setRole('donor');
      setEmail('priya.patel@example.com');
      setPassword('password123');
    } else {
      setRole('recipient');
      setEmail('dr.sharma@cityhospital.org');
      setPassword('password123');
    }
  };

  return (
    <div className="auth-page-root">
      <div className="container container-narrow">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-brand-badge">
              <Heart size={22} fill="#dc2626" color="#dc2626" />
            </div>
            <h2>Sign in to BloodBridge AI</h2>
            <p>Access your emergency dispatch console or donor registry</p>
          </div>

          {/* Role Toggle */}
          <div className="role-selector">
            <button 
              type="button"
              className={`role-btn ${role === 'donor' ? 'active' : ''}`}
              onClick={() => setRole('donor')}
            >
              <UserCheck size={16} />
              <span>Blood Donor</span>
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'recipient' ? 'active' : ''}`}
              onClick={() => setRole('recipient')}
            >
              <ShieldCheck size={16} />
              <span>Hospital / Recipient</span>
            </button>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  className={`form-input icon-padded ${errors.email ? 'error' : ''}`}
                  placeholder={role === 'donor' ? 'donor@example.com' : 'hospital@medical.org'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <div className="form-error-msg">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input icon-padded icon-padded-right ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <div className="form-error-msg">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : `Log In as ${role === 'donor' ? 'Donor' : 'Hospital / Recipient'}`}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="demo-fill-box">
            <span className="demo-fill-label">Quick Demo Profiles:</span>
            <div className="demo-fill-btns">
              <button 
                type="button" 
                className="btn btn-sm btn-secondary" 
                onClick={() => handleQuickDemoFill('donor')}
              >
                Donor Demo (Priya - O-)
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary" 
                onClick={() => handleQuickDemoFill('recipient')}
              >
                Hospital Demo (Dr. Sharma)
              </button>
            </div>
          </div>

          <div className="auth-footer-link">
            Don't have an account yet?{' '}
            <Link to="/signup" className="auth-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page-root {
          padding: 3.5rem 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 150px);
        }
        .auth-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          box-shadow: var(--shadow-md);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-brand-badge {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--primary-50);
          border: 1px solid var(--primary-200);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .auth-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--slate-900);
          letter-spacing: -0.02em;
          margin-bottom: 0.35rem;
        }
        .auth-header p {
          font-size: 0.95rem;
          color: var(--slate-500);
        }
        .role-selector {
          display: flex;
          background: var(--slate-100);
          padding: 4px;
          border-radius: var(--radius-md);
          margin-bottom: 1.75rem;
          gap: 4px;
        }
        .role-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--slate-600);
          background: transparent;
          border-radius: var(--radius-sm);
          transition: var(--transition);
        }
        .role-btn.active {
          background: white;
          color: var(--slate-900);
          box-shadow: var(--shadow-sm);
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--slate-400);
          pointer-events: none;
        }
        .icon-padded {
          padding-left: 2.5rem;
        }
        .icon-padded-right {
          padding-right: 2.5rem;
        }
        .password-toggle-btn {
          position: absolute;
          right: 0.85rem;
          background: none;
          color: var(--slate-400);
          display: flex;
          align-items: center;
        }
        .password-toggle-btn:hover {
          color: var(--slate-700);
        }
        .demo-fill-box {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px dashed var(--slate-200);
          text-align: center;
        }
        .demo-fill-label {
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--slate-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 0.6rem;
        }
        .demo-fill-btns {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .auth-footer-link {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
          color: var(--slate-600);
        }
        .auth-link {
          color: var(--primary);
          font-weight: 700;
        }
        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
