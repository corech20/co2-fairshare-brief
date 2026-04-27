import type {
  WizardData,
  CalculationResult,
  FuelCalculationResult,
  StufenmodellEntry,
  FuelType,
  FuelEntry,
  RestrictionCase,
  CostInputType,
  SegmentResult,
  YearlySegment,
} from './types';

/**
 * Round a number to exactly 2 decimal places (used only for final output values).
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

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

/**
 * Heating value conversion factors (raw input unit → kWh Heizwert).
 *
 * Erdgas: User enters kWh Brennwert (Hs). Conversion to Heizwert (Hi):
 *   Hi = 0.9030 × Hs (per § 3 CO2KostAufG, emissions are Heizwert-based).
 *
 * Fernwärme: User enters kWh directly (already Heizwert).
 *
 * Heizöl: 1 Liter = 10,0461 kWh (Hi)
 * Flüssiggas, Pellets etc.: physical units → kWh (Hi)
 */
const HEATING_VALUE_FACTORS: Record<string, number> = {
  erdgas: 0.9030,
  heizoel: 10.0461,
  fluessiggas: 12.7778,
  pellets: 4.1667,
  hackschnitzel: 4.1667,
  abfallholz: 4.1667,
  braunkohle: 19.7 / 3.6,
  fernwaerme: 1,
  erdgas_kwk: 0.9030,
  fluessiggas_kwk: 12.7778,
  heizoel_kwk: 10.0461,
};

/** CHP heat share factors */
const CHP_HEAT_SHARE: Record<string, number> = {
  erdgas_kwk: 0.4375,
  fluessiggas_kwk: 0.3984,
  heizoel_kwk: 0.3984,
};

/** Fuels where CO2 cost is legally zero (renewable biomass). */
const ZERO_COST_FUELS = new Set<string>(['pellets', 'hackschnitzel']);

/** CO2 price per ton in EUR by year */
const CO2_PRICE_BY_YEAR: Record<number, number> = {
  2021: 25, 2022: 30, 2023: 30, 2024: 45, 2025: 55, 2026: 65,
};

// ---------------------------------------------------------------------------
// VAT RATE LOGIC
// ---------------------------------------------------------------------------

/** Standard VAT rate (19%) */
const STANDARD_VAT_RATE = 1.19;

/** Temporarily reduced VAT rate (7%) for gas/Fernwärme: Oct 2022 – Mar 2024 */
const REDUCED_VAT_RATE = 1.07;

/** Fuels eligible for the temporary 7% VAT reduction */
const GAS_REDUCED_VAT_FUELS = new Set<string>(['erdgas', 'erdgas_kwk', 'fernwaerme']);

/**
 * Determine the applicable VAT rate for CO2 costs.
 *
 * Gas and Fernwärme had a temporarily reduced VAT rate of 7% (Oct 2022 – Mar 2024).
 * All other fuels always use the standard 19% rate.
 *
 * The billing period end date is used as a practical proxy to determine
 * which VAT regime applies.
 */
export function getVATRate(fuelType?: string, billingPeriodEnd?: string): number {
  if (fuelType && GAS_REDUCED_VAT_FUELS.has(fuelType) && billingPeriodEnd) {
    const endDate = new Date(billingPeriodEnd);
    // If billing period ends before April 2024, the temporary 7% rate applies
    if (endDate < new Date('2024-04-01')) {
      return REDUCED_VAT_RATE;
    }
  }
  return STANDARD_VAT_RATE;
}

/**
 * Day-accurate VAT computation for gas/Fernwärme.
 * Handles the 7% → 19% transition on April 1, 2024.
 * For billing periods spanning the boundary, the net cost is split
 * proportionally by days and each portion receives its applicable rate.
 */
