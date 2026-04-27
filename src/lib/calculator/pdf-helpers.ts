import type { WizardData, CalculationResult, AddressData, FuelCalculationResult } from './types';

// ── Formatters ────────────────────────────────────────────────────────────
export const fmt = {
  currency: (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n),
  number: (n: number, decimals = 2) =>
    new Intl.NumberFormat('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n),
  date: (dateStr?: string) => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
};

// ── Address helpers ───────────────────────────────────────────────────────
export function formatFullName(addr?: AddressData, flatName?: string): string {
  if (addr?.firstName || addr?.lastName) {
    const parts: string[] = [];
    if (addr.salutation) parts.push(addr.salutation);
    if (addr.firstName) parts.push(addr.firstName);
    if (addr.lastName) parts.push(addr.lastName);
    return parts.join(' ');
  }
  return flatName || '';
}

export function formatNameOnly(addr?: AddressData, flatName?: string): string {
  if (addr?.firstName || addr?.lastName) {
    return [addr?.firstName, addr?.lastName].filter(Boolean).join(' ');
  }
  return flatName || '';
}

export function formatAddressLines(addr?: AddressData, flatAddr?: string): string[] {
  if (addr && (addr.street || addr.postalCode || addr.city)) {
    const lines: string[] = [];
    const streetLine = [addr.street, addr.houseNumber].filter(Boolean).join(' ');
    if (streetLine) lines.push(streetLine);
    if (addr.apartmentDesignation) lines.push(addr.apartmentDesignation);
    const cityLine = [addr.postalCode, addr.city].filter(Boolean).join(' ');
    if (cityLine) lines.push(cityLine);
    return lines;
  }
  if (flatAddr) return flatAddr.split(/,\s*|\n/).map(l => l.trim()).filter(Boolean);
  return [];
}

export function getSenderName(data: WizardData): string {
  if (data.userRole === 'mieter') {
    return formatFullName(data.tenantAddress, data.tenantName) || '';
  }
  return formatFullName(data.landlordAddress, data.landlordName) || '';
}

export function getSenderAddressLines(data: WizardData): string[] {
  if (data.userRole === 'mieter') {
    return formatAddressLines(data.tenantAddress, data.tenantAddressFlat);
  }
  return formatAddressLines(data.landlordAddress, data.landlordAddressFlat);
}

export function getRecipientName(data: WizardData): string {
  if (data.userRole === 'mieter') {
    return formatFullName(data.landlordAddress, data.landlordName) || '';
  }
  return formatFullName(data.tenantAddress, data.tenantName) || '';
}

export function getRecipientAddressLines(data: WizardData): string[] {
  if (data.userRole === 'mieter') {
    return formatAddressLines(data.landlordAddress, data.landlordAddressFlat);
  }
  return formatAddressLines(data.tenantAddress, data.tenantAddressFlat);
}

// ── Case detection ────────────────────────────────────────────────────────
export type DocumentCase = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Single source of truth: Ist der Erstattungs-/Brief-Flow zulässig?
 *
 * Whitelist:
 *  - Rolle = Mieter
 *  - UND der Mieter ist selbst Vertragspartner des Lieferanten (eigene Rechnung):
 *      • Etagenheizung / wohnungseigene Heizungsanlage     → implizit ja
 *      • Fernwärme/Nahwärme (Wohn- oder Nichtwohngebäude)  → verbindlich Direktlieferung,
 *        sofern nicht Sonderausschluss „Erstanschluss ab 01.01.2023"
 *
 * In allen anderen Fällen (Sonderausschluss Fernwärme, Vermieter-Rolle) → false.
 */
export function isReimbursementEligible(data: WizardData): boolean {
  if (data.userRole !== 'mieter') return false;
  // Etagenheizung: eigene Wohnungsheizung → eigener Liefervertrag implizit
  if (data.heatSupplyType === 'etage') return true;
  // Fernwärme/Nahwärme: Mieter gilt verbindlich als Direktlieferungsfall,
  // außer beim Sonderausschluss „Erstanschluss ab 01.01.2023" (kein CO2KostAufG).
  if (data.heatSupplyType === 'fernwaerme') {
    return !data.districtHeatingConnectedAfter2023;
  }
  return false;
}

export function getDocumentCase(data: WizardData): DocumentCase {
  const isResident = data.buildingType !== 'nichtwohngebaeude';
  // Eligible tenant reimbursement cases use C/D regardless of building type.
  // (Non-residential tenants with own supplier contract → C, with direct district
  //  heating supply → D. Same letter logic as residential.)
  if (data.userRole === 'mieter' && isReimbursementEligible(data)) {
    return data.heatSupplyType === 'fernwaerme' ? 'D' : 'C';
  }
  if (!isResident) return 'E';
  return data.heatSupplyType === 'fernwaerme' ? 'B' : 'A';
}

// ── Billing period string ─────────────────────────────────────────────────
export function getPeriodString(data: WizardData): string {
  return `${fmt.date(data.billingPeriodStart)} – ${fmt.date(data.billingPeriodEnd)}`;
}

// ── Building / property reference ─────────────────────────────────────────
export function getBuildingReference(data: WizardData): string {
  if (data.buildingAddress) return data.buildingAddress;
  const lines = data.userRole === 'mieter'
    ? formatAddressLines(data.tenantAddress, data.tenantAddressFlat)
    : formatAddressLines(data.landlordAddress, data.landlordAddressFlat);
  return lines.length > 0 ? lines.join(', ') : '';
}

// ── Property label (Gebäude vs Wohnung) ───────────────────────────────────
export function getPropertyLabel(data: WizardData): string {
  const isApartment = data.heatSupplyType === 'etage' || data.heatSupplyType === 'fernwaerme';
  if (data.userRole === 'mieter' && isApartment) {
    return 'Berechnung erstellt für die Wohnung:';
  }
  return 'Berechnung erstellt für das Gebäude:';
}

// ── Subject line ──────────────────────────────────────────────────────────
export function getSubjectLine(data: WizardData, _result: CalculationResult): string {
  const period = getPeriodString(data);
  const docCase = getDocumentCase(data);
  switch (docCase) {
    case 'C':
    case 'D':
      return `Berechnung der CO2-Kosten und Erstattungsanspruch nach dem CO2KostAufG`;
    case 'B':
      return `CO2-Kostenaufteilung für die Wärmeversorgung im Abrechnungszeitraum ${period}`;
    case 'E':
      return `CO2-Kostenaufteilung (Nichtwohngebäude) für den Abrechnungszeitraum ${period}`;
    default:
      return `CO2-Kostenaufteilung für den Abrechnungszeitraum ${period}`;
  }
}

// ── Salutation ────────────────────────────────────────────────────────────
export function getSalutation(data: WizardData): string {
  const recipientAddr = data.userRole === 'mieter' ? data.landlordAddress : data.tenantAddress;
  if (recipientAddr?.lastName) {
    const salut = recipientAddr.salutation;
    if (salut === 'Frau') return `Sehr geehrte Frau ${recipientAddr.lastName},`;
    if (salut === 'Herr') return `Sehr geehrter Herr ${recipientAddr.lastName},`;
    return `Sehr geehrte/r ${recipientAddr.lastName},`;
  }
  const recipientName = getRecipientName(data);
  if (recipientName) return `Sehr geehrte/r ${recipientName},`;
  return 'Sehr geehrte Damen und Herren,';
}

// ── Introductory paragraph ────────────────────────────────────────────────
export function getIntroText(data: WizardData, _result: CalculationResult): string {
  const docCase = getDocumentCase(data);
  const buildingRef = getBuildingReference(data);
  const period = getPeriodString(data);
  const liegenschaft = buildingRef ? ` für die Liegenschaft ${buildingRef}` : '';

  switch (docCase) {
    case 'A':
      return `anbei erhalten Sie die CO2-Kostenaufteilungsrechnung${liegenschaft} im Abrechnungszeitraum ${period}. Die Aufteilung der CO2-Kosten zwischen Vermieter und Mieter erfolgt gemäß dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG).`;
    case 'B':
      return `anbei erhalten Sie die CO2-Kostenaufteilungsrechnung${liegenschaft} im Abrechnungszeitraum ${period}. Die Aufteilung der CO2-Kosten für die Wärmeversorgung des Gebäudes erfolgt gemäß dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG).`;
    case 'C':
      return `anbei erhalten Sie die CO2-Kostenaufteilungsrechnung${liegenschaft} im Abrechnungszeitraum ${period}. Als Mieter/in mit eigener Wärmeversorgung (Etagenheizung) ergibt sich nach dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) ein möglicher Erstattungsanspruch gegenüber dem Vermieter in Höhe des ausgewiesenen Vermieteranteils der CO2-Kosten.`;
    case 'D':
      return `anbei erhalten Sie die CO2-Kostenaufteilungsrechnung${liegenschaft} im Abrechnungszeitraum ${period}. Als Mieter/in mit direkter Wärmebelieferung ergibt sich nach dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) ein möglicher Erstattungsanspruch gegenüber dem Vermieter in Höhe des ausgewiesenen Vermieteranteils der CO2-Kosten.`;
    case 'E':
      if (data.restrictionCase === 'fall1und2') {
        return `anbei erhalten Sie die CO2-Kostenaufteilungsrechnung${liegenschaft} im Abrechnungszeitraum ${period}. Da für das Nichtwohngebäude sowohl Einschränkungen bei der energetischen Verbesserung des Gebäudes (Fall 1) als auch bei der Wärmeversorgung (Fall 2) vorliegen, trägt der Mieter die CO2-Kosten gemäß Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) vollständig.`;
      }
      return `anbei erhalten Sie die CO2-Kostenaufteilungsrechnung${liegenschaft} im Abrechnungszeitraum ${period}. Für das Nichtwohngebäude ergibt sich nach dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) im Regelfall eine hälftige Aufteilung der CO2-Kosten zwischen Mieter und Vermieter.`;
  }
}

// ── Stufenmodell emission range text ──────────────────────────────────────
const STUFEN_RANGES = [
  { min: 0, max: 12 },
  { min: 12, max: 17 },
  { min: 17, max: 22 },
  { min: 22, max: 27 },
  { min: 27, max: 32 },
  { min: 32, max: 37 },
  { min: 37, max: 42 },
  { min: 42, max: 47 },
  { min: 47, max: 52 },
  { min: 52, max: Infinity },
];

export function getStufenmodellRangeText(step: number): string {
  if (step < 1 || step > 10) return '';
  const range = STUFEN_RANGES[step - 1];
  if (step === 1) return `< ${range.max} kg CO2 / m² / a`;
  if (step === 10) return `≥ ${range.min} kg CO2 / m² / a`;
  return `${range.min} bis < ${range.max} kg CO2 / m² / a`;
}

// ── Section 3: Special circumstances text ─────────────────────────────────
export function getSpecialCircumstancesText(data: WizardData, result: CalculationResult): string {
  const restriction = result.restrictionApplied;
  const lines: string[] = [];

  if (restriction === 'fall3') {
    if (result.isResidential) {
      lines.push('Basierend auf den Anwenderangaben bestehen keine öffentlich-rechtlichen Einschränkungen, die eine Abweichung vom gesetzlichen Stufenmodell begründen würden. Die Aufteilung der Kohlendioxidkosten erfolgt daher unverändert nach dem 10-Stufen-Modell gemäß § 5 CO2KostAufG.');
    } else {
      lines.push('Basierend auf den Anwenderangaben bestehen keine öffentlich-rechtlichen Einschränkungen, die eine Abweichung von der hälftigen Aufteilung begründen würden. Die Aufteilung der Kohlendioxidkosten erfolgt daher hälftig (50 % / 50 %) gemäß § 8 CO2KostAufG.');
    }
  } else if (restriction === 'fall1und2') {
    if (result.isResidential) {
      lines.push('Basierend auf den Anwenderangaben liegen sowohl eine Einschränkung bei der energetischen Verbesserung des Gebäudes (Fall 1, z. B. Denkmalschutz) als auch eine Einschränkung bei der Wärmeversorgung (Fall 2, z. B. Anschlusszwang an ein Fernwärmenetz) vor. Gemäß § 7 Abs. 2 CO2KostAufG entfallen die CO2-Kosten in diesem Fall vollständig auf den Mieter (Mieter 100 % / Vermieter 0 %).');
    } else {
      lines.push('Auf Grundlage der ausgewählten rechtlichen Beschränkungen nach § 9 CO2KostAufG erfolgt keine Aufteilung der CO2-Kosten; der Vermieteranteil entfällt vollständig (Mieter 100 % / Vermieter 0 %).');
    }
  } else if (restriction === 'fall1') {
    if (result.isResidential) {
      lines.push('Basierend auf den Anwenderangaben liegt eine Einschränkung bei der energetischen Verbesserung des Gebäudes vor (Fall 1, z. B. Denkmalschutz). Der Vermieteranteil an den CO2-Kosten wird daher gemäß § 9 Abs. 1 CO2KostAufG gegenüber dem Stufenmodell halbiert.');
    } else {
      lines.push('Auf Grundlage der ausgewählten rechtlichen Beschränkung nach § 9 CO2KostAufG reduziert sich der Vermieteranteil bei Nichtwohngebäuden von 50 % auf 25 % (Mieter 75 % / Vermieter 25 %).');
    }
  } else if (restriction === 'fall2') {
    if (result.isResidential) {
      lines.push('Basierend auf den Anwenderangaben liegt eine Einschränkung bei der Wärmeversorgung vor (Fall 2, z. B. Anschlusszwang an ein Fernwärmenetz). Der Vermieteranteil an den CO2-Kosten wird daher gemäß § 9 Abs. 1 CO2KostAufG gegenüber dem Stufenmodell halbiert.');
    } else {
      lines.push('Auf Grundlage der ausgewählten rechtlichen Beschränkung nach § 9 CO2KostAufG reduziert sich der Vermieteranteil bei Nichtwohngebäuden von 50 % auf 25 % (Mieter 75 % / Vermieter 25 %).');
    }
  }

  // Hinweis bei Nichtwohngebäuden mit Einschränkung
  if (!result.isResidential && (restriction === 'fall1' || restriction === 'fall2' || restriction === 'fall1und2')) {
    lines.push('Die Berücksichtigung rechtlicher Beschränkungen erfolgt auf Grundlage der Nutzereingaben und ersetzt keine rechtliche Prüfung oder den gesetzlich erforderlichen Nachweis im Einzelfall.');
  }

  if (result.reimbursementReductionApplied) {
    lines.push(`In der Wohnung befindet sich ein zusätzliches Gasgerät ohne eigenen Zähler (z. B. Gasherd, Gasdurchlauferhitzer). Der Erstattungsanspruch gegenüber dem Vermieter wurde daher gemäß § 5 Abs. 5 CO2KostAufG pauschal um ${result.reimbursementReductionPercent} % gekürzt.`);
  }

  if (result.usedDirectCost) {
    lines.push('Die CO2-Kosten wurden ganz oder teilweise direkt aus der Abrechnung des Wärmelieferanten übernommen.');
  }

  return lines.join('\n\n');
}

// ── Fuel unit label ───────────────────────────────────────────────────────
export function getFuelUnitLabel(fuelType: string): string {
  switch (fuelType) {
    case 'erdgas':
    case 'erdgas_kwk':
    case 'fernwaerme':
      return 'kWh';
    case 'heizoel':
    case 'heizoel_kwk':
      return 'Liter';
    default:
      return 'kg';
  }
}

// ── KWK fuel detection ────────────────────────────────────────────────────
const KWK_FUELS = new Set(['erdgas_kwk', 'fluessiggas_kwk', 'heizoel_kwk']);
export function isKwkFuel(fuelType: string): boolean {
  return KWK_FUELS.has(fuelType);
}
export function getEnergyHeatingValueLabel(fuelType: string): string {
  return isKwkFuel(fuelType)
    ? 'Energiegehalt (Heizwert, bezogen auf den Wärmeanteil bei KWK)'
    : 'Energiegehalt (Heizwert)';
}

// ── Fuel calculation step text ────────────────────────────────────────────
export function getFuelCalculationSteps(fr: FuelCalculationResult): string[] {
  const steps: string[] = [];
  steps.push(`Brennstoff: ${fr.fuelLabel}`);
  if (fr.inputAmount && fr.inputAmount > 0) {
    steps.push(`Menge: ${fmt.number(fr.inputAmount, 0)} ${getFuelUnitLabel(fr.fuelType)}`);
  }
  // Energiegehalt: bei Direkteingabe der Emissionen über Emissionsfaktor zurückrechnen
  const energyKwh = (fr.energyHeatingValueKwh && fr.energyHeatingValueKwh > 0)
    ? fr.energyHeatingValueKwh
    : (fr.emissionFactor > 0 ? fr.co2Kg / fr.emissionFactor : 0);
  steps.push(`${getEnergyHeatingValueLabel(fr.fuelType)}: ${fmt.number(energyKwh, 2)} kWh`);
  steps.push(`Emissionsfaktor: ${fmt.number(fr.emissionFactor, 5)} kg CO2/kWh`);
  steps.push(`CO2-Emissionen: ${fmt.number(fr.co2Kg, 1)} kg`);
  if (fr.usedDirectCost) {
    steps.push(`CO2-Kosten (aus Brennstoff-/Wärmeabrechnung): ${fmt.currency(fr.co2CostGross)} brutto`);
  }
  return steps;
}

// ── Labels ────────────────────────────────────────────────────────────────
export function getHeatSupplyLabel(data: WizardData): string {
  switch (data.heatSupplyType) {
    case 'zentral': return 'Zentrale Heizungsanlage';
    case 'fernwaerme': return 'Fernwärme';
    case 'etage': return 'Etagenheizung';
    default: return '–';
  }
}

export function getBuildingTypeLabel(data: WizardData): string {
  return data.buildingType === 'nichtwohngebaeude' ? 'Nichtwohngebäude' : 'Wohngebäude';
}

// ── Closing text ──────────────────────────────────────────────────────────
export function getClosingText(data: WizardData): string {
  const docCase = getDocumentCase(data);
  if (docCase === 'C' || docCase === 'D') {
    return 'Die vorstehende Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des Kohlendioxidkostenaufteilungsgesetzes (CO2KostAufG). Ich bitte um Erstattung des ausgewiesenen Vermieteranteils an den CO2-Kosten innerhalb der gesetzlich vorgesehenen Frist.\n\nFür Rückfragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen';
  }
  if (docCase === 'E') {
    return 'Die vorstehende Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des Kohlendioxidkostenaufteilungsgesetzes (CO2KostAufG). Diese Mitteilung dient der Information über die Aufteilung der CO2-Kosten gemäß den gesetzlichen Anforderungen für Nichtwohngebäude.\n\nFür Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen';
  }
  return 'Die vorstehende Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des Kohlendioxidkostenaufteilungsgesetzes (CO2KostAufG). Diese Mitteilung dient der Information über die Aufteilung der CO2-Kosten gemäß den gesetzlichen Anforderungen.\n\nFür Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen';
}

// ── Dynamic area label for PDF ────────────────────────────────────────────
export function getAreaLabelForPDF(data: WizardData): string {
  const isTenant = data.userRole === 'mieter';
  if (data.buildingType === 'nichtwohngebaeude') {
    return isTenant ? 'Mietfläche' : 'Gesamtnutzfläche des Gebäudes';
  }
  // Wohngebäude
  const isApartment = data.heatSupplyType === 'etage' ||
    (isTenant && data.heatSupplyType === 'fernwaerme');
  if (isApartment) return 'Wohnfläche der Wohnung';
  return isTenant ? 'Wohnfläche der Wohnung' : 'Gesamtwohnfläche des Gebäudes';
}

// Keep old getSummaryText export for Results.tsx compatibility
export function getSummaryText(data: WizardData, result: CalculationResult): string {
  const docCase = getDocumentCase(data);
  if (docCase === 'C' || docCase === 'D') {
    return `Nach der Berechnung entfallen ${result.landlordPercent} % der CO2-Kosten (${fmt.currency(result.landlordShare)}) auf den Vermieter und ${result.tenantPercent} % (${fmt.currency(result.tenantShare)}) auf den/die Mieter/in.`;
  }
  return `Nach der Berechnung entfallen ${result.landlordPercent} % der CO2-Kosten auf den Vermieter und ${result.tenantPercent} % auf den Mieter.`;
}
