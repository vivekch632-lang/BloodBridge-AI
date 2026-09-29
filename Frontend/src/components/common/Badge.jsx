

export function BloodBadge({ group, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'badge-lg' : size === 'sm' ? 'badge-sm' : '';
  return (
    <span className={`blood-badge ${sizeClass}`}>
      {group}
      <style>{`
        .blood-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #dc2626;
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          border-radius: 8px;
          padding: 0.2rem 0.6rem;
          letter-spacing: -0.01em;
          font-size: 0.875rem;
        }
        .blood-badge.badge-sm {
          font-size: 0.75rem;
          padding: 0.1rem 0.45rem;
          border-radius: 6px;
        }
        .blood-badge.badge-lg {
          font-size: 1.15rem;
          padding: 0.35rem 0.85rem;
          border-radius: 10px;
          border-width: 2px;
        }
      `}</style>
    </span>
  );
}

export function UrgencyBadge({ level }) {
  const isCritical = level === 'Critical';
  const isUrgent = level === 'Urgent';

  let bg = '#ecfeff';
  let color = '#0e7490';
  let border = '#a5f3fc';

  if (isCritical) {
    bg = '#fef2f2';
    color = '#dc2626';
    border = '#fecaca';
  } else if (isUrgent) {
    bg = '#fffbeb';
    color = '#b45309';
    border = '#fde68a';
  }

  return (
    <span 
      className={`urgency-badge ${isCritical ? 'pulse-critical' : ''}`}
      style={{ backgroundColor: bg, color, borderColor: border }}
    >
      <span className="urgency-dot" style={{ backgroundColor: color }}></span>
      {level || 'Standard'}
      <style>{`
        .urgency-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .urgency-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .pulse-critical {
          animation: pulse-border 2s infinite;
        }
      `}</style>
    </span>
  );
}

export function CompatibilityBadge({ status }) {
  if (status === 'EXACT') {
    return (
      <span className="compat-badge exact">
        ★ Exact Match
        <style>{compatStyle}</style>
      </span>
    );
  }
  if (status === 'COMPATIBLE') {
    return (
      <span className="compat-badge compatible">
        ✓ Compatible
        <style>{compatStyle}</style>
      </span>
    );
  }
  return (
    <span className="compat-badge incompatible">
      ✕ Incompatible
      <style>{compatStyle}</style>
    </span>
  );
}

const compatStyle = `
  .compat-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    letter-spacing: 0.02em;
  }
  .compat-badge.exact {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }
  .compat-badge.compatible {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  .compat-badge.incompatible {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }
`;