function computeVAT(
  netCost: number,
  fuelType: string,
  periodStart?: string,
  periodEnd?: string,
): { grossCost: number; isMixed: boolean; reducedDays: number; standardDays: number } {
  const noMix = (rate: number) => ({
    grossCost: netCost * rate,
    isMixed: false,
    reducedDays: 0,
    standardDays: 0,
  });

  if (netCost === 0) return noMix(1);

  if (!GAS_REDUCED_VAT_FUELS.has(fuelType) || !periodStart || !periodEnd) {
    return noMix(STANDARD_VAT_RATE);
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const boundary = new Date('2024-04-01');

  // Entirely before Apr 1, 2024 → 7 %
  if (end < boundary) return noMix(REDUCED_VAT_RATE);
  // Entirely on/after Apr 1, 2024 → 19 %
  if (start >= boundary) return noMix(STANDARD_VAT_RATE);

  // Mixed: period spans the Apr 1, 2024 boundary
  const dayMs = 1000 * 60 * 60 * 24;
  // Both boundary days count, so total = end - start + 1
  const totalDays = Math.round((end.getTime() - start.getTime()) / dayMs) + 1;
  if (totalDays <= 0) return noMix(STANDARD_VAT_RATE);

  // 01.01–31.03 inclusive = boundary - start (in days) gives the count including start
  const reducedDays = Math.round((boundary.getTime() - start.getTime()) / dayMs);
  const standardDays = totalDays - reducedDays;

  const reducedNet = netCost * (reducedDays / totalDays);
  const standardNet = netCost - reducedNet;

  const grossCost = reducedNet * REDUCED_VAT_RATE + standardNet * STANDARD_VAT_RATE;

  return { grossCost, isMixed: true, reducedDays, standardDays };
}

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
// BILLING PERIOD HELPERS
// ---------------------------------------------------------------------------

export function getBillingPeriodDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function isCrossYearPeriod(start: string, end: string): boolean {
  return new Date(start).getFullYear() !== new Date(end).getFullYear();
}

export function getYearBoundaries(start: string, end: string): { year: number; periodStart: string; periodEnd: string }[] {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    return [{ year: startYear, periodStart: start, periodEnd: end }];
  }

  const segments: { year: number; periodStart: string; periodEnd: string }[] = [];
  for (let yr = startYear; yr <= endYear; yr++) {
    const segStart = yr === startYear ? start : `${yr}-01-01`;
    const segEnd = yr === endYear ? end : `${yr}-12-31`;
    segments.push({ year: yr, periodStart: segStart, periodEnd: segEnd });
  }
  return segments;
}

export function validateBillingPeriod(start?: string, end?: string): string | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Bitte ein gültiges Datum eingeben.';
  const MIN_YEAR = 2023;
  if (s.getFullYear() < MIN_YEAR || e.getFullYear() < MIN_YEAR) {
    return `Es werden nur Abrechnungszeiträume ab dem Jahr ${MIN_YEAR} unterstützt.`;
  }
  if (e <= s) return 'Das Enddatum muss nach dem Startdatum liegen.';
  const days = getBillingPeriodDays(start, end);
  if (days > 365) return 'Der angegebene Zeitraum darf nicht länger als 365 Tage sein.';
  return null;
}

// ---------------------------------------------------------------------------
// ANNUALIZATION HELPERS
// ---------------------------------------------------------------------------

