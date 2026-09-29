import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  Heart
} from 'lucide-react';

import { BLOOD_GROUPS, checkEligibility } from '../utils/bloodCompatibility';
import { donorService } from '../services/donorService';
import { showToast } from '../services/toastService';


export default function DonorRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    city: 'Mumbai',
    lastDonationDate: '',
    availability: 'Available',

    latitude: null,
    longitude: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');


  /* =====================================================
     HANDLE INPUT
  ===================================================== */

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };


  /* =====================================================
     CAPTURE REAL DEVICE LOCATION
  ===================================================== */

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus(
        'Location is not supported by this browser.'
      );
      return;
    }

    setIsLocating(true);
    setLocationStatus(
      'Requesting your location permission...'
    );


    navigator.geolocation.getCurrentPosition(
      (position) => {

        const latitude =
          Number(position.coords.latitude);

        const longitude =
          Number(position.coords.longitude);


        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude
        }));


        setLocationStatus(
          'Location captured successfully.'
        );

        setIsLocating(false);


        showToast(
          'Your donor location has been captured.',
          'success'
        );
      },


      (error) => {

        console.error(
          'Geolocation error:',
          error
        );


        let message =
          'Unable to get your location.';


        if (error.code === 1) {
          message =
            'Location permission was denied. Please allow location access in your browser.';
        } else if (error.code === 2) {
          message =
            'Your location could not be determined. Please try again.';
        } else if (error.code === 3) {
          message =
            'Location request timed out. Please try again.';
        }


        setLocationStatus(message);
        setIsLocating(false);


        showToast(
          message,
          'error'
        );
      },


      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };


  /* =====================================================
     VALIDATION
  ===================================================== */

  const validate = () => {

    const newErrors = {};


    if (!formData.name.trim()) {
      newErrors.name =
        'Full name is required.';
    }


    const age =
      Number(formData.age);


    if (!formData.age) {
      newErrors.age =
        'Age is required.';
    } else if (
      !Number.isInteger(age) ||
      age < 18 ||
      age > 65
    ) {
      newErrors.age =
        'Please enter an age between 18 and 65.';
    }


    if (!formData.bloodGroup) {
      newErrors.bloodGroup =
        'Blood group is required.';
    }


    if (!formData.phone.trim()) {
      newErrors.phone =
        'Phone number is required.';
    } else if (
      formData.phone.replace(/\D/g, '').length < 10
    ) {
      newErrors.phone =
        'Please enter a valid 10-digit phone number.';
    }


    if (!formData.email.trim()) {
      newErrors.email =
        'Email address is required.';
    } else if (
      !/\S+@\S+\.\S+/.test(formData.email)
    ) {
      newErrors.email =
        'Please enter a valid email address.';
    }


    if (!formData.city.trim()) {
      newErrors.city =
        'City is required.';
    }


    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (event) => {

    event.preventDefault();


    if (!validate()) {
      return;
    }


    setIsSubmitting(true);


    try {

      const eligibility =
        checkEligibility({
          age: Number(formData.age),
          lastDonationDate:
            formData.lastDonationDate
        });


      const savedDonor =
        await donorService.register({

          name:
            formData.name.trim(),

          age:
            Number(formData.age),

          bloodGroup:
            formData.bloodGroup,

          phone:
            formData.phone.trim(),

          email:
            formData.email.trim(),

          city:
            formData.city.trim(),

          lastDonationDate:
            formData.lastDonationDate || null,

          availability:
            formData.availability,

          latitude:
            formData.latitude,

          longitude:
            formData.longitude,

          eligible:
            eligibility?.isEligible ?? true
        });


      if (!savedDonor?.id) {
        throw new Error(
          'Donor profile was not saved.'
        );
      }


      showToast(
        'Donor profile saved successfully.',
        'success'
      );


      /*
       * Navigate only AFTER Supabase confirms
       * that the profile was saved.
       */
      navigate('/dashboard');

    } catch (error) {

      console.error(
        'Donor registration error:',
        error
      );


      showToast(
        error?.message ||
          'Unable to save donor profile. Please try again.',
        'error'
      );

    } finally {

      setIsSubmitting(false);
    }
  };


  /* =====================================================
     ELIGIBILITY PREVIEW
  ===================================================== */

  const eligibility =
    formData.age
      ? checkEligibility({
          age: Number(formData.age),
          lastDonationDate:
            formData.lastDonationDate
        })
      : null;


  return (
    <div className="donor-register-page">

      <div className="container container-narrow">

        <div className="donor-register-card">

          {/* HEADER */}

          <div className="register-header">

            <div className="register-icon">
              <Heart
                size={28}
                fill="#dc2626"
                color="#dc2626"
              />
            </div>

            <h1>
              Register as a Blood Donor
            </h1>

            <p>
              Create your registered donor profile
              for emergency blood matching.
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            noValidate
          >

            {/* =================================================
                PERSONAL INFORMATION
            ================================================= */}

            <div className="form-section">

              <div className="section-heading">
                <User size={18} />
                <span>
                  Personal Information
                </span>
              </div>


              {/* NAME */}

              <div className="form-group">

                <label className="form-label">
                  Full Name
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
                      errors.name
                        ? 'error'
                        : ''
                    }`}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) =>
                      handleChange(
                        'name',
                        e.target.value
                      )
                    }
                  />

                </div>

                {errors.name && (
                  <div className="form-error-msg">
                    {errors.name}
                  </div>
                )}

              </div>


              {/* AGE + BLOOD GROUP */}

              <div className="form-grid">

                <div className="form-group">

                  <label className="form-label">
                    Age
                    <span className="req">*</span>
                  </label>

                  <input
                    type="number"
                    min="18"
                    max="65"
                    className={`form-input ${
                      errors.age
                        ? 'error'
                        : ''
                    }`}
                    placeholder="e.g. 24"
                    value={formData.age}
                    onChange={(e) =>
                      handleChange(
                        'age',
                        e.target.value
                      )
                    }
                  />

                  {errors.age && (
                    <div className="form-error-msg">
                      {errors.age}
                    </div>
                  )}

                </div>


                <div className="form-group">

                  <label className="form-label">
                    Blood Group
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

                    {BLOOD_GROUPS.map(
                      (group) => (
                        <option
                          key={group}
                          value={group}
                        >
                          {group}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>


              {/* PHONE + EMAIL */}

              <div className="form-grid">

                <div className="form-group">

                  <label className="form-label">
                    Phone Number
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
                        errors.phone
                          ? 'error'
                          : ''
                      }`}
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) =>
                        handleChange(
                          'phone',
                          e.target.value
                        )
                      }
                    />

                  </div>

                  {errors.phone && (
                    <div className="form-error-msg">
                      {errors.phone}
                    </div>
                  )}

                </div>


                <div className="form-group">

                  <label className="form-label">
                    Email Address
                    <span className="req">*</span>
                  </label>

                  <div className="input-with-icon">

                    <Mail
                      className="input-icon"
                      size={18}
                    />

                    <input
                      type="email"
                      className={`form-input icon-padded ${
                        errors.email
                          ? 'error'
                          : ''
                      }`}
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleChange(
                          'email',
                          e.target.value
                        )
                      }
                    />

                  </div>

                  {errors.email && (
                    <div className="form-error-msg">
                      {errors.email}
                    </div>
                  )}

                </div>

              </div>

            </div>


            {/* =================================================
                LOCATION
            ================================================= */}

            <div className="form-section">

              <div className="section-heading">
                <MapPin size={18} />
                <span>
                  Donor Location
                </span>
              </div>


              <div className="form-group">

                <label className="form-label">
                  City
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


              <div className="location-box">

                <div className="location-info">

                  <Navigation
                    size={20}
                  />

                  <div>

                    <strong>
                      Add your current location
                    </strong>

                    <p>
                      Road distance and estimated
                      travel time can only be
                      calculated when location
                      coordinates are available.
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="btn btn-secondary location-btn"
                  onClick={
                    handleUseCurrentLocation
                  }
                  disabled={isLocating}
                >

                  <Navigation size={16} />

                  {isLocating
                    ? 'Getting Location...'
                    : 'Use Current Location'}

                </button>


                {locationStatus && (

                  <div
                    className={`location-status ${
                      formData.latitude != null
                        ? 'success'
                        : ''
                    }`}
                  >

                    {formData.latitude != null ? (
                      <CheckCircle2
                        size={15}
                      />
                    ) : null}

                    <span>
                      {locationStatus}
                    </span>

                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                DONATION HISTORY
            ================================================= */}

            <div className="form-section">

              <div className="section-heading">
                <Calendar size={18} />
                <span>
                  Donation History
                </span>
              </div>


              <div className="form-group">

                <label className="form-label">
                  Last Donation Date
                </label>

                <input
                  type="date"
                  className="form-input"
                  value={
                    formData.lastDonationDate
                  }
                  onChange={(e) =>
                    handleChange(
                      'lastDonationDate',
                      e.target.value
                    )
                  }
                />

              </div>


              {eligibility && (

                <div
                  className={`eligibility-box ${
                    eligibility.isEligible
                      ? 'eligible'
                      : 'warning'
                  }`}
                >

                  <ShieldCheck
                    size={20}
                  />

                  <div>

                    <strong>
                      {eligibility.isEligible
                        ? 'Prototype rule: eligible'
                        : 'Prototype rule: interval warning'}
                    </strong>

                    <p>
                      {eligibility.message ||
                        'Donation history is considered by the matching engine.'}
                    </p>

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                AVAILABILITY
            ================================================= */}

            <div className="form-section">

              <div className="section-heading">
                <CheckCircle2 size={18} />
                <span>
                  Emergency Availability
                </span>
              </div>


              <div className="availability-options">

                <button
                  type="button"
                  className={`availability-option ${
                    formData.availability ===
                    'Available'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleChange(
                      'availability',
                      'Available'
                    )
                  }
                >

                  <span className="availability-dot"></span>

                  <div>
                    <strong>
                      Available
                    </strong>

                    <small>
                      I can respond to emergency
                      requests.
                    </small>
                  </div>

                </button>


                <button
                  type="button"
                  className={`availability-option ${
                    formData.availability ===
                    'Unavailable'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleChange(
                      'availability',
                      'Unavailable'
                    )
                  }
                >

                  <span className="availability-dot unavailable"></span>

                  <div>
                    <strong>
                      Unavailable
                    </strong>

                    <small>
                      Do not prioritize me right now.
                    </small>
                  </div>

                </button>

              </div>

            </div>


            {/* =================================================
                DISCLAIMER
            ================================================= */}

            <div className="register-disclaimer">

              <ShieldCheck size={18} />

              <p>
                This profile records donor information
                for the BloodBridge matching prototype.
                Blood-group compatibility and donation
                eligibility must be confirmed by qualified
                blood-bank or medical staff before
                transfusion.
              </p>

            </div>


            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              className="btn btn-primary register-submit"
              disabled={isSubmitting}
            >

              {isSubmitting ? (
                'Saving Donor Profile...'
              ) : (
                <>
                  <Heart
                    size={18}
                    fill="currentColor"
                  />
                  Register Donor Profile
                </>
              )}

            </button>

          </form>

        </div>

      </div>


      {/* =====================================================
          PAGE STYLES
      ===================================================== */}

      <style>{`

        .donor-register-page {
          min-height: 100vh;
          padding: 40px 20px 70px;
          background: #f8fafc;
        }

        .donor-register-card {
          max-width: 760px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 38px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07);
        }

        .register-header {
          text-align: center;
          margin-bottom: 38px;
        }

        .register-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
        }

        .register-header h1 {
          margin: 0 0 8px;
          font-size: 30px;
          color: #0f172a;
        }

        .register-header p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
        }

        .form-section {
          margin-bottom: 30px;
          padding-bottom: 26px;
          border-bottom: 1px solid #e2e8f0;
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          color: #334155;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .form-label {
          display: block;
          margin-bottom: 7px;
          color: #1e293b;
          font-size: 14px;
          font-weight: 600;
        }

        .req {
          color: #dc2626;
          margin-left: 3px;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .form-input,
        .form-select {
          width: 100%;
          min-height: 44px;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          padding: 10px 13px;
          color: #0f172a;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus,
        .form-select:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.10);
        }

        .icon-padded {
          padding-left: 42px;
        }

        .form-input.error {
          border-color: #ef4444;
        }

        .form-error-msg {
          margin-top: 5px;
          color: #dc2626;
          font-size: 12px;
        }

        .location-box {
          border: 1px solid #dbeafe;
          background: #f8fbff;
          border-radius: 14px;
          padding: 16px;
        }

        .location-info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          color: #2563eb;
        }

        .location-info strong {
          display: block;
          color: #1e3a8a;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .location-info p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .location-btn {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .location-status {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 10px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.4;
        }

        .location-status.success {
          color: #059669;
        }

        .eligibility-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px;
          border-radius: 11px;
          margin-top: 8px;
        }

        .eligibility-box.eligible {
          background: #ecfdf5;
          color: #047857;
        }

        .eligibility-box.warning {
          background: #fffbeb;
          color: #b45309;
        }

        .eligibility-box strong {
          display: block;
          font-size: 13px;
          margin-bottom: 3px;
        }

        .eligibility-box p {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
        }

        .availability-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .availability-option {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          text-align: left;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
        }

        .availability-option.active {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .availability-dot {
          width: 10px;
          height: 10px;
          margin-top: 4px;
          border-radius: 50%;
          background: #10b981;
          flex-shrink: 0;
        }

        .availability-dot.unavailable {
          background: #94a3b8;
        }

        .availability-option strong {
          display: block;
          color: #1e293b;
          font-size: 13px;
          margin-bottom: 3px;
        }

        .availability-option small {
          display: block;
          color: #64748b;
          font-size: 11px;
          line-height: 1.4;
        }

        .register-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          margin-bottom: 22px;
        }

        .register-disclaimer svg {
          flex-shrink: 0;
          color: #64748b;
          margin-top: 1px;
        }

        .register-disclaimer p {
          margin: 0;
          font-size: 12px;
          line-height: 1.55;
        }

        .register-submit {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        @media (max-width: 650px) {

          .donor-register-page {
            padding: 20px 12px 50px;
          }

          .donor-register-card {
            padding: 24px 18px;
            border-radius: 16px;
          }

          .register-header h1 {
            font-size: 24px;
          }

          .form-grid,
          .availability-options {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </div>
  );
}