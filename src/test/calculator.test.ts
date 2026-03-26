import { describe, it, expect } from 'vitest';
import {
  calculateCO2Allocation,
  calculateSingleFuel,
  lookupStufenmodell,
  applyRestrictionModifier,
  validateBillingPeriod,
  isCrossYearPeriod,
  getYearBoundaries,
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
    // 10000 × 0.20088 = 2008.8 kg CO2
    expect(round2(r.co2Kg)).toBe(2008.8);
    expect(round2(r.energyHeatingValueKwh)).toBe(10000);
    // CO2 cost net: 2008.8 × 45 / 1000 = 90.396
    expect(round2(r.co2CostNet)).toBe(90.4);
    // CO2 cost gross: 90.396 × 1.07 = 96.72
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
    // 45000 × 0.20088 = 9039.60 kg CO2
    expect(round2(r.totalEmissionsKg)).toBe(9039.6);
    // 9039.60 / 290 = 31.17 kg/m²/a
    expect(round2(r.emissionsPerSqmYear)).toBe(31.17);
    // Step 5: 27 bis < 32 → 60% T / 40% L
    expect(r.stufenmodellStep).toBe(5);
    expect(r.tenantPercent).toBe(60);
    expect(r.landlordPercent).toBe(40);
    // CO2 cost: 9039.6 × 30/1000 × 1.07 = 290.17
    expect(round2(r.totalCO2Cost)).toBe(290.17);
    expect(round2(r.tenantShare)).toBe(174.1);
    expect(round2(r.landlordShare)).toBe(116.07);
    expect(r.isResidential).toBe(true);
    expect(r.restrictionNote).toBeUndefined();
    expect(r.reimbursementReductionApplied).toBe(false);
    expect(r.isCrossYear).toBe(false);
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
    // 45000 × 0.1234 = 5553.00 kg (fernwaerme factor = 1, no conversion)
    expect(round2(r.totalEmissionsKg)).toBe(5553.0);
    // 5553 / 290 = 19.15
    expect(round2(r.emissionsPerSqmYear)).toBe(19.15);
    expect(r.tenantPercent).toBe(80);
    expect(r.landlordPercent).toBe(20);
    // 5553 × 30/1000 × 1.07 = 178.25
    expect(round2(r.totalCO2Cost)).toBe(178.25);
    expect(round2(r.tenantShare)).toBe(142.6);
    expect(round2(r.landlordShare)).toBe(35.65);
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
    expect(r.baseTenantPercent).toBe(80);
    // fall2 halves landlord: 20/2 = 10
    expect(r.landlordPercent).toBe(10);
    expect(r.tenantPercent).toBe(90);
    expect(round2(r.tenantShare)).toBe(160.43);
    expect(round2(r.landlordShare)).toBe(17.83);
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
  it('standard case is 50/50, no stage model', () => {
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
    expect(r.isResidential).toBe(false);
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
    expect(r.tenantPercent).toBe(50);
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

describe('Erdgas: kWh input used directly (no Brennwert conversion)', () => {
  it('does not apply any conversion factor', () => {
    const r = calculateSingleFuel('erdgas', 20000, 30);
    // energyHeatingValueKwh must equal the input
    expect(r.energyHeatingValueKwh).toBe(20000);
    // 20000 × 0.20088 = 4017.6
    expect(round2(r.co2Kg)).toBe(4017.6);
  });
});

describe('Heizöl: liters → kWh conversion', () => {
  it('converts liters to kWh using Heizwert factor 10.0625', () => {
    const r = calculateSingleFuel('heizoel', 3000, 30);
    // 3000 × 10.0625 = 30187.5 kWh
    expect(round2(r.energyHeatingValueKwh)).toBe(30187.5);
    // 30187.5 × 0.2664 = 8041.95 (full precision)
    expect(round2(r.co2Kg)).toBe(8041.95);
    expect(round2(r.co2CostNet)).toBe(round2(r.co2Kg * 30 / 1000));
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.07));
  });
});

describe('Flüssiggas: kg → kWh conversion', () => {
  it('converts kg to kWh using factor 12.7778', () => {
    const r = calculateSingleFuel('fluessiggas', 500, 30);
    // 500 × 12.7778 = 6388.9 kWh
    expect(round2(r.energyHeatingValueKwh)).toBe(6388.9);
    // 6388.9 × 0.2358 = 1506.5
    expect(round2(r.co2Kg)).toBe(1506.54);
  });
});

describe('Braunkohle: kg → kWh conversion', () => {
  it('converts kg to kWh using factor 5.3889', () => {
    const r = calculateSingleFuel('braunkohle', 1000, 30);
    // 1000 × 5.3889 = 5388.9 kWh
    expect(round2(r.energyHeatingValueKwh)).toBe(5388.9);
    // 5388.9 × 0.35712 = 1924.46
    expect(round2(r.co2Kg)).toBe(1924.46);
  });
});

describe('Fernwärme: kWh input, custom emission factor', () => {
  it('uses kWh directly with custom factor', () => {
    const r = calculateSingleFuel('fernwaerme', 50000, 30, 0.15);
    expect(r.energyHeatingValueKwh).toBe(50000);
    // 50000 × 0.15 = 7500
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
  it('natural gas CHP applies heat share factor only (no Brennwert conversion)', () => {
    const r = calculateSingleFuel('erdgas_kwk', 45000, 30);
    // 45000 × 1.0 × 0.4375 = 19687.5 kWh
    expect(round2(r.energyHeatingValueKwh)).toBe(19687.5);
    expect(r.co2Kg).toBeGreaterThan(0);
    expect(r.co2CostGross).toBeGreaterThan(0);
  });

  it('heating oil CHP applies conversion + heat share factor', () => {
    const r = calculateSingleFuel('heizoel_kwk', 3000, 30);
    // 3000 × 10.0625 × 0.3984 = 12018.75
    expect(round2(r.energyHeatingValueKwh)).toBe(round2(3000 * 10.0625 * 0.3984));
    expect(r.co2Kg).toBeGreaterThan(0);
  });

  it('LPG CHP applies conversion + heat share factor', () => {
    const r = calculateSingleFuel('fluessiggas_kwk', 500, 30);
    // 500 × 12.7778 × 0.3984
    expect(round2(r.energyHeatingValueKwh)).toBe(round2(500 * 12.7778 * 0.3984));
    expect(r.co2Kg).toBeGreaterThan(0);
  });
});

// ===================================================================
// 7. TENANT APARTMENT HEATING + REIMBURSEMENT REDUCTION
// ===================================================================

describe('Case A: Tenant + apartment heating + extra gas device (5% reduction)', () => {
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
    expect(r.notes.some((n) => n.includes('5 %'))).toBe(true);
  });

  it('does NOT apply reduction without extra gas device', () => {
    const r = calculateCO2Allocation({ ...data, hasExtraGasDevice: false });
    expect(r.reimbursementReductionApplied).toBe(false);
    expect(r.landlordShareBeforeReduction).toBeUndefined();
  });

  it('uses apartment area for emissions/m²', () => {
    const r = calculateCO2Allocation(data);
    expect(r.relevantArea).toBe(75);
    // 12000 × 0.20088 = 2410.56 kg → 2410.56/75 = 32.14 kg/m²/a
    expect(round2(r.totalEmissionsKg)).toBe(2410.56);
    expect(round2(r.emissionsPerSqmYear)).toBe(32.14);
    // Step 6: 32 bis < 37 → 50/50
    expect(r.stufenmodellStep).toBe(6);
  });
});

// ===================================================================
// 8. MULTI-FUEL CASES
// ===================================================================

describe('Case B: Multiple fuels (heating oil + pellets)', () => {
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
    expect(r.fuelResults[0].co2Kg).toBeGreaterThan(0);
    expect(r.fuelResults[0].co2CostGross).toBeGreaterThan(0);
    expect(r.fuelResults[1].co2Kg).toBeGreaterThan(0);
    expect(r.fuelResults[1].co2CostGross).toBe(0); // pellets = zero cost
    expect(round2(r.totalEmissionsKg)).toBe(
      round2(r.fuelResults[0].co2Kg + r.fuelResults[1].co2Kg),
    );
    expect(round2(r.totalCO2Cost)).toBe(
      round2(r.fuelResults[0].co2CostGross + r.fuelResults[1].co2CostGross),
    );
    expect(r.weightedEmissionFactor).toBeGreaterThan(0);
    expect(r.weightedEmissionFactor).toBe(r.totalEmissionsKg / r.totalEnergyHeatingValueKwh);
    expect(r.notes.some((n) => n.includes('2 Brennstoffen'))).toBe(true);
    expect(r.isCrossYear).toBe(false);
  });
});

