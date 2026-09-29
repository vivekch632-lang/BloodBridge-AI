/**
 * LocalStorage Persistence Layer for BloodBridge AI
 */
import { INITIAL_DONORS, INITIAL_REQUESTS, INITIAL_USER } from '../data/mockData';

const KEYS = {
  DONORS: 'bloodbridge_donors',
  REQUESTS: 'bloodbridge_requests',
  USER: 'bloodbridge_active_user',
  NOTIFICATIONS: 'bloodbridge_notifications'
};

export const Storage = {
  init() {
    if (!localStorage.getItem(KEYS.DONORS)) {
      localStorage.setItem(KEYS.DONORS, JSON.stringify(INITIAL_DONORS));
    }
    if (!localStorage.getItem(KEYS.REQUESTS)) {
      localStorage.setItem(KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    }
    if (!localStorage.getItem(KEYS.USER)) {
      localStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
    }
  },

  getDonors() {
    this.init();
    try {
      const data = localStorage.getItem(KEYS.DONORS);
      return data ? JSON.parse(data) : INITIAL_DONORS;
    } catch {
      return INITIAL_DONORS;
    }
  },

  saveDonors(donors) {
    localStorage.setItem(KEYS.DONORS, JSON.stringify(donors));
  },

  addDonor(donor) {
    const donors = this.getDonors();
    const newDonor = {
      id: `donor-${Date.now()}`,
      distance: 3.2,
      donationCount: 0,
      verified: true,
      rating: 5.0,
      eligible: true,
      ...donor
    };
    donors.unshift(newDonor);
    this.saveDonors(donors);
    return newDonor;
  },

  getRequests() {
    this.init();
    try {
      const data = localStorage.getItem(KEYS.REQUESTS);
      return data ? JSON.parse(data) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  },

  saveRequests(requests) {
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
  },

  addRequest(req) {
    const requests = this.getRequests();
    const newReq = {
      id: `req-${Date.now()}`,
      status: 'Active',
      createdAt: new Date().toISOString(),
      matchedDonorsCount: 0,
      ...req
    };
    requests.unshift(newReq);
    this.saveRequests(requests);
    return newReq;
  },

  getUser() {
    this.init();
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  },

  saveUser(user) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  resetDefaults() {
    localStorage.setItem(KEYS.DONORS, JSON.stringify(INITIAL_DONORS));
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    localStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
  }
};