function daysInYear(year: number): number {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

/**
 * Annualize emissions for stage model classification only.
 * CO2 costs are NEVER annualized – they are always based on actual consumption.
 */
function getAnnualizationFactor(start?: string, end?: string): number {
  if (!start || !end) return 1;
  const periodDays = getBillingPeriodDays(start, end);
  if (periodDays <= 0) return 1;

  const endYear = new Date(end).getFullYear();
  const yearDays = daysInYear(endYear);

  if (periodDays >= yearDays - 2) return 1;

  return yearDays / periodDays;
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
  vatRate?: number,
  periodStart?: string,
  periodEnd?: string,
): FuelCalculationResult {
  const heatingValueFactor = HEATING_VALUE_FACTORS[fuelType] ?? 1;
  const chpFactor = CHP_HEAT_SHARE[fuelType] ?? 1;
  const emissionFactor = getEmissionFactor(fuelType, customEmissionFactor);

  // Convert source input to heating value, then round to 2 decimals.
  // The original entered amount is NOT rounded — only the converted result.
  const energyHeatingValueKwh = round2(amount * heatingValueFactor * chpFactor);
  const co2Kg = energyHeatingValueKwh * emissionFactor;

  // Determine gross from net: explicit vatRate takes precedence, then period-based computation
  const applyVAT = (net: number) => {
    if (vatRate != null) return net * vatRate;
    return computeVAT(net, fuelType, periodStart, periodEnd).grossCost;
  };

  // Check for direct cost input
  if (directCost != null && directCost > 0) {
    const co2CostGross = directCostType === 'netto' ? applyVAT(directCost) : directCost;
    const co2CostNet = directCostType === 'netto'
      ? directCost
      : directCost / (vatRate ?? getVATRate(fuelType, periodEnd));
    return {
      fuelType, fuelLabel: getFuelLabel(fuelType), inputAmount: amount,
      energyHeatingValueKwh, emissionFactor, co2Kg,
      co2CostNet, co2CostGross, usedDirectCost: true,
    };
  }

  const isZeroCost = ZERO_COST_FUELS.has(fuelType);
  // Keep full precision – rounding happens only at final output in buildResult
  const co2CostNet = isZeroCost ? 0 : (co2Kg * co2PricePerTon) / 1000;
  const co2CostGross = isZeroCost ? 0 : applyVAT(co2CostNet);

  return {
    fuelType, fuelLabel: getFuelLabel(fuelType), inputAmount: amount,
    energyHeatingValueKwh, emissionFactor, co2Kg,
    co2CostNet, co2CostGross, usedDirectCost: false,
  };
}

// ---------------------------------------------------------------------------
// SINGLE FUEL SEGMENT CALCULATION (for cross-year)
// ---------------------------------------------------------------------------

function calculateFuelSegment(
  fuelType: FuelType,
  amount: number,
  co2PricePerTon: number,
  customEmissionFactor?: number,
  periodStart?: string,
  periodEnd?: string,
): { energyHeatingValueKwh: number; co2Kg: number; co2CostNet: number; co2CostGross: number } {
  const heatingValueFactor = HEATING_VALUE_FACTORS[fuelType] ?? 1;
  const chpFactor = CHP_HEAT_SHARE[fuelType] ?? 1;
  const emissionFactor = getEmissionFactor(fuelType, customEmissionFactor);

  // Convert source input to heating value, then round to 2 decimals.
  const energyHeatingValueKwh = round2(amount * heatingValueFactor * chpFactor);
  const co2Kg = energyHeatingValueKwh * emissionFactor;
  const isZeroCost = ZERO_COST_FUELS.has(fuelType);
  // Keep full precision – rounding happens only at final output in buildResult
  const co2CostNet = isZeroCost ? 0 : (co2Kg * co2PricePerTon) / 1000;
  const co2CostGross = isZeroCost ? 0 : computeVAT(co2CostNet, fuelType, periodStart, periodEnd).grossCost;

  return { energyHeatingValueKwh, co2Kg, co2CostNet, co2CostGross };
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
    // BMWK-compliant: floor (NOT kaufmännisches Runden).
    // Example: base landlord 95 % → floor(95/2) = 47 % (not 48 %).
    // The tenant percentage is the complement so the two values always sum to 100 %.
    const modifiedLandlord = Math.floor(baseLandlordPercent / 2);
    return { landlordPercent: modifiedLandlord, tenantPercent: 100 - modifiedLandlord };
  }

  // Nichtwohngebäude mit genau einer Einschränkung (Fall 1 ODER Fall 2):
  // Vermieteranteil von 50 % wird halbiert → 25 % / 75 %.
  return { landlordPercent: 25, tenantPercent: 75 };
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
    throw new Error('Die Flächenangabe ist erforderlich für die Berechnung.');
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
  const notes: string[] = [];

  // Detect cross-year
  const crossYear = data.billingPeriodStart && data.billingPeriodEnd
    ? isCrossYearPeriod(data.billingPeriodStart, data.billingPeriodEnd)
    : false;

  // Determine primary fuel type and emission factor
  const primaryFuelType = data.fuelType ?? 'erdgas';
  const primaryEmissionFactor = data.emissionFactorCustom;

  // --- Standard same-year calculation ---
  const co2PricePerTon = getCO2PriceForYear(billingYear);

  if (crossYear) {
    notes.push(
      `Jahresübergreifender Zeitraum: Berechnung auf Basis der Gesamtmenge des Rechnungszeitraums. ` +
      `Für die Stufenermittlung werden die Emissionen auf ein Jahr normiert; die CO2-Kosten werden nicht hochgerechnet. ` +
      `Der CO2-Preis des Endjahres (${billingYear}: ${co2PricePerTon} €/t) wird angesetzt.`,
    );
  }

  // --- Direct CO2 emissions input path (standard mode) ---
  // When the user enters CO2 emissions directly (kg), we skip fuel-amount → energy → emissions
  // conversion entirely. CO2 cost = emissions(t) × CO2 price of end-year.
  if (
    !data.expertMode &&
    (!data.fuelEntries || data.fuelEntries.length === 0) &&
    data.co2EmissionsDirect != null && data.co2EmissionsDirect > 0
  ) {
    const co2Kg = data.co2EmissionsDirect;
    const isZeroCost = ZERO_COST_FUELS.has(primaryFuelType);
    let co2CostNet: number;
    let co2CostGross: number;
    let usedDirectCost = false;
    if (data.co2CostDirect != null && data.co2CostDirect > 0) {
      // User provided BOTH emissions and cost → cost wins for the money side
      const isNet = data.co2CostDirectType === 'netto';
      co2CostGross = isNet
        ? computeVAT(data.co2CostDirect, primaryFuelType, data.billingPeriodStart, data.billingPeriodEnd).grossCost
        : data.co2CostDirect;
      co2CostNet = isNet
        ? data.co2CostDirect
        : data.co2CostDirect / getVATRate(primaryFuelType, data.billingPeriodEnd);
      usedDirectCost = true;
    } else if (isZeroCost) {
      co2CostNet = 0;
      co2CostGross = 0;
    } else {
      co2CostNet = (co2Kg * co2PricePerTon) / 1000;
      co2CostGross = computeVAT(co2CostNet, primaryFuelType, data.billingPeriodStart, data.billingPeriodEnd).grossCost;
    }
    const fuelResults: FuelCalculationResult[] = [{
      fuelType: primaryFuelType,
      fuelLabel: getFuelLabel(primaryFuelType),
      inputAmount: 0,
      energyHeatingValueKwh: 0,
      emissionFactor: getEmissionFactor(primaryFuelType, primaryEmissionFactor),
      co2Kg,
      co2CostNet,
      co2CostGross,
      usedDirectCost,
      usedDirectEmissions: true,
    }];
    notes.push('Berechnung auf Basis der direkt eingegebenen CO2-Emissionen (kg) lt. Abrechnung.');
    return buildResult(data, fuelResults, co2PricePerTon, billingYear, notes, crossYear, undefined);
  }

  // Build fuel entries
  const fuelEntries: FuelEntry[] = data.fuelEntries && data.fuelEntries.length > 0
    ? data.fuelEntries
    : [{
        fuelType: primaryFuelType,
        amount: data.fuelAmount ?? 0,
        emissionFactorCustom: primaryEmissionFactor,
        co2CostDirect: data.co2CostDirect,
        co2CostDirectType: data.co2CostDirectType,
      }];

  // Calculate each fuel with day-accurate VAT based on billing period
  const fuelResults: FuelCalculationResult[] = fuelEntries.map(entry => {
    return calculateSingleFuel(
      entry.fuelType, entry.amount, co2PricePerTon,
      entry.emissionFactorCustom, entry.co2CostDirect, entry.co2CostDirectType,
      undefined, data.billingPeriodStart, data.billingPeriodEnd,
    );
  });

  return buildResult(data, fuelResults, co2PricePerTon, billingYear, notes, false, undefined);
}

