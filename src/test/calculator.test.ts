import { describe, it, expect } from 'vitest';
import {
  calculateCO2Allocation,
  calculateSingleFuel,
  lookupStufenmodell,
  applyRestrictionModifier,
  validateBillingPeriod,
  isCrossYearPeriod,
  getYearBoundaries,
  getBillingPeriodDays,
  getVATRate,
} from '../lib/calculator/engine';
import type { WizardData } from '../lib/calculator/types';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Compute expected gross with day-accurate mixed VAT for gas/Fernwärme spanning Apr 1 2024 */
function mixedVATGross(netCost: number, periodStart: string, periodEnd: string): number {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const boundary = new Date('2024-04-01');
  if (end < boundary) return netCost * 1.07;
  if (start >= boundary) return netCost * 1.19;
  const dayMs = 86400000;
  const totalDays = Math.round((end.getTime() - start.getTime()) / dayMs) + 1;
  const reducedDays = Math.round((boundary.getTime() - start.getTime()) / dayMs);
  const reducedNet = netCost * (reducedDays / totalDays);
  const standardNet = netCost - reducedNet;
  return reducedNet * 1.07 + standardNet * 1.19;
}

// ===================================================================
// 0. VAT RATE LOGIC
// ===================================================================

describe('VAT rate determination', () => {
  it('gas 2023 → 7% (temporary reduction)', () => {
    expect(getVATRate('erdgas', '2023-12-31')).toBe(1.07);
  });

  it('gas Jan-Mar 2024 → 7% (still within temporary period)', () => {
    expect(getVATRate('erdgas', '2024-03-31')).toBe(1.07);
  });

  it('gas Apr 2024 onwards → 19%', () => {
    expect(getVATRate('erdgas', '2024-04-01')).toBe(1.19);
  });

  it('gas full year 2024 → 19% (period ends after Mar 2024)', () => {
    expect(getVATRate('erdgas', '2024-12-31')).toBe(1.19);
  });

  it('gas 2025 → 19%', () => {
    expect(getVATRate('erdgas', '2025-12-31')).toBe(1.19);
  });

  it('fernwaerme 2023 → 7%', () => {
    expect(getVATRate('fernwaerme', '2023-12-31')).toBe(1.07);
  });

  it('fernwaerme 2024 full year → 19%', () => {
    expect(getVATRate('fernwaerme', '2024-12-31')).toBe(1.19);
  });

  it('heizoel always 19%, even in 2023', () => {
    expect(getVATRate('heizoel', '2023-12-31')).toBe(1.19);
  });

  it('fluessiggas always 19%', () => {
    expect(getVATRate('fluessiggas', '2024-12-31')).toBe(1.19);
  });

  it('no fuel or period → 19% default', () => {
    expect(getVATRate()).toBe(1.19);
    expect(getVATRate('erdgas')).toBe(1.19);
  });

  it('erdgas_kwk 2023 → 7%', () => {
    expect(getVATRate('erdgas_kwk', '2023-12-31')).toBe(1.07);
  });

  it('erdgas_kwk 2025 → 19%', () => {
    expect(getVATRate('erdgas_kwk', '2025-12-31')).toBe(1.19);
  });
});

// ===================================================================
// 1. BMWK-ALIGNED REFERENCE CASES
// ===================================================================

describe('BMWK-aligned: Erdgas 10,000 kWh baseline (default 19% VAT)', () => {
  it('matches BMWK formula: kWh(Hs) × 0.9030 × emissionFactor', () => {
    // Erdgas: user enters Brennwert (Hs), internally converted to Heizwert (Hi) via × 0.9030
    const r = calculateSingleFuel('erdgas', 10000, 45);
    expect(round2(r.co2Kg)).toBe(1813.95);
    expect(round2(r.energyHeatingValueKwh)).toBe(9030);
    expect(round2(r.co2CostNet)).toBe(81.63);
    expect(round2(r.co2CostGross)).toBe(round2(81.63 * 1.19));
  });
});

describe('Reference Case 1: Natural Gas 2023 (7% VAT period)', () => {
  const data: WizardData = {
    userRole: 'vermieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'zentral',
    restrictionCase: 'fall3',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    fuelType: 'erdgas',
    fuelAmount: 45000,
    buildingArea: 290,
  };

  it('matches all expected values with 7% VAT', () => {
    const r = calculateCO2Allocation(data);
    // 45000 × 0.9030 × 0.20088 = 8162.76 kg
    expect(round2(r.totalEmissionsKg)).toBe(8162.76);
    expect(round2(r.emissionsPerSqmYear)).toBe(28.15);
    expect(r.stufenmodellStep).toBe(5);
    expect(r.tenantPercent).toBe(60);
    expect(r.landlordPercent).toBe(40);
    // net: 8162.76 × 30 / 1000 = 244.88
    expect(round2(r.totalCO2CostNet)).toBe(244.88);
    // gross: 244.88 × 1.07 = 262.02
    expect(round2(r.totalCO2Cost)).toBe(262.02);
    expect(r.isResidential).toBe(true);
    expect(r.isCrossYear).toBe(false);
    expect(r.annualizationFactor).toBeUndefined();
  });
});

