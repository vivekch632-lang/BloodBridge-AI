import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
  Send,
  Info,
  X,
  Navigation,
  Route,
} from 'lucide-react';

import { BloodBadge } from '../components/common/Badge';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { donorService } from '../services/donorService';
import { requestService } from '../services/requestService';
import { showToast } from '../services/toastService';
import { supabase } from '../lib/supabaseClient';

export default function DonorMatchingPage() {
  const [searchParams] = useSearchParams();

  const rawBloodGroup = searchParams.get('bloodGroup');
  const rawCity = searchParams.get('city');
  const rawRequestId = searchParams.get('requestId');

  const initialBloodGroup =
    rawBloodGroup &&
    rawBloodGroup !== 'undefined' &&
    rawBloodGroup !== 'null'
      ? rawBloodGroup
      : 'O-';

  const initialCity =
    rawCity &&
    rawCity !== 'undefined' &&
    rawCity !== 'null'
      ? rawCity
      : '';

  const initialRequestId =
    rawRequestId &&
    rawRequestId !== 'undefined' &&
    rawRequestId !== 'null'
      ? rawRequestId
      : null;

  const [bloodGroup, setBloodGroup] = useState(initialBloodGroup);
  const [city, setCity] = useState(initialCity);
  const [maxDistance, setMaxDistance] = useState(25);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // When a specific emergency request is opened, its blood group and city
  // are authoritative. The matching UI must never be able to display one
  // blood group while the engine matches another.
  const [requestLoaded, setRequestLoaded] = useState(!initialRequestId);
  const [requestBloodGroup, setRequestBloodGroup] = useState(
    initialRequestId ? null : initialBloodGroup
  );
  const [requestCity, setRequestCity] = useState(
    initialRequestId ? null : initialCity
  );

  const [matchedDonors, setMatchedDonors] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [matchError, setMatchError] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [contactedDonorIds, setContactedDonorIds] = useState([]);
  const [aiServiceStatus, setAiServiceStatus] = useState('checking');

  // Load the selected emergency request first. Its blood group is the
  // authoritative requirement for this matching page.
  useEffect(() => {
    let cancelled = false;

    async function loadAuthoritativeRequest() {
      if (!initialRequestId) {
        setRequestLoaded(true);
        return;
      }

      setRequestLoaded(false);

      const { data, error } = await supabase
        .from('blood_requests')
        .select('blood_group, city')
        .eq('id', initialRequestId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Unable to load selected emergency request:', error);
        setRequestBloodGroup(null);
        setRequestCity(null);
        setRequestLoaded(true);
        return;
      }

      const authoritativeGroup = String(data?.blood_group || '').trim();
      const authoritativeCity = String(data?.city || '').trim();

      if (!authoritativeGroup) {
        console.error('Selected emergency request has no blood group.');
        setRequestBloodGroup(null);
        setRequestCity(authoritativeCity || null);
        setRequestLoaded(true);
        return;
      }

      setRequestBloodGroup(authoritativeGroup);
      setBloodGroup(authoritativeGroup);

      if (authoritativeCity) {
        setRequestCity(authoritativeCity);
        setCity(authoritativeCity);
      }

      setRequestLoaded(true);
    }

    loadAuthoritativeRequest();

    return () => {
      cancelled = true;
    };
  }, [initialRequestId]);

  useEffect(() => {
    let cancelled = false;

    function normalizeUrgency(value) {
      const text = String(value || '').toLowerCase();

      if (text.includes('critical')) return 'Critical';
      if (text.includes('urgent')) return 'Urgent';
      return 'Routine';
    }

    function daysSinceDonation(lastDonationDate) {
      if (!lastDonationDate) return 180;

      const date = new Date(lastDonationDate);
      if (Number.isNaN(date.getTime())) return 180;

      const days = Math.floor(
        (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      return Math.max(0, days);
    }

    async function getRequestDetails() {
      if (!initialRequestId) {
        return {
          urgency: normalizeUrgency(
            searchParams.get('urgency')
          ),
          unitsRequired: 1,
          city: city.trim(),
          bloodGroup,
        };
      }

      const { data, error } = await supabase
        .from('blood_requests')
        .select('blood_group, units_required, urgency, city')
        .eq('id', initialRequestId)
        .maybeSingle();

      if (error) {
        console.warn(
          'Unable to load request details for trained AI:',
          error
        );
      }

      return {
        urgency: normalizeUrgency(
          data?.urgency || searchParams.get('urgency')
        ),
        unitsRequired: Number(data?.units_required) || 1,
        city: data?.city || city.trim(),
        // The dropdown is the active matching requirement. It is initialized
        // from the saved request, but can be changed for testing/filtering.
        bloodGroup,
      };
    }

    async function predictWithTrainedAI(donor, requestDetails) {
      const distance = Number(donor.distanceKm);
      const travelTime = Number(donor.travelTimeMinutes);

      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(travelTime)
      ) {
        return {
          ...donor,
          aiProbability: null,
          aiProbabilityPercent: null,
          aiPrediction: 'Unavailable',
          aiConfidence: 'Unavailable',
          aiModel: 'BloodBridge Random Forest Donor Matching Model',
        };
      }

      const donorAge = Number(donor.age);
      const safeAge =
        Number.isFinite(donorAge) && donorAge >= 18
          ? donorAge
          : 30;

      const donorGender =
        donor.gender === 'Male' ||
        donor.gender === 'Female' ||
        donor.gender === 'Other'
          ? donor.gender
          : 'Other';

      const payload = {
        donor_blood_group:
          donor.bloodGroup || 'O+',
        recipient_blood_group:
          requestDetails.bloodGroup || bloodGroup,
        donor_age: safeAge,
        donor_gender: donorGender,
        donor_available: donor.available
          ? 'Available'
          : 'Unavailable',
        distance_km: distance,
        estimated_travel_minutes: travelTime,
        days_since_last_donation:
          daysSinceDonation(donor.lastDonationDate),
        donation_eligible:
          donor.eligibility?.eligible ??
          donor.isEligible ??
          true,
        urgency: requestDetails.urgency,
        units_required:
          requestDetails.unitsRequired,
        donor_city:
          donor.city || requestDetails.city || 'Unknown',
        recipient_city:
          requestDetails.city || city.trim() || 'Unknown',
      };

      try {
        const response = await fetch(
          'http://127.0.0.1:8000/predict',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(
            `AI service returned HTTP ${response.status}`
          );
        }

        const result = await response.json();

        if (!result?.success) {
          throw new Error(
            result?.message ||
              'AI service did not return a prediction.'
          );
        }

        return {
          ...donor,
          aiProbability:
            result.ai_probability,
          aiProbabilityPercent:
            result.ai_probability_percent,
          aiPrediction:
            result.prediction,
          aiConfidence:
            result.confidence_label,
          aiModel:
            result.model_used,
          aiModelVersion:
            result.model_version,
          aiModelType:
            result.model_type,
        };
      } catch (error) {
        console.error(
          'Trained AI prediction failed for donor:',
          donor.id,
          error
        );

        return {
          ...donor,
          aiProbability: null,
          aiProbabilityPercent: null,
          aiPrediction: 'Unavailable',
          aiConfidence: 'Unavailable',
          aiModel:
            'BloodBridge Random Forest Donor Matching Model',
          aiError: error?.message || 'AI service unavailable',
        };
      }
    }

    async function loadMatches() {
      if (initialRequestId && !requestLoaded) {
        setIsLoadingMatches(true);
        return;
      }

      if (initialRequestId && !requestBloodGroup) {
        setIsLoadingMatches(false);
        setMatchedDonors([]);
        setMatchError('The selected emergency request does not have a valid blood group.');
        setAiServiceStatus('unavailable');
        return;
      }

      setIsLoadingMatches(true);
      setMatchError('');
      setAiServiceStatus('checking');

      try {
        console.log('Loading donor matches:', {
          requestId: initialRequestId,
          bloodGroup,
          city,
          maxDistance,
          onlyAvailable,
        });

        const requestDetails =
          await getRequestDetails();

        // Always match using the blood group currently selected in the UI.
        // When a request is opened, this starts with the request's saved group.
        const effectiveBloodGroup = bloodGroup;

        const effectiveCity = initialRequestId
          ? requestCity || requestDetails.city || city.trim()
          : city.trim();

        const results = await donorService.findMatches({
          bloodGroup: effectiveBloodGroup,
          city: effectiveCity,
          maxDistance,
          onlyAvailable,
          requestId: initialRequestId,
        });

        console.log('Donor matching results:', results);

        const baseDonors = Array.isArray(results)
          ? results
          : [];

        const aiResults = await Promise.all(
          baseDonors.map((donor) =>
            predictWithTrainedAI(
              donor,
              requestDetails
            )
          )
        );

        const successfulPredictions =
          aiResults.filter(
            (donor) =>
              donor.aiProbabilityPercent != null
          );

        const sortedResults = [...aiResults].sort(
          (a, b) => {
            const aProbability =
              a.aiProbability == null
                ? -1
                : Number(a.aiProbability);
            const bProbability =
              b.aiProbability == null
                ? -1
                : Number(b.aiProbability);

            if (
              bProbability !== aProbability
            ) {
              return bProbability - aProbability;
            }

            const aDistance =
              a.distanceKm == null
                ? Number.POSITIVE_INFINITY
                : Number(a.distanceKm);
            const bDistance =
              b.distanceKm == null
                ? Number.POSITIVE_INFINITY
                : Number(b.distanceKm);

            return aDistance - bDistance;
          }
        );

        if (!cancelled) {
          setMatchedDonors(sortedResults);
          setAiServiceStatus(
            successfulPredictions.length > 0
              ? 'online'
              : 'unavailable'
          );
        }
      } catch (error) {
        console.error('Donor matching error:', error);

        if (!cancelled) {
          setMatchedDonors([]);
          setMatchError(
            error?.message ||
              'Unable to load donor matches.'
          );
          setAiServiceStatus('unavailable');

          showToast(
            'Unable to load donor matches.',
            'error'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMatches(false);
        }
      }
    }

    loadMatches();

    return () => {
      cancelled = true;
    };
  }, [
    bloodGroup,
    city,
    maxDistance,
    onlyAvailable,
    initialRequestId,
    requestLoaded,
    requestBloodGroup,
    requestCity,
  ]);

  const handleSendEmergencyAlert = async (donor) => {
    if (!initialRequestId) {
      showToast(
        'No emergency request was selected.',
        'error'
      );
      return;
    }

    try {
      console.log('Preparing emergency response:', {
        requestId: initialRequestId,
        donorId: donor.id,
        donorName: donor.name,
      });

      await requestService.updateStatus(
        initialRequestId,
        'In Progress'
      );

      setContactedDonorIds((previous) => {
        if (previous.includes(donor.id)) {
          return previous;
        }

        return [...previous, donor.id];
      });

      showToast(
        `Emergency response prepared for ${donor.name}. Request is now in progress.`,
        'success'
      );
    } catch (error) {
      console.error(
        'Emergency response error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to prepare emergency response.',
        'error'
      );
    }
  };

  const compatibleCount = matchedDonors.length;

  return (
    <div className="matching-page">
      <div className="container">

        {/* HEADER */}
        <div className="matching-header">
          <div>
            <div className="matching-badge-pill">
              <Sparkles size={14} />
              <span>
                Trained AI Donor Matching & Blood Compatibility
              </span>
            </div>

            <h1 className="page-title">
              Donor Prioritization Engine
            </h1>

            <p className="page-subtitle">
              Ranking compatible registered donors using a
              trained Random Forest model with real road distance,
              ETA, availability, donation history, urgency, and
              donor/request context.
            </p>
          </div>

          <div className="header-stat-pill">
            <span className="stat-pill-num">
              {compatibleCount}
            </span>

            <span className="stat-pill-label">
              Compatible Donors in Radius
            </span>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="filter-card">
          <div className="filter-header">
            <div className="filter-title">
              <SlidersHorizontal size={18} />
              <span>Matching Parameters</span>
            </div>

            {initialRequestId && (
              <span className="badge badge-critical">
                TARGETING REQUEST #{initialRequestId}
              </span>
            )}
          </div>

          <div className="filter-grid">

            {/* BLOOD GROUP */}
            <div className="filter-item">
              <label className="filter-label">
                Patient Blood Group Required
              </label>

              <select
                className="form-select"
                value={bloodGroup}
                onChange={(event) =>
                  setBloodGroup(event.target.value)
                }
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>

              {initialRequestId && requestBloodGroup && bloodGroup !== requestBloodGroup && (
                <small style={{ display: 'block', marginTop: '6px', color: '#b45309' }}>
                  Matching override: this selection is for testing and does not change the saved emergency request.
                </small>
              )}
            </div>

            {/* CITY */}
            <div className="filter-item">
              <label className="filter-label">
                Filter by City / District
              </label>

              <div className="input-with-icon">
                <MapPin
                  className="input-icon"
                  size={16}
                />

                <input
                  type="text"
                  className="form-input icon-padded"
                  placeholder="e.g. Vizag"
                  value={initialRequestId ? requestCity || '' : city}
                  readOnly={Boolean(initialRequestId)}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                />
              </div>
            </div>

            {/* DISTANCE */}
            <div className="filter-item">
              <label className="filter-label">
                Max Travel Radius:{' '}
                <strong>{maxDistance} km</strong>
              </label>

              <input
                type="range"
                min="3"
                max="50"
                step="1"
                className="distance-slider"
                value={maxDistance}
                onChange={(event) =>
                  setMaxDistance(
                    Number(event.target.value)
                  )
                }
              />
            </div>

            {/* AVAILABLE */}
            <div className="filter-item checkbox-filter">
              <label className="available-only-toggle">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(event) =>
                    setOnlyAvailable(
                      event.target.checked
                    )
                  }
                />

                <span>
                  Show Only Ready & Available Donors
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="results-section">
          <div className="results-header">
            <h3>
              Prioritized Donors Ranked by Trained AI Prediction
            </h3>

            <div className="results-status-group">
              <span className={`ai-status-pill ai-status-${aiServiceStatus}`}>
                {aiServiceStatus === 'online'
                  ? '● Trained AI Online'
                  : aiServiceStatus === 'checking'
                    ? '● AI Checking'
                    : '● Trained AI Offline'}
              </span>

              <span className="results-count">
                Showing {matchedDonors.length} donors
              </span>
            </div>
          </div>

          {/* LOADING */}
          {isLoadingMatches && (
            <div className="empty-state-card">
              <Clock size={36} />

              <h4>
                Loading real donor matches...
              </h4>

              <p>
                Checking registered donor profiles,
                blood compatibility, and location data.
              </p>
            </div>
          )}

          {/* ERROR */}
          {!isLoadingMatches && matchError && (
            <div className="empty-state-card">
              <Info size={36} />

              <h4>
                Unable to load donor matches
              </h4>

              <p>{matchError}</p>
            </div>
          )}

          {/* NO MATCH */}
          {!isLoadingMatches &&
            !matchError &&
            matchedDonors.length === 0 && (
              <div className="empty-state-card">
                <Info size={36} />

                <h4>
                  No matching donors found
                </h4>

                <p>
                  No compatible available donor was
                  found for the current city and travel
                  radius.
                </p>

                <button
                  className="btn btn-secondary btn-sm mt-3"
                  onClick={() => {
                    setCity('');
                    setMaxDistance(50);
                  }}
                >
                  Clear City & Expand Radius
                </button>
              </div>
            )}

          {/* DONOR CARDS */}
          {!isLoadingMatches &&
            !matchError &&
            matchedDonors.length > 0 && (
              <div className="donors-grid">
                {matchedDonors.map((donor, index) => {
                  const contacted =
                    contactedDonorIds.includes(
                      donor.id
                    );

                  return (
                    <div
                      key={donor.id}
                      className="donor-match-card"
                    >

                      {/* TOP */}
                      <div className="card-top-bar">
                        <div className="rank-indicator">
                          <span className="rank-num">
                            #{index + 1}
                          </span>

                          <span className="rank-label">
                            Priority Match
                          </span>
                        </div>

                        <div className="score-percent">
                          <Sparkles size={13} />

                          <span>
                            {donor.aiProbabilityPercent != null
                              ? `${Number(donor.aiProbabilityPercent).toFixed(2)}% AI`
                              : 'AI unavailable'}
                          </span>
                        </div>
                      </div>

                      {/* BODY */}
                      <div className="card-body">

                        <div className="donor-main-row">
                          <BloodBadge
                            group={donor.bloodGroup}
                            size="lg"
                          />

                          <div className="donor-main-info">
                            <div className="donor-name-row">
                              <h3>
                                {donor.name ||
                                  'Registered Donor'}
                              </h3>

                              <span className="badge badge-standard">
                                <ShieldCheck
                                  size={13}
                                />
                                Registered Donor
                              </span>
                            </div>

                            <div className="donor-contact-row">
                              <span>
                                <MapPin size={14} />
                                {donor.city ||
                                  'Location unavailable'}
                              </span>

                              {donor.phone && (
                                <span>
                                  <Phone size={14} />
                                  {donor.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* TRAINED AI PREDICTION */}
                        <div className="ai-prediction-box">
                          <div className="ai-prediction-header">
                            <div className="ai-prediction-title">
                              <Sparkles size={15} />
                              <strong>Trained AI Prediction</strong>
                            </div>

                            <span className="ai-model-badge">
                              Random Forest v{donor.aiModelVersion || '1.0.0'}
                            </span>
                          </div>

                          {donor.aiProbabilityPercent != null ? (
                            <>
                              <div className="ai-prediction-main">
                                <strong>
                                  {Number(donor.aiProbabilityPercent).toFixed(2)}%
                                </strong>
                                <span>
                                  {donor.aiPrediction || 'Model prediction'}
                                </span>
                              </div>

                              <div className="ai-prediction-meta">
                                <span>Model confidence: {donor.aiConfidence || '—'}</span>
                                <span>Actual trained model response</span>
                              </div>
                            </>
                          ) : (
                            <div className="ai-unavailable">
                              <span>
                                Trained AI service is unavailable. Start the local AI API on port 8000.
                              </span>
                            </div>
                          )}
                        </div>

                        {/* COMPATIBILITY */}
                        <div className="match-detail-box">
                          <div className="match-detail-header">
                            <strong>
                              Blood Compatibility
                            </strong>

                            {/* IMPORTANT:
                                Do NOT use CompatibilityBadge here.
                                All donors returned by findMatches()
                                have already passed the compatibility
                                filter.
                            */}
                            <span className="compatibility-success">
                              ✓ Compatible
                            </span>
                          </div>

                          <p>
                            {donor.rationale ||
                              'Compatible under the configured ABO/Rh red-cell compatibility rules. Final compatibility and transfusion decisions must be confirmed by qualified blood-bank staff.'}
                          </p>
                        </div>

                        {/* REAL ROAD ROUTE */}
                        <div className="route-detail-box">
                          <div className="route-title">
                            <Route size={15} />

                            <strong>
                              Real Road Route
                            </strong>
                          </div>

                          {donor.distanceKm != null ? (
                            <div className="route-values">

                              <div>
                                <span>
                                  Road Distance
                                </span>

                                <strong>
                                  {Number(
                                    donor.distanceKm
                                  ).toFixed(1)}{' '}
                                  km
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Estimated Travel Time
                                </span>

                                <strong>
                                  {donor.travelTimeMinutes !=
                                  null
                                    ? `${Math.round(
                                        donor.travelTimeMinutes
                                      )} min`
                                    : 'Unavailable'}
                                </strong>
                              </div>

                            </div>
                          ) : (
                            <div className="route-unavailable">
                              <Navigation size={14} />

                              <span>
                                Road distance unavailable
                                for this donor.
                              </span>
                            </div>
                          )}

                          {donor.routeSource && (
                            <small>
                              Route source:{' '}
                              {donor.routeSource}
                            </small>
                          )}
                        </div>

                        {/* SCORE BREAKDOWN */}
                        <div className="score-breakdown">

                          <div>
                            <span>
                              Proximity
                            </span>

                            <strong>
                              {donor.distanceScore ??
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Availability
                            </span>

                            <strong>
                              {donor.available
                                ? 'Ready'
                                : 'Unavailable'}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Eligibility
                            </span>

                            <strong>
                              {donor.eligibility?.eligible ??
                              donor.isEligible
                                ? 'Eligible'
                                : 'Review'}
                            </strong>
                          </div>

                        </div>

                        {/* ACTIONS */}
                        <div className="card-actions">

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              setSelectedDonor(
                                donor
                              )
                            }
                          >
                            View Match Details
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              handleSendEmergencyAlert(
                                donor
                              )
                            }
                            disabled={contacted}
                          >
                            {contacted ? (
                              <>
                                <CheckCircle2
                                  size={14}
                                />
                                Response Prepared
                              </>
                            ) : (
                              <>
                                <Send size={14} />
                                Prepare Emergency Response
                              </>
                            )}
                          </button>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* DISCLAIMER */}
        <div className="matching-disclaimer">
          <Info size={16} />

          <p>
            BloodBridge AI uses a trained Random Forest model
            to prioritize compatible donors using the available
            donor, request, and routing features. ABO/Rh
            compatibility remains a separate hard safety filter.
            The model is trained on synthetic prototype data and
            must not replace qualified blood-bank or clinical decisions.
          </p>
        </div>

      </div>

      {/* DETAILS MODAL */}
      {selectedDonor && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedDonor(null)
          }
        >
          <div
            className="modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <h3>
                AI Match Details
              </h3>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedDonor(null)
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">

              <div className="modal-donor">
                <BloodBadge
                  group={
                    selectedDonor.bloodGroup
                  }
                  size="lg"
                />

                <div>
                  <h3>
                    {selectedDonor.name}
                  </h3>

                  <p>
                    {selectedDonor.city}
                  </p>
                </div>
              </div>

              <div className="modal-grid">

                <div>
                  <span>
                    AI Match Score
                  </span>

                  <strong>
                    {selectedDonor.matchScore ??
                      selectedDonor.score ??
                      0}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Blood Compatibility
                  </span>

                  <strong className="modal-compatible">
                    ✓ Compatible
                  </strong>
                </div>

                <div>
                  <span>
                    Road Distance
                  </span>

                  <strong>
                    {selectedDonor.distanceKm !=
                    null
                      ? `${Number(
                          selectedDonor.distanceKm
                        ).toFixed(1)} km`
                      : 'Unavailable'}
                  </strong>
                </div>

                <div>
                  <span>
                    ETA
                  </span>

                  <strong>
                    {selectedDonor.travelTimeMinutes !=
                    null
                      ? `${Math.round(
                          selectedDonor.travelTimeMinutes
                        )} min`
                      : 'Unavailable'}
                  </strong>
                </div>

              </div>

              <div className="modal-ai-info">
                <strong>Trained AI Model</strong>
                <p>
                  {selectedDonor.aiProbabilityPercent != null
                    ? `Random Forest prediction: ${Number(selectedDonor.aiProbabilityPercent).toFixed(2)}% — ${selectedDonor.aiPrediction || 'High/Low suitability'}.`
                    : 'The trained AI service did not return a prediction.'}
                </p>
              </div>

              <div className="modal-rationale">
                <strong>
                  Matching rationale
                </strong>

                <p>
                  {selectedDonor.rationale ||
                    'Compatibility and availability were considered by the matching engine.'}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        .matching-page {
          padding: 2.5rem 0 4rem;
        }

        .matching-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .matching-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.75rem;
          border-radius: 999px;
          background: #f5f3ff;
          color: #7c3aed;
          border: 1px solid #ddd6fe;
          font-size: 0.78rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--slate-900);
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          max-width: 700px;
          color: var(--slate-600);
          line-height: 1.6;
        }

        .header-stat-pill {
          min-width: 190px;
          padding: 1rem 1.25rem;
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          text-align: center;
        }

        .stat-pill-num {
          display: block;
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary-600);
        }

        .stat-pill-label {
          display: block;
          font-size: 0.75rem;
          color: var(--slate-600);
        }

        .filter-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          margin-bottom: 2.5rem;
        }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid var(--slate-200);
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          padding: 1.5rem;
        }

        .filter-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--slate-700);
          margin-bottom: 0.45rem;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--slate-400);
        }

        .icon-padded {
          padding-left: 2.25rem;
        }

        .checkbox-filter {
          display: flex;
          align-items: center;
        }

        .available-only-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--slate-700);
          cursor: pointer;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .results-header h3 {
          font-size: 1.2rem;
          font-weight: 800;
        }

        .results-count {
          color: var(--slate-500);
          font-size: 0.8rem;
        }

        .results-status-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .ai-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.55rem;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 800;
          border: 1px solid var(--slate-200);
          background: white;
        }

        .ai-status-online {
          color: #047857;
          border-color: #a7f3d0;
          background: #ecfdf5;
        }

        .ai-status-checking {
          color: #92400e;
          border-color: #fde68a;
          background: #fffbeb;
        }

        .ai-status-unavailable {
          color: #b91c1c;
          border-color: #fecaca;
          background: #fef2f2;
        }

        .empty-state-card {
          background: white;
          border: 1px dashed var(--slate-300);
          border-radius: var(--radius-xl);
          padding: 3rem 1.5rem;
          text-align: center;
          color: var(--slate-500);
        }

        .empty-state-card h4 {
          margin: 0.75rem 0 0.35rem;
          color: var(--slate-900);
          font-size: 1.1rem;
        }

        .empty-state-card p {
          max-width: 600px;
          margin: auto;
        }

        .donors-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .donor-match-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 1.25rem;
          background: var(--slate-50);
          border-bottom: 1px solid var(--slate-200);
        }

        .rank-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rank-num {
          font-weight: 800;
          color: var(--slate-900);
        }

        .rank-label {
          font-size: 0.75rem;
          color: var(--slate-500);
        }

        .score-percent {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: #7c3aed;
          font-weight: 800;
          font-size: 0.8rem;
        }

        .card-body {
          padding: 1.25rem;
        }

        .donor-main-row {
          display: flex;
          gap: 0.9rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .donor-main-info {
          flex: 1;
        }

        .donor-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .donor-name-row h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--slate-900);
        }

        .donor-contact-row {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
          margin-top: 0.35rem;
          color: var(--slate-500);
          font-size: 0.78rem;
        }

        .donor-contact-row span {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .match-detail-box,
        .route-detail-box {
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-md);
          padding: 0.85rem;
          margin-bottom: 0.75rem;
        }

        .match-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
        }

        .compatibility-success {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.55rem;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .match-detail-box p {
          font-size: 0.78rem;
          color: var(--slate-600);
          line-height: 1.5;
        }

        .route-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.7rem;
          color: var(--slate-800);
        }

        .route-values {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .route-values div {
          background: var(--slate-50);
          border-radius: 7px;
          padding: 0.65rem;
        }

        .route-values span {
          display: block;
          font-size: 0.7rem;
          color: var(--slate-500);
          margin-bottom: 0.2rem;
        }

        .route-values strong {
          display: block;
          font-size: 0.9rem;
          color: var(--slate-900);
        }

        .route-detail-box small {
          display: block;
          margin-top: 0.6rem;
          color: var(--slate-400);
          font-size: 0.68rem;
        }

        .route-unavailable {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--slate-500);
          font-size: 0.78rem;
        }

        .score-breakdown {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .score-breakdown div {
          padding: 0.6rem;
          background: var(--slate-50);
          border-radius: 7px;
          text-align: center;
        }

        .score-breakdown span {
          display: block;
          font-size: 0.68rem;
          color: var(--slate-500);
        }

        .score-breakdown strong {
          display: block;
          margin-top: 0.2rem;
          font-size: 0.78rem;
          color: var(--slate-800);
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .ai-prediction-box {
          border: 1px solid #ddd6fe;
          border-radius: var(--radius-md);
          padding: 0.9rem;
          margin-bottom: 0.75rem;
          background: #faf5ff;
        }

        .ai-prediction-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.65rem;
        }

        .ai-prediction-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #6d28d9;
        }

        .ai-model-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: #6d28d9;
          border: 1px solid #ddd6fe;
          background: white;
          border-radius: 999px;
          padding: 0.22rem 0.45rem;
        }

        .ai-prediction-main {
          display: flex;
          align-items: baseline;
          gap: 0.65rem;
        }

        .ai-prediction-main strong {
          font-size: 1.35rem;
          color: #5b21b6;
        }

        .ai-prediction-main span {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--slate-700);
        }

        .ai-prediction-meta {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.45rem;
          color: var(--slate-500);
          font-size: 0.68rem;
        }

        .ai-unavailable {
          color: #92400e;
          font-size: 0.76rem;
          line-height: 1.45;
        }

        .modal-ai-info {
          margin-top: 1rem;
          padding: 0.85rem;
          border: 1px solid #ddd6fe;
          border-radius: 8px;
          background: #faf5ff;
        }

        .modal-ai-info p {
          margin-top: 0.4rem;
          color: var(--slate-600);
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .matching-disclaimer {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          margin-top: 1.5rem;
          padding: 1rem;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-md);
          color: var(--slate-500);
          font-size: 0.75rem;
        }

        .matching-disclaimer p {
          margin: 0;
          line-height: 1.5;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1000;
        }

        .modal-content {
          width: min(600px, 100%);
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--slate-200);
        }

        .modal-header h3 {
          font-weight: 800;
        }

        .modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--slate-100);
        }

        .modal-body {
          padding: 1.25rem;
        }

        .modal-donor {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .modal-donor h3 {
          font-weight: 800;
        }

        .modal-donor p {
          color: var(--slate-500);
          font-size: 0.8rem;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .modal-grid div {
          padding: 0.75rem;
          background: var(--slate-50);
          border-radius: 8px;
        }

        .modal-grid span {
          display: block;
          font-size: 0.7rem;
          color: var(--slate-500);
        }

        .modal-grid strong {
          display: block;
          margin-top: 0.25rem;
          color: var(--slate-900);
        }

        .modal-compatible {
          color: #047857 !important;
        }

        .modal-rationale {
          margin-top: 1rem;
          padding: 0.85rem;
          border: 1px solid var(--slate-200);
          border-radius: 8px;
        }

        .modal-rationale p {
          margin-top: 0.4rem;
          color: var(--slate-600);
          font-size: 0.8rem;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .filter-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .donors-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .matching-header {
            flex-direction: column;
          }

          .header-stat-pill {
            width: 100%;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .results-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .results-status-group {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}