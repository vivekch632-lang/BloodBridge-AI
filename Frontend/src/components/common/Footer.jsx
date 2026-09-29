import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, PhoneCall } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-root">
      {/* Emergency Hotline Alert Strip */}
      <div className="hotline-strip">
        <div className="container hotline-inner">
          <div className="hotline-text">
            <PhoneCall className="pulse-heart" size={18} />
            <span>24/7 National Emergency Blood Helpline: <strong>104 / 1800-11-2233</strong></span>
          </div>
          <Link to="/find-blood" className="btn btn-sm btn-danger-outline">
            Request Emergency Dispatch
          </Link>
        </div>
      </div>

      <div className="container footer-main">
        <div className="footer-grid">
          {/* Col 1: About */}
          <div className="footer-col">
            <div className="footer-brand">
              <div className="footer-icon-wrap">
                <Heart size={20} fill="#dc2626" color="#dc2626" />
              </div>
              <span className="footer-brand-title">BloodBridge AI</span>
            </div>
            <p className="footer-desc">
              An intelligent, real-time emergency blood donation and donor-matching platform bridging critical shortages with rapid AI triage, geolocation, and verified donor pools.
            </p>
            <div className="badge badge-standard">
              <ShieldCheck size={14} />
              <span>HIPAA & Healthcare Ethics Aligned</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Platform Services</h4>
            <ul className="footer-links">
              <li><Link to="/find-blood">Emergency Blood Request</Link></li>
              <li><Link to="/become-donor">Register as a Blood Donor</Link></li>
              <li><Link to="/requests">Live Emergency Appeals</Link></li>
              <li><Link to="/ai-assistant">AI Blood Match Assistant</Link></li>
              <li><Link to="/dashboard">Donor & Hospital Dashboard</Link></li>
            </ul>
          </div>

          {/* Col 3: Medical Blood Chart */}
          <div className="footer-col">
            <h4 className="footer-heading">Universal Compatibility</h4>
            <div className="blood-matrix-card">
              <div className="matrix-row">
                <span className="pill-universal-donor">O-</span>
                <span className="matrix-desc">Universal Red Cell Donor (can donate to all groups)</span>
              </div>
              <div className="matrix-row">
                <span className="pill-universal-recip">AB+</span>
                <span className="matrix-desc">Universal Recipient (can receive from any group)</span>
              </div>
              <div className="matrix-row">
                <span className="pill-rest-rule">90 Days</span>
                <span className="matrix-desc">Standard biological rest gap required between whole blood donations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} BloodBridge AI. Academic Healthcare Project. Built for emergency response rapid matching.</p>
          <p className="disclaimer-text">
            Disclaimer: BloodBridge AI is an assistive decision-support coordination platform. In acute life-threatening situations, always contact hospital trauma centers immediately.
          </p>
        </div>
      </div>

      <style>{`
        .footer-root {
          background: #0f172a;
          color: #94a3b8;
          border-top: 1px solid var(--slate-800);
          margin-top: auto;
        }
        .hotline-strip {
          background: #1e293b;
          border-bottom: 1px solid #334155;
          padding: 0.85rem 0;
          color: #f8fafc;
        }
        .hotline-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .hotline-text {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.95rem;
        }
        .hotline-text strong {
          color: #fca5a5;
          letter-spacing: 0.02em;
        }
        .footer-main {
          padding-top: 3.5rem;
          padding-bottom: 2rem;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          margin-bottom: 3rem;
        }
        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: 1.5fr 1fr 1.2fr;
          }
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .footer-icon-wrap {
          background: rgba(220, 38, 38, 0.15);
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .footer-brand-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: white;
        }
        .footer-desc {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #94a3b8;
          margin-bottom: 1.25rem;
        }
        .footer-heading {
          color: white;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          letter-spacing: -0.01em;
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .footer-links a {
          font-size: 0.9rem;
          color: #94a3b8;
          transition: var(--transition);
        }
        .footer-links a:hover {
          color: white;
          padding-left: 4px;
        }
        .blood-matrix-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .matrix-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .pill-universal-donor {
          background: #dc2626;
          color: white;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          min-width: 32px;
          text-align: center;
        }
        .pill-universal-recip {
          background: #0284c7;
          color: white;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          min-width: 32px;
          text-align: center;
        }
        .pill-rest-rule {
          background: #059669;
          color: white;
          font-weight: 800;
          font-size: 0.7rem;
          padding: 0.2rem 0.45rem;
          border-radius: 6px;
          white-space: nowrap;
        }
        .matrix-desc {
          font-size: 0.8rem;
          color: #cbd5e1;
          line-height: 1.4;
        }
        .footer-bottom {
          border-top: 1px solid #334155;
          padding-top: 1.75rem;
          font-size: 0.8125rem;
          color: #64748b;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .disclaimer-text {
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>
    </footer>
  );
}