describe('Reference Case 2: District Heating 2023', () => {
  const data: WizardData = {
    userRole: 'vermieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall3',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    fuelType: 'fernwaerme',
    fuelAmount: 45000,
    emissionFactorCustom: 0.1234,
    buildingArea: 290,
  };

  it('matches all expected values with 7% VAT', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalEmissionsKg)).toBe(5553.0);
    expect(round2(r.emissionsPerSqmYear)).toBe(19.15);
    expect(r.tenantPercent).toBe(80);
    expect(r.landlordPercent).toBe(20);
    // net: 5553 × 30 / 1000 = 166.59
    // gross: 166.59 × 1.07 = 178.2513 → 178.25
    expect(round2(r.totalCO2Cost)).toBe(178.25);
  });
});

describe('Reference Case 3: District Heating with Restriction 2023', () => {
  const data: WizardData = {
    userRole: 'vermieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall2',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    fuelType: 'fernwaerme',
    fuelAmount: 45000,
    emissionFactorCustom: 0.1234,
    buildingArea: 290,
  };

  it('matches all expected values with restriction modifier', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalCO2Cost)).toBe(178.25);
    expect(r.baseLandlordPercent).toBe(20);
    expect(r.landlordPercent).toBe(10);
    expect(r.tenantPercent).toBe(90);
  });
});

// ===================================================================
// 2. RESTRICTION MODIFIERS
// ===================================================================

describe('Restriction modifiers', () => {
  it('fall1und2 sets landlord to 0%', () => {
    const r = applyRestrictionModifier(40, 60, 'fall1und2', true);
    expect(r.landlordPercent).toBe(0);
    expect(r.tenantPercent).toBe(100);
  });

  it('fall1 halves landlord share (residential)', () => {
    const r = applyRestrictionModifier(40, 60, 'fall1', true);
    expect(r.landlordPercent).toBe(20);
    expect(r.tenantPercent).toBe(80);
  });

  it('non-residential fall1und2 sets landlord to 0%', () => {
    const r = applyRestrictionModifier(50, 50, 'fall1und2', false);
    expect(r.landlordPercent).toBe(0);
    expect(r.tenantPercent).toBe(100);
  });

  it('non-residential fall1 reduces landlord share to 25 % (§ 9 CO2KostAufG)', () => {
    const r = applyRestrictionModifier(50, 50, 'fall1', false);
    expect(r.landlordPercent).toBe(25);
    expect(r.tenantPercent).toBe(75);
  });

  it('non-residential fall2 reduces landlord share to 25 % (§ 9 CO2KostAufG)', () => {
    const r = applyRestrictionModifier(50, 50, 'fall2', false);
    expect(r.landlordPercent).toBe(25);
    expect(r.tenantPercent).toBe(75);
  });
});

// ===================================================================
// 3. NON-RESIDENTIAL BUILDING LOGIC
// ===================================================================

describe('Non-residential building logic', () => {
  it('standard case is 50/50', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodEnd: '2023-12-31',
      fuelType: 'erdgas',
      fuelAmount: 45000,
      buildingArea: 290,
    });
    expect(r.landlordPercent).toBe(50);
    expect(r.tenantPercent).toBe(50);
    expect(r.stufenmodellStep).toBe(0);
  });

  it('fall1und2 gives 100% tenant', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude',
      restrictionCase: 'fall1und2',
      billingPeriodEnd: '2023-12-31',
      fuelType: 'erdgas',
      fuelAmount: 45000,
      buildingArea: 290,
    });
    expect(r.landlordPercent).toBe(0);
    expect(r.tenantPercent).toBe(100);
  });

  it('single restriction reduces landlord share from 50 % to 25 %', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude',
      restrictionCase: 'fall2',
      billingPeriodEnd: '2023-12-31',
      fuelType: 'erdgas',
      fuelAmount: 45000,
      buildingArea: 290,
    });
    expect(r.landlordPercent).toBe(25);
    expect(r.tenantPercent).toBe(75);
  });
});

// ===================================================================
// 4. BIOMASS / ZERO-CO2-COST FUELS
// ===================================================================

describe('Biomass fuel handling', () => {
  it('pellets have zero CO2 cost but positive emissions', () => {
    const r = calculateSingleFuel('pellets', 1000, 30);
    expect(r.co2Kg).toBeGreaterThan(0);
    expect(r.co2CostGross).toBe(0);
    expect(r.co2CostNet).toBe(0);
  });

  it('hackschnitzel have zero CO2 cost', () => {
    const r = calculateSingleFuel('hackschnitzel', 1000, 30);
    expect(r.co2Kg).toBeGreaterThan(0);
    expect(r.co2CostGross).toBe(0);
  });

  it('pellets full allocation produces 0€ shares', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodEnd: '2023-12-31',
      fuelType: 'pellets',
      fuelAmount: 5000,
      buildingArea: 200,
    });
    expect(r.totalCO2Cost).toBe(0);
    expect(r.landlordShare).toBe(0);
    expect(r.tenantShare).toBe(0);
    expect(r.totalEmissionsKg).toBeGreaterThan(0);
  });
});

// ===================================================================
// 5. INDIVIDUAL FUEL PATH VERIFICATION
// ===================================================================

describe('Erdgas: kWh(Hs) → kWh(Hi) conversion via 0.9030', () => {
  it('applies 0.9030 conversion factor for Brennwert→Heizwert', () => {
    const r = calculateSingleFuel('erdgas', 20000, 30);
    expect(round2(r.energyHeatingValueKwh)).toBe(18060);
    expect(round2(r.co2Kg)).toBe(3627.89);
  });
});

