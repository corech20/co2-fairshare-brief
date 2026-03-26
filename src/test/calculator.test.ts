import { describe, it, expect } from 'vitest';
import { calculateCO2Allocation, calculateSingleFuel, lookupStufenmodell, applyRestrictionModifier, validateBillingPeriod, isCrossYearPeriod, getYearBoundaries } from '../lib/calculator/engine';
import type { WizardData } from '../lib/calculator/types';

function round2(n: number) { return Math.round(n * 100) / 100; }

// ===== EXISTING REFERENCE CASES (must not regress) =====

describe('Reference Case 1: Natural Gas', () => {
  const data: WizardData = {
    userRole: 'vermieter', buildingType: 'wohngebaeude', heatSupplyType: 'zentral',
    restrictionCase: 'fall3', billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
    fuelType: 'erdgas', fuelAmount: 45000, buildingArea: 290,
  };

  it('matches all expected values', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalEmissionsKg)).toBe(8162.76);
    expect(round2(r.emissionsPerSqmYear)).toBe(28.15);
    expect(round2(r.totalCO2Cost)).toBe(262.02);
    expect(r.tenantPercent).toBe(60);
    expect(r.landlordPercent).toBe(40);
    expect(round2(r.tenantShare)).toBe(157.21);
    expect(round2(r.landlordShare)).toBe(104.81);
    expect(r.stufenmodellStep).toBe(5);
    expect(r.isResidential).toBe(true);
    expect(r.restrictionNote).toBeUndefined();
    expect(r.reimbursementReductionApplied).toBe(false);
    expect(r.isCrossYear).toBe(false);
  });
});

describe('Reference Case 2: District Heating', () => {
  const data: WizardData = {
    userRole: 'vermieter', buildingType: 'wohngebaeude', heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall3', billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
    fuelType: 'fernwaerme', fuelAmount: 45000, emissionFactorCustom: 0.1234, buildingArea: 290,
  };

  it('matches all expected values', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalEmissionsKg)).toBe(5553.00);
    expect(round2(r.emissionsPerSqmYear)).toBe(19.15);
    expect(round2(r.totalCO2Cost)).toBe(178.25);
    expect(r.tenantPercent).toBe(80);
    expect(r.landlordPercent).toBe(20);
    expect(round2(r.tenantShare)).toBe(142.60);
    expect(round2(r.landlordShare)).toBe(35.65);
  });
});

describe('Reference Case 3: District Heating with Restriction', () => {
  const data: WizardData = {
    userRole: 'vermieter', buildingType: 'wohngebaeude', heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall2', billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
    fuelType: 'fernwaerme', fuelAmount: 45000, emissionFactorCustom: 0.1234, buildingArea: 290,
  };

  it('matches all expected values with restriction modifier', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalCO2Cost)).toBe(178.25);
    expect(r.baseLandlordPercent).toBe(20);
    expect(r.baseTenantPercent).toBe(80);
    expect(r.landlordPercent).toBe(10);
    expect(r.tenantPercent).toBe(90);
    expect(round2(r.tenantShare)).toBe(160.43);
    expect(round2(r.landlordShare)).toBe(17.83);
  });
});

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

describe('Non-residential building logic', () => {
  it('standard case is 50/50, no stage model', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude', restrictionCase: 'fall3',
      billingPeriodEnd: '2023-12-31', fuelType: 'erdgas', fuelAmount: 45000, buildingArea: 290,
    });
    expect(r.landlordPercent).toBe(50);
    expect(r.tenantPercent).toBe(50);
    expect(r.stufenmodellStep).toBe(0);
    expect(r.isResidential).toBe(false);
  });

  it('fall1und2 gives 100% tenant', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude', restrictionCase: 'fall1und2',
      billingPeriodEnd: '2023-12-31', fuelType: 'erdgas', fuelAmount: 45000, buildingArea: 290,
    });
    expect(r.landlordPercent).toBe(0);
    expect(r.tenantPercent).toBe(100);
  });

  it('single restriction stays 50/50 with note', () => {
    const r = calculateCO2Allocation({
      buildingType: 'nichtwohngebaeude', restrictionCase: 'fall2',
      billingPeriodEnd: '2023-12-31', fuelType: 'erdgas', fuelAmount: 45000, buildingArea: 290,
    });
    expect(r.landlordPercent).toBe(50);
    expect(r.tenantPercent).toBe(50);
    expect(r.restrictionNote).toBeDefined();
  });
});

describe('Biomass fuel handling', () => {
  it('pellets have zero CO2 cost but positive emissions', () => {
    const r = calculateSingleFuel('pellets', 1000, 30);
    expect(r.co2Kg).toBeGreaterThan(0);
    expect(r.co2CostGross).toBe(0);
  });

  it('hackschnitzel have zero CO2 cost', () => {
    const r = calculateSingleFuel('hackschnitzel', 1000, 30);
    expect(r.co2Kg).toBeGreaterThan(0);
    expect(r.co2CostGross).toBe(0);
  });
});

// ===== ADVANCED TEST CASES =====

