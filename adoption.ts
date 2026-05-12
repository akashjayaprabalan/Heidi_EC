export type AdoptionStage = {
  label: string;
  optInRate: number;
  optedInClinics: number;
  explanation: string;
};

export type AdoptionOutcome = {
  totalClinics: number;
  initialOptInRate: number;
  receiveDemandRate: number;
  accessGateConversionRate: number;
  trustConversionRate: number;
  finalOptInRate: number;
  finalOptedInClinics: number;
  stages: AdoptionStage[];
};

function clampRate(rate: number): number {
  return Math.min(1, Math.max(0, rate));
}

function toClinics(totalClinics: number, optInRate: number): number {
  return Math.round(totalClinics * optInRate);
}

export function calculateAdoptionOutcome({
  totalClinics = 1800,
  initialOptInRate = 0.19,
  receiveDemandRate = 0.71,
  accessGateConversionRate = 0.75,
  trustConversionRate = 0.524,
}: Partial<{
  totalClinics: number;
  initialOptInRate: number;
  receiveDemandRate: number;
  accessGateConversionRate: number;
  trustConversionRate: number;
}> = {}): AdoptionOutcome {
  const safeInitial = clampRate(initialOptInRate);
  const safeDemand = Math.max(safeInitial, clampRate(receiveDemandRate));
  const safeAccessConversion = clampRate(accessGateConversionRate);
  const safeTrustConversion = clampRate(trustConversionRate);
  const receiverOnlyPool = Math.max(0, safeDemand - safeInitial);
  const accessGateLift = receiverOnlyPool * safeAccessConversion;
  const afterAccessGate = clampRate(safeInitial + accessGateLift);
  const remainingHoldoutPool = Math.max(0, 1 - afterAccessGate);
  const trustLift = remainingHoldoutPool * safeTrustConversion;
  const finalOptInRate = clampRate(afterAccessGate + trustLift);

  return {
    totalClinics,
    initialOptInRate: safeInitial,
    receiveDemandRate: safeDemand,
    accessGateConversionRate: safeAccessConversion,
    trustConversionRate: safeTrustConversion,
    finalOptInRate,
    finalOptedInClinics: toClinics(totalClinics, finalOptInRate),
    stages: [
      {
        label: 'Existing sharers seed supply',
        optInRate: safeInitial,
        optedInClinics: toClinics(totalClinics, safeInitial),
        explanation: 'The 19% already willing to share create the first useful inventory.',
      },
      {
        label: 'Access gate converts receivers',
        optInRate: afterAccessGate,
        optedInClinics: toClinics(totalClinics, afterAccessGate),
        explanation: 'Clinics that want history must opt in before they can unlock it.',
      },
      {
        label: 'Risk controls convert holdouts',
        optInRate: finalOptInRate,
        optedInClinics: toClinics(totalClinics, finalOptInRate),
        explanation: 'Anonymity, capsules, private notes, and visible earnings reduce the switching and judgment fears.',
      },
    ],
  };
}
