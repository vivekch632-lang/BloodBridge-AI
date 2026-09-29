import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ShieldAlert, 
  UserPlus, 
  Sparkles, 
  Clock, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Building2, 
  Award,
  Zap
} from 'lucide-react';
import { BloodBadge } from '../components/common/Badge';
import { BLOOD_GROUPS, RECIPIENT_CAN_RECEIVE_FROM } from '../utils/bloodCompatibility';

export default function LandingPage() {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('O-');

  const compatibleDonors = RECIPIENT_CAN_RECEIVE_FROM[selectedBloodGroup] || [];

  return (
    <div className="landing-page">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-badge-pill">
            <span className="live-dot"></span>
            <Sparkles size={14} color="#dc2626" />
            <span>AI-Powered Emergency Blood Dispatch Network</span>
          </div>

          <h1 className="hero-title">
            Every Second Counts.<br />
            <span className="hero-highlight">Intelligent Blood Matching</span> When Minutes Save Lives.
          </h1>

          <p className="hero-subtitle">
            BloodBridge AI bridges critical healthcare shortages by instantly connecting trauma hospitals and patients with eligible, compatible nearby blood donors using real-time clinical triage and geolocation algorithms.
          </p>

          <div className="hero-cta-group">
            <Link to="/find-blood" className="btn btn-primary btn-lg hero-btn-urgent">
              <ShieldAlert size={20} />
              <span>Request Emergency Blood</span>
            </Link>
            <Link to="/become-donor" className="btn btn-secondary btn-lg hero-btn-donor">
              <UserPlus size={20} />
              <span>Register as a Donor</span>
            </Link>
          </div>

          {/* Urgent Live Banner */}
          <div className="hero-urgent-strip">
            <div className="urgent-badge-mini">LIVE ALERT</div>
            <p className="urgent-strip-text">
              Emergency demand in <strong>Lilavati Hospital & KEM Hospital, Mumbai</strong>: <strong>B+</strong> and <strong>O-</strong> units required urgently.
            </p>
            <Link to="/requests" className="urgent-strip-link">
              View Feed <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper red">
                <Users size={24} />
              </div>
              <div className="stat-number">1,420+</div>
              <div className="stat-label">Verified Active Donors</div>
              <div className="stat-sub">Ready across 18 major hospital zones</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper emerald">
                <Heart size={24} />
              </div>
              <div className="stat-number">890+</div>
              <div className="stat-label">Transfusions Facilitated</div>
              <div className="stat-sub">Zero fatal shortages on active dispatches</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper amber">
                <Clock size={24} />
              </div>
              <div className="stat-number">&lt; 14 Mins</div>
              <div className="stat-label">Average Match & Dispatch</div>
              <div className="stat-sub">65% faster than conventional telephone trees</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper cyan">
                <Award size={24} />
              </div>
              <div className="stat-number">99.8%</div>
              <div className="stat-label">Clinical Match Accuracy</div>
              <div className="stat-sub">Strict ABO & Rh antigen adherence</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-subtitle">RAPID RESPONSE PROTOCOL</span>
            <h2 className="section-title">How BloodBridge AI Saves Lives in 4 Steps</h2>
            <p className="section-desc">
              Designed with trauma surgeons and emergency responders to eliminate latency and manual donor calling.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-card">
              <div className="step-badge">01</div>
              <div className="workflow-icon red"><ShieldAlert size={28} /></div>
              <h3>Emergency Request Triggered</h3>
              <p>Hospitals or family coordinators post patient blood requirements, required units, and urgency level in under 30 seconds.</p>
            </div>

            <div className="workflow-card">
              <div className="step-badge">02</div>
              <div className="workflow-icon purple"><Sparkles size={28} /></div>
              <h3>AI Prioritization & Geolocation</h3>
              <p>Our algorithm evaluates red cell compatibility, proximity distance, 90-day rest recency, and availability to rank optimal donors.</p>
            </div>

            <div className="workflow-card">
              <div className="step-badge">03</div>
              <div className="workflow-icon amber"><Zap size={28} /></div>
              <h3>Instant Automated Alert</h3>
              <p>Top compatible donors within radius receive immediate emergency notifications with hospital navigation coordinates.</p>
            </div>

            <div className="workflow-card">
              <div className="step-badge">04</div>
              <div className="workflow-icon emerald"><CheckCircle2 size={28} /></div>
              <h3>Safe Transfusion Delivery</h3>
              <p>Donation is received, verified by the blood bank, and transferred to the ICU or trauma theater, saving another life.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE BLOOD COMPATIBILITY CHECKER */}
      <section className="compat-tool-section">
        <div className="container">
          <div className="compat-tool-card">
            <div className="compat-tool-header">
              <div>
                <span className="section-subtitle">INTERACTIVE CLINICAL REFERENCE</span>
                <h3 className="compat-tool-title">Blood Compatibility Matrix</h3>
                <p className="compat-tool-desc">Select a recipient's blood group to see which donors can safely donate.</p>
              </div>
              <div className="badge badge-standard">
                <span>ABO / Rh Red Cell Rules</span>
              </div>
            </div>

            <div className="blood-picker-row">
              <span className="picker-label">Recipient Blood Group:</span>
              <div className="blood-buttons">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBloodGroup(bg)}
                    className={`blood-btn ${selectedBloodGroup === bg ? 'active' : ''}`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="compat-result-box">
              <div className="result-main">
                <span className="result-lead">A patient with <strong>{selectedBloodGroup}</strong> can receive red blood cells from:</span>
                <div className="result-chips">
                  {compatibleDonors.map((bg) => (
                    <div key={bg} className="compatible-chip">
                      <BloodBadge group={bg} size="lg" />
                      <span className="chip-note">{bg === selectedBloodGroup ? 'Exact Match' : bg === 'O-' ? 'Universal Donor' : 'Compatible Alternative'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-ai-note">
                <div className="ai-note-badge">
                  <Sparkles size={14} />
                  <span>AI Matching Insight</span>
                </div>
                <p>
                  {selectedBloodGroup === 'O-' && 'O- is the universal red blood cell donor. However, O- recipients can ONLY receive O- blood safely, making immediate local O- donor matching critical.'}
                  {selectedBloodGroup === 'AB+' && 'AB+ is the universal recipient and can safely receive red blood cells from all ABO/Rh blood types. The AI engine prioritizes exact AB+ first to conserve O- stocks for emergency trauma.'}
                  {selectedBloodGroup !== 'O-' && selectedBloodGroup !== 'AB+' && `While ${selectedBloodGroup} is preferred to prevent antibody sensitisation, ${compatibleDonors.join(', ')} can be administered in urgent shortages after crossmatching.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLATFORM CORE FEATURES */}
      <section className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-subtitle">ENTERPRISE HEALTHCARE GRADE</span>
            <h2 className="section-title">Built for Precision, Reliability, and Speed</h2>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon"><Activity size={24} /></div>
              <h4>Real-time Geolocation Radius</h4>
              <p>Donors are matched by driving distance and traffic patterns, ensuring blood reaches the theater before critical thresholds.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Sparkles size={24} /></div>
              <h4>AI Triage & Rationale Engine</h4>
              <p>Every match provides transparent clinical rationale to attending surgeons, explaining the antigen safety score.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Clock size={24} /></div>
              <h4>90-Day Biological Rest Tracker</h4>
              <p>Protects donor health by calculating minimum rest periods and hemoglobin recovery intervals before dispatch.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Building2 size={24} /></div>
              <h4>Hospital & Coordinator Portal</h4>
              <p>Dedicated tracking dashboards for blood bank officers to monitor open appeals, incoming donor confirmations, and ETA.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Zap size={24} /></div>
              <h4>Zero-Friction Emergency Posting</h4>
              <p>No tedious onboarding in emergencies. Coordinators can broadcast requirements in under 30 seconds.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Users size={24} /></div>
              <h4>Dual-Role Unified Dashboards</h4>
              <p>Seamlessly toggle between giving blood and managing hospital requests with full privacy protection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-content">
              <h2>Be Someone's Lifeline Today</h2>
              <p>Join thousands of registered heroes ready to respond when an emergency strikes in your neighborhood.</p>
              <div className="cta-buttons">
                <Link to="/become-donor" className="btn btn-primary btn-lg">
                  Register as a Donor Now
                </Link>
                <Link to="/ai-assistant" className="btn btn-secondary btn-lg">
                  <Sparkles size={18} />
                  Try AI Blood Match Assistant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .hero-section {
          padding: 4.5rem 0 3.5rem;
          background: radial-gradient(circle at 50% 10%, rgba(220, 38, 38, 0.07) 0%, rgba(248, 250, 252, 1) 70%);
          text-align: center;
        }
        .hero-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          background: white;
          border: 1px solid var(--primary-200);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
          margin-bottom: 1.5rem;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          animation: pulse-border 1.5s infinite;
        }
        .hero-title {
          font-size: 2.75rem;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--slate-900);
          max-width: 880px;
          margin-bottom: 1.25rem;
        }
        @media (min-width: 768px) {
          .hero-title {
            font-size: 3.5rem;
          }
        }
        .hero-highlight {
          color: var(--primary);
          position: relative;
        }
        .hero-subtitle {
          font-size: 1.125rem;
          line-height: 1.6;
          color: var(--slate-600);
          max-width: 720px;
          margin-bottom: 2.25rem;
        }
        .hero-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }
        .hero-btn-urgent {
          background: var(--primary);
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
        }
        .hero-urgent-strip {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1.25rem;
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-sm);
          font-size: 0.875rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .urgent-badge-mini {
          background: #dc2626;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .urgent-strip-text {
          color: var(--slate-700);
        }
        .urgent-strip-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--primary);
          font-weight: 700;
        }
        .stats-section {
          padding: 2.5rem 0 3.5rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .stat-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 1.75rem 1.5rem;
          box-shadow: var(--shadow-sm);
          text-align: left;
          transition: var(--transition);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .stat-icon-wrapper {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .stat-icon-wrapper.red { background: #fef2f2; color: #dc2626; }
        .stat-icon-wrapper.emerald { background: #ecfdf5; color: #059669; }
        .stat-icon-wrapper.amber { background: #fffbeb; color: #d97706; }
        .stat-icon-wrapper.cyan { background: #ecfeff; color: #0891b2; }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: var(--slate-900);
          line-height: 1;
          margin-bottom: 0.4rem;
          letter-spacing: -0.02em;
        }
        .stat-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--slate-800);
          margin-bottom: 0.25rem;
        }
        .stat-sub {
          font-size: 0.775rem;
          color: var(--slate-500);
          line-height: 1.4;
        }
        .how-it-works-section {
          padding: 4rem 0;
          background: white;
          border-top: 1px solid var(--slate-200);
          border-bottom: 1px solid var(--slate-200);
        }
        .section-header {
          margin-bottom: 3.5rem;
        }
        .section-subtitle {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 0.5rem;
        }
        .section-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--slate-900);
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }
        .section-desc {
          font-size: 1.05rem;
          color: var(--slate-600);
          max-width: 620px;
          margin: 0 auto;
        }
        .text-center { text-align: center; }

        .workflow-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .workflow-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .workflow-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .workflow-card {
          background: var(--slate-50);
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 2rem 1.5rem;
          position: relative;
          transition: var(--transition);
        }
        .workflow-card:hover {
          background: white;
          box-shadow: var(--shadow-md);
          border-color: var(--slate-300);
        }
        .step-badge {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--slate-300);
        }
        .workflow-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .workflow-icon.red { background: #fee2e2; color: #dc2626; }
        .workflow-icon.purple { background: #f3e8ff; color: #7c3aed; }
        .workflow-icon.amber { background: #fef3c7; color: #d97706; }
        .workflow-icon.emerald { background: #d1fae5; color: #059669; }

        .workflow-card h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--slate-900);
          margin-bottom: 0.6rem;
        }
        .workflow-card p {
          font-size: 0.875rem;
          color: var(--slate-600);
          line-height: 1.5;
        }

        .compat-tool-section {
          padding: 4rem 0;
        }
        .compat-tool-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          box-shadow: var(--shadow-md);
        }
        .compat-tool-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--slate-100);
          padding-bottom: 1.5rem;
        }
        .compat-tool-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--slate-900);
          margin-bottom: 0.3rem;
        }
        .compat-tool-desc {
          color: var(--slate-600);
          font-size: 0.95rem;
        }
        .blood-picker-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        .picker-label {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--slate-700);
        }
        .blood-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .blood-btn {
          padding: 0.5rem 1rem;
          font-size: 0.95rem;
          font-weight: 800;
          background: var(--slate-100);
          color: var(--slate-700);
          border: 1.5px solid var(--slate-200);
          border-radius: var(--radius-md);
          transition: var(--transition);
        }
        .blood-btn:hover {
          background: var(--slate-200);
        }
        .blood-btn.active {
          background: #dc2626;
          color: white;
          border-color: #b91c1c;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        .compat-result-box {
          background: var(--slate-50);
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .result-lead {
          font-size: 1rem;
          color: var(--slate-800);
          display: block;
          margin-bottom: 1rem;
        }
        .result-chips {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .compatible-chip {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-md);
          padding: 0.6rem 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          box-shadow: var(--shadow-xs);
        }
        .chip-note {
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--slate-600);
        }
        .result-ai-note {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: #1e40af;
          line-height: 1.5;
        }
        .ai-note-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 700;
          font-size: 0.75rem;
          color: #1d4ed8;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }

        .features-section {
          padding: 4rem 0;
          background: white;
        }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .feature-item {
          padding: 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--slate-100);
          background: var(--slate-50);
          transition: var(--transition);
        }
        .feature-item:hover {
          background: white;
          box-shadow: var(--shadow-sm);
          border-color: var(--slate-200);
        }
        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--primary-50);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .feature-item h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--slate-900);
          margin-bottom: 0.5rem;
        }
        .feature-item p {
          font-size: 0.875rem;
          color: var(--slate-600);
          line-height: 1.5;
        }

        .cta-banner-section {
          padding: 4rem 0 5rem;
        }
        .cta-banner {
          background: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #991b1b 100%);
          border-radius: var(--radius-xl);
          padding: 3.5rem 2rem;
          text-align: center;
          color: white;
          box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
        }
        .cta-content {
          max-width: 680px;
          margin: 0 auto;
        }
        .cta-content h2 {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }
        .cta-content p {
          font-size: 1.05rem;
          color: #fecaca;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