// ---------------------------------------------------------------------------
// CROSS-YEAR CALCULATION
// ---------------------------------------------------------------------------

function calculateCrossYear(data: WizardData, notes: string[]): CalculationResult {
  const segments = data.yearlySegments!;
  const primaryFuelType = data.fuelType ?? 'erdgas';
  const primaryEmissionFactor = data.emissionFactorCustom;

  const segmentResults: SegmentResult[] = [];
  let totalEnergyKwh = 0;
  let totalCo2Kg = 0;
  let totalCostNet = 0;
  let totalAmount = 0;

  // Step 1: Calculate net costs per segment (each segment uses its own CO2 price)
  for (const seg of segments) {
    const co2Price = getCO2PriceForYear(seg.year);
    const result = calculateFuelSegment(primaryFuelType, seg.amount, co2Price, primaryEmissionFactor, seg.periodStart, seg.periodEnd);
    // Store segment-level gross using per-segment VAT for display, but
    // the overall gross will be recomputed below using full-period VAT
    segmentResults.push({
      year: seg.year,
      periodStart: seg.periodStart,
      periodEnd: seg.periodEnd,
      amount: seg.amount,
      co2PricePerTon: co2Price,
      co2Kg: result.co2Kg,
      co2CostNet: result.co2CostNet,
      co2CostGross: result.co2CostGross,
      energyHeatingValueKwh: result.energyHeatingValueKwh,
    });
    totalEnergyKwh += result.energyHeatingValueKwh;
    totalCo2Kg += result.co2Kg;
    totalCostNet += result.co2CostNet;
    totalAmount += seg.amount;
  }

  // Step 2: Apply VAT to the total net cost using the FULL billing period
  // This ensures the VAT day-split (7%/19% boundary) is calculated across
  // the entire billing period, matching BMWK behavior exactly.
  const totalCostGross = computeVAT(
    totalCostNet, primaryFuelType,
    data.billingPeriodStart, data.billingPeriodEnd,
  ).grossCost;

  const emissionFactor = getEmissionFactor(primaryFuelType, primaryEmissionFactor);

  const fuelResults: FuelCalculationResult[] = [{
    fuelType: primaryFuelType,
    fuelLabel: getFuelLabel(primaryFuelType),
    inputAmount: totalAmount,
    energyHeatingValueKwh: totalEnergyKwh,
    emissionFactor,
    co2Kg: totalCo2Kg,
    co2CostNet: totalCostNet,
    co2CostGross: totalCostGross,
    usedDirectCost: false,
  }];

  const yearsUsed = segments.map(s => `${s.year}: ${getCO2PriceForYear(s.year)} €/t`).join(', ');
  notes.push(`Jahresübergreifende Berechnung mit getrennten CO2-Preisen (${yearsUsed}).`);

  const billingYear = segments[segments.length - 1].year;
  const displayCo2Price = segments[0].co2PricePerTon;

  return buildResult(data, fuelResults, displayCo2Price, billingYear, notes, true, segmentResults);
}

