import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Navigation,
} from 'lucide-react';

import { BloodBadge, UrgencyBadge } from '../components/common/Badge';
import { authService } from '../services/authService';
import { requestService } from '../services/requestService';
import { donorService } from '../services/donorService';
import { showToast } from '../services/toastService';

function statusClass(status) {
  const value = String(status || '').toLowerCase();

  if (value === 'fulfilled' || value === 'completed') {
    return 'status-fulfilled';
  }

  if (value === 'in progress' || value === 'in_progress') {
    return 'status-progress';
  }

  return 'status-active';
}

function formatDate(value) {
  if (!value) return 'Recently created';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRequestStatus(req) {
  return req?.status || 'Active';
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('donor');

  const [requests, setRequests] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  const loadDashboardData = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [user, allRequests] = await Promise.all([
        authService.getCurrentUser(),
        requestService.getAll(),
      ]);

      const safeRequests = Array.isArray(allRequests)
        ? allRequests
        : [];

      setCurrentUser(user);
      setRequests(safeRequests);

      if (user?.role) {
        setActiveTab(user.role);
      }

      /*
       * Availability is stored in the real donors table.
       * Read it from the donor profile instead of using demo state.
       */
      if (user?.id) {
        try {
          const donorProfile =
            await donorService.getCurrentUserProfile();

          setIsAvailable(
            donorProfile?.available ??
              donorProfile?.isAvailable ??
              true
          );
        } catch (donorError) {
          console.warn(
            'Unable to load donor availability:',
            donorError
          );

          setIsAvailable(true);
        }
      }
    } catch (error) {
      console.error(
        'Dashboard loading error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to load dashboard data.',
        'error'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const refreshData = async () => {
    await loadDashboardData(true);
  };

  useEffect(() => {
    const unsubscribe = authService.subscribe(
      (user) => {
        setCurrentUser(user);
      }
    );

    return unsubscribe;
  }, []);

  const handleToggleAvailability = async () => {
    if (!currentUser?.id) {
      showToast(
        'Please log in again before changing availability.',
        'error'
      );
      return;
    }

    const nextValue = !isAvailable;

    try {
      await donorService.updateAvailability(
        currentUser.id,
        nextValue
      );

      setIsAvailable(nextValue);

      showToast(
        nextValue
          ? 'Status updated: Ready for emergency donor matching.'
          : 'Status updated: Temporarily unavailable for donation.',
        'success'
      );
    } catch (error) {
      console.error(
        'Availability update error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to update donor availability.',
        'error'
      );
    }
  };

  const handleMarkFulfilled = async (requestId) => {
    if (!requestId) return;

    try {
      setUpdatingRequestId(requestId);

      await requestService.updateStatus(
        requestId,
        'Fulfilled'
      );

      await loadDashboardData(true);

      showToast(
        'Emergency request marked as fulfilled.',
        'success'
      );
    } catch (error) {
      console.error(
        'Fulfill request error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to update the emergency request.',
        'error'
      );
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleAcceptRequest = async (req) => {
    if (!req?.id) return;

    try {
      setUpdatingRequestId(req.id);

      await requestService.updateStatus(
        req.id,
        'In Progress'
      );

      await loadDashboardData(true);

      showToast(
        'Emergency response accepted. Request is now In Progress.',
        'success'
      );
    } catch (error) {
      console.error(
        'Accept request error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to accept this request.',
        'error'
      );
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const activeRequests = useMemo(
    () =>
      requests.filter(
        (req) =>
          getRequestStatus(req).toLowerCase() ===
          'active'
      ),
    [requests]
  );

  const inProgressRequests = useMemo(
    () =>
      requests.filter(
        (req) =>
          getRequestStatus(req).toLowerCase() ===
          'in progress'
      ),
    [requests]
  );

  const fulfilledRequests = useMemo(
    () =>
      requests.filter(
        (req) =>
          getRequestStatus(req).toLowerCase() ===
          'fulfilled'
      ),
    [requests]
  );

  /*
   * Donor Mode should only show active requests.
   * Hospital Mode intentionally shows ALL real requests,
   * including "In Progress", so a response such as
   * "Test Hospital 2" never disappears after a donor responds.
   */
  const donorIncomingRequests = activeRequests;

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="container dashboard-loading">
          <div className="loading-card">
            <RefreshCw size={24} className="spin" />
            <p>Loading your BloodBridge dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="dashboard-page">
        <div className="container dashboard-loading">
          <div className="loading-card">
            <p>Please log in to access your dashboard.</p>
            <Link
              to="/login"
              className="btn btn-primary"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hospitalName =
    currentUser?.hospital ||
    currentUser?.hospitalName ||
    'Hospital / Recipient Account';

  const userName =
    currentUser?.name ||
    currentUser?.email ||
    'BloodBridge User';

  return (
    <div className="dashboard-page">
      <div className="container">

        {/* ROLE SWITCHER */}
        <div className="dash-role-banner">
          <div className="role-banner-info">
            <span className="role-banner-label">
              Active Dashboard Perspective:
            </span>

            <strong>
              {activeTab === 'donor'
                ? 'Blood Donor View'
                : 'Hospital / Recipient View'}
            </strong>
          </div>

          <div className="role-banner-right">
            <button
              className="refresh-dashboard-btn"
              onClick={refreshData}
              disabled={isRefreshing}
              title="Refresh real Supabase data"
            >
              <RefreshCw
                size={15}
                className={
                  isRefreshing ? 'spin' : ''
                }
              />
              <span>Refresh</span>
            </button>

            <div className="role-toggle-group">
              <button
                type="button"
                className={`role-toggle-btn ${
                  activeTab === 'donor'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('donor')
                }
              >
                <Heart size={15} />
                <span>Donor Mode</span>
              </button>

              <button
                type="button"
                className={`role-toggle-btn ${
                  activeTab === 'recipient'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('recipient')
                }
              >
                <Building2 size={15} />
                <span>Hospital Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            DONOR MODE
        ====================================================== */}
        {activeTab === 'donor' && (
          <div className="donor-dash-layout">

            <div className="dash-profile-card">
              <div className="dash-profile-inner">

                <div className="profile-avatar-wrap">
                  <div className="profile-blood-icon">
                    <BloodBadge
                      group={
                        currentUser.bloodGroup ||
                        'O-'
                      }
                      size="lg"
                    />
                  </div>
                </div>

                <div className="profile-details">
                  <div className="profile-name-row">
                    <h2>{userName}</h2>

                    <span className="badge badge-standard">
                      <ShieldCheck
                        size={14}
                        color="#059669"
                      />
                      Verified Account
                    </span>
                  </div>

                  <div className="profile-meta-row">
                    <span>
                      <MapPin size={14} />
                      {currentUser.city ||
                        'City not set'}
                    </span>

                    {currentUser.phone && (
                      <span>
                        <Phone size={14} />
                        {currentUser.phone}
                      </span>
                    )}

                    <span>
                      <Clock size={14} />
                      Real Supabase donor profile
                    </span>
                  </div>
                </div>

                <div className="availability-box">
                  <span className="avail-label">
                    Emergency Dispatch
                  </span>

                  <button
                    onClick={
                      handleToggleAvailability
                    }
                    className={`btn-avail-toggle ${
                      isAvailable
                        ? 'available'
                        : 'busy'
                    }`}
                  >
                    <span className="avail-indicator" />
                    <span>
                      {isAvailable
                        ? 'Ready to Donate'
                        : 'Unavailable'}
                    </span>
                  </button>

                  <span className="avail-sub">
                    {isAvailable
                      ? 'Visible to compatible emergency requests'
                      : 'Paused for new donor matches'}
                  </span>
                </div>
              </div>

              <div className="donor-stats-strip">
                <div className="donor-stat">
                  <div className="stat-val">
                    {donorIncomingRequests.length}
                  </div>
                  <div className="stat-name">
                    Active Appeals
                  </div>
                </div>

                <div className="donor-stat">
                  <div className="stat-val red">
                    {inProgressRequests.length}
                  </div>
                  <div className="stat-name">
                    In Progress
                  </div>
                </div>

                <div className="donor-stat">
                  <div className="stat-val emerald">
                    {fulfilledRequests.length}
                  </div>
                  <div className="stat-name">
                    Fulfilled Requests
                  </div>
                </div>

                <div className="donor-stat">
                  <div className="stat-val cyan">
                    {currentUser.bloodGroup ||
                      '—'}
                  </div>
                  <div className="stat-name">
                    Blood Group
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-section">
              <div className="dash-section-header">
                <div>
                  <h3 className="section-title-sm">
                    Incoming Emergency Dispatches
                  </h3>

                  <p className="section-sub-sm">
                    Real emergency requests currently
                    available for donor response.
                  </p>
                </div>

                <span className="badge badge-critical">
                  {donorIncomingRequests.length}{' '}
                  Active
                </span>
              </div>

              {donorIncomingRequests.length ===
              0 ? (
                <div className="empty-card">
                  <CheckCircle2
                    size={34}
                    color="#059669"
                  />

                  <h4>
                    No active compatible appeals
                    right now
                  </h4>

                  <p>
                    New emergency requests will
                    appear here when they are
                    available.
                  </p>
                </div>
              ) : (
                <div className="incoming-grid">
                  {donorIncomingRequests.map(
                    (req) => (
                      <div
                        key={req.id}
                        className="incoming-card"
                      >
                        <div className="incoming-top">
                          <BloodBadge
                            group={
                              req.bloodGroup
                            }
                            size="md"
                          />

                          <UrgencyBadge
                            level={
                              req.emergencyLevel ||
                              req.urgency
                            }
                          />

                          <span className="needed-time">
                            {req.requiredTime ||
                              req.requiredBy ||
                              'As soon as possible'}
                          </span>
                        </div>

                        <div className="incoming-body">
                          <h4>
                            {req.hospital ||
                              'Medical Facility'}
                          </h4>

                          <div className="patient-sub">
                            Patient:{' '}
                            <strong>
                              {req.patientName ||
                                'Emergency Case'}
                            </strong>
                            {' • '}
                            {req.unitsRequired || 1}{' '}
                            Unit(s)
                          </div>

                          <p className="incoming-notes">
                            {req.notes ||
                              'Emergency blood requirement.'}
                          </p>

                          {req.contactPhone && (
                            <div className="incoming-phone">
                              <Phone size={13} />
                              {req.contactPhone}
                            </div>
                          )}
                        </div>

                        <div className="incoming-actions">
                          <Link
                            to={`/donor-matching?requestId=${
                              req.id
                            }&bloodGroup=${encodeURIComponent(
                              req.bloodGroup || ''
                            )}&city=${encodeURIComponent(
                              req.city || ''
                            )}`}
                            className="btn btn-secondary btn-sm"
                          >
                            <Navigation
                              size={14}
                            />
                            View Matches
                          </Link>

                          <button
                            className="btn btn-primary btn-sm"
                            disabled={
                              updatingRequestId ===
                              req.id
                            }
                            onClick={() =>
                              handleAcceptRequest(
                                req
                              )
                            }
                          >
                            <CheckCircle2
                              size={14}
                            />
                            {updatingRequestId ===
                            req.id
                              ? 'Updating...'
                              : 'Accept & Respond'}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            HOSPITAL / RECIPIENT MODE
        ====================================================== */}
        {activeTab === 'recipient' && (
          <div className="recipient-dash-layout">

            <div className="dash-profile-card hospital-theme">
              <div className="dash-profile-inner">

                <div className="profile-avatar-wrap hospital-icon-wrap">
                  <Building2
                    size={32}
                    color="#0891b2"
                  />
                </div>

                <div className="profile-details">
                  <div className="profile-name-row">
                    <h2>{userName}</h2>

                    <span className="badge badge-standard">
                      <ShieldCheck
                        size={14}
                        color="#0891b2"
                      />
                      Hospital / Recipient
                    </span>
                  </div>

                  <div className="profile-meta-row">
                    <span>
                      <Building2 size={14} />
                      {hospitalName}
                    </span>

                    {currentUser.city && (
                      <span>
                        <MapPin size={14} />
                        {currentUser.city}
                      </span>
                    )}

                    {currentUser.phone && (
                      <span>
                        <Phone size={14} />
                        {currentUser.phone}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to="/find-blood"
                  className="btn btn-primary btn-sm header-post-btn"
                >
                  <Plus size={16} />
                  <span>
                    Broadcast Emergency Blood
                    Request
                  </span>
                </Link>
              </div>

              {/* REAL REQUEST METRICS */}
              <div className="donor-stats-strip">
                <div className="donor-stat">
                  <div className="stat-val">
                    {activeRequests.length}
                  </div>
                  <div className="stat-name">
                    Active Appeals
                  </div>
                </div>

                <div className="donor-stat">
                  <div className="stat-val amber">
                    {inProgressRequests.length}
                  </div>
                  <div className="stat-name">
                    In Progress
                  </div>
                </div>

                <div className="donor-stat">
                  <div className="stat-val emerald">
                    {fulfilledRequests.length}
                  </div>
                  <div className="stat-name">
                    Fulfilled
                  </div>
                </div>

                <div className="donor-stat">
                  <div className="stat-val cyan">
                    {requests.length}
                  </div>
                  <div className="stat-name">
                    Total Requests
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                ALL REAL REQUESTS
                ================================================= */}
            <div className="dash-section">
              <div className="dash-section-header">
                <div>
                  <h3 className="section-title-sm">
                    Emergency Blood Requests
                  </h3>

                  <p className="section-sub-sm">
                    Live records loaded directly from
                    the BloodBridge Supabase database.
                    Requests remain visible after a
                    donor response.
                  </p>
                </div>

                <div className="section-header-actions">
                  <span className="live-data-pill">
                    <span className="live-dot" />
                    LIVE DATABASE
                  </span>

                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={refreshData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      size={14}
                      className={
                        isRefreshing
                          ? 'spin'
                          : ''
                      }
                    />
                    Refresh
                  </button>

                  <Link
                    to="/find-blood"
                    className="btn btn-sm btn-primary"
                  >
                    <Plus size={14} />
                    New Request
                  </Link>
                </div>
              </div>

              {requests.length === 0 ? (
                <div className="empty-card">
                  <Building2
                    size={38}
                    color="#0891b2"
                  />

                  <h4>
                    No emergency requests found
                  </h4>

                  <p>
                    Create an emergency request and
                    it will appear here from Supabase.
                  </p>

                  <Link
                    to="/find-blood"
                    className="btn btn-primary btn-sm"
                  >
                    Create Emergency Request
                  </Link>
                </div>
              ) : (
                <div className="active-requests-grid">
                  {requests.map((req) => {
                    const status =
                      getRequestStatus(req);

                    const isFulfilled =
                      status.toLowerCase() ===
                      'fulfilled';

                    const isInProgress =
                      status.toLowerCase() ===
                      'in progress';

                    const isUpdating =
                      updatingRequestId ===
                      req.id;

                    return (
                      <div
                        key={req.id}
                        className={`active-req-card ${
                          isFulfilled
                            ? 'fulfilled'
                            : ''
                        } ${
                          isInProgress
                            ? 'in-progress'
                            : ''
                        }`}
                      >
                        {/* REQUEST HEADER */}
                        <div className="active-req-top">
                          <div className="req-blood-info">
                            <BloodBadge
                              group={
                                req.bloodGroup
                              }
                              size="lg"
                            />

                            <div>
                              <h4 className="req-patient">
                                {req.patientName ||
                                  'Emergency Case'}
                              </h4>

                              <span className="req-units">
                                {req.unitsRequired ||
                                  1}{' '}
                                Unit(s) Required
                              </span>
                            </div>
                          </div>

                          <div className="req-badge-group">
                            <UrgencyBadge
                              level={
                                req.emergencyLevel ||
                                req.urgency
                              }
                            />

                            <span
                              className={`request-status ${statusClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>

                        {/* REAL REQUEST DETAILS */}
                        <div className="active-req-details">
                          <div className="active-detail-line">
                            <Building2 size={14} />
                            <span>
                              <strong>
                                {req.hospital ||
                                  'Medical Facility'}
                              </strong>
                              {req.city
                                ? ` • ${req.city}`
                                : ''}
                            </span>
                          </div>

                          <div className="active-detail-line">
                            <Clock size={14} />
                            <span>
                              Required:{' '}
                              <strong>
                                {req.requiredTime ||
                                  req.requiredBy ||
                                  'As soon as possible'}
                              </strong>
                            </span>
                          </div>

                          {req.contactName && (
                            <div className="active-detail-line">
                              <ShieldCheck
                                size={14}
                              />
                              <span>
                                Contact:{' '}
                                <strong>
                                  {
                                    req.contactName
                                  }
                                </strong>
                              </span>
                            </div>
                          )}

                          {req.contactPhone && (
                            <div className="active-detail-line">
                              <Phone size={14} />
                              <span>
                                {req.contactPhone}
                              </span>
                            </div>
                          )}

                          <div className="active-detail-line request-created">
                            <Clock size={14} />
                            <span>
                              Created:{' '}
                              {formatDate(
                                req.createdAt ||
                                  req.created_at
                              )}
                            </span>
                          </div>

                          {req.notes && (
                            <div className="active-req-notes">
                              "{req.notes}"
                            </div>
                          )}

                          {/* SHOW COORDINATES WHEN PRESENT */}
                          {req.latitude != null &&
                            req.longitude !=
                              null && (
                              <div className="coordinates-pill">
                                <MapPin
                                  size={13}
                                />
                                <span>
                                  Location saved:
                                  {' '}
                                  {Number(
                                    req.latitude
                                  ).toFixed(5)}
                                  ,{' '}
                                  {Number(
                                    req.longitude
                                  ).toFixed(5)}
                                </span>
                              </div>
                            )}
                        </div>

                        {/* ACTIONS */}
                        <div className="active-req-actions">
                          <Link
                            to={`/donor-matching?requestId=${
                              req.id
                            }&bloodGroup=${encodeURIComponent(
                              req.bloodGroup || ''
                            )}&city=${encodeURIComponent(
                              req.city || ''
                            )}`}
                            className="btn btn-secondary btn-sm"
                          >
                            <Navigation
                              size={14}
                            />
                            View Matched Donors
                          </Link>

                          {!isFulfilled ? (
                            <button
                              className="btn btn-emerald btn-sm"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                handleMarkFulfilled(
                                  req.id
                                )
                              }
                            >
                              <CheckCircle2
                                size={14}
                              />

                              {isUpdating
                                ? 'Updating...'
                                : 'Mark Fulfilled'}
                            </button>
                          ) : (
                            <span className="fulfilled-text">
                              <CheckCircle2
                                size={16}
                              />
                              Transfusion Complete
                            </span>
                          )}
                        </div>

                        {/* IN-PROGRESS EXPLANATION */}
                        {isInProgress && (
                          <div className="progress-banner">
                            <CheckCircle2
                              size={16}
                            />

                            <div>
                              <strong>
                                Donor response received
                              </strong>

                              <span>
                                This request is
                                currently in
                                progress and remains
                                visible until the
                                hospital marks it
                                fulfilled.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-page {
          padding: 2.5rem 0 4rem;
        }

        .dashboard-loading {
          min-height: 55vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-card,
        .empty-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 2rem;
          text-align: center;
          box-shadow: var(--shadow-sm);
        }

        .loading-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: var(--slate-600);
        }

        .empty-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          color: var(--slate-600);
        }

        .empty-card h4 {
          color: var(--slate-900);
          font-size: 1.05rem;
          margin: 0.25rem 0 0;
        }

        .empty-card p {
          margin: 0 0 0.75rem;
          max-width: 520px;
          font-size: 0.875rem;
        }

        .spin {
          animation: dashboard-spin 0.9s linear infinite;
        }

        @keyframes dashboard-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dash-role-banner {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .role-banner-info {
          font-size: 0.95rem;
          color: var(--slate-700);
        }

        .role-banner-label {
          color: var(--slate-500);
          margin-right: 0.4rem;
        }

        .role-banner-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .refresh-dashboard-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.7rem;
          border: 1px solid var(--slate-200);
          background: white;
          color: var(--slate-600);
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }

        .refresh-dashboard-btn:hover {
          background: var(--slate-50);
          color: var(--slate-900);
        }

        .refresh-dashboard-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .role-toggle-group {
          display: flex;
          background: var(--slate-100);
          padding: 3px;
          border-radius: var(--radius-md);
          gap: 4px;
        }

        .role-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.95rem;
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--slate-600);
          background: transparent;
          border-radius: var(--radius-sm);
          transition: var(--transition);
          cursor: pointer;
        }

        .role-toggle-btn.active {
          background: white;
          color: var(--slate-900);
          box-shadow: var(--shadow-xs);
        }

        .dash-profile-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          margin-bottom: 2.5rem;
        }

        .dash-profile-card.hospital-theme {
          border-top: 4px solid #0891b2;
        }

        .dash-profile-inner {
          padding: 2rem;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .profile-avatar-wrap {
          width: 68px;
          height: 68px;
          border-radius: 18px;
          background: var(--primary-50);
          border: 1.5px solid var(--primary-200);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hospital-icon-wrap {
          background: #ecfeff;
          border-color: #a5f3fc;
        }

        .profile-details {
          flex: 1;
          min-width: 260px;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
          flex-wrap: wrap;
        }

        .profile-name-row h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--slate-900);
          margin: 0;
        }

        .profile-meta-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          font-size: 0.85rem;
          color: var(--slate-600);
        }

        .profile-meta-row span {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .availability-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
        }

        .avail-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--slate-500);
          text-transform: uppercase;
        }

        .btn-avail-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-avail-toggle.available {
          background: #ecfdf5;
          color: #047857;
          border: 1.5px solid #a7f3d0;
        }

        .btn-avail-toggle.busy {
          background: var(--slate-100);
          color: var(--slate-600);
          border: 1.5px solid var(--slate-200);
        }

        .avail-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .avail-sub {
          font-size: 0.725rem;
          color: var(--slate-400);
          text-align: right;
        }

        .header-post-btn {
          white-space: nowrap;
        }

        .donor-stats-strip {
          background: var(--slate-50);
          border-top: 1px solid var(--slate-200);
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        @media (min-width: 768px) {
          .donor-stats-strip {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .donor-stat {
          padding: 1.25rem;
          text-align: center;
          border-right: 1px solid var(--slate-200);
        }

        .donor-stat:last-child {
          border-right: none;
        }

        .stat-val {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--slate-900);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-val.red { color: var(--primary); }
        .stat-val.emerald { color: #059669; }
        .stat-val.amber { color: #d97706; }
        .stat-val.cyan { color: #0891b2; }

        .stat-name {
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--slate-500);
        }

        .dash-section {
          margin-bottom: 3rem;
        }

        .dash-section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }

        .section-title-sm {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--slate-900);
          margin: 0;
        }

        .section-sub-sm {
          font-size: 0.85rem;
          color: var(--slate-500);
          margin: 0.2rem 0 0;
        }

        .section-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .live-data-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.7rem;
          border: 1px solid #a7f3d0;
          background: #ecfdf5;
          color: #047857;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          animation: live-pulse 1.5s infinite;
        }

        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .incoming-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 768px) {
          .incoming-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .incoming-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
        }

        .incoming-top {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .needed-time {
          margin-left: auto;
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--slate-500);
        }

        .incoming-body h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--slate-900);
          margin: 0 0 0.25rem;
        }

        .patient-sub {
          font-size: 0.825rem;
          color: var(--slate-600);
          margin-bottom: 0.5rem;
        }

        .incoming-notes {
          background: var(--slate-50);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--slate-700);
          font-style: italic;
          margin-bottom: 0.75rem;
        }

        .incoming-phone {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          color: var(--slate-500);
          margin-bottom: 1.25rem;
        }

        .incoming-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: auto;
          flex-wrap: wrap;
        }

        .active-requests-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .active-requests-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .active-req-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          position: relative;
        }

        .active-req-card.in-progress {
          border-color: #fbbf24;
          box-shadow: 0 0 0 1px #fef3c7, var(--shadow-sm);
        }

        .active-req-card.fulfilled {
          opacity: 0.82;
          background: var(--slate-50);
        }

        .active-req-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .req-blood-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .req-patient {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--slate-900);
          margin: 0;
          word-break: break-word;
        }

        .req-units {
          font-size: 0.8rem;
          color: var(--slate-500);
        }

        .req-badge-group {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
          flex-shrink: 0;
        }

        .request-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem 0.55rem;
          border-radius: var(--radius-full);
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .status-active {
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .status-progress {
          color: #92400e;
          background: #fffbeb;
          border: 1px solid #fde68a;
        }

        .status-fulfilled {
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }

        .active-req-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .active-detail-line {
          display: flex;
          align-items: flex-start;
          gap: 0.45rem;
          font-size: 0.825rem;
          color: var(--slate-600);
        }

        .active-detail-line svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .request-created {
          color: var(--slate-400);
          font-size: 0.75rem;
        }

        .active-req-notes {
          background: var(--slate-50);
          border-left: 3px solid var(--primary-200);
          padding: 0.55rem 0.75rem;
          font-size: 0.8rem;
          color: var(--slate-700);
          font-style: italic;
          margin-top: 0.15rem;
        }

        .coordinates-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #99f6e4;
          border-radius: 6px;
          padding: 0.45rem 0.6rem;
          font-size: 0.72rem;
          font-weight: 600;
        }

        .active-req-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: auto;
          align-items: center;
          flex-wrap: wrap;
        }

        .fulfilled-text {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.825rem;
          font-weight: 700;
          color: #059669;
          margin-left: auto;
        }

        .progress-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
        }

        .progress-banner svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .progress-banner div {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          font-size: 0.75rem;
        }

        .progress-banner strong {
          font-size: 0.8rem;
        }

        @media (max-width: 700px) {
          .availability-box {
            align-items: flex-start;
            width: 100%;
          }

          .avail-sub {
            text-align: left;
          }

          .active-req-top {
            flex-direction: column;
          }

          .req-badge-group {
            align-items: flex-start;
            flex-direction: row;
            flex-wrap: wrap;
          }

          .fulfilled-text {
            margin-left: 0;
          }

          .role-banner-right {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
