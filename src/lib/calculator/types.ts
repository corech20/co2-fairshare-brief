export type UserRole = 'vermieter' | 'mieter';
export type BuildingType = 'wohngebaeude' | 'nichtwohngebaeude';
export type HeatSupplyType = 'zentral' | 'fernwaerme' | 'etage';
export type RestrictionCase = 'fall1' | 'fall2' | 'fall1und2' | 'fall3';

export type FuelType =
  | 'erdgas'
  | 'heizoel'
  | 'fluessiggas'
  | 'pellets'
  | 'hackschnitzel'
  | 'abfallholz'
  | 'braunkohle'
  | 'fernwaerme'
  | 'erdgas_kwk'
  | 'fluessiggas_kwk'
  | 'heizoel_kwk';

export interface FuelEntry {
  fuelType: FuelType;
  amount: number; // raw input amount in native unit
  emissionFactorCustom?: number; // for fernwaerme
}

export interface WizardData {
  userRole?: UserRole;
  buildingType?: BuildingType;
  heatSupplyType?: HeatSupplyType;
  restrictionCase?: RestrictionCase;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  fuelType?: FuelType;
  buildingArea?: number;
  apartmentArea?: number;
  fuelAmount?: number;
  co2CostDirect?: number;
  emissionFactorCustom?: number;
  // Multi-fuel support (future)
  fuelEntries?: FuelEntry[];
  // Letter fields
  tenantName?: string;
  tenantAddress?: string;
  landlordName?: string;
  landlordAddress?: string;
}

export interface FuelCalculationResult {
  fuelType: FuelType;
  fuelLabel: string;
  inputAmount: number;
  energyHeatingValueKwh: number;
  emissionFactor: number;
  co2Kg: number;
  co2CostNet: number;
  co2CostGross: number;
}

export interface CalculationResult {
  totalEmissionsKg: number;
  emissionsPerSqmYear: number;
  co2PricePerTon: number;
  totalCO2Cost: number;
  landlordShare: number;
  tenantShare: number;
  landlordPercent: number;
  tenantPercent: number;
  baseLandlordPercent: number;
  baseTenantPercent: number;
  stufenmodellStep: number;
  fuelLabel: string;
  emissionFactor: number;
  totalEnergyHeatingValueKwh: number;
  weightedEmissionFactor: number;
  fuelResults: FuelCalculationResult[];
  billingYear: number;
  relevantArea: number;
  restrictionApplied: RestrictionCase;
}

export interface StufenmodellEntry {
  maxEmissionsPerSqm: number;
  tenantPercent: number;
  landlordPercent: number;
}

export const WIZARD_STEPS = [
  'userRole',
  'buildingType',
  'heatSupply',
  'restriction',
  'billingPeriod',
  'fuelSource',
  'inputValues',
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];