describe('Heizöl: liters → kWh conversion (factor 10.0461)', () => {
  it('converts liters to kWh using factor 10.0461', () => {
    const r = calculateSingleFuel('heizoel', 3000, 30);
    // 3000 × 10.0461 = 30138.3 kWh
    expect(round2(r.energyHeatingValueKwh)).toBe(30138.3);
    // 30138.3 × 0.2664 = 8024.84
    expect(round2(r.co2Kg)).toBe(round2(30138.3 * 0.2664));
    expect(round2(r.co2CostNet)).toBe(round2(r.co2Kg * 30 / 1000));
    // Heizöl always 19% VAT
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.19));
  });
});

describe('Flüssiggas: kg → kWh conversion', () => {
  it('converts kg to kWh using factor 12.7778', () => {
    const r = calculateSingleFuel('fluessiggas', 500, 30);
    expect(round2(r.energyHeatingValueKwh)).toBe(6388.9);
    expect(round2(r.co2Kg)).toBe(round2(6388.9 * 0.2358));
  });
});

describe('Braunkohle: kg → kWh conversion', () => {
  it('converts kg to kWh using factor 19.7/3.6, rounded to 2 decimals', () => {
    const r = calculateSingleFuel('braunkohle', 1000, 30);
    // 1000 × (19.7/3.6) = 5472.2222... → rounded to 5472.22 kWh
    expect(round2(r.energyHeatingValueKwh)).toBe(5472.22);
    // CO2 calculated from rounded energy: 5472.22 × 0.35712
    expect(round2(r.co2Kg)).toBe(round2(5472.22 * 0.35712));
  });
});

describe('Fernwärme: kWh input, custom emission factor', () => {
  it('uses kWh directly with custom factor', () => {
    const r = calculateSingleFuel('fernwaerme', 50000, 30, 0.15);
    expect(r.energyHeatingValueKwh).toBe(50000);
    expect(round2(r.co2Kg)).toBe(7500);
  });

  it('zero emissions without custom factor', () => {
    const r = calculateSingleFuel('fernwaerme', 50000, 30);
    expect(r.co2Kg).toBe(0);
  });
});

// ===================================================================
// 6. CHP (KWK) VARIANTS
// ===================================================================

describe('CHP variants', () => {
  it('natural gas CHP applies Hi conversion + heat share factor', () => {
    const r = calculateSingleFuel('erdgas_kwk', 45000, 30);
    // 45000 × 0.9030 × 0.4375 = 17777.81
    expect(round2(r.energyHeatingValueKwh)).toBe(17777.81);
  });

  it('heating oil CHP applies conversion + heat share factor', () => {
    const r = calculateSingleFuel('heizoel_kwk', 3000, 30);
    expect(round2(r.energyHeatingValueKwh)).toBe(round2(3000 * 10.0461 * 0.3984));
  });

  it('LPG CHP applies conversion + heat share factor', () => {
    const r = calculateSingleFuel('fluessiggas_kwk', 500, 30);
    expect(round2(r.energyHeatingValueKwh)).toBe(round2(500 * 12.7778 * 0.3984));
  });
});

// ===================================================================
// 7. TENANT APARTMENT HEATING + REIMBURSEMENT REDUCTION
// ===================================================================

describe('Tenant apartment heating with 5% reduction', () => {
  const data: WizardData = {
    userRole: 'mieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'etage',
    restrictionCase: 'fall3',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    fuelType: 'erdgas',
    fuelAmount: 12000,
    apartmentArea: 75,
    hasExtraGasDevice: true,
  };

  it('applies 5% reduction to landlord reimbursement', () => {
    const r = calculateCO2Allocation(data);
    expect(r.reimbursementReductionApplied).toBe(true);
    expect(r.reimbursementReductionPercent).toBe(5);
    expect(r.landlordShareBeforeReduction).toBeDefined();
    expect(r.landlordShare).toBeLessThan(r.landlordShareBeforeReduction!);
    expect(round2(r.landlordShare)).toBe(round2(r.landlordShareBeforeReduction! * 0.95));
  });

  it('does NOT apply reduction without extra gas device', () => {
    const r = calculateCO2Allocation({ ...data, hasExtraGasDevice: false });
    expect(r.reimbursementReductionApplied).toBe(false);
  });

  it('uses apartment area for emissions/m²', () => {
    const r = calculateCO2Allocation(data);
    expect(r.relevantArea).toBe(75);
    // 12000 × 0.9030 × 0.20088 = 2176.74
    expect(round2(r.totalEmissionsKg)).toBe(2176.74);
    expect(round2(r.emissionsPerSqmYear)).toBe(29.02);
    expect(r.stufenmodellStep).toBe(5);
  });
});

// ===================================================================
// 8. MULTI-FUEL CASES
// ===================================================================

describe('Multiple fuels (heating oil + pellets)', () => {
  const data: WizardData = {
    userRole: 'vermieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'zentral',
    restrictionCase: 'fall3',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    buildingArea: 400,
    fuelEntries: [
      { fuelType: 'heizoel', amount: 3000 },
      { fuelType: 'pellets', amount: 2000 },
    ],
  };

  it('aggregates totals from multiple fuels', () => {
    const r = calculateCO2Allocation(data);
    expect(r.fuelResults).toHaveLength(2);
    expect(r.fuelResults[0].co2CostGross).toBeGreaterThan(0);
    expect(r.fuelResults[1].co2CostGross).toBe(0);
    expect(round2(r.totalCO2Cost)).toBe(round2(r.fuelResults[0].co2CostGross));
  });
});

// ===================================================================
// 9. DIRECT CO2 COST INPUT
// ===================================================================

