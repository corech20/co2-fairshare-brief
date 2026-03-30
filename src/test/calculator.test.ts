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
} from '../lib/calculator/engine';
import type { WizardData } from '../lib/calculator/types';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ===================================================================
// 1. BMWK-ALIGNED REFERENCE CASES
// ===================================================================

describe('BMWK-aligned: Erdgas 10,000 kWh baseline', () => {
  it('matches BMWK formula: kWh × emissionFactor directly', () => {
    const r = calculateSingleFuel('erdgas', 10000, 45);
    expect(round2(r.co2Kg)).toBe(2008.8);
    expect(round2(r.energyHeatingValueKwh)).toBe(10000);
    expect(round2(r.co2CostNet)).toBe(90.4);
    expect(round2(r.co2CostGross)).toBe(96.72);
  });
});

describe('Reference Case 1: Natural Gas (BMWK-aligned)', () => {
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

  it('matches all expected values', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalEmissionsKg)).toBe(9039.6);
    expect(round2(r.emissionsPerSqmYear)).toBe(31.17);
    expect(r.stufenmodellStep).toBe(5);
    expect(r.tenantPercent).toBe(60);
    expect(r.landlordPercent).toBe(40);
    expect(round2(r.totalCO2Cost)).toBe(290.17);
    expect(round2(r.tenantShare)).toBe(174.1);
    expect(round2(r.landlordShare)).toBe(116.07);
    expect(r.isResidential).toBe(true);
    expect(r.isCrossYear).toBe(false);
    expect(r.annualizationFactor).toBeUndefined();
  });
});

describe('Reference Case 2: District Heating', () => {
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

  it('matches all expected values', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalEmissionsKg)).toBe(5553.0);
    expect(round2(r.emissionsPerSqmYear)).toBe(19.15);
    expect(r.tenantPercent).toBe(80);
    expect(r.landlordPercent).toBe(20);
    expect(round2(r.totalCO2Cost)).toBe(178.25);
  });
});

