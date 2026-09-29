import { supabase } from '../lib/supabaseClient';
import { authService } from './authService';
import { getRoutesToDonors } from './routeService';

// ============================================================
// BLOOD COMPATIBILITY
// Donor -> Recipient red-cell compatibility
// ============================================================

const COMPATIBLE_DONORS = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],

  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],

  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],

  'AB-': ['O-', 'A-', 'B-', 'AB-'],

  'AB+': [
    'O-',
    'O+',
    'A-',
    'A+',
    'B-',
    'B+',
    'AB-',
    'AB+'
  ]
};

// ============================================================
// CHECK BLOOD COMPATIBILITY
// ============================================================

function isCompatible(donorBloodGroup, recipientBloodGroup) {
  if (!donorBloodGroup || !recipientBloodGroup) {
    return false;
  }

  const donorGroups =
    COMPATIBLE_DONORS[recipientBloodGroup];

  if (!donorGroups) {
    return false;
  }

  return donorGroups.includes(donorBloodGroup);
}

// ============================================================
// HELPERS
// ============================================================

function validCoordinate(value) {
  return (
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value))
  );
}

// ============================================================
// MAP DATABASE DONOR TO FRONTEND DONOR
// ============================================================

function mapDonor(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,

    name: row.full_name || '',
    fullName: row.full_name || '',

    email: row.email || '',
    phone: row.phone || '',

    bloodGroup: row.blood_group || '',

    age:
      row.age !== null && row.age !== undefined
        ? Number(row.age)
        : null,

    gender: row.gender || '',

    city: row.city || '',

    latitude:
      validCoordinate(row.latitude)
        ? Number(row.latitude)
        : null,

    longitude:
      validCoordinate(row.longitude)
        ? Number(row.longitude)
        : null,

    lastDonationDate:
      row.last_donation_date || null,

    available:
      row.available === true,

    createdAt:
      row.created_at || null,

    registered: true,
    verified: false,

    distanceKm: null,
    distanceScore: 0,
    travelTimeMinutes: null,
    routeSource: null,

    compatibility: null,
    matchScore: 0,

    isEligible: true,

    eligibility: {
      eligible: true
    },

    rationale: ''
  };
}

// ============================================================
// SERVICE
// ============================================================

