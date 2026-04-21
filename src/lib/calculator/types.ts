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
  | 'abfallholz' // kept internally for backward compat, not shown in UI
  | 'braunkohle'
  | 'fernwaerme'
  | 'erdgas_kwk'
  | 'fluessiggas_kwk'
  | 'heizoel_kwk';

export type CostInputType = 'brutto' | 'netto';

/** Output type for PDF generation */
export type OutputType = 'calculation' | 'letter_tenant_reimbursement' | 'letter_landlord_info';

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

/** A yearly segment for cross-year billing periods */
export interface YearlySegment {
  year: number;
  periodStart: string;
  periodEnd: string;
  /** Fuel amounts per segment – one per fuel entry or single fuel */
  amount: number;
  co2PricePerTon: number;
}

/** Per-segment calculation result */
export interface SegmentResult {
  year: number;
  periodStart: string;
  periodEnd: string;
  amount: number;
  co2PricePerTon: number;
  co2Kg: number;
  co2CostNet: number;
  co2CostGross: number;
  energyHeatingValueKwh: number;
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
  /** Cross-year billing: yearly segment data */
  yearlySegments?: YearlySegment[];
  /** Fernwärme-Sonderfall: Erstmaliger Anschluss ab dem 1. Januar 2023 → CO2KostAufG nicht anwendbar */
  districtHeatingConnectedAfter2023?: boolean;
  /**
   * Whitelist-Trigger für den Erstattungs-/Brief-Flow:
   * true  = Mieter ist selbst Vertragspartner des Brennstoff-/Wärmelieferanten
   *         und erhält eine eigene Rechnung (Selbstversorgung / Direktbelieferung).
   * false = Versorgung läuft über Vermieter / Nebenkostenabrechnung.
   * Bei Etagenheizung (eigene Wohnungsheizung) implizit true.
   * Bei Vermieter-Rolle immer false.
   */
  tenantIsDirectContractParty?: boolean;
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
  /** Actual emissions per m² for the billing period (not annualized) */
  emissionsPerSqmYear: number;
  co2PricePerTon: number;
  /** Total CO2 cost including VAT (gross) */
  totalCO2Cost: number;
  /** Total CO2 cost excluding VAT (net) */
  totalCO2CostNet: number;
  /** Applied VAT rate (e.g. 1.07 or 1.19) for transparency */
  appliedVATRate: number;
  /** Human-readable VAT percentage (e.g. "7" or "19") */
  vatPercent: number;
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
  /** Cross-year: was the calculation split by year segments? */
  isCrossYear: boolean;
  /** Per-segment results for cross-year calculations */
  segmentResults?: SegmentResult[];
  /** Annualization factor applied for stage classification (only if < full year) */
  annualizationFactor?: number;
  /** Annualized emissions per m²/year used ONLY for stage classification */
  emissionsPerSqmAnnualized?: number;
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
