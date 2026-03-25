export type UserRole = 'vermieter' | 'mieter';
export type BuildingType = 'wohngebaeude' | 'nichtwohngebaeude';
export type HeatSupplyType = 'zentral' | 'fernwaerme' | 'etage';
export type RestrictionCase = 'fall1' | 'fall2' | 'fall1und2' | 'fall3';
export type FuelType = 'erdgas' | 'heizoel' | 'fernwaerme';

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
  fuelAmount?: number; // kWh for gas/fernwärme, liters for oil
  co2CostDirect?: number; // EUR, optional direct input
  emissionFactorCustom?: number; // kg CO2/kWh, for Fernwärme
  tenantName?: string;
  tenantAddress?: string;
  landlordName?: string;
  landlordAddress?: string;
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
  stufenmodellStep: number;
  fuelLabel: string;
  emissionFactor: number;
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

export type WizardStep = typeof WIZARD_STEPS[number];