// ===================================================================
// 9. DISTRICT HEATING APARTMENT PATH (TENANT)
// ===================================================================

describe('Case C: District heating apartment path (tenant)', () => {
  const data: WizardData = {
    userRole: 'mieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall3',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    fuelType: 'fernwaerme',
    fuelAmount: 8000,
    emissionFactorCustom: 0.15,
    apartmentArea: 65,
  };

  it('calculates apartment-level district heating result', () => {
    const r = calculateCO2Allocation(data);
    expect(r.relevantArea).toBe(65);
    // 8000 × 0.15 = 1200 kg
    expect(round2(r.totalEmissionsKg)).toBe(1200);
    expect(round2(r.emissionsPerSqmYear)).toBe(round2(1200 / 65));
    expect(r.totalCO2Cost).toBeGreaterThan(0);
    expect(r.notes.some((n) => n.includes('Wohnungsfläche'))).toBe(true);
  });
});

// ===================================================================
// 10. DIRECT CO2 COST INPUT
// ===================================================================

describe('Direct CO2 cost input (net/gross)', () => {
  it('uses gross cost directly when type is brutto', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 100, 'brutto');
    expect(r.usedDirectCost).toBe(true);
    expect(round2(r.co2CostGross)).toBe(100);
    // Emissions still calculated normally
    expect(round2(r.co2Kg)).toBe(2008.8);
  });

  it('converts net to gross with VAT when type is netto', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 100, 'netto');
    expect(r.usedDirectCost).toBe(true);
    expect(round2(r.co2CostGross)).toBe(107);
    expect(round2(r.co2CostNet)).toBe(100);
  });

  it('ignores direct cost when zero', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 0, 'brutto');
    expect(r.usedDirectCost).toBe(false);
  });
});

