import type {
  WizardData,
  CalculationResult,
  FuelCalculationResult,
  StufenmodellEntry,
  FuelType,
  FuelEntry,
  RestrictionCase,
  CostInputType,
} from './types';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

/** Emission factors in kg CO2 per kWh (Heizwert basis) */
const EMISSION_FACTORS: Record<string, number> = {
  erdgas: 0.20088,
  heizoel: 0.2664,
  fluessiggas: 0.2358,
  pellets: 0.036,
  hackschnitzel: 0.027,
  abfallholz: 0.3132,
  braunkohle: 0.35712,
  erdgas_kwk: 0.20088,
  fluessiggas_kwk: 0.2358,
  heizoel_kwk: 0.2664,
};

/** Heating value conversion factors (raw input unit → kWh Heizwert) */
const HEATING_VALUE_FACTORS: Record<string, number> = {
  erdgas: 3.2508 / 3.6,        // Brennwert→Heizwert = 0.903
  heizoel: 10.0625,             // liters → kWh
  fluessiggas: 12.7778,         // kg → kWh
  pellets: 4.1667,              // kg → kWh
  hackschnitzel: 4.1667,        // kg → kWh
  abfallholz: 4.1667,           // kg → kWh
  braunkohle: 5.3889,           // kg → kWh
  fernwaerme: 1,                // already kWh
  erdgas_kwk: 3.2508 / 3.6,
  fluessiggas_kwk: 12.7778,
  heizoel_kwk: 10.0625,
};

/** CHP heat share factors */
const CHP_HEAT_SHARE: Record<string, number> = {
  erdgas_kwk: 0.4375,
  fluessiggas_kwk: 0.3984,
  heizoel_kwk: 0.3984,
};

/** Fuels where CO2 cost is legally zero (renewable biomass). Altholz is NOT here. */
const ZERO_COST_FUELS = new Set<string>(['pellets', 'hackschnitzel']);

/** CO2 price per ton in EUR by year */
const CO2_PRICE_BY_YEAR: Record<number, number> = {
  2021: 25, 2022: 30, 2023: 30, 2024: 45, 2025: 55, 2026: 65,
};

/** VAT rate on CO2 costs (7% reduced rate) */
const VAT_RATE = 1.07;

/** Human-readable fuel labels */
const FUEL_LABELS: Record<FuelType, string> = {
  erdgas: 'Erdgas',
  heizoel: 'Heizöl',
  fluessiggas: 'Flüssiggas (LPG)',
  pellets: 'Holzpellets',
  hackschnitzel: 'Holzhackschnitzel',
  abfallholz: 'Altholz AI/AII',
  braunkohle: 'Braunkohlebriketts',
  fernwaerme: 'Fernwärme',
  erdgas_kwk: 'Erdgas (KWK)',
  fluessiggas_kwk: 'Flüssiggas (KWK)',
  heizoel_kwk: 'Heizöl (KWK)',
};

// 10-Stufen-Modell for Wohngebäude (CO2KostAufG §5)
const STUFEN_MODELL_WOHN: StufenmodellEntry[] = [
  { maxEmissionsPerSqm: 12,       tenantPercent: 100, landlordPercent: 0 },
  { maxEmissionsPerSqm: 17,       tenantPercent: 90,  landlordPercent: 10 },
  { maxEmissionsPerSqm: 22,       tenantPercent: 80,  landlordPercent: 20 },
  { maxEmissionsPerSqm: 27,       tenantPercent: 70,  landlordPercent: 30 },
  { maxEmissionsPerSqm: 32,       tenantPercent: 60,  landlordPercent: 40 },
  { maxEmissionsPerSqm: 37,       tenantPercent: 50,  landlordPercent: 50 },
  { maxEmissionsPerSqm: 42,       tenantPercent: 40,  landlordPercent: 60 },
  { maxEmissionsPerSqm: 47,       tenantPercent: 30,  landlordPercent: 70 },
  { maxEmissionsPerSqm: 52,       tenantPercent: 20,  landlordPercent: 80 },
  { maxEmissionsPerSqm: Infinity, tenantPercent: 5,   landlordPercent: 95 },
];