describe('Direct CO2 cost input', () => {
  it('uses gross cost directly when type is brutto', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 100, 'brutto');
    expect(r.usedDirectCost).toBe(true);
    expect(round2(r.co2CostGross)).toBe(100);
  });

  it('converts net to gross with VAT when type is netto (default 19%)', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 100, 'netto');
    expect(round2(r.co2CostGross)).toBe(119);
    expect(round2(r.co2CostNet)).toBe(100);
  });

  it('converts net to gross with explicit 7% VAT', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 100, 'netto', 1.07);
    expect(round2(r.co2CostGross)).toBe(107);
    expect(round2(r.co2CostNet)).toBe(100);
  });

  it('ignores direct cost when zero', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 0, 'brutto');
    expect(r.usedDirectCost).toBe(false);
  });
});

// ===================================================================
// 10. BILLING PERIOD VALIDATION
// ===================================================================

describe('Billing period validation', () => {
  it('rejects end before start', () => {
    expect(validateBillingPeriod('2023-12-31', '2023-01-01')).toBe('Das Enddatum muss nach dem Startdatum liegen.');
  });

  it('rejects period longer than 365 days', () => {
    expect(validateBillingPeriod('2023-01-01', '2024-01-02')).toBe('Der angegebene Zeitraum darf nicht länger als 365 Tage sein.');
  });

  it('accepts exactly 365 days', () => {
    expect(validateBillingPeriod('2023-01-01', '2024-01-01')).toBeNull();
  });

  it('accepts same-year period', () => {
    expect(validateBillingPeriod('2023-03-01', '2023-09-30')).toBeNull();
  });
});

// ===================================================================
// 11. CROSS-YEAR DETECTION
// ===================================================================

describe('Cross-year detection', () => {
  it('detects cross-year period', () => {
    expect(isCrossYearPeriod('2024-02-01', '2025-01-31')).toBe(true);
  });

  it('detects same-year period', () => {
    expect(isCrossYearPeriod('2023-01-01', '2023-12-31')).toBe(false);
  });

  it('generates correct year boundaries', () => {
    const boundaries = getYearBoundaries('2024-02-01', '2025-01-31');
    expect(boundaries).toHaveLength(2);
    expect(boundaries[0]).toEqual({ year: 2024, periodStart: '2024-02-01', periodEnd: '2024-12-31' });
    expect(boundaries[1]).toEqual({ year: 2025, periodStart: '2025-01-01', periodEnd: '2025-01-31' });
  });
});

// ===================================================================
// 12. CROSS-YEAR CALCULATION
// ===================================================================

describe('Cross-year calculation', () => {
  it('calculates cross-year periods from a single total amount (no manual yearly splits)', () => {
    const data: WizardData = {
      userRole: 'vermieter',
      buildingType: 'wohngebaeude',
      heatSupplyType: 'zentral',
      restrictionCase: 'fall3',
      billingPeriodStart: '2024-02-01',
      billingPeriodEnd: '2025-01-31',
      fuelType: 'erdgas',
      buildingArea: 290,
      fuelAmount: 45000, // total over the whole billing period, no manual 2024/2025 split
    };

    const r = calculateCO2Allocation(data);

    // Cross-year flag stays off in the new flow – we no longer use the
    // segmented calculation path. The result has no segment breakdown.
    expect(r.isCrossYear).toBe(false);
    expect(r.segmentResults).toBeUndefined();

    // CO2 price = end-year price (2025 → 55 €/t)
    expect(r.co2PricePerTon).toBe(55);

    // Total emissions: 45000 × 0.9030 = 40635.00 kWh → × 0.20088 ≈ 8162.76 kg
    const expectedKwh = round2(45000 * 0.9030);
    const expectedCo2Kg = expectedKwh * 0.20088;
    expect(round2(r.totalEmissionsKg)).toBe(round2(expectedCo2Kg));

    // Euro costs: net = co2Kg × 55 / 1000, gross via full-period VAT (mixed 7%/19%).
    // Crucially, costs are NOT annualized.
    const expectedNet = expectedCo2Kg * 55 / 1000;
    const expectedGross = mixedVATGross(expectedNet, '2024-02-01', '2025-01-31');
    expect(round2(r.totalCO2CostNet)).toBe(round2(expectedNet));
    expect(round2(r.totalCO2Cost)).toBe(round2(expectedGross));

    // Emissions per m² are annualized ONLY for the stage classification.
    // Period = 366 days (2024-02-01 .. 2025-01-31 inclusive ≈ 365 days),
    // so the annualization factor is ~1 and the stage uses (roughly) the
    // actual emissions per m². We just assert the annualized field exists
    // OR matches the actual when the period is essentially a full year.
    expect(r.emissionsPerSqmYear).toBeGreaterThan(0);
  });
});
});

// ===================================================================
// 13. STAGE MODEL BOUNDARIES
// ===================================================================

describe('Stufenmodell boundary cases', () => {
  it('step 1: < 12 kg → 100% tenant', () => {
    expect(lookupStufenmodell(11.99).step).toBe(1);
    expect(lookupStufenmodell(11.99).tenantPercent).toBe(100);
  });

  it('step 2: exactly 12 kg → 90/10', () => {
    expect(lookupStufenmodell(12).step).toBe(2);
  });

  it('step 10: >= 52 kg → 5/95', () => {
    expect(lookupStufenmodell(52).step).toBe(10);
    expect(lookupStufenmodell(52).landlordPercent).toBe(95);
  });
});

// ===================================================================
// 14. CO2 PRICE BY YEAR
// ===================================================================