describe('Case A: Tenant + apartment heating + extra gas device (5% reduction)', () => {
  const data: WizardData = {
    userRole: 'mieter', buildingType: 'wohngebaeude', heatSupplyType: 'etage',
    restrictionCase: 'fall3', billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
    fuelType: 'erdgas', fuelAmount: 12000, apartmentArea: 75, hasExtraGasDevice: true,
  };

  it('applies 5% reduction to landlord reimbursement', () => {
    const r = calculateCO2Allocation(data);
    expect(r.reimbursementReductionApplied).toBe(true);
    expect(r.reimbursementReductionPercent).toBe(5);
    expect(r.landlordShareBeforeReduction).toBeDefined();
    expect(r.landlordShare).toBeLessThan(r.landlordShareBeforeReduction!);
    expect(round2(r.landlordShare)).toBe(round2(r.landlordShareBeforeReduction! * 0.95));
    expect(r.notes.some(n => n.includes('5 %'))).toBe(true);
  });

  it('does NOT apply reduction without extra gas device', () => {
    const r = calculateCO2Allocation({ ...data, hasExtraGasDevice: false });
    expect(r.reimbursementReductionApplied).toBe(false);
    expect(r.landlordShareBeforeReduction).toBeUndefined();
  });
});

describe('Case B: Multiple fuels (heating oil + pellets)', () => {
  const data: WizardData = {
    userRole: 'vermieter', buildingType: 'wohngebaeude', heatSupplyType: 'zentral',
    restrictionCase: 'fall3', billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
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
    expect(r.fuelResults[1].co2CostGross).toBe(0);
    expect(round2(r.totalEmissionsKg)).toBe(round2(r.fuelResults[0].co2Kg + r.fuelResults[1].co2Kg));
    expect(round2(r.totalCO2Cost)).toBe(round2(r.fuelResults[0].co2CostGross + r.fuelResults[1].co2CostGross));
    expect(r.weightedEmissionFactor).toBeGreaterThan(0);
    expect(r.weightedEmissionFactor).toBe(r.totalEmissionsKg / r.totalEnergyHeatingValueKwh);
    expect(r.notes.some(n => n.includes('2 Brennstoffen'))).toBe(true);
    expect(r.isCrossYear).toBe(false);
  });
});

describe('Case C: District heating apartment path (tenant)', () => {
  const data: WizardData = {
    userRole: 'mieter', buildingType: 'wohngebaeude', heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall3', billingPeriodStart: '2023-01-01', billingPeriodEnd: '2023-12-31',
    fuelType: 'fernwaerme', fuelAmount: 8000, emissionFactorCustom: 0.15, apartmentArea: 65,
  };

  it('calculates apartment-level district heating result', () => {
    const r = calculateCO2Allocation(data);
    expect(r.relevantArea).toBe(65);
    expect(round2(r.totalEmissionsKg)).toBe(1200);
    expect(round2(r.emissionsPerSqmYear)).toBe(round2(1200 / 65));
    expect(r.totalCO2Cost).toBeGreaterThan(0);
    expect(r.notes.some(n => n.includes('Wohnungsfläche'))).toBe(true);
  });
});

describe('Direct CO2 cost input (net/gross)', () => {
  it('uses gross cost directly when type is brutto', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 100, 'brutto');
    expect(r.usedDirectCost).toBe(true);
    expect(round2(r.co2CostGross)).toBe(100);
  });

  it('converts net to gross with VAT when type is netto', () => {
    const r = calculateSingleFuel('erdgas', 10000, 30, undefined, 100, 'netto');
    expect(r.usedDirectCost).toBe(true);
    expect(round2(r.co2CostGross)).toBe(107);
    expect(round2(r.co2CostNet)).toBe(100);
  });
});

describe('CHP variants', () => {
  it('natural gas CHP applies heat share factor', () => {
    const r = calculateSingleFuel('erdgas_kwk', 45000, 30);
    expect(round2(r.energyHeatingValueKwh)).toBe(round2(45000 * (3.2508 / 3.6) * 0.4375));
    expect(r.co2Kg).toBeGreaterThan(0);
    expect(r.co2CostGross).toBeGreaterThan(0);
  });

  it('heating oil CHP applies heat share factor', () => {
    const r = calculateSingleFuel('heizoel_kwk', 3000, 30);
    expect(round2(r.energyHeatingValueKwh)).toBe(round2(3000 * 10.0625 * 0.3984));
    expect(r.co2Kg).toBeGreaterThan(0);
  });
});

// ===== NEW: Billing period validation =====

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

describe('Cross-year calculation', () => {
  it('calculates with separate CO2 prices per year segment', () => {
    const data: WizardData = {
      userRole: 'vermieter', buildingType: 'wohngebaeude', heatSupplyType: 'zentral',
      restrictionCase: 'fall3', billingPeriodStart: '2024-02-01', billingPeriodEnd: '2025-01-31',
      fuelType: 'erdgas', buildingArea: 290,
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
    // Total should be sum of segments
    const totalFromSegments = r.segmentResults!.reduce((s, seg) => s + seg.co2CostGross, 0);
    expect(round2(r.totalCO2Cost)).toBe(round2(totalFromSegments));
    expect(r.totalEmissionsKg).toBeGreaterThan(0);
    expect(r.notes.some(n => n.includes('Jahresübergreifend'))).toBe(true);
  });
});