/** Tenant apartment heating: 5% reimbursement reduction for extra gas device */
const EXTRA_GAS_DEVICE_REDUCTION = 0.05;

// ---------------------------------------------------------------------------
// PUBLIC HELPERS
// ---------------------------------------------------------------------------

export function getEmissionFactor(fuelType: FuelType, customFactor?: number): number {
  if (fuelType === 'fernwaerme') return customFactor ?? 0;
  return EMISSION_FACTORS[fuelType] ?? 0;
}

export function getCO2PriceForYear(year: number): number {
  return CO2_PRICE_BY_YEAR[year] ?? CO2_PRICE_BY_YEAR[2025];
}

export function getFuelLabel(fuelType: FuelType): string {
  return FUEL_LABELS[fuelType] ?? fuelType;
}

// ---------------------------------------------------------------------------
// SINGLE FUEL CALCULATION
// ---------------------------------------------------------------------------

export function calculateSingleFuel(
  fuelType: FuelType,
  amount: number,
  co2PricePerTon: number,
  customEmissionFactor?: number,
  directCost?: number,
  directCostType?: CostInputType,
): FuelCalculationResult {
  const heatingValueFactor = HEATING_VALUE_FACTORS[fuelType] ?? 1;
  const chpFactor = CHP_HEAT_SHARE[fuelType] ?? 1;
  const emissionFactor = getEmissionFactor(fuelType, customEmissionFactor);

  const energyHeatingValueKwh = amount * heatingValueFactor * chpFactor;
  const co2Kg = energyHeatingValueKwh * emissionFactor;

  // Check for direct cost input
  if (directCost != null && directCost > 0) {
    const co2CostGross = directCostType === 'netto' ? directCost * VAT_RATE : directCost;
    const co2CostNet = directCostType === 'netto' ? directCost : directCost / VAT_RATE;
    return {
      fuelType, fuelLabel: getFuelLabel(fuelType), inputAmount: amount,
      energyHeatingValueKwh, emissionFactor, co2Kg,
      co2CostNet, co2CostGross, usedDirectCost: true,
    };
  }

  const isZeroCost = ZERO_COST_FUELS.has(fuelType);
  const co2CostNet = isZeroCost ? 0 : (co2Kg * co2PricePerTon) / 1000;
  const co2CostGross = isZeroCost ? 0 : co2CostNet * VAT_RATE;

  return {
    fuelType, fuelLabel: getFuelLabel(fuelType), inputAmount: amount,
    energyHeatingValueKwh, emissionFactor, co2Kg,
    co2CostNet, co2CostGross, usedDirectCost: false,
  };
}

// ---------------------------------------------------------------------------
// STUFEN-MODELL LOOKUP
// ---------------------------------------------------------------------------

export function lookupStufenmodell(
  emissionsPerSqm: number,
): { tenantPercent: number; landlordPercent: number; step: number } {
  for (let i = 0; i < STUFEN_MODELL_WOHN.length; i++) {
    if (emissionsPerSqm < STUFEN_MODELL_WOHN[i].maxEmissionsPerSqm) {
      return {
        tenantPercent: STUFEN_MODELL_WOHN[i].tenantPercent,
        landlordPercent: STUFEN_MODELL_WOHN[i].landlordPercent,
        step: i + 1,
      };
    }
  }
  const last = STUFEN_MODELL_WOHN[STUFEN_MODELL_WOHN.length - 1];
  return { tenantPercent: last.tenantPercent, landlordPercent: last.landlordPercent, step: 10 };
}

// ---------------------------------------------------------------------------
// RESTRICTION CASE MODIFIER
// ---------------------------------------------------------------------------