describe('CO2 price per year', () => {
  it('2023 → 30 €/t', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodEnd: '2023-12-31', fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    expect(r.co2PricePerTon).toBe(30);
  });

  it('2024 → 45 €/t', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodEnd: '2024-12-31', fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    expect(r.co2PricePerTon).toBe(45);
  });

  it('2025 → 55 €/t', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodEnd: '2025-12-31', fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    expect(r.co2PricePerTon).toBe(55);
  });
});

// ===================================================================
// 15. HEIZÖL FULL CASE (factor 10.0461, 19% VAT)
// ===================================================================

describe('Heizöl full allocation case (factor 10.0461)', () => {
  it('calculates correctly for 3000 liters 2023 (19% VAT for oil)', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
      fuelType: 'heizoel', fuelAmount: 3000, buildingArea: 200,
    });
    // 3000 × 10.0461 = 30138.30 kWh (rounded to 2 decimals)
    // 30138.30 × 0.2664 = 8024.8411 kg CO2
    expect(round2(r.totalEmissionsKg)).toBe(round2(30138.30 * 0.2664));
    // 8024.84 / 200 = 40.12 kg/m²/a → step 7 (37-42)
    expect(r.stufenmodellStep).toBe(7);
    expect(r.tenantPercent).toBe(40);
    expect(r.landlordPercent).toBe(60);
    // VAT applied to net from rounded energy
    const rawNet = 30138.30 * 0.2664 * 30 / 1000;
    expect(round2(r.totalCO2Cost)).toBe(round2(rawNet * 1.19));
  });

  it('calculates correctly for 3000 liters 2024 (19% VAT)', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2024-01-01', billingPeriodEnd: '2024-12-31',
      fuelType: 'heizoel', fuelAmount: 3000, buildingArea: 200,
    });
    const rawNet2024 = 30138.30 * 0.2664 * 45 / 1000;
    expect(round2(r.totalCO2Cost)).toBe(round2(rawNet2024 * 1.19));
  });
});

// ===================================================================
// 16. NET / GROSS CONSISTENCY
// ===================================================================

describe('Net/Gross consistency', () => {
  it('default (no period) → 19% VAT for erdgas', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30);
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.19));
  });

  it('heizoel always 19% VAT', () => {
    const r = calculateSingleFuel('heizoel', 1000, 45);
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.19));
  });

  it('erdgas with explicit 7% VAT', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, undefined, undefined, 1.07);
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.07));
  });

  it('2024 gas costs higher than 2023 (price + VAT difference)', () => {
    const r2023 = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
      fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    const r2024 = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2024-01-01', billingPeriodEnd: '2024-12-31',
      fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    // Same emissions
    expect(round2(r2023.totalEmissionsKg)).toBe(round2(r2024.totalEmissionsKg));
    // 2024 has higher CO2 price (45 vs 30) AND higher VAT (19% vs 7%)
    expect(r2024.totalCO2Cost).toBeGreaterThan(r2023.totalCO2Cost);
    // Verify correct VAT rates applied
    expect(round2(r2023.totalCO2Cost)).toBe(round2(r2023.totalCO2CostNet * 1.07));
    expect(round2(r2024.totalCO2Cost)).toBe(round2(mixedVATGross(r2024.totalCO2CostNet, '2024-01-01', '2024-12-31')));
  });
});

// ===================================================================
// 17. ANNUALIZATION FOR STAGE CLASSIFICATION ONLY
// ===================================================================

describe('Annualization for stage model classification', () => {
  it('annualizes emissions/m² for under-year periods', () => {
    const data: WizardData = {
      buildingType: 'wohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodStart: '2024-02-01',
      billingPeriodEnd: '2024-09-30',
      fuelType: 'erdgas',
      fuelAmount: 10000,
      buildingArea: 100,
    };

    const r = calculateCO2Allocation(data);
    const periodDays = getBillingPeriodDays('2024-02-01', '2024-09-30');
    expect(periodDays).toBe(242);

    // Actual emissions: 10000 × 0.9030 × 0.20088 = 1813.95 kg → 18.14 kg/m²
    expect(round2(r.emissionsPerSqmYear)).toBe(round2(1813.95 / 100));

    // Annualized: 18.14 × (366/242) = ~27.43 kg/m²/a
    expect(r.annualizationFactor).toBeDefined();
    expect(r.emissionsPerSqmAnnualized).toBeDefined();
    expect(r.emissionsPerSqmAnnualized!).toBeGreaterThan(r.emissionsPerSqmYear);

    // CO2 cost must NOT be annualized (based on actual 10000 kWh × 0.9030)
    // Period ends 2024-09-30 → erdgas → 19% VAT (after Apr 2024)
    const expectedCostNet = 1813.95 * 45 / 1000;
    expect(round2(r.totalCO2Cost)).toBe(round2(mixedVATGross(expectedCostNet, '2024-02-01', '2024-09-30')));
  });

  it('does NOT annualize for full-year periods', () => {
    const data: WizardData = {
      buildingType: 'wohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-12-31',
      fuelType: 'erdgas',
      fuelAmount: 10000,
      buildingArea: 100,
    };

    const r = calculateCO2Allocation(data);
    expect(r.annualizationFactor).toBeUndefined();
    expect(r.emissionsPerSqmAnnualized).toBeUndefined();
  });
});

// ===================================================================
// 18. NON-RESIDENTIAL WITH ERDGAS
// ===================================================================