// ---------------------------------------------------------------------------
// BUILD RESULT (shared between same-year and cross-year)
// ---------------------------------------------------------------------------

function buildResult(
  data: WizardData,
  fuelResults: FuelCalculationResult[],
  co2PricePerTon: number,
  billingYear: number,
  notes: string[],
  isCrossYear: boolean,
  segmentResults?: SegmentResult[],
): CalculationResult {
  // Aggregates
  const totalEnergyHeatingValueKwh = fuelResults.reduce((s, r) => s + r.energyHeatingValueKwh, 0);
  const totalEmissionsKg = fuelResults.reduce((s, r) => s + r.co2Kg, 0);
  const totalCO2CostGrossCalc = fuelResults.reduce((s, r) => s + r.co2CostGross, 0);
  const totalCO2CostNetCalc = fuelResults.reduce((s, r) => s + r.co2CostNet, 0);
  const anyDirectCost = fuelResults.some(r => r.usedDirectCost);

  // Round only at the final output stage (BMWK-aligned: VAT applied to raw net, then round)
  const totalCO2Cost = Math.round(totalCO2CostGrossCalc * 100) / 100;
  const totalCO2CostNet = Math.round(totalCO2CostNetCalc * 100) / 100;
  const usedDirectCost = anyDirectCost;

  // Determine the effective VAT rate for display purposes
  const appliedVATRate = totalCO2CostNet > 0
    ? totalCO2Cost / totalCO2CostNet
    : getVATRate(data.fuelType, data.billingPeriodEnd);
  const vatPercent = Math.round((appliedVATRate - 1) * 100);

  const weightedEmissionFactor = totalEnergyHeatingValueKwh > 0
    ? totalEmissionsKg / totalEnergyHeatingValueKwh : 0;

  const isResidential = data.buildingType !== 'nichtwohngebaeude';

  // Determine relevant area
  const { area: relevantArea, source: areaSource } = determineRelevantArea(data);
  if (areaSource === 'apartment') {
    notes.push('Berechnung basiert auf der Wohnungsfläche.');
  }

  // Calculate actual emissions per m² (based on real consumption)
  const emissionsPerSqmActual = totalEmissionsKg / relevantArea;

  // For stage model classification: annualize if period < full year
  const annualizationFactor = getAnnualizationFactor(data.billingPeriodStart, data.billingPeriodEnd);
  const emissionsPerSqmAnnualized = emissionsPerSqmActual * annualizationFactor;

  // Use annualized value for stage classification, actual for display
  const emissionsPerSqmForStage = emissionsPerSqmAnnualized;
  const emissionsPerSqmYear = emissionsPerSqmActual;

  if (annualizationFactor > 1) {
    notes.push(`Für die Einstufung wurden die Emissionen auf ein volles Jahr hochgerechnet (Faktor ${annualizationFactor.toFixed(4)}).`);
  }

  // Stage model (uses annualized emissions for classification)
  const { tenantPercent: baseTenantPercent, landlordPercent: baseLandlordPercent, step } =
    lookupStufenmodell(emissionsPerSqmForStage);

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
      // Genau eine Einschränkung (Fall 1 oder Fall 2): Vermieteranteil halbiert
      landlordPercent = 25;
      tenantPercent = 75;
    }
  }

  // CO2 costs are always based on actual consumption (never annualized).
  // Cent-exact allocation: round only the landlord share, derive tenant as the
  // remainder so landlord + tenant === totalCO2Cost on the cent.
  let landlordShare = Math.round((totalCO2Cost * landlordPercent) / 100 * 100) / 100;
  let tenantShare = Math.round((totalCO2Cost - landlordShare) * 100) / 100;

  // 5% reduction for tenant + apartment heating + extra gas device
  let reimbursementReductionApplied = false;
  let reimbursementReductionPercent = 0;
  let landlordShareBeforeReduction: number | undefined;

  if (
    data.userRole === 'mieter' &&
    data.heatSupplyType === 'etage' &&
    data.hasExtraGasDevice === true &&
    (data.fuelType === 'erdgas' || data.fuelType === 'erdgas_kwk')
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
    totalCO2CostNet,
    appliedVATRate,
    vatPercent,
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
    isCrossYear,
    segmentResults,
    annualizationFactor: annualizationFactor > 1 ? annualizationFactor : undefined,
    emissionsPerSqmAnnualized: annualizationFactor > 1 ? emissionsPerSqmAnnualized : undefined,
  };
}