export function applyRestrictionModifier(
  baseLandlordPercent: number,
  baseTenantPercent: number,
  restriction: RestrictionCase,
  isResidential: boolean,
): { landlordPercent: number; tenantPercent: number; restrictionNote?: string } {
  if (restriction === 'fall3') {
    if (!isResidential) return { landlordPercent: 50, tenantPercent: 50 };
    return { landlordPercent: baseLandlordPercent, tenantPercent: baseTenantPercent };
  }

  if (restriction === 'fall1und2') {
    return { landlordPercent: 0, tenantPercent: 100 };
  }

  // fall1 or fall2
  if (isResidential) {
    const modifiedLandlord = Math.round(baseLandlordPercent / 2);
    return { landlordPercent: modifiedLandlord, tenantPercent: 100 - modifiedLandlord };
  }

  return {
    landlordPercent: 50, tenantPercent: 50,
    restrictionNote: 'Bei Nichtwohngebäuden mit einzelnen öffentlich-rechtlichen Einschränkungen erfolgt hier eine konservative Standardbehandlung. Im Einzelfall kann eine gesonderte rechtliche Prüfung sinnvoll sein.',
  };
}

// ---------------------------------------------------------------------------
// DETERMINE RELEVANT AREA
// ---------------------------------------------------------------------------

export function determineRelevantArea(data: WizardData): { area: number; source: 'building' | 'apartment' } {
  const useApartment = data.heatSupplyType === 'etage' ||
    (data.userRole === 'mieter' && data.heatSupplyType === 'fernwaerme' && !data.buildingArea);

  if (useApartment) {
    if (!data.apartmentArea || data.apartmentArea <= 0) {
      throw new Error('Wohnungsfläche ist erforderlich für die Berechnung bei Etagenheizung oder Wohnungs-Fernwärme.');
    }
    return { area: data.apartmentArea, source: 'apartment' };
  }

  if (!data.buildingArea || data.buildingArea <= 0) {
    if (data.apartmentArea && data.apartmentArea > 0) {
      return { area: data.apartmentArea, source: 'apartment' };
    }
    throw new Error('Gebäudewohnfläche ist erforderlich für die Berechnung.');
  }
  return { area: data.buildingArea, source: 'building' };
}

// ---------------------------------------------------------------------------
// MAIN CALCULATION
// ---------------------------------------------------------------------------