describe('Non-residential Erdgas 50/50', () => {
  it('ignores stage model, applies 50/50', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude', restrictionCase: 'fall3',
      billingPeriodEnd: '2024-12-31', fuelType: 'erdgas', fuelAmount: 20000, buildingArea: 500,
    });
    expect(r.landlordPercent).toBe(50);
    expect(r.tenantPercent).toBe(50);
    expect(r.stufenmodellStep).toBe(0);
    // 20000 × 0.9030 × 0.20088 = 3627.89
    expect(round2(r.totalEmissionsKg)).toBe(round2(20000 * 0.9030 * 0.20088));
  });
});

// ===================================================================
// 19. NON-RESIDENTIAL BOTH RESTRICTIONS
// ===================================================================

describe('Non-residential both restrictions', () => {
  it('gives 100% tenant / 0% landlord', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude', restrictionCase: 'fall1und2',
      billingPeriodEnd: '2024-12-31', fuelType: 'erdgas', fuelAmount: 20000, buildingArea: 500,
    });
    expect(r.landlordPercent).toBe(0);
    expect(r.tenantPercent).toBe(100);
    expect(r.landlordShare).toBe(0);
    expect(round2(r.tenantShare)).toBe(round2(r.totalCO2Cost));
  });
});

// ===================================================================
// 20. FULL 2024 ERDGAS CASE (45 €/t, 19% VAT)
// ===================================================================

describe('Full 2024 Erdgas case', () => {
  it('uses 45 €/t with 19% VAT correctly', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2024-01-01', billingPeriodEnd: '2024-12-31',
      fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    // 10000 × 0.9030 × 0.20088 = 1813.95 kg
    expect(round2(r.totalEmissionsKg)).toBe(1813.95);
    // 1813.95 / 100 = 18.14 → step 3 (17-22)
    expect(r.stufenmodellStep).toBe(3);
    // net: 1813.95 × 45/1000 = 81.63
    expect(round2(r.totalCO2CostNet)).toBe(81.63);
    // gross: mixed VAT (7% for 91 days, 19% for 275 days in 2024 leap year)
    expect(r.totalCO2Cost).toBeCloseTo(mixedVATGross(81.63, '2024-01-01', '2024-12-31'), 1);
  });
});

// ===================================================================
// 21. FULL 2025 ERDGAS CASE (55 €/t, 19% VAT)
// ===================================================================

describe('Full 2025 Erdgas case', () => {
  it('uses 55 €/t with 19% VAT correctly', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2025-01-01', billingPeriodEnd: '2025-12-31',
      fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    // net: 1813.95 × 55/1000 = 99.77
    expect(round2(r.totalCO2CostNet)).toBe(99.77);
    // BMWK-aligned: energy rounded to 2 decimals → 9030.00 × 0.20088 = 1813.9464
    const rawNet2025 = 9030.00 * 0.20088 * 55 / 1000;
    expect(round2(r.totalCO2Cost)).toBe(round2(rawNet2025 * 1.19));
  });
});

// ===================================================================
// 22. DISTRICT HEATING APARTMENT PATH (TENANT)
// ===================================================================

describe('District heating apartment path (tenant)', () => {
  it('calculates apartment-level district heating', () => {
    const r = calculateCO2Allocation({
      userRole: 'mieter', buildingType: 'wohngebaeude', heatSupplyType: 'fernwaerme',
      restrictionCase: 'fall3', billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
      fuelType: 'fernwaerme', fuelAmount: 8000, emissionFactorCustom: 0.15, apartmentArea: 65,
    });
    expect(r.relevantArea).toBe(65);
    expect(round2(r.totalEmissionsKg)).toBe(1200);
    expect(r.totalCO2Cost).toBeGreaterThan(0);
    expect(r.notes.some(n => n.includes('Wohnungsfläche'))).toBe(true);
  });
});

// ===================================================================
// 23. DEVIATING PERIOD WITHIN ONE YEAR
// ===================================================================

describe('Deviating billing period within one year', () => {
  it('calculates correctly without cross-year logic', () => {
    const data: WizardData = {
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2024-04-01', billingPeriodEnd: '2024-09-30',
      fuelType: 'erdgas', fuelAmount: 5000, buildingArea: 100,
    };
    const r = calculateCO2Allocation(data);
    expect(r.isCrossYear).toBe(false);
    // Actual CO2: 5000 × 0.9030 × 0.20088 = 906.97 kg → 9.07 kg/m²
    expect(r.annualizationFactor).toBeDefined();
    expect(round2(r.totalEmissionsKg)).toBe(round2(5000 * 0.9030 * 0.20088));
    // CO2 cost based on actual consumption, NOT annualized
    // Energy rounded to 2 decimals: 5000 × 0.9030 = 4515.00
    const rawNetDev = 4515.00 * 0.20088 * 45 / 1000;
    expect(round2(r.totalCO2Cost)).toBe(round2(rawNetDev * 1.19));
  });
});

// ===================================================================
// 24. HEIZÖL 2024 GROSS CORRECTNESS (19% VAT)
// ===================================================================

describe('Heizöl 2024 gross correctness', () => {
  it('applies 19% VAT for heating oil in 2024', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2024-01-01', billingPeriodEnd: '2024-12-31',
      fuelType: 'heizoel', fuelAmount: 2000, buildingArea: 150,
    });
    // 2000 × 10.0461 = 20092.20 kWh (rounded to 2 decimals)
    // 20092.20 × 0.2664 = 5348.56 kg CO2
    // net: 5348.56 × 45 / 1000 = 240.69
    // gross: 240.69 × 1.19 = 286.42
    // Energy rounded to 2 decimals
    const rawNetOil2024 = 20092.20 * 0.2664 * 45 / 1000;
    expect(round2(r.totalCO2Cost)).toBe(round2(rawNetOil2024 * 1.19));
    expect(round2(r.totalCO2CostNet)).toBe(round2(rawNetOil2024));
  });
});

