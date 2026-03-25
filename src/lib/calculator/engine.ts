import type { WizardData, CalculationResult, StufenmodellEntry, FuelType } from './types';

// Emission factors in kg CO2 per kWh (based on Heizwert)
const EMISSION_FACTORS: Record<string, number> = {
  erdgas: 0.20088,
  heizoel: 0.266,
  // fernwaerme: user-provided
};

// Erdgas: Brennwert-to-Heizwert conversion factor (3.2508 / 3.6)
const ERDGAS_BRENNWERT_TO_HEIZWERT = 3.2508 / 3.6; // ≈ 0.903

// Heizöl: 1 liter ≈ 10 kWh
const HEIZOEL_KWH_PER_LITER = 10;

// VAT rate applied to CO2 costs (7% reduced rate)
const CO2_COST_VAT_RATE = 1.07;

// CO2 price per ton in EUR by year
const CO2_PRICE_BY_YEAR: Record<number, number> = {
  2021: 25,
  2022: 30,
  2023: 30,
  2024: 45,
  2025: 55,
  2026: 65,
};

// 10-Stufen-Modell for Wohngebäude (CO2KostAufG §5)
const STUFEN_MODELL_WOHN: StufenmodellEntry[] = [
  { maxEmissionsPerSqm: 12, tenantPercent: 100, landlordPercent: 0 },
  { maxEmissionsPerSqm: 17, tenantPercent: 90, landlordPercent: 10 },
  { maxEmissionsPerSqm: 22, tenantPercent: 80, landlordPercent: 20 },
  { maxEmissionsPerSqm: 27, tenantPercent: 70, landlordPercent: 30 },
  { maxEmissionsPerSqm: 32, tenantPercent: 60, landlordPercent: 40 },
  { maxEmissionsPerSqm: 37, tenantPercent: 50, landlordPercent: 50 },
  { maxEmissionsPerSqm: 42, tenantPercent: 40, landlordPercent: 60 },
  { maxEmissionsPerSqm: 47, tenantPercent: 30, landlordPercent: 70 },
  { maxEmissionsPerSqm: 52, tenantPercent: 20, landlordPercent: 80 },
  { maxEmissionsPerSqm: Infinity, tenantPercent: 5, landlordPercent: 95 },
];

export function getEmissionFactor(fuelType: FuelType, customFactor?: number): number {
  if (fuelType === 'fernwaerme') {
    return customFactor ?? 0.18; // default fallback
  }
  return EMISSION_FACTORS[fuelType] ?? 0.201;
}

export function getCO2PriceForYear(year: number): number {
  return CO2_PRICE_BY_YEAR[year] ?? CO2_PRICE_BY_YEAR[2025];
}

export function getFuelLabel(fuelType: FuelType): string {
  const labels: Record<FuelType, string> = {
    erdgas: 'Erdgas',
    heizoel: 'Heizöl',
    fernwaerme: 'Fernwärme',
  };
  return labels[fuelType] ?? fuelType;
}

function getFuelAmountInKWh(fuelType: FuelType, amount: number): number {
  if (fuelType === 'heizoel') {
    return amount * HEIZOEL_KWH_PER_LITER;
  }
  if (fuelType === 'erdgas') {
    // Gas bills report Brennwert kWh; convert to Heizwert for emission calc
    return amount * ERDGAS_BRENNWERT_TO_HEIZWERT;
  }
  return amount; // already in kWh for fernwaerme
}

function lookupStufenmodell(emissionsPerSqm: number, isWohn: boolean): { tenantPercent: number; landlordPercent: number; step: number } {
  if (!isWohn) {
    // Nichtwohngebäude: 50/50 split
    return { tenantPercent: 50, landlordPercent: 50, step: 0 };
  }

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

export function calculateCO2Allocation(data: WizardData): CalculationResult {
  const fuelType = data.fuelType ?? 'erdgas';
  const emissionFactor = getEmissionFactor(fuelType, data.emissionFactorCustom);
  const fuelAmountKWh = getFuelAmountInKWh(fuelType, data.fuelAmount ?? 0);

  // Total emissions in kg CO2
  const totalEmissionsKg = fuelAmountKWh * emissionFactor;

  // Area to use: building area for the full building calculation
  const area = data.buildingArea ?? data.apartmentArea ?? 1;
  const emissionsPerSqmYear = totalEmissionsKg / area;

  // Determine billing year for CO2 price
  const billingYear = data.billingPeriodEnd
    ? new Date(data.billingPeriodEnd).getFullYear()
    : new Date().getFullYear();
  const co2PricePerTon = getCO2PriceForYear(billingYear);

  // Total CO2 cost
  let totalCO2Cost: number;
  if (data.co2CostDirect && data.co2CostDirect > 0) {
    totalCO2Cost = data.co2CostDirect;
  } else {
    totalCO2Cost = (totalEmissionsKg / 1000) * co2PricePerTon * CO2_COST_VAT_RATE;
  }

  const isWohn = data.buildingType !== 'nichtwohngebaeude';
  const { tenantPercent, landlordPercent, step } = lookupStufenmodell(emissionsPerSqmYear, isWohn);

  const landlordShare = totalCO2Cost * (landlordPercent / 100);
  const tenantShare = totalCO2Cost * (tenantPercent / 100);

  return {
    totalEmissionsKg,
    emissionsPerSqmYear,
    co2PricePerTon,
    totalCO2Cost,
    landlordShare,
    tenantShare,
    landlordPercent,
    tenantPercent,
    stufenmodellStep: step,
    fuelLabel: getFuelLabel(fuelType),
    emissionFactor,
  };
}
