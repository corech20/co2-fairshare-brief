import jsPDF from 'jspdf';
import type { WizardData, CalculationResult } from './types';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

const formatNumber = (n: number, decimals = 2) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function generatePDF(data: WizardData, result: CalculationResult) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const calcId = `CO2-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // --- Sender block ---
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const senderName = data.landlordName || 'Absender';
  const senderLine = data.landlordAddress
    ? `${senderName} · ${data.landlordAddress}`
    : senderName;
  doc.text(senderLine, margin, y);
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + 80, y);
  y += 10;

  // --- Recipient block ---
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const recipientName = data.tenantName || 'Empfänger';
  doc.text(recipientName, margin, y);
  y += 5;
  if (data.tenantAddress) {
    const addrLines = doc.splitTextToSize(data.tenantAddress, 80);
    doc.text(addrLines, margin, y);
    y += addrLines.length * 5;
  }
  y += 10;

  // --- Date and Calculation ID (right-aligned) ---
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(today, pageWidth - margin, y, { align: 'right' });
  y += 5;
  doc.text(`Berechnungs-Nr.: ${calcId}`, pageWidth - margin, y, { align: 'right' });
  y += 12;

  // --- Subject line ---
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 50, 80);
  doc.text('Aufteilung der CO2-Kosten nach CO2KostAufG', margin, y);
  y += 4;

  // Period subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const periodText = `Abrechnungszeitraum: ${formatDate(data.billingPeriodStart)} – ${formatDate(data.billingPeriodEnd)}`;
  doc.text(periodText, margin, y);
  y += 8;

  // Separator
  doc.setDrawColor(20, 50, 80);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --- Introductory paragraph ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  const salutation = data.tenantName
    ? `Sehr geehrte/r ${data.tenantName},`
    : 'Sehr geehrte Damen und Herren,';

  const introText = `${salutation}

auf Grundlage des Kohlendioxidkostenaufteilungsgesetzes (CO2KostAufG) ergibt sich für den oben genannten Abrechnungszeitraum die folgende Aufteilung der CO2-Kosten zwischen Vermieter und Mieter.`;

  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 5 + 6;

  // --- Summary sentence ---
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 50, 80);
  const summaryText = `Nach der Berechnung entfallen ${result.landlordPercent} % der CO2-Kosten auf den Vermieter und ${result.tenantPercent} % auf den Mieter.`;
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 8;

  // --- Main result table ---
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y - 3, contentWidth, 32, 2, 2, 'F');

  const drawRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(label, margin + 4, y);
    doc.text(value, pageWidth - margin - 4, y, { align: 'right' });
    y += 7;
  };

  y += 2;
  drawRow('Gesamte CO2-Kosten (brutto):', formatCurrency(result.totalCO2Cost), true);
  drawRow(`Anteil Vermieter (${result.landlordPercent} %):`, formatCurrency(result.landlordShare));
  drawRow(`Anteil Mieter (${result.tenantPercent} %):`, formatCurrency(result.tenantShare));
  y += 2;

  if (result.usedDirectCost) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Die CO2-Kosten wurden direkt aus der Abrechnung übernommen.', margin + 4, y);
    y += 6;
  }

  y += 8;

  // --- Technical details ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Berechnungsgrundlagen', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  const details: [string, string][] = [
    ['Brennstoff:', result.fuelLabel],
    ['Emissionsfaktor:', `${formatNumber(result.emissionFactor, 4)} kg CO2/kWh`],
    ['CO2-Preis:', `${formatCurrency(result.co2PricePerTon)} pro Tonne`],
    ['Gesamtemissionen:', `${formatNumber(result.totalEmissionsKg, 1)} kg CO2`],
    ['CO2 pro m²/Jahr:', `${formatNumber(result.emissionsPerSqmYear)} kg/m²`],
    ['Bezugsfläche:', `${formatNumber(result.relevantArea, 0)} m²`],
  ];

  if (result.isResidential && result.stufenmodellStep > 0) {
    details.push(['Stufe (10-Stufen-Modell):', `Stufe ${result.stufenmodellStep}`]);
  }

  if (!result.isResidential) {
    details.push(['Gebäudetyp:', 'Nichtwohngebäude (hälftige Aufteilung)']);
  }

  if (result.restrictionApplied !== 'fall3' && result.isResidential) {
    details.push(['Basis-Aufteilung (vor Einschränkung):', `Mieter ${result.baseTenantPercent}% / Vermieter ${result.baseLandlordPercent}%`]);
  }

  for (const [label, value] of details) {
    doc.text(label, margin + 2, y);
    doc.text(value, margin + 55, y);
    y += 5;
  }

  y += 8;

  // --- Restriction note if applicable ---
  if (result.restrictionNote) {
    doc.setFontSize(8);
    doc.setTextColor(140, 100, 20);
    const noteLines = doc.splitTextToSize(`Hinweis: ${result.restrictionNote}`, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 6;
  }

  // --- Closing ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  const closingText = `Die Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des CO2KostAufG. Diese Mitteilung dient der Information und ersetzt keine rechtsverbindliche Beratung.

Mit freundlichen Grüßen`;
  const closingLines = doc.splitTextToSize(closingText, contentWidth);
  doc.text(closingLines, margin, y);
  y += closingLines.length * 5 + 12;

  // Signature
  if (data.landlordName) {
    doc.setFont('helvetica', 'normal');
    doc.text(data.landlordName, margin, y);
  }

  // --- Footer ---
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Erstellt mit CO2-Kostenaufteilungsrechner · ${calcId} · ${today} · Alle Angaben ohne Gewähr`,
    pageWidth / 2,
    footerY,
    { align: 'center' },
  );

  doc.save(`CO2-Kostenaufteilung_${calcId}.pdf`);
}
