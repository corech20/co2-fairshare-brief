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

export function getDocumentCase(data: WizardData): DocumentCase {
  const isResident = data.buildingType !== 'nichtwohngebaeude';
  if (!isResident) return 'E';
  if (data.userRole === 'mieter') {
    return data.heatSupplyType === 'fernwaerme' ? 'D' : 'C';
  }
  return data.heatSupplyType === 'fernwaerme' ? 'B' : 'A';
}

// ── Billing period string ─────────────────────────────────────────────────
export function getPeriodString(data: WizardData): string {
  return `${fmt.date(data.billingPeriodStart)} – ${fmt.date(data.billingPeriodEnd)}`;
}

// ── Building / property reference ─────────────────────────────────────────
export function getBuildingReference(data: WizardData): string {
  if (data.buildingAddress) return data.buildingAddress;
  // Fall back to recipient address as property reference
  const lines = data.userRole === 'mieter'
    ? formatAddressLines(data.tenantAddress, data.tenantAddressFlat)
    : formatAddressLines(data.landlordAddress, data.landlordAddressFlat);
  return lines.length > 0 ? lines.join(', ') : '';
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
      return `anbei erhalten Sie die CO2-Kostenaufteilungsrechnung${liegenschaft} im Abrechnungszeitraum ${period}. Für das Nichtwohngebäude ergibt sich nach dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) im Regelfall eine hälftige Aufteilung der CO2-Kosten zwischen Mieter und Vermieter.`;
  }
}

// ── Section 3: Special circumstances text ─────────────────────────────────
export function getSpecialCircumstancesText(data: WizardData, result: CalculationResult): string {
  const docCase = getDocumentCase(data);
  const restriction = result.restrictionApplied;
  const lines: string[] = [];

  if (restriction === 'fall3') {
    if (result.isResidential) {
      lines.push('Es liegen keine bekannten öffentlich-rechtlichen Einschränkungen vor, die eine Abweichung vom Stufenmodell begründen. Die Aufteilung erfolgt nach dem gesetzlichen Stufenmodell gemäß § 5 CO2KostAufG.');
    } else {
      lines.push('Es liegen keine bekannten öffentlich-rechtlichen Einschränkungen vor. Für das Nichtwohngebäude gilt die gesetzliche hälftige Aufteilung (50 % / 50 %) gemäß § 8 CO2KostAufG.');
    }
  } else if (restriction === 'fall1und2') {
    lines.push('Es liegen sowohl Einschränkungen bei der energetischen Verbesserung des Gebäudes (Fall 1) als auch bei der Wärmeversorgung (Fall 2) vor. In diesem Fall entfallen die CO2-Kosten vollständig auf den Mieter (100 % / 0 %).');
  } else if (restriction === 'fall1') {
    if (result.isResidential) {
      lines.push('Es liegt eine Einschränkung bei der energetischen Verbesserung des Gebäudes vor (Fall 1, z. B. Denkmalschutz). Der Vermieteranteil wird daher gegenüber dem Stufenmodell halbiert.');
    } else {
      lines.push('Es liegt eine Einschränkung bei der energetischen Verbesserung des Gebäudes vor (Fall 1). Bei Nichtwohngebäuden erfolgt hier eine konservative Standardbehandlung mit hälftiger Aufteilung. Im Einzelfall kann eine gesonderte rechtliche Prüfung sinnvoll sein.');
    }
  } else if (restriction === 'fall2') {
    if (result.isResidential) {
      lines.push('Es liegt eine Einschränkung bei der energetischen Verbesserung der Wärmeversorgung vor (Fall 2, z. B. Anschlusszwang). Der Vermieteranteil wird daher gegenüber dem Stufenmodell halbiert.');
    } else {
      lines.push('Es liegt eine Einschränkung bei der energetischen Verbesserung der Wärmeversorgung vor (Fall 2). Bei Nichtwohngebäuden erfolgt hier eine konservative Standardbehandlung mit hälftiger Aufteilung. Im Einzelfall kann eine gesonderte rechtliche Prüfung sinnvoll sein.');
    }
  }

  if (result.reimbursementReductionApplied) {
    lines.push(`In der Wohnung befindet sich ein zusätzliches Gasgerät ohne eigenen Zähler. Der Erstattungsanspruch gegenüber dem Vermieter wurde daher pauschal um ${result.reimbursementReductionPercent} % gekürzt.`);
  }

  if (result.usedDirectCost) {
    lines.push('Die CO2-Kosten wurden ganz oder teilweise direkt aus der Abrechnung übernommen und nicht rechnerisch ermittelt.');
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

// ── Fuel calculation step text ────────────────────────────────────────────
export function getFuelCalculationSteps(fr: FuelCalculationResult): string[] {
  const steps: string[] = [];
  steps.push(`Brennstoff: ${fr.fuelLabel}`);
  steps.push(`Menge: ${fmt.number(fr.inputAmount, 0)} ${getFuelUnitLabel(fr.fuelType)}`);
  steps.push(`Energiegehalt (Heizwert): ${fmt.number(fr.energyHeatingValueKwh, 0)} kWh`);
  steps.push(`Emissionsfaktor: ${fmt.number(fr.emissionFactor, 5)} kg CO2/kWh`);
  steps.push(`CO2-Emissionen: ${fmt.number(fr.co2Kg, 1)} kg`);
  if (fr.usedDirectCost) {
    steps.push(`CO2-Kosten (direkt übernommen): ${fmt.currency(fr.co2CostGross)} brutto`);
  } else {
    steps.push(`CO2-Kosten netto: ${fmt.currency(fr.co2CostNet)}`);
    steps.push(`CO2-Kosten brutto (inkl. USt.): ${fmt.currency(fr.co2CostGross)}`);
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

// ── Closing text (kept for backward compat) ───────────────────────────────
export function getClosingText(data: WizardData): string {
  const docCase = getDocumentCase(data);
  if (docCase === 'C' || docCase === 'D') {
    return 'Die Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des CO2KostAufG. Ich bitte um Erstattung des ausgewiesenen Vermieteranteils.\n\nFür Rückfragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen';
  }
  return 'Die Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des CO2KostAufG. Diese Mitteilung dient der Information gemäß den gesetzlichen Anforderungen.\n\nFür Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen';
}

// Keep old getSummaryText export for Results.tsx compatibility
export function getSummaryText(data: WizardData, result: CalculationResult): string {
  const docCase = getDocumentCase(data);
  if (docCase === 'C' || docCase === 'D') {
    return `Nach der Berechnung entfallen ${result.landlordPercent} % der CO2-Kosten (${fmt.currency(result.landlordShare)}) auf den Vermieter und ${result.tenantPercent} % (${fmt.currency(result.tenantShare)}) auf den/die Mieter/in.`;
  }
  return `Nach der Berechnung entfallen ${result.landlordPercent} % der CO2-Kosten auf den Vermieter und ${result.tenantPercent} % auf den Mieter.`;
}