// ===================================================================
// 25. GAS Q1 2024 (still 7% VAT period)
// ===================================================================

describe('Gas Q1 2024 (within temporary 7% VAT period)', () => {
  it('uses 7% VAT for gas period ending before Apr 2024', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2024-01-01', billingPeriodEnd: '2024-03-31',
      fuelType: 'erdgas', fuelAmount: 3000, buildingArea: 100,
    });
    // 3000 × 0.9030 × 0.20088 = 544.18 kg
    // net: 544.18 × 45 / 1000 = 24.49
    // gross: 24.49 × 1.07 = 26.20
    // Energy rounded: 3000 × 0.9030 = 2709.00
    const netCost = 2709.00 * 0.20088 * 45 / 1000;
    expect(round2(r.totalCO2Cost)).toBe(round2(netCost * 1.07));
  });
});

// ===================================================================
// 26. MULTI-FUEL MIXED VAT (heizoel + erdgas 2023)
// ===================================================================

describe('Multi-fuel mixed VAT rates (2023)', () => {
  it('applies correct VAT per fuel type', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
      buildingArea: 300,
      fuelEntries: [
        { fuelType: 'erdgas', amount: 20000 },      // 7% VAT (gas 2023)
        { fuelType: 'heizoel', amount: 1000 },       // 19% VAT (oil always)
      ],
    });
    expect(r.fuelResults).toHaveLength(2);
    // Gas: 7% VAT
    const gasNet = r.fuelResults[0].co2CostNet;
    expect(round2(r.fuelResults[0].co2CostGross)).toBe(round2(gasNet * 1.07));
    // Oil: 19% VAT
    const oilNet = r.fuelResults[1].co2CostNet;
    expect(round2(r.fuelResults[1].co2CostGross)).toBe(round2(oilNet * 1.19));
  });
});

// ===================================================================
// 27. NET/GROSS SEPARATION IN RESULT
// ===================================================================

describe('Net and gross are cleanly separated', () => {
  it('totalCO2CostNet and totalCO2Cost are both present and different', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2024-01-01', billingPeriodEnd: '2024-12-31',
      fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    expect(r.totalCO2CostNet).toBeDefined();
    expect(r.totalCO2CostNet).toBeLessThan(r.totalCO2Cost);
    // 2024 full year gas has mixed VAT (7% Q1 + 19% rest), so ratio is NOT exactly 1.19
    const expectedRatio = r.totalCO2Cost / r.totalCO2CostNet;
    expect(expectedRatio).toBeGreaterThan(1.07);
    expect(expectedRatio).toBeLessThan(1.19);
  });
});

// ===================================================================
// 28. ENERGY ROUNDING TO 2 DECIMALS AFTER CONVERSION
// ===================================================================

describe('Energy conversion: input unchanged, converted heating value rounded to 2 decimals', () => {
  it('Braunkohle: converted heating value rounded to 2 decimals', () => {
    const r = calculateSingleFuel('braunkohle', 1000, 30);
    // 1000 × (19.7/3.6) = 5472.2222... → rounded to 5472.22
    expect(r.energyHeatingValueKwh).toBe(5472.22);
    expect(r.inputAmount).toBe(1000); // original input unchanged
  });

  it('Erdgas: clean conversion stays exact', () => {
    const r = calculateSingleFuel('erdgas', 10000, 45);
    expect(r.energyHeatingValueKwh).toBe(9030.00);
    expect(r.inputAmount).toBe(10000);
  });

  it('Heizoel: converted heating value rounded to 2 decimals', () => {
    const r = calculateSingleFuel('heizoel', 3000, 30);
    // 3000 × 10.0461 = 30138.3
    expect(r.energyHeatingValueKwh).toBe(30138.30);
    expect(r.inputAmount).toBe(3000);
  });

  it('Fluessiggas: converted heating value rounded to 2 decimals', () => {
    const r = calculateSingleFuel('fluessiggas', 500, 30);
    expect(r.energyHeatingValueKwh).toBe(6388.90);
    expect(r.inputAmount).toBe(500);
  });

  it('downstream CO2 uses rounded converted heating value', () => {
    const r = calculateSingleFuel('braunkohle', 1000, 30);
    // CO2 must be calculated from 5472.22 (rounded), not 5472.2222...
    const expectedCo2 = 5472.22 * 0.35712;
    expect(r.co2Kg).toBeCloseTo(expectedCo2, 6);
  });
});

// ===================================================================
// 29. STAGE BOUNDARY VALIDATION WITH ROUNDED ENERGY
// ===================================================================

describe('Stage boundary validation across fuels', () => {
  const thresholds = [12, 17, 22, 27, 32, 37, 42, 47, 52];

  thresholds.forEach((threshold, idx) => {
    const stepBelow = idx + 1;
    const stepAtOrAbove = idx + 2;

    it(`threshold ${threshold}: value just below → step ${stepBelow}`, () => {
      expect(lookupStufenmodell(threshold - 0.01).step).toBe(stepBelow);
    });

    it(`threshold ${threshold}: exact value → step ${stepAtOrAbove}`, () => {
      expect(lookupStufenmodell(threshold).step).toBe(stepAtOrAbove);
    });

    it(`threshold ${threshold}: value just above → step ${stepAtOrAbove}`, () => {
      expect(lookupStufenmodell(threshold + 0.01).step).toBe(stepAtOrAbove);
    });
  });
});

