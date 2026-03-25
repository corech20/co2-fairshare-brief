import jsPDF from 'jspdf';
import type { WizardData, CalculationResult } from './types';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

const formatNumber = (n: number, decimals = 2) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

export function generatePDF(data: WizardData, result: CalculationResult) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const calcId = `CO2-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Sender
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const senderLine = data.landlordName
    ? `${data.landlordName}${data.landlordAddress ? ' · ' + data.landlordAddress : ''}`
    : 'Absender';
  doc.text(senderLine, margin, y);
  y += 8;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Recipient
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  if (data.tenantName) {
    doc.text(data.tenantName, margin, y);
    y += 5;
  }
  if (data.tenantAddress) {
    doc.text(data.tenantAddress, margin, y);
    y += 5;
  }
  if (!data.tenantName && !data.tenantAddress) {
    doc.text('Empfänger', margin, y);
    y += 5;
  }
  y += 10;

  // Date and ID
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Datum: ${today}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Berechnung: ${calcId}`, pageWidth - margin, y + 5, { align: 'right' });
  y += 5;

  // Title
  y += 10;
  doc.setFontSize(16);
  doc.setTextColor(20, 50, 80);
  doc.text('Aufteilung der CO2-Kosten', margin, y);
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const periodText = data.billingPeriodStart && data.billingPeriodEnd
    ? `Abrechnungszeitraum: ${new Date(data.billingPeriodStart).toLocaleDateString('de-DE')} – ${new Date(data.billingPeriodEnd).toLocaleDateString('de-DE')}`
    : 'Abrechnungszeitraum: nicht angegeben';
  doc.text(periodText, margin, y);
  y += 12;

  // Separator
  doc.setDrawColor(20, 50, 80);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Body text
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const bodyText = `Sehr geehrte Damen und Herren,

gemäß dem Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) ergibt sich für den oben genannten Abrechnungszeitraum folgende Aufteilung der CO2-Kosten:`;

  const bodyLines = doc.splitTextToSize(bodyText, contentWidth);
  doc.text(bodyLines, margin, y);
  y += bodyLines.length * 5 + 8;

  // Results table
  const drawRow = (label: string, value: string, bold = false) => {
    if (bold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.setTextColor(40, 40, 40);
    doc.text(label, margin + 2, y);
    doc.text(value, pageWidth - margin - 2, y, { align: 'right' });
    y += 7;
  };

  // Table background
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y - 4, contentWidth, 42, 2, 2, 'F');
  y += 2;

  doc.setFontSize(10);
  drawRow('Gesamte CO2-Kosten:', formatCurrency(result.totalCO2Cost), true);
  drawRow(`Anteil Vermieter (${result.landlordPercent}%):`, formatCurrency(result.landlordShare));
  drawRow(`Anteil Mieter (${result.tenantPercent}%):`, formatCurrency(result.tenantShare));
  y += 2;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  drawRow('CO2-Emissionen pro m²/a:', `${formatNumber(result.emissionsPerSqmYear)} kg`);
  if (result.stufenmodellStep > 0) {
    drawRow('Stufe (10-Stufen-Modell):', `Stufe ${result.stufenmodellStep}`);
  }
  y += 6;

  // Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  const detailsText = `Brennstoff: ${result.fuelLabel}
Emissionsfaktor: ${formatNumber(result.emissionFactor, 3)} kg CO2/kWh
CO2-Preis: ${formatCurrency(result.co2PricePerTon)} pro Tonne
Gesamtemissionen: ${formatNumber(result.totalEmissionsKg, 1)} kg CO2`;

  const detailLines = doc.splitTextToSize(detailsText, contentWidth);
  doc.text(detailLines, margin, y);
  y += detailLines.length * 5 + 10;

  // Closing
  const closingText = `Die Berechnung erfolgte auf Grundlage der gesetzlichen Vorgaben des CO2KostAufG. Für Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`;
  const closingLines = doc.splitTextToSize(closingText, contentWidth);
  doc.text(closingLines, margin, y);
  y += closingLines.length * 5 + 15;

  // Signature line
  if (data.landlordName) {
    doc.text(data.landlordName, margin, y);
    y += 8;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Erstellt mit CO2-Kostenaufteilungsrechner · ${calcId} · ${today} · Alle Angaben ohne Gewähr`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  doc.save(`CO2-Kostenaufteilung_${calcId}.pdf`);
}
