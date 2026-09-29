/**
 * BloodBridge AI
 * Blood Group Compatibility & Donor Matching Engine
 *
 * Important:
 * - This is a software matching aid, not a medical clearance system.
 * - ABO/Rh red-cell compatibility rules are used for preliminary matching.
 * - Final transfusion compatibility must be confirmed by qualified
 *   blood-bank / medical staff.
 */

export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-'
];

/*
 * Donor blood group -> recipient blood groups
 * for preliminary red-cell compatibility matching.
 */
export const DONOR_CAN_DONATE_TO = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

/*
 * Recipient blood group -> compatible donor blood groups.
 */
export const RECIPIENT_CAN_RECEIVE_FROM = {
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'A-': ['O-', 'A-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'B-': ['O-', 'B-'],
  'O+': ['O-', 'O+'],
  'O-': ['O-']
};

/**
 * Returns the compatibility status between donor and recipient blood groups.
 *
 * @returns {'EXACT'|'COMPATIBLE'|'INCOMPATIBLE'}
 */
export function getCompatibilityStatus(donorBlood, recipientBlood) {
  if (!donorBlood || !recipientBlood) {
    return 'INCOMPATIBLE';
  }

  if (donorBlood === recipientBlood) {
    return 'EXACT';
  }

  const compatibleRecipients =
    DONOR_CAN_DONATE_TO[donorBlood] || [];

  return compatibleRecipients.includes(recipientBlood)
    ? 'COMPATIBLE'
    : 'INCOMPATIBLE';
}

/**
 * Prototype donation-interval check.
 *
 * This is NOT medical clearance.
 * It is only a configurable software rule used for donor prioritization.
 */
export function checkEligibility(lastDonationDate) {
  if (!lastDonationDate) {
    return {
      isEligible: true,
      daysSince: null,
      daysRemaining: 0
    };
  }

  const last = new Date(lastDonationDate);

  if (Number.isNaN(last.getTime())) {
    return {
      isEligible: true,
      daysSince: null,
      daysRemaining: 0
    };
  }

  const now = new Date();

  // Ignore time-of-day differences.
  last.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - last.getTime();
  const daysSince = Math.floor(
    diffTime / (1000 * 60 * 60 * 24)
  );

  // If a future date was entered, treat it as not eligible.
  if (daysSince < 0) {
    return {
      isEligible: false,
      daysSince: 0,
      daysRemaining: 90
    };
  }

  const minimumIntervalDays = 90;
  const isEligible = daysSince >= minimumIntervalDays;

  return {
    isEligible,
    daysSince,
    daysRemaining: isEligible
      ? 0
      : minimumIntervalDays - daysSince
  };
}

/**
 * Formats a distance value for display.
 */
export function formatDistance(distanceKm) {
  if (
    typeof distanceKm !== 'number' ||
    !Number.isFinite(distanceKm)
  ) {
    return 'Distance unavailable';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Formats a travel duration in minutes.
 */
export function formatDuration(durationMinutes) {
  if (
    typeof durationMinutes !== 'number' ||
    !Number.isFinite(durationMinutes)
  ) {
    return 'ETA unavailable';
  }

  if (durationMinutes < 1) {
    return '< 1 min';
  }

  if (durationMinutes < 60) {
    return `${Math.round(durationMinutes)} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = Math.round(durationMinutes % 60);

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

/**
 * Calculates proximity points.
 *
 * IMPORTANT:
 * No fake/default distance is ever used.
 *
 * @param {number|null} distanceKm
 * @returns {number}
 */
export function calculateProximityScore(distanceKm) {
  if (
    typeof distanceKm !== 'number' ||
    !Number.isFinite(distanceKm) ||
    distanceKm < 0
  ) {
    return 0;
  }

  if (distanceKm <= 3) {
    return 30;
  }

  if (distanceKm <= 8) {
    return 24;
  }

  if (distanceKm <= 15) {
    return 18;
  }

  if (distanceKm <= 30) {
    return 10;
  }

  return 5;
}

/**
 * Calculates the donor match score.
 *
 * Maximum:
 * - Compatibility: 40
 * - Proximity: 30
 * - Availability: 20
 * - Donation-history rule: 10
 *
 * If road distance is unavailable, no proximity points are fabricated.
 */
export function calculateAIMatchScore(donor, request) {
  let score = 0;
  const rationaleItems = [];

  const recipientBlood = request?.bloodGroup;

  const compatibility = getCompatibilityStatus(
    donor?.bloodGroup,
    recipientBlood
  );

  /*
   * ---------------------------------------------------------
   * 1. BLOOD COMPATIBILITY — MAX 40
   * ---------------------------------------------------------
   */

  if (compatibility === 'INCOMPATIBLE') {
    rationaleItems.push(
      `Incompatible blood group (${donor?.bloodGroup || 'unknown'} is not configured as compatible with ${recipientBlood || 'unknown'} for preliminary red-cell matching).`
    );

    return {
      score: 0,
      compatibility,
      isEligible: false,
      rank: 'Incompatible',
      distance: null,
      distanceScore: 0,
      eligibility: checkEligibility(donor?.lastDonationDate),
      rationale: rationaleItems.join(' ')
    };
  }

  if (compatibility === 'EXACT') {
    score += 40;

    rationaleItems.push(
      `Exact blood-group match (${donor.bloodGroup} → ${recipientBlood}).`
    );
  } else {
    score += 30;

    rationaleItems.push(
      `Compatible under the configured ABO/Rh red-cell compatibility rules (${donor.bloodGroup} → ${recipientBlood}).`
    );
  }

  rationaleItems.push(
    'Final compatibility and transfusion decisions must be confirmed by qualified blood-bank staff.'
  );

  /*
   * ---------------------------------------------------------
   * 2. ROAD PROXIMITY — MAX 30
   * ---------------------------------------------------------
   */

  const distance =
    typeof donor?.distance === 'number' &&
    Number.isFinite(donor.distance)
      ? donor.distance
      : null;

  const distanceScore = calculateProximityScore(distance);

  score += distanceScore;

  if (distance !== null) {
    rationaleItems.push(
      `Road distance is ${formatDistance(distance)}.`
    );

    if (
      typeof donor?.travelTimeMinutes === 'number' &&
      Number.isFinite(donor.travelTimeMinutes)
    ) {
      rationaleItems.push(
        `Estimated driving time is approximately ${formatDuration(donor.travelTimeMinutes)}.`
      );
    }
  } else {
    rationaleItems.push(
      'Road distance and ETA are unavailable because location/routing data is not available.'
    );
  }

  /*
   * ---------------------------------------------------------
   * 3. AVAILABILITY — MAX 20
   * ---------------------------------------------------------
   */

  const availability =
    donor?.availability ||
    (donor?.available ? 'Available' : 'Unavailable');

  if (
    availability === 'Available' ||
    availability === 'Immediate'
  ) {
    score += 20;

    rationaleItems.push(
      'Donor is currently marked as available.'
    );
  } else if (availability === 'Within 24 Hours') {
    score += 10;

    rationaleItems.push(
      'Donor is marked as available within 24 hours.'
    );
  } else {
    rationaleItems.push(
      'Donor is currently marked as unavailable.'
    );
  }

  /*
   * ---------------------------------------------------------
   * 4. DONATION HISTORY — MAX 10
   * ---------------------------------------------------------
   */

  const eligibility = checkEligibility(
    donor?.lastDonationDate
  );

  if (eligibility.isEligible) {
    score += 10;

    if (eligibility.daysSince === null) {
      rationaleItems.push(
        'No previous donation date was provided, so the configured interval rule does not reduce the score.'
      );
    } else {
      rationaleItems.push(
        `The configured ${90}-day donation-interval rule is satisfied (${eligibility.daysSince} days since the recorded donation).`
      );
    }
  } else {
    /*
     * Do not claim medical clearance.
     * Reduce prioritization instead.
     */
    rationaleItems.push(
      `The configured donation-interval rule indicates ${eligibility.daysRemaining} more day(s) before this donor should be prioritized.`
    );
  }

  /*
   * ---------------------------------------------------------
   * RANK
   * ---------------------------------------------------------
   */

  let rank = 'Fair Match';

  if (score >= 85) {
    rank = 'Ideal Match';
  } else if (score >= 70) {
    rank = 'Strong Match';
  } else if (score >= 50) {
    rank = 'Moderate Match';
  }

  return {
    score,
    compatibility,
    isEligible: eligibility.isEligible,
    rank,
    distance,
    distanceScore,
    travelTimeMinutes:
      typeof donor?.travelTimeMinutes === 'number'
        ? donor.travelTimeMinutes
        : null,
    eligibility,
    rationale: rationaleItems.join(' ')
  };
}