export const donorService = {

  // ==========================================================
  // GET ALL DONORS
  // ==========================================================

  async getAll() {
    const {
      data,
      error
    } = await supabase
      .from('donors')
      .select('*')
      .order('created_at', {
        ascending: false
      });

    if (error) {
      console.error(
        'getAll donors error:',
        error
      );

      throw error;
    }

    return (data || []).map(mapDonor);
  },

  // ==========================================================
  // CURRENT USER DONOR PROFILE
  // ==========================================================

  async getCurrentUserProfile() {
    const user =
      await authService.getCurrentUser();

    if (!user?.id) {
      return null;
    }

    const {
      data,
      error
    } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return mapDonor(data);
  },

  // ==========================================================
  // GET DONOR BY ID
  // ==========================================================

  async getById(id) {
    if (!id) return null;

    const {
      data,
      error
    } = await supabase
      .from('donors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return mapDonor(data);
  },

  // ==========================================================
  // REGISTER / UPDATE DONOR
  // ==========================================================

  async register(formData) {
    const user =
      await authService.getCurrentUser();

    if (!user?.id) {
      throw new Error(
        'You must be logged in to register as a donor.'
      );
    }

    const latitude =
      validCoordinate(formData.latitude)
        ? Number(formData.latitude)
        : null;

    const longitude =
      validCoordinate(formData.longitude)
        ? Number(formData.longitude)
        : null;

    const donorRow = {
      user_id: user.id,

      full_name:
        formData.fullName?.trim() ||
        formData.name?.trim() ||
        user.name ||
        null,

      email:
        formData.email?.trim() ||
        user.email ||
        null,

      phone:
        formData.phone?.trim() ||
        user.phone ||
        null,

      blood_group:
        formData.bloodGroup || null,

      age:
        formData.age !== '' &&
        formData.age !== null &&
        formData.age !== undefined
          ? Number(formData.age)
          : null,

      gender:
        formData.gender || null,

      city:
        formData.city?.trim() || null,

      latitude,
      longitude,

      last_donation_date:
        formData.lastDonationDate ||
        formData.lastDonation ||
        null,

      available:
        formData.available !== false
    };

    console.log(
      'Saving donor profile to Supabase:',
      donorRow
    );

    // ========================================================
    // CHECK WHETHER THIS USER ALREADY HAS A DONOR PROFILE
    // ========================================================

    const {
      data: existingDonor,
      error: existingError
    } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    // ========================================================
    // UPDATE EXISTING PROFILE
    // ========================================================

    if (existingDonor) {
      const {
        data,
        error
      } = await supabase
        .from('donors')
        .update(donorRow)
        .eq('id', existingDonor.id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      console.log(
        'Donor profile updated successfully:',
        data
      );

      return mapDonor(data);
    }

    // ========================================================
    // CREATE NEW PROFILE
    // ========================================================

    const {
      data,
      error
    } = await supabase
      .from('donors')
      .insert(donorRow)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    console.log(
      'Donor profile created successfully:',
      data
    );

    return mapDonor(data);
  },

  // ==========================================================
  // UPDATE AVAILABILITY
  // ==========================================================

  async updateAvailability(
    donorId,
    available
  ) {
    const {
      data,
      error
    } = await supabase
      .from('donors')
      .update({
        available: Boolean(available)
      })
      .eq('id', donorId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapDonor(data);
  },

  // ==========================================================
  // GET REQUEST LOCATION
  // ==========================================================

  async getRequestLocation(requestId) {
    if (!requestId) {
      return null;
    }

    const {
      data,
      error
    } = await supabase
      .from('blood_requests')
      .select(
        'id,blood_group,city,latitude,longitude,status,urgency'
      )
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,

      bloodGroup:
        data.blood_group,

      city:
        data.city || '',

      latitude:
        validCoordinate(data.latitude)
          ? Number(data.latitude)
          : null,

      longitude:
        validCoordinate(data.longitude)
          ? Number(data.longitude)
          : null,

      status:
        data.status || 'Active',

      urgency:
        data.urgency || 'normal'
    };
  },

  // ==========================================================
  // FIND MATCHES
  // ==========================================================

  async findMatches({
    bloodGroup,
    city = '',
    maxDistance = 50,
    onlyAvailable = false,
    requestId = null
  }) {

    console.log(
      '========== MATCHING START =========='
    );

    console.log(
      'Matching input:',
      {
        bloodGroup,
        city,
        maxDistance,
        onlyAvailable,
        requestId
      }
    );

    // --------------------------------------------------------
    // GET REQUEST LOCATION
    // --------------------------------------------------------

    let requestInfo = null;

    if (requestId) {
      requestInfo =
        await this.getRequestLocation(
          requestId
        );

      console.log(
        'Request information:',
        requestInfo
      );
    }

    // --------------------------------------------------------
    // IMPORTANT FIX:
    //
    // The blood group selected in the Donor Matching page
    // is the authoritative blood group for this matching
    // operation.
    //
    // DO NOT allow the saved request blood group to override
    // the dropdown selection.
    //
    // Example:
    //
    // Saved request = O+
    // Dropdown       = B-
    //
    // Matching MUST use B-
    // --------------------------------------------------------

    const recipientBloodGroup =
      bloodGroup ||
      requestInfo?.bloodGroup ||
      '';

    if (!recipientBloodGroup) {
      throw new Error(
        'Patient blood group is required before donor matching.'
      );
    }

    // --------------------------------------------------------
    // USE REQUEST CITY IF PAGE CITY IS EMPTY
    // --------------------------------------------------------

    const requestedCity =
      city?.trim() ||
      requestInfo?.city?.trim() ||
      '';

    // --------------------------------------------------------
    // REQUEST COORDINATES
    // --------------------------------------------------------

    const originLatitude =
      validCoordinate(
        requestInfo?.latitude
      )
        ? Number(requestInfo.latitude)
        : null;

    const originLongitude =
      validCoordinate(
        requestInfo?.longitude
      )
        ? Number(requestInfo.longitude)
        : null;

    console.log(
      'Matching recipient:',
      recipientBloodGroup
    );

    console.log(
      'Matching city:',
      requestedCity
    );

    console.log(
      'Request coordinates:',
      {
        latitude: originLatitude,
        longitude: originLongitude
      }
    );

    // --------------------------------------------------------
    // STEP 1: GET ALL REAL DONORS
    // --------------------------------------------------------

    const {
      data,
      error
    } = await supabase
      .from('donors')
      .select('*');

    if (error) {
      console.error(
        'SUPABASE DONOR QUERY ERROR:',
        error
      );

      throw error;
    }

    console.log(
      'RAW DONORS FROM SUPABASE:',
      data
    );

    let donors =
      (data || []).map(mapDonor);

    console.log(
      'MAPPED DONORS:',
      donors
    );

    // --------------------------------------------------------
    // STEP 2: AVAILABILITY
    // --------------------------------------------------------

    if (onlyAvailable) {
      donors =
        donors.filter(
          donor =>
            donor.available === true
        );

      console.log(
        'After available filter:',
        donors
      );
    }

    // --------------------------------------------------------
    // STEP 3: CITY
    // --------------------------------------------------------

    if (requestedCity) {
      const wantedCity =
        requestedCity.toLowerCase();

      donors =
        donors.filter(
          donor =>
            donor.city
              ?.trim()
              .toLowerCase() ===
            wantedCity
        );

      console.log(
        'After city filter:',
        donors
      );
    }

    // --------------------------------------------------------
    // STEP 4: BLOOD COMPATIBILITY
    // --------------------------------------------------------

    donors =
      donors.filter(
        donor => {

          const compatible =
            isCompatible(
              donor.bloodGroup,
              recipientBloodGroup
            );

          console.log(
            'Compatibility check:',
            donor.name,
            donor.bloodGroup,
            '->',
            recipientBloodGroup,
            compatible
          );

          return compatible;
        }
      );

    console.log(
      'AFTER BLOOD COMPATIBILITY:',
      donors
    );

    // --------------------------------------------------------
    // FINAL SAFETY CHECK
    //
    // Never allow an incompatible donor to continue into
    // routing, scoring, or AI ranking.
    //
    // This is intentionally repeated as a second hard filter.
    // --------------------------------------------------------

    donors =
      donors.filter(
        donor =>
          isCompatible(
            donor.bloodGroup,
            recipientBloodGroup
          )
      );

    console.log(
      'AFTER FINAL COMPATIBILITY SAFETY CHECK:',
      donors
    );

    // --------------------------------------------------------
    // IMPORTANT:
    //
    // If we have a compatible donor, DO NOT remove them
    // just because routing fails.
    //
    // Routing is additional information.
    // --------------------------------------------------------

    // --------------------------------------------------------
    // STEP 5: REAL ROAD ROUTING
    // --------------------------------------------------------

    const canRoute =
      validCoordinate(originLatitude) &&
      validCoordinate(originLongitude);

    if (
      canRoute &&
      donors.length > 0
    ) {

      const destinations =
        donors
          .filter(
            donor =>
              validCoordinate(
                donor.latitude
              ) &&
              validCoordinate(
                donor.longitude
              )
          )
          .map(
            donor => ({
              id: donor.id,

              latitude:
                donor.latitude,

              longitude:
                donor.longitude
            })
          );

      console.log(
        'Donors sent to road router:',
        destinations
      );

      if (destinations.length > 0) {

        try {

          const routes =
            await getRoutesToDonors(
              {
                latitude:
                  originLatitude,

                longitude:
                  originLongitude
              },

              destinations
            );

          console.log(
            'REAL ROAD ROUTES:',
            routes
          );

          const routeMap =
            new Map(
              routes.map(
                route => [
                  route.id,
                  route
                ]
              )
            );

          donors =
            donors.map(
              donor => {

                const route =
                  routeMap.get(
                    donor.id
                  );

                if (!route) {
                  return donor;
                }

                return {
                  ...donor,

                  distanceKm:
                    Number(
                      route.distanceKm
                    ),

                  travelTimeMinutes:
                    Number(
                      route.durationMinutes
                    ),

                  routeSource:
                    route.source
                };
              }
            );

        } catch (routeError) {

          console.warn(
            'Road routing failed. Donors will still be shown:',
            routeError
          );
        }
      }
    }

    // --------------------------------------------------------
    // STEP 6: CALCULATE MATCH SCORE
    // --------------------------------------------------------

    donors =
      donors.map(
        donor => {

          // Every donor reaching this stage is compatible.
          let score = 40;

          // --------------------------------------------------
          // Availability
          // --------------------------------------------------

          if (donor.available) {
            score += 20;
          }

          // --------------------------------------------------
          // Distance
          // --------------------------------------------------

          let distanceScore = 0;

          if (
            donor.distanceKm !== null
          ) {

            if (
              donor.distanceKm <= 5
            ) {
              distanceScore = 20;

            } else if (
              donor.distanceKm <= 15
            ) {
              distanceScore = 15;

            } else if (
              donor.distanceKm <= 25
            ) {
              distanceScore = 10;

            } else if (
              donor.distanceKm <= 50
            ) {
              distanceScore = 5;
            }

            score += distanceScore;
          }

          // --------------------------------------------------
          // Donation history
          // --------------------------------------------------

          score += 10;

          return {
            ...donor,

            compatibility:
              'compatible',

            matchScore:
              Math.min(
                score,
                100
              ),

            distanceScore,

            isEligible: true,

            eligibility: {
              eligible: true
            },

            rationale:
              `Compatible under the configured ABO/Rh red-cell compatibility rules. ${
                donor.available
                  ? 'The donor is currently marked available.'
                  : 'The donor is currently marked unavailable.'
              } Final compatibility and transfusion decisions must be confirmed by qualified blood-bank staff.`
          };
        }
      );

    // --------------------------------------------------------
    // STEP 7: DISTANCE FILTER
    // --------------------------------------------------------
    //
    // Only remove donors when we have a REAL road distance
    // and it exceeds the selected radius.
    //
    // Unknown distance stays visible.
    // --------------------------------------------------------

    donors =
      donors.filter(
        donor => {

          if (
            donor.distanceKm === null ||
            donor.distanceKm === undefined
          ) {
            return true;
          }

          return (
            donor.distanceKm <=
            Number(maxDistance)
          );
        }
      );

    // --------------------------------------------------------
    // STEP 8: SORT
    // --------------------------------------------------------

    donors.sort(
      (a, b) => {

        if (
          b.matchScore !==
          a.matchScore
        ) {
          return (
            b.matchScore -
            a.matchScore
          );
        }

        if (
          a.distanceKm !== null &&
          b.distanceKm !== null
        ) {
          return (
            a.distanceKm -
            b.distanceKm
          );
        }

        return 0;
      }
    );

    console.log(
      'FINAL DONOR MATCHES:',
      donors
    );

    console.log(
      '========== MATCHING END =========='
    );

    return donors;
  }
};