describe('Reference Case 3: District Heating with Restriction', () => {
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

  it('non-residential fall1 stays 50/50 with note', () => {
    const r = applyRestrictionModifier(50, 50, 'fall1', false);
    expect(r.landlordPercent).toBe(50);
    expect(r.tenantPercent).toBe(50);
    expect(r.restrictionNote).toBeDefined();
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

  it('single restriction stays 50/50 with note', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude',
      restrictionCase: 'fall2',
      billingPeriodEnd: '2023-12-31',
      fuelType: 'erdgas',
      fuelAmount: 45000,
      buildingArea: 290,
    });
    expect(r.landlordPercent).toBe(50);
    expect(r.restrictionNote).toBeDefined();
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

describe('Erdgas: kWh input used directly', () => {
  it('does not apply any conversion factor', () => {
    const r = calculateSingleFuel('erdgas', 20000, 30);
    expect(r.energyHeatingValueKwh).toBe(20000);
    expect(round2(r.co2Kg)).toBe(4017.6);
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
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.07));
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
  it('converts kg to kWh using factor 5.3889', () => {
    const r = calculateSingleFuel('braunkohle', 1000, 30);
    expect(round2(r.energyHeatingValueKwh)).toBe(5388.9);
    expect(round2(r.co2Kg)).toBe(round2(5388.9 * 0.35712));
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
  it('natural gas CHP applies heat share factor only', () => {
    const r = calculateSingleFuel('erdgas_kwk', 45000, 30);
    expect(round2(r.energyHeatingValueKwh)).toBe(19687.5);
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
    expect(round2(r.totalEmissionsKg)).toBe(2410.56);
    expect(round2(r.emissionsPerSqmYear)).toBe(32.14);
    expect(r.stufenmodellStep).toBe(6);
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

  it('converts net to gross with VAT when type is netto', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 100, 'netto');
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
  it('calculates with separate CO2 prices per year segment', () => {
    const data: WizardData = {
      userRole: 'vermieter',
      buildingType: 'wohngebaeude',
      heatSupplyType: 'zentral',
      restrictionCase: 'fall3',
      billingPeriodStart: '2024-02-01',
      billingPeriodEnd: '2025-01-31',
      fuelType: 'erdgas',
      buildingArea: 290,
      yearlySegments: [
        { year: 2024, periodStart: '2024-02-01', periodEnd: '2024-12-31', amount: 35000, co2PricePerTon: 45 },
        { year: 2025, periodStart: '2025-01-01', periodEnd: '2025-01-31', amount: 10000, co2PricePerTon: 55 },
      ],
    };

    const r = calculateCO2Allocation(data);
    expect(r.isCrossYear).toBe(true);
    expect(r.segmentResults).toHaveLength(2);
    expect(round2(r.segmentResults![0].co2Kg)).toBe(7030.8);
    expect(round2(r.segmentResults![1].co2Kg)).toBe(2008.8);

    const totalFromSegments = r.segmentResults!.reduce((s, seg) => s + seg.co2CostGross, 0);
    expect(round2(r.totalCO2Cost)).toBe(round2(totalFromSegments));
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
// 15. HEIZÖL FULL CASE (updated factor 10.0461)
// ===================================================================

describe('Heizöl full allocation case (factor 10.0461)', () => {
  it('calculates correctly for 3000 liters', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
      fuelType: 'heizoel', fuelAmount: 3000, buildingArea: 200,
    });
    // 3000 × 10.0461 = 30138.3 kWh
    // 30138.3 × 0.2664 = 8024.84 kg CO2
    expect(round2(r.totalEmissionsKg)).toBe(round2(30138.3 * 0.2664));
    // 8024.84 / 200 = 40.12 kg/m²/a → step 7 (37-42)
    expect(r.stufenmodellStep).toBe(7);
    expect(r.tenantPercent).toBe(40);
    expect(r.landlordPercent).toBe(60);
  });
});

// ===================================================================
// 16. NET / GROSS CONSISTENCY
// ===================================================================

describe('Net/Gross consistency (7% VAT)', () => {
  it('gross = net × 1.07 for erdgas', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30);
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.07));
  });

  it('gross = net × 1.07 for heizoel', () => {
    const r = calculateSingleFuel('heizoel', 1000, 45);
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.07));
  });

  it('VAT consistent across years (2023 vs 2024)', () => {
    const r2023 = calculateSingleFuel('erdgas', 10000, 30);
    const r2024 = calculateSingleFuel('erdgas', 10000, 45);
    expect(round2(r2023.co2CostGross)).toBe(round2(r2023.co2CostNet * 1.07));
    expect(round2(r2024.co2CostGross)).toBe(round2(r2024.co2CostNet * 1.07));
    // 2024 should have higher costs (45 vs 30 €/t)
    expect(r2024.co2CostGross).toBeGreaterThan(r2023.co2CostGross);
  });
});

// ===================================================================
// 17. ANNUALIZATION FOR STAGE CLASSIFICATION ONLY
// ===================================================================

describe('Annualization for stage model classification', () => {
  it('annualizes emissions/m² for under-year periods', () => {
    // 243 days in 2024 (leap year → 366 days)
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

    // Actual emissions: 10000 × 0.20088 = 2008.8 kg → 20.09 kg/m²
    expect(round2(r.emissionsPerSqmYear)).toBe(round2(2008.8 / 100));

    // Annualized: 20.09 × (366/242) = ~30.37 kg/m²/a
    expect(r.annualizationFactor).toBeDefined();
    expect(r.emissionsPerSqmAnnualized).toBeDefined();
    expect(r.emissionsPerSqmAnnualized!).toBeGreaterThan(r.emissionsPerSqmYear);

    // CO2 cost must NOT be annualized (based on actual 10000 kWh)
    const expectedCostNet = 2008.8 * 45 / 1000;
    expect(round2(r.totalCO2Cost)).toBe(round2(expectedCostNet * 1.07));
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
    expect(round2(r.totalEmissionsKg)).toBe(round2(20000 * 0.20088));
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
// 20. FULL 2024 ERDGAS CASE (45 €/t)
// ===================================================================

describe('Full 2024 Erdgas case', () => {
  it('uses 45 €/t correctly', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2024-01-01', billingPeriodEnd: '2024-12-31',
      fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    // 10000 × 0.20088 = 2008.8 kg
    expect(round2(r.totalEmissionsKg)).toBe(2008.8);
    // 2008.8 / 100 = 20.09 → step 3 (17-22)
    expect(r.stufenmodellStep).toBe(3);
    // net: 2008.8 × 45/1000 = 90.396
    // gross: 90.396 × 1.07 = 96.72
    expect(round2(r.totalCO2Cost)).toBe(96.72);
  });
});

// ===================================================================
// 21. FULL 2025 ERDGAS CASE (55 €/t)
// ===================================================================

describe('Full 2025 Erdgas case', () => {
  it('uses 55 €/t correctly', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude', restrictionCase: 'fall3',
      billingPeriodStart: '2025-01-01', billingPeriodEnd: '2025-12-31',
      fuelType: 'erdgas', fuelAmount: 10000, buildingArea: 100,
    });
    // net: 2008.8 × 55/1000 = 110.484
    // gross: 110.484 × 1.07 = 118.22
    expect(round2(r.totalCO2Cost)).toBe(118.22);
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
    // Actual CO2: 5000 × 0.20088 = 1004.4 kg → 10.044 kg/m²
    // Annualized: 10.044 × (366/183) = ~20.09 kg/m²/a → step 3
    expect(r.annualizationFactor).toBeDefined();
    expect(round2(r.totalEmissionsKg)).toBe(round2(5000 * 0.20088));
    // CO2 cost based on actual consumption, NOT annualized
    expect(round2(r.totalCO2Cost)).toBe(round2(1004.4 * 45 / 1000 * 1.07));
  });
});