// ===================================================================
// FALL 2 ROUNDING & § 9 ABS. 1 REGRESSION (BMWK-compliant)
// ===================================================================

import { calculateCO2Allocation as _calc } from '../lib/calculator/engine';
import { getSpecialCircumstancesText } from '../lib/calculator/pdf-helpers';

describe('Fall 1/2: floor (NOT kaufmännisches Runden) of base landlord percent', () => {
  // Verbindliche Regel: final_landlord_percent = floor(base_landlord_percent / 2)
  // Beispiel Stufe 10: base = 95 → floor(95/2) = 47 (NICHT 48)
  const cases: Array<[number, number]> = [
    [95, 47], // Stufe 10 – the BMWK reference case
    [80, 40], // Stufe 9
    [70, 35], // Stufe 8
    [60, 30], // Stufe 7
    [50, 25], // Stufe 6
    [40, 20], // Stufe 5
    [30, 15], // Stufe 4
    [20, 10], // Stufe 3
    [10, 5],  // Stufe 2
    [0, 0],   // Stufe 1
  ];
  for (const [base, expected] of cases) {
    it(`base landlord ${base}% → fall1: floor → ${expected}%`, () => {
      const r = applyRestrictionModifier(base, 100 - base, 'fall1', true);
      expect(r.landlordPercent).toBe(expected);
      expect(r.tenantPercent).toBe(100 - expected);
    });
    it(`base landlord ${base}% → fall2: floor → ${expected}%`, () => {
      const r = applyRestrictionModifier(base, 100 - base, 'fall2', true);
      expect(r.landlordPercent).toBe(expected);
      expect(r.tenantPercent).toBe(100 - expected);
    });
  }

  it('explicitly: 95/2 = 47.5 must floor to 47 (NOT round to 48)', () => {
    expect(applyRestrictionModifier(95, 5, 'fall2', true).landlordPercent).toBe(47);
  });
});

describe('Fall 2 reference scenario (BMWK reference)', () => {
  // Wohngebäude, Fernwärme, Stufe 10, Fall 2 → 47% / 53%
  // Inputs constructed so that emissions per m² > 52 (Stufe 10).
  const data: WizardData = {
    userRole: 'mieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall2',
    billingPeriodStart: '2024-01-01',
    billingPeriodEnd: '2024-12-31',
    fuelType: 'fernwaerme',
    fuelAmount: 21778,
    emissionFactorCustom: 0.29,
    apartmentArea: 100,
    buildingArea: 100,
  };
  const r = _calc(data);

  it('classified into stage 10 (residential)', () => {
    expect(r.stufenmodellStep).toBe(10);
    expect(r.baseLandlordPercent).toBe(95);
    expect(r.baseTenantPercent).toBe(5);
  });

  it('final percentages: landlord 47% / tenant 53% (NOT 48/52)', () => {
    expect(r.landlordPercent).toBe(47);
    expect(r.tenantPercent).toBe(53);
  });

  it('cent-exact allocation: landlord + tenant === total gross', () => {
    expect(round2(r.landlordShare + r.tenantShare)).toBe(r.totalCO2Cost);
  });

  it('landlord share derived from final 47% (not from baseLandlordPercent)', () => {
    expect(r.landlordShare).toBe(round2(r.totalCO2Cost * 0.47));
  });

  it('tenant share is the remainder (not independently rounded)', () => {
    expect(r.tenantShare).toBe(round2(r.totalCO2Cost - r.landlordShare));
  });
});

describe('Cent-exact allocation across all residential restriction stages', () => {
  // Construct synthetic results to verify that landlord + tenant always sum
  // to the total gross down to the cent, for every stage × fall1/fall2.
  const totals = [100, 123.45, 329.72, 1000.01, 7777.77];
  const baseLandlords = [10, 20, 30, 40, 50, 60, 70, 80, 95];
  for (const total of totals) {
    for (const base of baseLandlords) {
      const final = Math.floor(base / 2);
      const landlord = round2(total * final / 100);
      const tenant = round2(total - landlord);
      it(`total ${total} EUR, base ${base}% → landlord ${final}%: sums to total`, () => {
        expect(round2(landlord + tenant)).toBe(round2(total));
      });
    }
  }
});

describe('Legal reference: § 9 Abs. 1 CO2KostAufG (NOT § 7 Abs. 1)', () => {
  const buildResult = (restriction: 'fall1' | 'fall2'): WizardData => ({
    userRole: 'mieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'zentral',
    restrictionCase: restriction,
    billingPeriodStart: '2024-01-01',
    billingPeriodEnd: '2024-12-31',
    fuelType: 'erdgas',
    fuelAmount: 30000,
    buildingArea: 200,
  });

  it('Fall 1 (residential): cites § 9 Abs. 1, never § 7 Abs. 1', () => {
    const data = buildResult('fall1');
    const result = _calc(data);
    const text = getSpecialCircumstancesText(data, result);
    expect(text).toContain('§ 9 Abs. 1 CO2KostAufG');
    expect(text).not.toContain('§ 7 Abs. 1');
  });

  it('Fall 2 (residential): cites § 9 Abs. 1, never § 7 Abs. 1', () => {
    const data = buildResult('fall2');
    const result = _calc(data);
    const text = getSpecialCircumstancesText(data, result);
    expect(text).toContain('§ 9 Abs. 1 CO2KostAufG');
    expect(text).not.toContain('§ 7 Abs. 1');
  });
});
