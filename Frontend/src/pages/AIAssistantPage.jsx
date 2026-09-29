import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';
import { BloodBadge } from '../components/common/Badge';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { aiService } from '../services/aiService';
import { showToast } from '../services/toastService';

export default function AIAssistantPage() {
  const [bloodGroup, setBloodGroup] = useState('B-');
  const [units, setUnits] = useState(2);
  const [emergencyLevel, setEmergencyLevel] = useState('Critical');
  const [hospital, setHospital] = useState('Lilavati Hospital Trauma Center');
  const [city, setCity] = useState('Mumbai');
  const [notes, setNotes] = useState('Acute polytrauma hemorrhage following highway collision; requires urgent uncrossed or crossmatched red cells.');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const sampleScenarios = [
    {
      title: '🚨 Acute Trauma Surgery',
      bloodGroup: 'B-',
      units: 3,
      emergencyLevel: 'Critical',
      hospital: 'Lilavati Trauma Center',
      city: 'Mumbai',
      notes: 'Ruptured spleen with massive blood loss. Requires rapid transfusion standby.'
    },
    {
      title: '👶 Pediatric Surgery (Rare AB-)',
      bloodGroup: 'AB-',
      units: 1,
      emergencyLevel: 'Urgent',
      hospital: 'Kokilaben Hospital',
      city: 'Mumbai',
      notes: 'Pediatric cardiovascular corrective procedure. Minimal antigen divergence needed.'
    },
    {
      title: '🏥 Universal O- Emergency',
      bloodGroup: 'O-',
      units: 4,
      emergencyLevel: 'Critical',
      hospital: 'KEM Hospital ICU',
      city: 'Mumbai',
      notes: 'Severe postpartum hemorrhage. Universal O- supply dangerously depleted.'
    }
  ];

  const handleApplyScenario = (sc) => {
    setBloodGroup(sc.bloodGroup);
    setUnits(sc.units);
    setEmergencyLevel(sc.emergencyLevel);
    setHospital(sc.hospital);
    setCity(sc.city);
    setNotes(sc.notes);
  };

  const handleRunAnalysis = async (e) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const result = await aiService.analyzeRequirement({
        bloodGroup,
        units,
        emergencyLevel,
        hospital,
        city,
        notes
      });
      setAiResult(result);
    } catch {
      showToast('Error generating AI analysis.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="ai-assistant-page">
      <div className="container">
        {/* Header */}
        <div className="ai-header">
          <div className="ai-badge">
            <Sparkles size={16} />
            <span>AI Decision Support System</span>
          </div>
          <h1 className="page-title">AI Blood Match & Triage Assistant</h1>
          <p className="page-subtitle">
            Simulate or evaluate emergency transfusion requirements. The AI engine applies clinical antigen matching protocols, geographic travel radius estimation, and biological rest rules to explain optimal donor prioritization.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="scenarios-strip">
          <span className="scenarios-label">Try Clinical Scenarios:</span>
          <div className="scenarios-btns">
            {sampleScenarios.map((sc, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-sm btn-secondary scenario-btn"
                onClick={() => handleApplyScenario(sc)}
              >
                {sc.title}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-layout-grid">
          {/* Left Column: Requirements Input Form */}
          <div className="ai-input-col">
            <div className="card">
              <h3 className="card-heading">
                <span>Emergency Blood Requirement</span>
              </h3>

              <form onSubmit={handleRunAnalysis}>
                <div className="grid-1-2">
                  <div className="form-group">
                    <label className="form-label">Patient Blood Type</label>
                    <select
                      className="form-select"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg} {['O-', 'AB-', 'B-'].includes(bg) ? '★ (Rare / Universal)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Units Needed (Bags)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      value={units}
                      onChange={(e) => setUnits(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Urgency Level</label>
                  <div className="urgency-grid">
                    {['Critical', 'Urgent', 'Standard'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={`urgency-pill-btn ${emergencyLevel === lvl ? 'active ' + lvl.toLowerCase() : ''}`}
                        onClick={() => setEmergencyLevel(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-1-2">
                  <div className="form-group">
                    <label className="form-label">Hospital / Facility</label>
                    <input
                      type="text"
                      className="form-input"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Indication / Notes</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter surgery type or patient condition..."
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Computing AI Prioritization...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate AI Prioritization Analysis</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: AI Triage Output */}
          <div className="ai-output-col">
            {!aiResult && !isAnalyzing && (
              <div className="card empty-ai-card">
                <div className="empty-ai-icon">
                  <Sparkles size={36} color="#7c3aed" />
                </div>
                <h3>Ready to Analyze Requirement</h3>
                <p>
                  Configure the patient parameters on the left or select a clinical preset to see real-time AI donor prioritization, antigen compatibility mapping, and delivery dispatch logistics.
                </p>
                <button onClick={() => handleRunAnalysis()} className="btn btn-primary btn-sm mt-3">
                  Run Analysis for {bloodGroup} ({units} Units)
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="card loading-ai-card">
                <div className="ai-pulse-spinner">
                  <RefreshCw size={40} color="#7c3aed" className="spin-icon" />
                </div>
                <h3>Evaluating Donor Pool & Antigen Safety...</h3>
                <p>Cross-referencing active donors in {city}, calculating travel times, and testing Rh isoimmunization risks.</p>
              </div>
            )}

            {aiResult && !isAnalyzing && (
              <div className="card ai-result-card">
                {/* Result Header */}
                <div className="result-card-header">
                  <div>
                    <div className="triage-status-pill" style={{ color: aiResult.urgencyColor, borderColor: aiResult.urgencyColor }}>
                      <AlertTriangle size={14} />
                      <span>{aiResult.triagePriority}</span>
                    </div>
                    <div className="target-arrival-time">
                      <Clock size={14} />
                      <span>{aiResult.targetTime}</span>
                    </div>
                  </div>

                  <div className="blood-target-badge">
                    <BloodBadge group={aiResult.bloodGroup} size="lg" />
                  </div>
                </div>

                {/* AI Clinical Summary */}
                <div className="ai-clinical-summary-box">
                  <div className="summary-title">
                    <Sparkles size={14} color="#7c3aed" />
                    <span>AI Transfusion Assessment</span>
                  </div>
                  <p>{aiResult.triageSummary}</p>
                </div>

                {/* Compatibility Strategies */}
                <div className="compat-strategy-section">
                  <h4 className="sub-heading">Compatible Blood Groups for This Patient</h4>
                  <div className="compat-groups-row">
                    <div className="primary-group-item">
                      <span className="strategy-label">Primary Choice (Zero Antigen Divergence):</span>
                      <div className="group-chip exact">
                        <BloodBadge group={aiResult.bloodGroup} size="md" />
                        <span>Exact Match Preferred</span>
                      </div>
                    </div>

                    {aiResult.alternatives.length > 0 && (
                      <div className="alt-groups-item">
                        <span className="strategy-label">Secondary Safe Alternatives:</span>
                        <div className="alt-chips-row">
                          {aiResult.alternatives.map((alt) => (
                            <div key={alt} className="group-chip compatible">
                              <BloodBadge group={alt} size="sm" />
                              <span>{alt === 'O-' ? 'Universal Red Cell' : 'Safe Alternative'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prioritization Breakdown */}
                <div className="prioritization-section">
                  <h4 className="sub-heading">How Suitable Donors Are Prioritized</h4>
                  <div className="criteria-list">
                    {aiResult.prioritizationCriteria.map((item, idx) => (
                      <div key={idx} className="criterion-item">
                        <div className="criterion-header">
                          <CheckCircle2 size={16} color="#7c3aed" />
                          <strong>{item.criterion}</strong>
                        </div>
                        <p className="criterion-detail">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Safety Cautions */}
                <div className="precautions-section">
                  <h4 className="sub-heading">Clinical Safety Precautions</h4>
                  <ul className="precautions-list">
                    {aiResult.clinicalPrecautions.map((caution, idx) => (
                      <li key={idx}>{caution}</li>
                    ))}
                  </ul>
                </div>

                {/* Top Matched Candidate Donors */}
                {aiResult.topRecommendedDonors && aiResult.topRecommendedDonors.length > 0 && (
                  <div className="candidates-section">
                    <h4 className="sub-heading">Top Recommended Donors in Donor Pool</h4>
                    <div className="candidates-list">
                      {aiResult.topRecommendedDonors.map((donor) => (
                        <div key={donor.id} className="candidate-row">
                          <div className="candidate-info">
                            <BloodBadge group={donor.bloodGroup} size="sm" />
                            <div>
                              <strong>{donor.name}</strong> • {donor.city} ({donor.distance} km)
                            </div>
                          </div>
                          <div className="candidate-score">
                            <span>{donor.matchScore}% Match</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Link
                      to={`/donor-matching?bloodGroup=${encodeURIComponent(aiResult.bloodGroup)}&city=${encodeURIComponent(city)}`}
                      className="btn btn-primary btn-sm btn-block mt-3"
                    >
                      Open Live Matching Engine with Full Donor Pool <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ai-assistant-page {
          padding: 3rem 0 4rem;
        }
        .ai-header {
          margin-bottom: 2rem;
        }
        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.85rem;
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          border-radius: var(--radius-full);
          font-size: 0.775rem;
          font-weight: 700;
          color: #7c3aed;
          margin-bottom: 0.75rem;
        }
        .scenarios-strip {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 0.85rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          box-shadow: var(--shadow-xs);
        }
        .scenarios-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--slate-500);
          text-transform: uppercase;
        }
        .scenarios-btns {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .scenario-btn {
          font-size: 0.8rem;
        }

        .ai-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 960px) {
          .ai-layout-grid {
            grid-template-columns: 1fr 1.25fr;
          }
        }

        .card-heading {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--slate-900);
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--slate-100);
        }
        .urgency-grid {
          display: flex;
          gap: 0.5rem;
        }
        .urgency-pill-btn {
          flex: 1;
          padding: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          border-radius: var(--radius-md);
          background: var(--slate-100);
          color: var(--slate-700);
          border: 1px solid var(--slate-200);
          transition: var(--transition);
        }
        .urgency-pill-btn.active.critical {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }
        .urgency-pill-btn.active.urgent {
          background: #fffbeb;
          color: #b45309;
          border-color: #fde68a;
        }
        .urgency-pill-btn.active.standard {
          background: #ecfeff;
          color: #0e7490;
          border-color: #a5f3fc;
        }

        .empty-ai-card, .loading-ai-card {
          text-align: center;
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .empty-ai-icon, .ai-pulse-spinner {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: #f5f3ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }
        .empty-ai-card h3, .loading-ai-card h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--slate-900);
        }
        .empty-ai-card p, .loading-ai-card p {
          color: var(--slate-600);
          max-width: 480px;
          line-height: 1.5;
          font-size: 0.95rem;
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ai-result-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border: 1.5px solid #ddd6fe;
          box-shadow: 0 4px 20px -2px rgba(124, 58, 237, 0.1);
        }
        .result-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--slate-100);
        }
        .triage-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.775rem;
          font-weight: 800;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.4rem;
        }
        .target-arrival-time {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--slate-700);
        }

        .ai-clinical-summary-box {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
        }
        .summary-title {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          font-weight: 700;
          color: #7c3aed;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .ai-clinical-summary-box p {
          font-size: 0.9rem;
          color: #4c1d95;
          line-height: 1.5;
        }

        .sub-heading {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--slate-900);
          margin-bottom: 0.75rem;
        }
        .compat-groups-row {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .strategy-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--slate-600);
          display: block;
          margin-bottom: 0.35rem;
        }
        .group-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
        }
        .group-chip.exact {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }
        .group-chip.compatible {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        }
        .alt-chips-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .criteria-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .criterion-item {
          background: var(--slate-50);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          border: 1px solid var(--slate-200);
        }
        .criterion-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.875rem;
          color: var(--slate-900);
          margin-bottom: 0.25rem;
        }
        .criterion-detail {
          font-size: 0.8rem;
          color: var(--slate-600);
          line-height: 1.4;
          padding-left: 1.4rem;
        }

        .precautions-list {
          list-style-type: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .precautions-list li {
          font-size: 0.825rem;
          color: var(--slate-700);
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: var(--radius-sm);
          padding: 0.5rem 0.75rem;
        }

        .candidates-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .candidate-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--slate-50);
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-md);
          padding: 0.6rem 0.85rem;
        }
        .candidate-info {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.825rem;
          color: var(--slate-800);
        }
        .candidate-score {
          font-size: 0.775rem;
          font-weight: 800;
          color: #7c3aed;
          background: #f5f3ff;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
          border: 1px solid #ddd6fe;
        }
        .mt-3 { margin-top: 1rem; }
      `}</style>
    </div>
  );
}
