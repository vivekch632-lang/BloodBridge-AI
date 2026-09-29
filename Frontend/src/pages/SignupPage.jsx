import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, Lock, Mail, User, Phone, MapPin, ShieldCheck, UserCheck } from 'lucide-react';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { authService } from '../services/authService';
import { showToast } from '../services/toastService';

export default function SignupPage() {
  const [role, setRole] = useState('donor');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Mumbai',
    bloodGroup: 'O+'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Contact phone number is required.';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Please enter a valid 10-digit phone number.';
    }
    if (!formData.city.trim()) errs.city = 'City is required for emergency dispatch.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      authService.signup({
        ...formData,
        role
      });
      setIsLoading(false);
      showToast('Registration successful! Welcome to BloodBridge AI.', 'success');
      navigate('/dashboard');
    }, 450);
  };

  return (
    <div className="auth-page-root">
      <div className="container container-narrow">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-brand-badge">
              <Heart size={22} fill="#dc2626" color="#dc2626" />
            </div>
            <h2>Create Your BloodBridge Account</h2>
            <p>Join the verified network to donate blood or coordinate hospital emergencies</p>
          </div>

          {/* Role selector */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${role === 'donor' ? 'active' : ''}`}
              onClick={() => setRole('donor')}
            >
              <UserCheck size={16} />
              <span>I am a Blood Donor</span>
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

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">
                Full Legal Name <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  className={`form-input icon-padded ${errors.name ? 'error' : ''}`}
                  placeholder="e.g. Dr. Rajesh Sharma / Priya Patel"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              {errors.name && <div className="form-error-msg">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Email Address <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  className={`form-input icon-padded ${errors.email ? 'error' : ''}`}
                  placeholder="contact@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              {errors.email && <div className="form-error-msg">{errors.email}</div>}
            </div>

            <div className="grid-1-2">
              <div className="form-group">
                <label className="form-label">
                  Contact Phone Number <span className="req">*</span>
                </label>
                <div className="input-with-icon">
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    className={`form-input icon-padded ${errors.phone ? 'error' : ''}`}
                    placeholder="+91 98200 00000"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
                {errors.phone && <div className="form-error-msg">{errors.phone}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  City / Location <span className="req">*</span>
                </label>
                <div className="input-with-icon">
                  <MapPin className="input-icon" size={18} />
                  <input
                    type="text"
                    className={`form-input icon-padded ${errors.city ? 'error' : ''}`}
                    placeholder="e.g. Mumbai, Delhi, Bengaluru"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                {errors.city && <div className="form-error-msg">{errors.city}</div>}
              </div>
            </div>

            {role === 'donor' && (
              <div className="form-group">
                <label className="form-label">
                  Blood Group <span className="req">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.bloodGroup}
                  onChange={(e) => handleChange('bloodGroup', e.target.value)}
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg} {bg === 'O-' ? '(Universal Red Cell Donor)' : bg === 'AB+' ? '(Universal Recipient)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Set Password <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input icon-padded icon-padded-right ${errors.password ? 'error' : ''}`}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <div className="form-error-msg">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isLoading}>
              {isLoading ? 'Creating Profile...' : `Register Account as ${role === 'donor' ? 'Donor' : 'Hospital / Recipient'}`}
            </button>
          </form>

          <div className="auth-footer-link">
            Already registered?{' '}
            <Link to="/login" className="auth-link">
              Sign in to your account
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
      `}</style>
    </div>
  );
}