export function calculateCO2Allocation(data: WizardData): CalculationResult {
  const billingYear = data.billingPeriodEnd
    ? new Date(data.billingPeriodEnd).getFullYear()
    : new Date().getFullYear();
  const co2PricePerTon = getCO2PriceForYear(billingYear);
  const notes: string[] = [];

  // Build fuel entries
  const fuelEntries: FuelEntry[] = data.fuelEntries && data.fuelEntries.length > 0
    ? data.fuelEntries
    : [{
        fuelType: data.fuelType ?? 'erdgas',
        amount: data.fuelAmount ?? 0,
        emissionFactorCustom: data.emissionFactorCustom,
        co2CostDirect: data.co2CostDirect,
        co2CostDirectType: data.co2CostDirectType,
      }];

  // Calculate each fuel
  const fuelResults: FuelCalculationResult[] = fuelEntries.map(entry =>
    calculateSingleFuel(
      entry.fuelType, entry.amount, co2PricePerTon,
      entry.emissionFactorCustom, entry.co2CostDirect, entry.co2CostDirectType,
    ),
  );

  // Aggregates
  const totalEnergyHeatingValueKwh = fuelResults.reduce((s, r) => s + r.energyHeatingValueKwh, 0);
  const totalEmissionsKg = fuelResults.reduce((s, r) => s + r.co2Kg, 0);
  const totalCO2CostGrossCalc = fuelResults.reduce((s, r) => s + r.co2CostGross, 0);
  const anyDirectCost = fuelResults.some(r => r.usedDirectCost);

  // Use aggregated direct+calculated costs
  const totalCO2Cost = totalCO2CostGrossCalc;
  const usedDirectCost = anyDirectCost;

  const weightedEmissionFactor = totalEnergyHeatingValueKwh > 0
    ? totalEmissionsKg / totalEnergyHeatingValueKwh : 0;

  const isResidential = data.buildingType !== 'nichtwohngebaeude';

  // Determine relevant area
  const { area: relevantArea, source: areaSource } = determineRelevantArea(data);
  if (areaSource === 'apartment') {
    notes.push('Berechnung basiert auf der Wohnungsfläche.');
  }

  const emissionsPerSqmYear = totalEmissionsKg / relevantArea;

  // Stage model
  const { tenantPercent: baseTenantPercent, landlordPercent: baseLandlordPercent, step } =
    lookupStufenmodell(emissionsPerSqmYear);

  const restriction = data.restrictionCase ?? 'fall3';

  // Determine allocation
  let landlordPercent: number;
  let tenantPercent: number;
  let restrictionNote: string | undefined;

  if (isResidential) {
    if (restriction === 'fall3') {
      landlordPercent = baseLandlordPercent;
      tenantPercent = baseTenantPercent;
    } else {
      const mod = applyRestrictionModifier(baseLandlordPercent, baseTenantPercent, restriction, true);
      landlordPercent = mod.landlordPercent;
      tenantPercent = mod.tenantPercent;
      restrictionNote = mod.restrictionNote;
    }
  } else {
    if (restriction === 'fall3') {
      landlordPercent = 50;
      tenantPercent = 50;
    } else if (restriction === 'fall1und2') {
      landlordPercent = 0;
      tenantPercent = 100;
    } else {
      landlordPercent = 50;
      tenantPercent = 50;
      restrictionNote = 'Bei Nichtwohngebäuden mit einzelnen öffentlich-rechtlichen Einschränkungen erfolgt hier eine konservative Standardbehandlung. Im Einzelfall kann eine gesonderte rechtliche Prüfung sinnvoll sein.';
    }
  }

  let landlordShare = Math.round((totalCO2Cost * landlordPercent) / 100 * 100) / 100;
  let tenantShare = Math.round((totalCO2Cost * tenantPercent) / 100 * 100) / 100;

  // 5% reduction for tenant + apartment heating + extra gas device
  let reimbursementReductionApplied = false;
  let reimbursementReductionPercent = 0;
  let landlordShareBeforeReduction: number | undefined;

  if (
    data.userRole === 'mieter' &&
    data.heatSupplyType === 'etage' &&
    data.hasExtraGasDevice === true
  ) {
    reimbursementReductionApplied = true;
    reimbursementReductionPercent = EXTRA_GAS_DEVICE_REDUCTION * 100;
    landlordShareBeforeReduction = landlordShare;
    landlordShare = Math.round(landlordShare * (1 - EXTRA_GAS_DEVICE_REDUCTION) * 100) / 100;
    tenantShare = Math.round((totalCO2Cost - landlordShare) * 100) / 100;
    notes.push('Der Erstattungsanspruch gegenüber dem Vermieter wurde pauschal um 5 % gekürzt (zusätzliches Gasgerät ohne eigenen Zähler).');
  }

  // Multi-fuel note
  if (fuelResults.length > 1) {
    notes.push(`Berechnung basiert auf ${fuelResults.length} Brennstoffen/Wärmequellen.`);
  }

  const primaryFuel = fuelResults[0];

  return {
    totalEmissionsKg,
    emissionsPerSqmYear,
    co2PricePerTon,
    totalCO2Cost,
    landlordShare,
    tenantShare,
    landlordPercent,
    tenantPercent,
    baseLandlordPercent,
    baseTenantPercent,
    stufenmodellStep: isResidential ? step : 0,
    fuelLabel: primaryFuel?.fuelLabel ?? '',
    emissionFactor: primaryFuel?.emissionFactor ?? 0,
    totalEnergyHeatingValueKwh,
    weightedEmissionFactor,
    fuelResults,
    billingYear,
    relevantArea,
    restrictionApplied: restriction,
    restrictionNote,
    isResidential,
    usedDirectCost,
    reimbursementReductionApplied,
    reimbursementReductionPercent,
    landlordShareBeforeReduction,
    notes,
  };
}
