
import { Clinic, Patient, LedgerEventType } from './types';

export const INITIAL_CREDITS = 30;
export const VIEW_COST = 10;

export const SEED_CLINICS: Clinic[] = [
  { id: 'c1', name: 'Harbour Physio', username: 'harbour', password: 'Heidi123!', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
  { id: 'c2', name: 'Peak Performance', username: 'peak', password: 'Heidi123!', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
  { id: 'c3', name: 'City Sports Rehab', username: 'city', password: 'Heidi123!', optedIn: false, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
  { id: 'c4', name: 'Northside Physio', username: 'north', password: 'Heidi123!', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
  { id: 'c5', name: 'Bayside Movement', username: 'bayside', password: 'Heidi123!', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
];

export const SEED_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Sam Lee', homeClinicId: 'c1', consent: true },
  { id: 'p2', name: 'Maya Patel', homeClinicId: 'c1', consent: true },
  { id: 'p3', name: 'Jordan Kim', homeClinicId: 'c2', consent: true },
  { id: 'p4', name: 'Ava Chen', homeClinicId: 'c2', consent: true },
  { id: 'p5', name: 'Noah Singh', homeClinicId: 'c3', consent: false }, // No Consent
  { id: 'p6', name: 'Priya Rao', homeClinicId: 'c3', consent: true },
  { id: 'p7', name: 'Ethan Park', homeClinicId: 'c4', consent: true },
  { id: 'p8', name: 'Sofia Gomez', homeClinicId: 'c4', consent: false }, // No Consent
  { id: 'p9', name: 'Liam Walker', homeClinicId: 'c5', consent: true },
  { id: 'p10', name: 'Zara Ali', homeClinicId: 'c5', consent: true },
];