// ===================================================================
// 11. BILLING PERIOD VALIDATION
// ===================================================================

describe('Billing period validation', () => {
  it('rejects end before start', () => {
    const err = validateBillingPeriod('2023-12-31', '2023-01-01');
    expect(err).toBe('Das Enddatum muss nach dem Startdatum liegen.');
  });

  it('rejects period longer than 365 days', () => {
    const err = validateBillingPeriod('2023-01-01', '2024-01-02');
    expect(err).toBe('Der angegebene Zeitraum darf nicht länger als 365 Tage sein.');
  });

  it('accepts exactly 365 days', () => {
    const err = validateBillingPeriod('2023-01-01', '2024-01-01');
    expect(err).toBeNull();
  });

  it('accepts same-year period', () => {
    const err = validateBillingPeriod('2023-03-01', '2023-09-30');
    expect(err).toBeNull();
  });
});

// ===================================================================
// 12. CROSS-YEAR DETECTION
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
// 13. CROSS-YEAR CALCULATION
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
    expect(r.segmentResults![0].co2PricePerTon).toBe(45);
    expect(r.segmentResults![1].co2PricePerTon).toBe(55);

    // Segment 1: 35000 × 0.20088 = 7030.8 kg, net = 316.386, gross = 338.53
    expect(round2(r.segmentResults![0].co2Kg)).toBe(7030.8);
    // Segment 2: 10000 × 0.20088 = 2008.8 kg, net = 110.484, gross = 118.22
    expect(round2(r.segmentResults![1].co2Kg)).toBe(2008.8);

    // Total = sum of segments
    const totalFromSegments = r.segmentResults!.reduce((s, seg) => s + seg.co2CostGross, 0);
    expect(round2(r.totalCO2Cost)).toBe(round2(totalFromSegments));
    expect(r.totalEmissionsKg).toBeGreaterThan(0);
    expect(r.notes.some((n) => n.includes('Jahresübergreifend'))).toBe(true);
  });
});

// ===================================================================
// 14. STAGE MODEL (STUFENMODELL) BOUNDARIES
// ===================================================================

