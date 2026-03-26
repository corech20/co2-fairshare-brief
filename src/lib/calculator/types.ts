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

export type CostInputType = 'brutto' | 'netto';

export interface FuelEntry {
  fuelType: FuelType;
  amount: number;
  emissionFactorCustom?: number;
  co2CostDirect?: number;
  co2CostDirectType?: CostInputType;
}

export interface AddressData {
  salutation?: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  apartmentDesignation?: string;
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
  co2CostDirectType?: CostInputType;
  emissionFactorCustom?: number;
  fuelEntries?: FuelEntry[];
  /** Structured address for landlord */
  landlordAddress?: AddressData;
  /** Structured address for tenant */
  tenantAddress?: AddressData;
  /** Building address if different */
  buildingAddress?: string;
  /** Heat supplier name */
  heatSupplierName?: string;
  /** Legacy flat fields – kept for backward compat */
  tenantName?: string;
  tenantAddressFlat?: string;
  landlordName?: string;
  landlordAddressFlat?: string;
  /** Tenant path: extra gas device without separate meter (5% reduction) */
  hasExtraGasDevice?: boolean;
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
  usedDirectCost: boolean;
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
  restrictionNote?: string;
  isResidential: boolean;
  usedDirectCost: boolean;
  /** 5% reduction for tenant apartment heating with extra gas device */
  reimbursementReductionApplied: boolean;
  reimbursementReductionPercent: number;
  /** Pre-reduction landlord amount (for display) */
  landlordShareBeforeReduction?: number;
  notes: string[];
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
