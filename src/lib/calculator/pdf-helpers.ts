import type { WizardData, CalculationResult, AddressData } from './types';

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

// ── Case-specific text blocks ─────────────────────────────────────────────
export function getDocumentCase(data: WizardData): 'A' | 'B' | 'C' | 'D' | 'E' {
  const isResident = data.buildingType !== 'nichtwohngebaeude';
  if (!isResident) return 'E';
  if (data.userRole === 'mieter') {
    return data.heatSupplyType === 'fernwaerme' ? 'D' : 'C';
  }
  return data.heatSupplyType === 'fernwaerme' ? 'B' : 'A';
}

export function getSubjectLine(data: WizardData, result: CalculationResult): string {
  const period = `${fmt.date(data.billingPeriodStart)} – ${fmt.date(data.billingPeriodEnd)}`;
  const docCase = getDocumentCase(data);
  switch (docCase) {
    case 'C':
    case 'D':
      return `Berechnung der CO2-Kosten und Erstattungsanspruch nach dem CO2KostAufG\nAbrechnungszeitraum: ${period}`;
    case 'B':
      return `CO2-Kostenaufteilung für die Wärmeversorgung im Abrechnungszeitraum ${period}`;
    default:
      return `CO2-Kostenaufteilung für den Abrechnungszeitraum ${period}`;
  }
}

export function getSalutation(data: WizardData): string {
  const recipientName = getRecipientName(data);
  const recipientAddr = data.userRole === 'mieter' ? data.landlordAddress : data.tenantAddress;
  if (recipientName) {
    const salut = recipientAddr?.salutation;
    if (salut === 'Frau') return `Sehr geehrte Frau ${recipientAddr?.lastName || recipientName},`;
    if (salut === 'Herr') return `Sehr geehrter Herr ${recipientAddr?.lastName || recipientName},`;
    return `Sehr geehrte/r ${recipientName},`;
  }
  return 'Sehr geehrte Damen und Herren,';
}

export function getIntroText(data: WizardData, result: CalculationResult): string {
  const docCase = getDocumentCase(data);
  switch (docCase) {
    case 'A':
      return 'gemäß dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) ergibt sich für den oben genannten Abrechnungszeitraum folgende Aufteilung der CO2-Kosten zwischen Vermieter und Mieter.';
    case 'B':
      return 'gemäß dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) ergibt sich für die Wärmeversorgung des Gebäudes im oben genannten Abrechnungszeitraum folgende Aufteilung der CO2-Kosten.';
    case 'C':
      return 'als Mieter/in mit eigener Wärmeversorgung (Etagenheizung) ergibt sich nach dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) ein Erstattungsanspruch gegenüber dem Vermieter in Höhe des ausgewiesenen Vermieteranteils der CO2-Kosten.';
    case 'D':
      return 'als Mieter/in mit direkter Wärmebelieferung ergibt sich nach dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) ein Erstattungsanspruch gegenüber dem Vermieter in Höhe des ausgewiesenen Vermieteranteils der CO2-Kosten.';
    case 'E':
      return 'für das Nichtwohngebäude ergibt sich nach dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) im Regelfall eine hälftige Aufteilung der CO2-Kosten zwischen Mieter und Vermieter.';
  }
}

export function getSummaryText(data: WizardData, result: CalculationResult): string {
  const docCase = getDocumentCase(data);
  if (docCase === 'C' || docCase === 'D') {
    const base = `Nach der Berechnung entfallen ${result.landlordPercent} % der CO2-Kosten (${fmt.currency(result.landlordShare)}) auf den Vermieter und ${result.tenantPercent} % (${fmt.currency(result.tenantShare)}) auf den/die Mieter/in.`;
    if (result.reimbursementReductionApplied) {
      return base + `\n\nDer Erstattungsanspruch gegenüber dem Vermieter beträgt ${fmt.currency(result.landlordShare)}.`;
    }
    return base + `\n\nHiermit wird die Erstattung des Vermieteranteils in Höhe von ${fmt.currency(result.landlordShare)} geltend gemacht.`;
  }
  return `Nach der Berechnung entfallen ${result.landlordPercent} % der CO2-Kosten auf den Vermieter und ${result.tenantPercent} % auf den Mieter.`;
}

export function getClosingText(data: WizardData): string {
  const docCase = getDocumentCase(data);
  if (docCase === 'C' || docCase === 'D') {
    return 'Die Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des CO2KostAufG. Ich bitte um Erstattung des ausgewiesenen Vermieteranteils.\n\nFür Rückfragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen';
  }
  return 'Die Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des CO2KostAufG. Diese Mitteilung dient der Information gemäß den gesetzlichen Anforderungen.\n\nFür Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen';
}

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
