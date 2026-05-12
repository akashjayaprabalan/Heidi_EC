import { describe, expect, it } from 'vitest';
import { calculateAdoptionOutcome } from './adoption';

describe('adoption simulator', () => {
  it('shows a reproducible path from 19% sharing to roughly 80% opt-in', () => {
    const outcome = calculateAdoptionOutcome();

    expect(Math.round(outcome.initialOptInRate * 100)).toBe(19);
    expect(Math.round(outcome.receiveDemandRate * 100)).toBe(71);
    expect(Math.round(outcome.finalOptInRate * 100)).toBe(80);
    expect(outcome.finalOptedInClinics).toBe(1440);
    expect(outcome.stages.map((stage) => stage.label)).toEqual([
      'Existing sharers seed supply',
      'Access gate converts receivers',
      'Risk controls convert holdouts',
    ]);
  });
});
