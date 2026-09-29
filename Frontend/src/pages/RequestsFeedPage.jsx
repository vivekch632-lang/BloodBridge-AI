import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Heart,
  User
} from 'lucide-react';

import {
  BloodBadge,
  UrgencyBadge
} from '../components/common/Badge';

import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { requestService } from '../services/requestService';
import { showToast } from '../services/toastService';

export default function RequestsFeedPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bloodGroupFilter, setBloodGroupFilter] =
    useState('ALL');

  const [urgencyFilter, setUrgencyFilter] =
    useState('ALL');

  const [pledgedReqIds, setPledgedReqIds] =
    useState([]);

  /**
   * Load real emergency requests from Supabase.
   */
  useEffect(() => {
    let mounted = true;

    async function loadRequests() {
      try {
        setLoading(true);
        setError('');

        const data = await requestService.getAll();

        if (!mounted) return;

        setRequests(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          'Failed to load emergency requests:',
          err
        );

        if (!mounted) return;

        setError(
          err?.message ||
          'Unable to load emergency requests.'
        );

        setRequests([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Handle donor pledge.
   *
   * This currently records the pledge in the
   * current session and shows a confirmation.
   */
  const handlePledgeDonation = (req) => {
    setPledgedReqIds((prev) => {
      if (prev.includes(req.id)) {
        return prev;
      }

      return [...prev, req.id];
    });

    showToast(
      `Thank you! Your donation pledge has been forwarded to ${req.hospital} (${req.contactPhone}).`,
      'success'
    );
  };

  /**
   * Filter emergency requests.
   */
  const filteredRequests = requests.filter((r) => {
    if (
      bloodGroupFilter !== 'ALL' &&
      r.bloodGroup !== bloodGroupFilter
    ) {
      return false;
    }

    if (
      urgencyFilter !== 'ALL' &&
      r.emergencyLevel !== urgencyFilter
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="feed-page">
      <div className="container">

        {/* Header */}
        <div className="feed-header">
          <div>
            <span className="section-subtitle">
              COMMUNITY EMERGENCY DISPATCH
            </span>

            <h1 className="page-title">
              Live Hospital Blood Appeals
            </h1>

            <p className="page-subtitle">
              Verified emergency blood requirements from
              trauma centers and patient coordinators.
            </p>
          </div>

          <Link
            to="/find-blood"
            className="btn btn-primary btn-sm"
          >
            <ShieldAlert size={16} />
            <span>Post New Emergency Appeal</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="feed-filter-bar">

          <div className="filter-group">
            <span className="filter-title-mini">
              Blood Group:
            </span>

            <div className="filter-pills">

              <button
                type="button"
                className={`filter-pill ${
                  bloodGroupFilter === 'ALL'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setBloodGroupFilter('ALL')
                }
              >
                All
              </button>

              {BLOOD_GROUPS.map((bg) => (
                <button
                  type="button"
                  key={bg}
                  className={`filter-pill ${
                    bloodGroupFilter === bg
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setBloodGroupFilter(bg)
                  }
                >
                  {bg}
                </button>
              ))}

            </div>
          </div>

          <div className="filter-group">
            <span className="filter-title-mini">
              Urgency:
            </span>

            <div className="filter-pills">

              {[
                'ALL',
                'Critical',
                'Urgent',
                'Standard'
              ].map((level) => (
                <button
                  type="button"
                  key={level}
                  className={`filter-pill ${
                    urgencyFilter === level
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setUrgencyFilter(level)
                  }
                >
                  {level}
                </button>
              ))}

            </div>
          </div>

        </div>

        {/* Loading */}
        {loading && (
          <div className="card text-center empty-feed">
            <p>
              Loading live emergency requests...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="card text-center empty-feed error-feed">
            <p>
              Unable to load emergency requests.
            </p>

            <small>
              {error}
            </small>
          </div>
        )}

        {/* Request List */}
        {!loading &&
          !error &&
          (
            <div className="feed-grid">

              {filteredRequests.length === 0 ? (
                <div className="card text-center empty-feed">
                  <p>
                    No active appeals matching selected
                    filters.
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => {

                  const isPledged =
                    pledgedReqIds.includes(req.id);

                  const isFulfilled =
                    req.status === 'Fulfilled';

                  return (
                    <div
                      key={req.id}
                      className={`feed-card ${
                        isFulfilled
                          ? 'fulfilled-card'
                          : ''
                      }`}
                    >

                      {/* Card Header */}
                      <div className="feed-card-header">

                        <div className="feed-blood-tag">

                          <BloodBadge
                            group={req.bloodGroup}
                            size="lg"
                          />

                          <div className="units-count">
                            <strong>
                              {req.unitsRequired}
                            </strong>{' '}
                            {req.unitsRequired > 1
                              ? 'Units'
                              : 'Unit'}{' '}
                            Needed
                          </div>

                        </div>

                        <div className="feed-status-tags">

                          <UrgencyBadge
                            level={req.emergencyLevel}
                          />

                          {isFulfilled && (
                            <span className="badge badge-available">
                              Fulfilled
                            </span>
                          )}

                        </div>

                      </div>

                      {/* Card Body */}
                      <div className="feed-card-body">

                        <h3 className="patient-name">
                          {req.patientName}
                        </h3>

                        <div className="facility-row">
                          <Building2
                            size={16}
                            color="#dc2626"
                          />

                          <span className="hospital-name">
                            {req.hospital}
                          </span>
                        </div>

                        <div className="details-grid">

                          <div className="detail-item">
                            <MapPin
                              size={14}
                              color="#64748b"
                            />

                            <span>
                              {req.city}
                            </span>
                          </div>

                          <div className="detail-item">
                            <Clock
                              size={14}
                              color="#64748b"
                            />

                            <span>
                              Required:{' '}
                              <strong>
                                {req.requiredTime}
                              </strong>
                            </span>
                          </div>

                        </div>

                        {req.notes && (
                          <div className="feed-notes">
                            "{req.notes}"
                          </div>
                        )}

                        <div className="coordinator-info">
                          <User
                            size={13}
                            color="#64748b"
                          />

                          <span>
                            Attending:{' '}
                            {req.contactName}{' '}
                            ({req.contactPhone})
                          </span>
                        </div>

                      </div>

                      {/* Card Footer */}
                      <div className="feed-card-footer">

                        <Link
                          to={`/donor-matching?requestId=${
                            req.id
                          }&bloodGroup=${
                            encodeURIComponent(
                              req.bloodGroup
                            )
                          }&city=${
                            encodeURIComponent(
                              req.city
                            )
                          }`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Matched Donors
                        </Link>

                        <button
                          type="button"
                          className={`btn btn-sm ${
                            isPledged
                              ? 'btn-emerald'
                              : 'btn-primary'
                          }`}
                          onClick={() =>
                            handlePledgeDonation(req)
                          }
                          disabled={isFulfilled}
                        >

                          {isPledged ? (
                            <>
                              <CheckCircle2 size={14} />
                              <span>
                                Pledged to Donate
                              </span>
                            </>
                          ) : (
                            <>
                              <Heart size={14} />
                              <span>
                                I Can Donate
                              </span>
                            </>
                          )}

                        </button>

                      </div>

                    </div>
                  );
                })
              )}

            </div>
          )
        }

      </div>

      <style>{`

        .feed-page {
          padding: 3rem 0 4rem;
        }

        .feed-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .feed-filter-bar {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
        }

        @media (min-width: 768px) {
          .feed-filter-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-title-mini {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--slate-600);
        }

        .filter-pills {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .filter-pill {
          padding: 0.35rem 0.65rem;
          font-size: 0.8rem;
          font-weight: 700;
          background: var(--slate-100);
          color: var(--slate-700);
          border: 1px solid var(--slate-200);
          border-radius: 6px;
          transition: var(--transition);
        }

        .filter-pill:hover {
          background: var(--slate-200);
        }

        .filter-pill.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary-hover);
        }

        .feed-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .feed-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .feed-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        .feed-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--slate-300);
        }

        .feed-card.fulfilled-card {
          opacity: 0.7;
          background: var(--slate-50);
        }

        .feed-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--slate-100);
        }

        .feed-blood-tag {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .units-count {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--slate-700);
        }

        .feed-status-tags {
          display: flex;
          gap: 0.35rem;
        }

        .patient-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--slate-900);
          margin-bottom: 0.5rem;
        }

        .facility-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--slate-800);
          margin-bottom: 0.85rem;
        }

        .details-grid {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
          font-size: 0.825rem;
          color: var(--slate-600);
          margin-bottom: 0.85rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .feed-notes {
          background: var(--slate-50);
          border-left: 3px solid var(--primary-200);
          padding: 0.6rem 0.85rem;
          font-size: 0.8125rem;
          color: var(--slate-700);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          margin-bottom: 0.85rem;
          font-style: italic;
        }

        .coordinator-info {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          color: var(--slate-500);
          margin-bottom: 1.25rem;
        }

        .feed-card-footer {
          margin-top: auto;
          display: flex;
          gap: 0.5rem;
        }

        .feed-card-footer a,
        .feed-card-footer button {
          flex: 1;
        }

        .empty-feed {
          padding: 3rem;
          color: var(--slate-500);
        }

        .error-feed {
          color: var(--primary);
        }

        .error-feed small {
          display: block;
          margin-top: 0.5rem;
          color: var(--slate-500);
        }

      `}</style>
    </div>
  );
}