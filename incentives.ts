import { INITIAL_CREDITS, VIEW_COST } from './constants';
import type { Clinic, ContinuityCapsule, Patient, Report } from './types';
import { isReportSharedToNetwork } from './sharing';

export type SharedReportPayload = {
  reportId: string;
  patientId: string;
  authorClinicId: string;
  tier: Report['tier'];
  capsule: ContinuityCapsule;
  reportType: string;
  visitDate?: string;
  fullTreatmentDetail?: string;
};

export type UnlockSettlement = {
  clinics: Clinic[];
  charged: boolean;
};

export function getReportCapsule(report: Report): ContinuityCapsule {
  if (report.capsule) {
    return report.capsule;
  }

  const fallback = report.summary?.trim() || report.notes.trim();

  return {
    status: fallback || 'Clinical status captured locally.',
    interventions: 'See continuity summary.',
    risks: 'No network-visible red flags recorded.',
    nextStep: 'Continue care using the capsule and request clarification if needed.',
  };
}

export function getReportTierLabel(report: Report): string {
  if (report.tier === 'Full') {
    return 'Full Detail';
  }

  if (report.tier === 'Private') {
    return 'Private';
  }

  return 'Continuity Capsule';
}

export function getSharedReportPayload(report: Report): SharedReportPayload {
  const payload: SharedReportPayload = {
    reportId: report.id,
    patientId: report.patientId,
    authorClinicId: report.authorClinicId,
    tier: report.tier,
    capsule: getReportCapsule(report),
    reportType: report.reportType?.trim() || 'Clinical Note',
  };

  if (report.visitDate) {
    payload.visitDate = report.visitDate;
  }

  if (report.tier === 'Full') {
    payload.fullTreatmentDetail = report.notes;
  }

  return payload;
}

export function getUnlockBlockReason(
  viewer: Clinic | undefined,
  report: Report,
  patientById: Record<string, Patient>,
  clinicById: Record<string, Clinic>,
): string | null {
  if (!viewer) {
    return 'Viewer Clinic Missing';
  }

  if (!viewer.optedIn) {
    return 'Opt in to unlock network history';
  }

  if (viewer.credits < VIEW_COST) {
    return `Need ${VIEW_COST} credits to unlock`;
  }

  if (report.authorClinicId === viewer.id) {
    return 'Own clinic report';
  }

  if (!isReportSharedToNetwork(report, patientById, clinicById)) {
    return 'Author opted out, patient consent missing, or report is private';
  }

  return null;
}

export function settleReportUnlock(
  clinics: readonly Clinic[],
  viewerClinicId: string,
  authorClinicId: string,
  alreadyUnlocked: boolean,
): UnlockSettlement {
  if (alreadyUnlocked || viewerClinicId === authorClinicId) {
    return {
      clinics: [...clinics],
      charged: false,
    };
  }

  const viewer = clinics.find((clinic) => clinic.id === viewerClinicId);
  const author = clinics.find((clinic) => clinic.id === authorClinicId);

  if (!viewer || !author || !viewer.optedIn || !author.optedIn || viewer.credits < VIEW_COST) {
    return {
      clinics: [...clinics],
      charged: false,
    };
  }

  return {
    charged: true,
    clinics: clinics.map((clinic) => {
      if (clinic.id === viewerClinicId) {
        return {
          ...clinic,
          credits: clinic.credits - VIEW_COST,
          reportsViewed: (clinic.reportsViewed || 0) + 1,
        };
      }

      if (clinic.id === authorClinicId) {
        return {
          ...clinic,
          credits: clinic.credits + VIEW_COST,
        };
      }

      return clinic;
    }),
  };
}

export function getAccessRunway(credits: number): number {
  return Math.floor(Math.max(0, credits) / VIEW_COST);
}

export function getCreditsEarned(clinic: Clinic): number {
  const creditsUsed = Math.max(0, (clinic.reportsViewed || 0) * VIEW_COST);
  return Math.max(0, clinic.credits - INITIAL_CREDITS + creditsUsed);
}

export function getContributionScore(clinic: Clinic): number {
  const optInBonus = clinic.optedIn ? 20 : 0;
  return optInBonus + getCreditsEarned(clinic) + Math.max(0, clinic.reportsShared || 0) * 8;
}
