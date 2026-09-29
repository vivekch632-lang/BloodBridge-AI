/**
 * BloodBridge AI
 * Road Routing Service
 *
 * Uses OSRM (Open Source Routing Machine)
 * for real road distance and travel-time calculation.
 *
 * IMPORTANT:
 * OSRM coordinates must be:
 * longitude,latitude
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Check whether a value is a valid number.
 */
function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validate latitude and longitude.
 */
function hasValidCoordinates(latitude, longitude) {
  return (
    isValidNumber(latitude) &&
    isValidNumber(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Convert meters to kilometres.
 */
function metersToKm(meters) {
  if (!isValidNumber(meters)) {
    return null;
  }

  return Number((meters / 1000).toFixed(2));
}

/**
 * Convert seconds to minutes.
 */
function secondsToMinutes(seconds) {
  if (!isValidNumber(seconds)) {
    return null;
  }

  return Number((seconds / 60).toFixed(1));
}

/**
 * Get a real road route between two coordinates.
 */
export async function getRoadRoute(origin, destination) {
  const originLat = Number(origin?.latitude);
  const originLon = Number(origin?.longitude);

  const destinationLat = Number(destination?.latitude);
  const destinationLon = Number(destination?.longitude);

  console.log('🚗 BloodBridge routing request:', {
    origin: {
      latitude: originLat,
      longitude: originLon
    },
    destination: {
      latitude: destinationLat,
      longitude: destinationLon
    }
  });

  /**
   * Validate coordinates before contacting OSRM.
   */
  if (
    !hasValidCoordinates(originLat, originLon) ||
    !hasValidCoordinates(destinationLat, destinationLon)
  ) {
    console.error('❌ Invalid routing coordinates');

    return {
      distanceKm: null,
      durationMinutes: null,
      durationSeconds: null,
      source: 'invalid-coordinates',
      error: 'Invalid latitude or longitude'
    };
  }

  /**
   * OSRM requires:
   * longitude,latitude
   */
  const coordinates =
    `${originLon},${originLat};` +
    `${destinationLon},${destinationLat}`;

  const url =
    `${OSRM_BASE_URL}/route/v1/driving/${coordinates}` +
    '?overview=false&steps=false';

  console.log('🌍 OSRM URL:', url);

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 OSRM HTTP status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        '❌ OSRM HTTP error:',
        response.status,
        errorText
      );

      return {
        distanceKm: null,
        durationMinutes: null,
        durationSeconds: null,
        source: 'OSRM-error',
        error: `OSRM HTTP ${response.status}`
      };
    }

    const data = await response.json();

    console.log('📦 OSRM response:', data);

    if (
      data?.code !== 'Ok' ||
      !Array.isArray(data.routes) ||
      data.routes.length === 0
    ) {
      console.error(
        '❌ OSRM did not return a route:',
        data
      );

      return {
        distanceKm: null,
        durationMinutes: null,
        durationSeconds: null,
        source: 'OSRM-no-route',
        error:
          data?.message ||
          'No driving route found'
      };
    }

    const route = data.routes[0];

    const distanceKm = metersToKm(route.distance);
    const durationMinutes =
      secondsToMinutes(route.duration);

    console.log('✅ REAL ROAD ROUTE:', {
      distanceKm,
      durationMinutes,
      durationSeconds: route.duration
    });

    return {
      distanceKm,
      durationMinutes,
      durationSeconds: isValidNumber(route.duration)
        ? route.duration
        : null,
      source: 'OSRM',
      error: null
    };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error?.name === 'AbortError') {
      console.error(
        '❌ OSRM request timed out.'
      );

      return {
        distanceKm: null,
        durationMinutes: null,
        durationSeconds: null,
        source: 'OSRM-timeout',
        error: 'Routing request timed out'
      };
    }

    console.error(
      '❌ OSRM network error:',
      error
    );

    return {
      distanceKm: null,
      durationMinutes: null,
      durationSeconds: null,
      source: 'OSRM-network-error',
      error:
        error?.message ||
        'Routing network error'
    };
  }
}

/**
 * Get road routes from one origin to multiple donors.
 */
export async function getRoutesToDonors(
  origin,
  destinations
) {
  if (
    !origin ||
    !Array.isArray(destinations) ||
    destinations.length === 0
  ) {
    return [];
  }

  const originLat = Number(origin.latitude);
  const originLon = Number(origin.longitude);

  if (
    !hasValidCoordinates(
      originLat,
      originLon
    )
  ) {
    console.error(
      '❌ Invalid origin coordinates for donor routing:',
      origin
    );

    return [];
  }

  const validDestinations =
    destinations.filter((donor) =>
      hasValidCoordinates(
        Number(donor?.latitude),
        Number(donor?.longitude)
      )
    );

  console.log(
    `🚑 Routing ${validDestinations.length} donor(s)`
  );

  const results = [];

  /**
   * Small batches to avoid excessive requests
   * to the public OSRM demo server.
   */
  const batchSize = 3;

  for (
    let index = 0;
    index < validDestinations.length;
    index += batchSize
  ) {
    const batch =
      validDestinations.slice(
        index,
        index + batchSize
      );

    const batchResults =
      await Promise.all(
        batch.map(async (donor) => {
          const route =
            await getRoadRoute(
              {
                latitude: originLat,
                longitude: originLon
              },
              {
                latitude: Number(
                  donor.latitude
                ),
                longitude: Number(
                  donor.longitude
                )
              }
            );

          return {
            id: donor.id,
            donorId: donor.id,
            ...route
          };
        })
      );

    results.push(...batchResults);

    if (
      index + batchSize <
      validDestinations.length
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );
    }
  }

  console.log(
    '🗺️ Final donor routing results:',
    results
  );

  return results;
}

/**
 * Format road distance for UI.
 */
export function formatRoadDistance(
  distanceKm
) {
  if (
    !isValidNumber(distanceKm)
  ) {
    return 'Distance unavailable';
  }

  if (distanceKm < 1) {
    return `${Math.round(
      distanceKm * 1000
    )} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Format ETA for UI.
 */
export function formatRoadDuration(
  durationMinutes
) {
  if (
    !isValidNumber(durationMinutes)
  ) {
    return 'ETA unavailable';
  }

  if (durationMinutes < 1) {
    return '< 1 min';
  }

  if (durationMinutes < 60) {
    return `${Math.round(
      durationMinutes
    )} min`;
  }

  const hours = Math.floor(
    durationMinutes / 60
  );

  const minutes = Math.round(
    durationMinutes % 60
  );

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export default {
  getRoadRoute,
  getRoutesToDonors,
  formatRoadDistance,
  formatRoadDuration
};