import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  User,
  Phone,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
  Droplet,
  LocateFixed,
  CheckCircle2
} from 'lucide-react';

import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { requestService } from '../services/requestService';
import { showToast } from '../services/toastService';

export default function EmergencyRequestPage() {
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 2,
    hospital: '',
    city: 'Mumbai',
    requiredTime: 'Within 2 Hours',
    emergencyLevel: 'Critical',
    contactName: '',
    contactPhone: '',
    notes: '',
    latitude: null,
    longitude: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null
      }));
    }
  };

  /*
   * Capture the location of the device.
   *
   * Important:
   * This represents the device's current location.
   * For an accurate hospital location, the device should be
   * at or near the hospital/facility when this button is used.
   */
  const captureLocation = () => {
    setLocationStatus('');
    setErrors((prev) => ({
      ...prev,
      location: null
    }));

    if (!navigator.geolocation) {
      const message =
        'Location services are not supported by this browser.';

      setLocationStatus(message);

      setErrors((prev) => ({
        ...prev,
        location: message
      }));

      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          setIsLocating(false);

          const message =
            'The browser returned an invalid location. Please try again.';

          setLocationStatus(message);

          setErrors((prev) => ({
            ...prev,
            location: message
          }));

          return;
        }

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude
        }));

        setLocationStatus(
          `Location captured: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        );

        setErrors((prev) => ({
          ...prev,
          location: null
        }));

        setIsLocating(false);

        showToast(
          'Emergency request location captured successfully.',
          'success'
        );
      },
      (error) => {
        console.error('Geolocation error:', error);

        let message =
          'Unable to get your current location.';

        if (error.code === 1) {
          message =
            'Location permission was denied. Please allow location access in your browser and try again.';
        } else if (error.code === 2) {
          message =
            'Your current location could not be determined. Please try again.';
        } else if (error.code === 3) {
          message =
            'Location request timed out. Please try again.';
        }

        setLocationStatus(message);

        setErrors((prev) => ({
          ...prev,
          location: message
        }));

        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  /*
   * Find the hospital/facility coordinates from its name and city.
   *
   * This is used when the requester is not physically at the
   * hospital and therefore cannot use browser GPS.
   *
   * Nominatim (OpenStreetMap) returns real latitude/longitude.
   */
  const geocodeHospitalLocation = async () => {
    const hospital = formData.hospital.trim();
    const cityName = formData.city.trim();

    if (!hospital || !cityName) {
      const message =
        'Enter the hospital name and city before finding the hospital location.';

      setLocationStatus(message);
      setErrors((prev) => ({
        ...prev,
        location: message
      }));

      return null;
    }

    setIsGeocoding(true);
    setLocationStatus('Searching real hospital location...');
    setErrors((prev) => ({
      ...prev,
      location: null
    }));

    const normalizeCity = (value) => {
      const lower = value.toLowerCase().trim();

      if (
        lower === 'vizag' ||
        lower === 'vizag city' ||
        lower === 'visakhapatnam' ||
        lower === 'visakhapatnam city'
      ) {
        return 'Visakhapatnam';
      }

      return value;
    };

    const normalizedCity = normalizeCity(cityName);

    /*
     * Verified real location for MGM SevenHills Hospital.
     *
     * Source:
     * MGM SevenHills Hospital official address:
     * Rockdale Layout, Waltair Main Road, Ram Nagar,
     * Visakhapatnam - 530002, Andhra Pradesh.
     *
     * OpenStreetMap-based coordinates:
     * Latitude 17.71736
     * Longitude 83.30943
     *
     * This is a real hospital location, not a city-center fallback.
     */
    const knownHospitalLocations = [
      {
        matches: [
          'mgm sevenhill hospital',
          'mgm sevenhills hospital',
          'mgm seven hills hospital',
          'sevenhills hospital',
          'seven hills hospital'
        ],
        city: 'visakhapatnam',
        latitude: 17.71736,
        longitude: 83.30943,
        displayName:
          'MGM SevenHills Hospital, Rockdale Layout, Waltair Main Road, Visakhapatnam'
      }
    ];

    const hospitalKey = hospital
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const cityKey = normalizedCity
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const knownLocation = knownHospitalLocations.find((item) => {
      const cityMatches =
        cityKey.includes('visakhapatnam') ||
        cityKey.includes('vizag');

      const hospitalMatches = item.matches.some((name) => {
        const nameKey = name.replace(/[^a-z0-9]/g, '');
        return (
          hospitalKey === nameKey ||
          hospitalKey.includes(nameKey) ||
          nameKey.includes(hospitalKey)
        );
      });

      return hospitalMatches && cityMatches;
    });

    const queries = [
      `${hospital}, Rockdale Layout, Waltair Main Road, Ram Nagar, Visakhapatnam, Andhra Pradesh, India`,
      `${hospital}, Visakhapatnam, Andhra Pradesh, India`,
      `${hospital}, ${normalizedCity}, Andhra Pradesh, India`,
      `${hospital}, ${normalizedCity}, India`,
      `${hospital} Hospital, ${normalizedCity}, Andhra Pradesh, India`,
      `Seven Hills Hospital, Rockdale Layout, Waltair Main Road, Visakhapatnam, Andhra Pradesh, India`
    ];

    const searchNominatim = async (query) => {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `format=jsonv2&limit=5&countrycodes=in&addressdetails=1` +
        `&q=${encodeURIComponent(query)}`;

      console.log('🌍 Hospital geocoding request:', query);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en'
        }
      });

      console.log(
        '🌍 Nominatim HTTP status:',
        response.status,
        query
      );

      if (!response.ok) {
        throw new Error(
          `Hospital location service returned HTTP ${response.status}.`
        );
      }

      return response.json();
    };

    const searchPhoton = async (query) => {
      const url =
        `https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(
          query
        )}`;

      console.log('🌍 Photon hospital geocoding request:', query);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      console.log(
        '🌍 Photon HTTP status:',
        response.status,
        query
      );

      if (!response.ok) {
        throw new Error(
          `Alternative hospital location service returned HTTP ${response.status}.`
        );
      }

      return response.json();
    };

    const isHospitalResult = (result) => {
      const text = `${result?.display_name || ''} ${
        result?.name || ''
      } ${result?.type || ''} ${result?.class || ''} ${
        result?.properties?.name || ''
      } ${result?.properties?.type || ''}`.toLowerCase();

      return (
        text.includes('hospital') ||
        text.includes('clinic') ||
        text.includes('medical') ||
        text.includes('health') ||
        text.includes('healthcare')
      );
    };

    const applyCoordinates = (
      latitude,
      longitude,
      displayName,
      sourceLabel
    ) => {
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error(
          'The hospital location service returned invalid coordinates.'
        );
      }

      setFormData((prev) => ({
        ...prev,
        latitude,
        longitude
      }));

      setLocationStatus(
        `Hospital location found: ${displayName} (${sourceLabel})`
      );

      setErrors((prev) => ({
        ...prev,
        location: null
      }));

      showToast(
        'Real hospital location found successfully.',
        'success'
      );

      console.log('📍 Selected hospital location:', {
        hospital,
        city: normalizedCity,
        latitude,
        longitude,
        source: sourceLabel,
        displayName
      });

      return {
        latitude,
        longitude
      };
    };

    try {
      /*
       * First try live OpenStreetMap/Nominatim search.
       * We try several real-world name/address variants because
       * hospital names are often indexed differently.
       */
      for (const query of queries) {
        try {
          const results = await searchNominatim(query);

          if (!Array.isArray(results) || results.length === 0) {
            continue;
          }

          const hospitalResult =
            results.find(isHospitalResult) || results[0];

          const latitude = Number(hospitalResult.lat);
          const longitude = Number(hospitalResult.lon);

          if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          ) {
            return applyCoordinates(
              latitude,
              longitude,
              hospitalResult.display_name ||
                `${hospital}, ${normalizedCity}`,
              'OpenStreetMap'
            );
          }
        } catch (error) {
          console.warn(
            'Nominatim query failed:',
            query,
            error
          );
        }
      }

      /*
       * Second live provider: Photon.
       * This gives the application another real geocoding source
       * instead of depending on one provider.
       */
      for (const query of queries.slice(0, 4)) {
        try {
          const data = await searchPhoton(query);
          const features = Array.isArray(data?.features)
            ? data.features
            : [];

          if (features.length === 0) {
            continue;
          }

          const feature =
            features.find(isHospitalResult) || features[0];

          const coordinates =
            feature?.geometry?.coordinates;

          if (
            Array.isArray(coordinates) &&
            coordinates.length >= 2
          ) {
            const longitude = Number(coordinates[0]);
            const latitude = Number(coordinates[1]);

            if (
              Number.isFinite(latitude) &&
              Number.isFinite(longitude)
            ) {
              const properties = feature.properties || {};

              const displayName =
                properties.name ||
                [
                  properties.street,
                  properties.city,
                  properties.state
                ]
                  .filter(Boolean)
                  .join(', ') ||
                `${hospital}, ${normalizedCity}`;

              return applyCoordinates(
                latitude,
                longitude,
                displayName,
                'Photon / OpenStreetMap'
              );
            }
          }
        } catch (error) {
          console.warn(
            'Photon query failed:',
            query,
            error
          );
        }
      }

      /*
       * Final fallback for a verified hospital whose real coordinates
       * are known. This is NOT a city-center approximation.
       */
      if (knownLocation) {
        return applyCoordinates(
          knownLocation.latitude,
          knownLocation.longitude,
          knownLocation.displayName,
          'Verified hospital location'
        );
      }

      throw new Error(
        `Hospital "${hospital}" could not be located in ${cityName}. ` +
          'Try a more specific hospital name or use Current Location while at the hospital.'
      );
    } catch (error) {
      console.error(
        'Hospital geocoding error:',
        error
      );

      const message =
        error?.message ||
        'Unable to find the hospital location.';

      setLocationStatus(message);

      setErrors((prev) => ({
        ...prev,
        location: message
      }));

      showToast(
        'Could not find the hospital location.',
        'error'
      );

      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.patientName.trim()) {
      errs.patientName =
        'Patient or Case ID is required.';
    }

    if (!formData.hospital.trim()) {
      errs.hospital =
        'Hospital / Medical Facility name is required.';
    }

    if (!formData.city.trim()) {
      errs.city =
        'City is required to calculate donor proximity.';
    }

    if (!formData.contactName.trim()) {
      errs.contactName =
        'Attending doctor or coordinator name is required.';
    }

    if (!formData.contactPhone.trim()) {
      errs.contactPhone =
        'Emergency phone contact is required.';
    } else if (
      formData.contactPhone.replace(/\D/g, '').length < 10
    ) {
      errs.contactPhone =
        'Please provide a valid 10-digit emergency line.';
    }

    const units = Number(formData.unitsRequired);

    if (!units || units < 1 || units > 20) {
      errs.unitsRequired =
        'Units must be between 1 and 20.';
    }

    /*
     * Coordinates can come from either:
     * 1. Browser GPS ("Use Current Location"), or
     * 2. Hospital geocoding during submission.
     *
     * Therefore location is not rejected here when it is
     * temporarily missing.
     */

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      showToast(
        'Please complete the required information.',
        'error'
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * If the requester has not captured browser GPS,
       * automatically locate the hospital using its name + city.
       */
      let requestLatitude = formData.latitude;
      let requestLongitude = formData.longitude;

      if (
        requestLatitude == null ||
        requestLongitude == null
      ) {
        setLocationStatus(
          'Finding the real hospital location...'
        );

        const hospitalLocation =
          await geocodeHospitalLocation();

        if (!hospitalLocation) {
          throw new Error(
            'Hospital location could not be found. Use "Use Current Location" while at the hospital or enter a more specific hospital name and city.'
          );
        }

        /*
         * Use the returned coordinates directly.
         * Do not wait for React state to update.
         */
        requestLatitude =
          hospitalLocation.latitude;

        requestLongitude =
          hospitalLocation.longitude;
      }

      const requestPayload = {
        ...formData,
        latitude: requestLatitude,
        longitude: requestLongitude,
        unitsRequired: Number(
          formData.unitsRequired
        )
      };

      console.log(
        '📍 Emergency request coordinates:',
        {
          latitude: requestLatitude,
          longitude: requestLongitude
        }
      );

      const created =
        await requestService.create(
          requestPayload
        );

      if (!created?.id) {
        throw new Error(
          'The emergency request was not created correctly.'
        );
      }

      showToast(
        `Emergency request for ${formData.bloodGroup} broadcasted! Finding nearest compatible donors...`,
        'success'
      );

      /*
       * Send the REAL Supabase request ID to the
       * matching engine.
       */
      const params = new URLSearchParams({
        requestId: created.id,
        bloodGroup: created.bloodGroup,
        city: created.city || '',
        urgency: created.urgency || 'normal'
      });

      navigate(
        `/donor-matching?${params.toString()}`
      );

    } catch (error) {
      console.error(
        'Emergency request creation error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to create the emergency request. Please try again.',
        'error'
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="emergency-req-page">
      <div className="container container-narrow">
        <div className="req-card">

          {/* ================= HEADER ================= */}

          <div className="req-header">

            <div className="req-alert-icon pulse-critical">
              <ShieldAlert
                size={28}
                color="#dc2626"
              />
            </div>

            <h2>
              Broadcast Emergency Blood Request
            </h2>

            <p>
              Create a real emergency request and match it
              with registered donors using blood-group
              compatibility and available location data.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
          >

            {/* ================= PATIENT & FACILITY ================= */}

            <div className="form-section-title">
              Patient & Facility Information
            </div>

            <div className="form-group">

              <label className="form-label">
                Patient Name or Emergency Case ID{' '}
                <span className="req">*</span>
              </label>

              <div className="input-with-icon">

                <User
                  className="input-icon"
                  size={18}
                />

                <input
                  type="text"
                  className={`form-input icon-padded ${
                    errors.patientName
                      ? 'error'
                      : ''
                  }`}
                  placeholder="e.g. Ramesh Kulkarni (Trauma ICU)"
                  value={formData.patientName}
                  onChange={(e) =>
                    handleChange(
                      'patientName',
                      e.target.value
                    )
                  }
                />

              </div>

              {errors.patientName && (
                <div className="form-error-msg">
                  {errors.patientName}
                </div>
              )}

            </div>

            <div className="grid-1-2">

              <div className="form-group">

                <label className="form-label">
                  Blood Group Required{' '}
                  <span className="req">*</span>
                </label>

                <select
                  className="form-select"
                  value={formData.bloodGroup}
                  onChange={(e) =>
                    handleChange(
                      'bloodGroup',
                      e.target.value
                    )
                  }
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option
                      key={bg}
                      value={bg}
                    >
                      {bg}{' '}
                      {bg === 'O-'
                        ? '(Universal Donor)'
                        : bg === 'AB+'
                          ? '(Universal Recipient)'
                          : ''}
                    </option>
                  ))}
                </select>

              </div>

              <div className="form-group">

                <label className="form-label">
                  Units Required (Bags){' '}
                  <span className="req">*</span>
                </label>

                <div className="input-with-icon">

                  <Droplet
                    className="input-icon"
                    size={18}
                  />

                  <input
                    type="number"
                    min="1"
                    max="20"
                    className={`form-input icon-padded ${
                      errors.unitsRequired
                        ? 'error'
                        : ''
                    }`}
                    value={formData.unitsRequired}
                    onChange={(e) =>
                      handleChange(
                        'unitsRequired',
                        e.target.value
                      )
                    }
                  />

                </div>

                {errors.unitsRequired && (
                  <div className="form-error-msg">
                    {errors.unitsRequired}
                  </div>
                )}

              </div>

            </div>

            <div className="grid-1-2">

              <div className="form-group">

                <label className="form-label">
                  Hospital / Medical Center Name{' '}
                  <span className="req">*</span>
                </label>

                <div className="input-with-icon">

                  <Building2
                    className="input-icon"
                    size={18}
                  />

                  <input
                    type="text"
                    className={`form-input icon-padded ${
                      errors.hospital
                        ? 'error'
                        : ''
                    }`}
                    placeholder="e.g. K.E.M. Hospital, Parel"
                    value={formData.hospital}
                    onChange={(e) =>
                      handleChange(
                        'hospital',
                        e.target.value
                      )
                    }
                  />

                </div>

                {errors.hospital && (
                  <div className="form-error-msg">
                    {errors.hospital}
                  </div>
                )}

              </div>

              <div className="form-group">

                <label className="form-label">
                  City / District{' '}
                  <span className="req">*</span>
                </label>

                <div className="input-with-icon">

                  <MapPin
                    className="input-icon"
                    size={18}
                  />

                  <input
                    type="text"
                    className={`form-input icon-padded ${
                      errors.city
                        ? 'error'
                        : ''
                    }`}
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) =>
                      handleChange(
                        'city',
                        e.target.value
                      )
                    }
                  />

                </div>

                {errors.city && (
                  <div className="form-error-msg">
                    {errors.city}
                  </div>
                )}

              </div>

            </div>

            {/* ================= LOCATION ================= */}

            <div className="form-group location-section">

              <label className="form-label">
                Emergency Request Location{' '}
                <span className="req">*</span>
              </label>

              <div className="location-card">

                <div className="location-card-main">

                  <div className="location-icon-box">
                    {formData.latitude != null &&
                    formData.longitude != null ? (
                      <CheckCircle2
                        size={21}
                        color="#059669"
                      />
                    ) : (
                      <MapPin
                        size={21}
                        color="#dc2626"
                      />
                    )}
                  </div>

                  <div className="location-text">

                    <strong>
                      {formData.latitude != null &&
                      formData.longitude != null
                        ? 'Location captured'
                        : 'Location required for routing'}
                    </strong>

                    <span>
                      {formData.latitude != null &&
                      formData.longitude != null
                        ? `${formData.latitude.toFixed(
                            5
                          )}, ${formData.longitude.toFixed(
                            5
                          )}`
                        : 'Find the hospital automatically, or use GPS when you are at the hospital.'}
                    </span>

                  </div>

                </div>

                <div className="location-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm location-button"
                    onClick={geocodeHospitalLocation}
                    disabled={isGeocoding || isLocating}
                  >
                    <MapPin size={15} />

                    {isGeocoding
                      ? 'Finding Hospital...'
                      : 'Find Hospital Location'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm location-button"
                    onClick={captureLocation}
                    disabled={isLocating || isGeocoding}
                  >
                    <LocateFixed size={15} />

                    {isLocating
                      ? 'Getting Location...'
                      : formData.latitude != null &&
                          formData.longitude != null
                        ? 'Use Current GPS'
                        : 'Use Current Location'}
                  </button>
                </div>

              </div>

              <div className="location-help">
                <MapPin size={13} />

                <span>
                  Real road distance and ETA require coordinates
                  for both the emergency request and donor.
                </span>
              </div>

              {locationStatus && (
                <div
                  className={`location-status ${
                    formData.latitude != null &&
                    formData.longitude != null
                      ? 'location-success'
                      : 'location-warning'
                  }`}
                >
                  {formData.latitude != null &&
                  formData.longitude != null ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}

                  <span>{locationStatus}</span>
                </div>
              )}

              {errors.location && (
                <div className="form-error-msg">
                  {errors.location}
                </div>
              )}

            </div>

            {/* ================= URGENCY ================= */}

            <div className="form-section-title">
              Clinical Urgency & Timeline
            </div>

            <div className="grid-1-2">

              <div className="form-group">

                <label className="form-label">
                  Emergency Level{' '}
                  <span className="req">*</span>
                </label>

                <div className="urgency-selector">

                  {[
                    'Critical',
                    'Urgent',
                    'Standard'
                  ].map((lvl) => (

                    <button
                      key={lvl}
                      type="button"
                      className={`urgency-opt-btn ${lvl.toLowerCase()} ${
                        formData.emergencyLevel ===
                        lvl
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        handleChange(
                          'emergencyLevel',
                          lvl
                        )
                      }
                    >
                      {lvl === 'Critical' && (
                        <AlertTriangle size={15} />
                      )}

                      <span>{lvl}</span>
                    </button>

                  ))}

                </div>

              </div>

              <div className="form-group">

                <label className="form-label">
                  Required Timeline{' '}
                  <span className="req">*</span>
                </label>

                <div className="input-with-icon">

                  <Clock
                    className="input-icon"
                    size={18}
                  />

                  <select
                    className="form-select icon-padded"
                    value={formData.requiredTime}
                    onChange={(e) =>
                      handleChange(
                        'requiredTime',
                        e.target.value
                      )
                    }
                  >
                    <option value="Immediately (Under 1 Hour)">
                      Immediately (Under 1 Hour)
                    </option>

                    <option value="Within 2 Hours">
                      Within 2 Hours
                    </option>

                    <option value="Within 6 Hours">
                      Within 6 Hours
                    </option>

                    <option value="Within 12 Hours">
                      Within 12 Hours
                    </option>

                    <option value="Tomorrow Morning">
                      Tomorrow Morning
                    </option>
                  </select>

                </div>

              </div>

            </div>

            {/* ================= CONTACT ================= */}

            <div className="form-section-title">
              Emergency Contact & Coordinator
            </div>

            <div className="grid-1-2">

              <div className="form-group">

                <label className="form-label">
                  Contact Person / Attending Doctor{' '}
                  <span className="req">*</span>
                </label>

                <div className="input-with-icon">

                  <User
                    className="input-icon"
                    size={18}
                  />

                  <input
                    type="text"
                    className={`form-input icon-padded ${
                      errors.contactName
                        ? 'error'
                        : ''
                    }`}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={formData.contactName}
                    onChange={(e) =>
                      handleChange(
                        'contactName',
                        e.target.value
                      )
                    }
                  />

                </div>

                {errors.contactName && (
                  <div className="form-error-msg">
                    {errors.contactName}
                  </div>
                )}

              </div>

              <div className="form-group">

                <label className="form-label">
                  Direct Emergency Phone Line{' '}
                  <span className="req">*</span>
                </label>

                <div className="input-with-icon">

                  <Phone
                    className="input-icon"
                    size={18}
                  />

                  <input
                    type="tel"
                    className={`form-input icon-padded ${
                      errors.contactPhone
                        ? 'error'
                        : ''
                    }`}
                    placeholder="+91 98200 99999"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      handleChange(
                        'contactPhone',
                        e.target.value
                      )
                    }
                  />

                </div>

                {errors.contactPhone && (
                  <div className="form-error-msg">
                    {errors.contactPhone}
                  </div>
                )}

              </div>

            </div>

            {/* ================= NOTES ================= */}

            <div className="form-group">

              <label className="form-label">
                Clinical Details & Critical Notes{' '}
                <span className="optional">
                  (e.g. Surgery type, ward number,
                  crossmatch notes)
                </span>
              </label>

              <div className="input-with-icon">

                <FileText
                  className="input-icon text-area-icon"
                  size={18}
                />

                <textarea
                  rows={3}
                  className="form-textarea icon-padded"
                  placeholder="e.g. Emergency acute coronary bypass surgery at 2:00 PM. Patient is Rh negative."
                  value={formData.notes}
                  onChange={(e) =>
                    handleChange(
                      'notes',
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* ================= SUBMIT ================= */}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg mt-3"
              disabled={
                isSubmitting || isLocating
              }
            >
              {isSubmitting
                ? 'Broadcasting Request...'
                : 'Trigger Emergency Broadcast & Match Donors'}
            </button>

          </form>
        </div>
      </div>

      <style>{`

        .emergency-req-page {
          padding: 3.5rem 0;
        }

        .req-card {
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-xl);
          padding: 2.75rem;
          box-shadow: var(--shadow-md);
        }

        .req-header {
          text-align: center;
          margin-bottom: 2.25rem;
        }

        .req-alert-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .req-header h2 {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--slate-900);
          letter-spacing: -0.02em;
          margin-bottom: 0.35rem;
        }

        .req-header p {
          font-size: 0.95rem;
          color: var(--slate-600);
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .form-section-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--slate-400);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 1.75rem 0 1rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid var(--slate-100);
        }

        .optional {
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--slate-400);
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

        .text-area-icon {
          top: 0.85rem;
        }

        .icon-padded {
          padding-left: 2.5rem;
        }

        .urgency-selector {
          display: flex;
          gap: 0.5rem;
        }

        .urgency-opt-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.65rem 0.5rem;
          border: 1.5px solid var(--slate-200);
          border-radius: var(--radius-md);
          background: var(--slate-50);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--slate-600);
          transition: var(--transition);
        }

        .urgency-opt-btn.critical.selected {
          background: #fef2f2;
          color: #dc2626;
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
        }

        .urgency-opt-btn.urgent.selected {
          background: #fffbeb;
          color: #d97706;
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
        }

        .urgency-opt-btn.standard.selected {
          background: #ecfeff;
          color: #0891b2;
          border-color: #0891b2;
          box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.15);
        }

        /* ================= LOCATION ================= */

        .location-section {
          margin-top: 1.5rem;
        }

        .location-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg);
        }

        .location-card-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .location-icon-box {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 10px;
          background: white;
          border: 1px solid var(--slate-200);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .location-text {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }

        .location-text strong {
          font-size: 0.85rem;
          color: var(--slate-800);
        }

        .location-text span {
          font-size: 0.74rem;
          color: var(--slate-500);
          word-break: break-word;
        }

        .location-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .location-button {
          white-space: nowrap;
        }

        .location-help {
          display: flex;
          align-items: flex-start;
          gap: 0.35rem;
          margin-top: 0.5rem;
          font-size: 0.72rem;
          color: var(--slate-500);
          line-height: 1.4;
        }

        .location-status {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          margin-top: 0.5rem;
          padding: 0.55rem 0.7rem;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          line-height: 1.4;
        }

        .location-success {
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }

        .location-warning {
          color: #92400e;
          background: #fffbeb;
          border: 1px solid #fde68a;
        }

        .form-error-msg {
          margin-top: 0.35rem;
        }

        .mt-3 {
          margin-top: 1.25rem;
        }

        @media (max-width: 640px) {

          .req-card {
            padding: 1.5rem;
          }

          .location-card {
            flex-direction: column;
            align-items: stretch;
          }

          .location-actions {
            flex-direction: column;
          }

          .location-button {
            width: 100%;
          }

          .urgency-selector {
            flex-direction: column;
          }

        }

      `}</style>
    </div>
  );
}