describe('Stufenmodell boundary cases', () => {
  it('step 1: < 12 kg → 100% tenant / 0% landlord', () => {
    const r = lookupStufenmodell(11.99);
    expect(r.step).toBe(1);
    expect(r.tenantPercent).toBe(100);
    expect(r.landlordPercent).toBe(0);
  });

  it('step 2: exactly 12 kg → 90/10', () => {
    const r = lookupStufenmodell(12);
    expect(r.step).toBe(2);
    expect(r.tenantPercent).toBe(90);
    expect(r.landlordPercent).toBe(10);
  });

  it('step 10: >= 52 kg → 5/95', () => {
    const r = lookupStufenmodell(52);
    expect(r.step).toBe(10);
    expect(r.tenantPercent).toBe(5);
    expect(r.landlordPercent).toBe(95);
  });

  it('step 10: very high emissions', () => {
    const r = lookupStufenmodell(200);
    expect(r.step).toBe(10);
    expect(r.tenantPercent).toBe(5);
    expect(r.landlordPercent).toBe(95);
  });
});

// ===================================================================
// 15. CO2 PRICE BY YEAR
// ===================================================================

describe('CO2 price per year correctness', () => {
  it('2023 gas: uses 30 €/t', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodEnd: '2023-12-31',
      fuelType: 'erdgas',
      fuelAmount: 10000,
      buildingArea: 100,
    });
    expect(r.co2PricePerTon).toBe(30);
  });

  it('2024 gas: uses 45 €/t', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodEnd: '2024-12-31',
      fuelType: 'erdgas',
      fuelAmount: 10000,
      buildingArea: 100,
    });
    expect(r.co2PricePerTon).toBe(45);
  });

  it('2025 gas: uses 55 €/t', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodEnd: '2025-12-31',
      fuelType: 'erdgas',
      fuelAmount: 10000,
      buildingArea: 100,
    });
    expect(r.co2PricePerTon).toBe(55);
  });
});

// ===================================================================
// 16. HEIZÖL FULL ALLOCATION CASE
// ===================================================================

describe('Standard residential Heizöl full case', () => {
  it('calculates correctly for 3000 liters', () => {
    const r = calculateCO2Allocation({
      buildingType: 'wohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodStart: '2023-01-01',
      billingPeriodEnd: '2023-12-31',
      fuelType: 'heizoel',
      fuelAmount: 3000,
      buildingArea: 200,
    });
    // 3000 × 10.0625 = 30187.5 kWh
    // 30187.5 × 0.2664 = 8037.93 kg CO2
    expect(round2(r.totalEmissionsKg)).toBe(8037.93);
    // 8037.93 / 200 = 40.19 kg/m²/a → step 7 (37-42)
    expect(round2(r.emissionsPerSqmYear)).toBe(40.19);
    expect(r.stufenmodellStep).toBe(7);
    expect(r.tenantPercent).toBe(40);
    expect(r.landlordPercent).toBe(60);
  });
});

// ===================================================================
// 17. NON-RESIDENTIAL WITH ERDGAS
// ===================================================================

describe('Non-residential Erdgas 50/50', () => {
  it('ignores stage model, applies 50/50', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude',
      restrictionCase: 'fall3',
      billingPeriodEnd: '2024-12-31',
      fuelType: 'erdgas',
      fuelAmount: 20000,
      buildingArea: 500,
    });
    expect(r.landlordPercent).toBe(50);
    expect(r.tenantPercent).toBe(50);
    expect(r.stufenmodellStep).toBe(0);
    // CO2 still calculated correctly
    expect(round2(r.totalEmissionsKg)).toBe(round2(20000 * 0.20088));
    expect(r.totalCO2Cost).toBeGreaterThan(0);
  });
});

// ===================================================================
// 18. NET / GROSS CONSISTENCY
// ===================================================================

describe('Net/Gross consistency (7% VAT)', () => {
  it('gross = net × 1.07 for standard fuel', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30);
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.07));
  });

  it('gross = net × 1.07 for heizoel', () => {
    const r = calculateSingleFuel('heizoel', 1000, 45);
    expect(round2(r.co2CostGross)).toBe(round2(r.co2CostNet * 1.07));
  });
});
