import jsPDF from 'jspdf';
import type { WizardData, CalculationResult } from './types';
import {
  fmt,
  getSenderName,
  getSenderAddressLines,
  getRecipientName,
  getRecipientAddressLines,
  getSubjectLine,
  getSalutation,
  getIntroText,
  getSummaryText,
  getClosingText,
  getDocumentCase,
  getHeatSupplyLabel,
  getBuildingTypeLabel,
} from './pdf-helpers';

export function generatePDF(data: WizardData, result: CalculationResult) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 25; // margin
  const cw = pw - 2 * m; // content width
  let y = m;

  const calcId = `CO2-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const docCase = getDocumentCase(data);

  // ── Helper: check page break ────────────────────────────────────────
  const ensureSpace = (needed: number) => {
    if (y + needed > ph - 20) {
      doc.addPage();
      y = m;
    }
  };

  // ── 1. Sender line ──────────────────────────────────────────────────
  const senderName = getSenderName(data);
  const senderLines = getSenderAddressLines(data);

  if (senderName || senderLines.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const senderCompact = [senderName, ...senderLines].filter(Boolean).join(' · ');
    doc.text(senderCompact, m, y);
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(m, y, m + 85, y);
    y += 8;
  }

  // ── 2. Recipient block ──────────────────────────────────────────────
  const recipientName = getRecipientName(data);
  const recipientLines = getRecipientAddressLines(data);

  if (recipientName || recipientLines.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    if (recipientName) {
      doc.text(recipientName, m, y);
      y += 5;
    }
    doc.setFontSize(10);
    for (const line of recipientLines) {
      doc.text(line, m, y);
      y += 4.5;
    }
    y += 6;
  }

  // ── 3. Date & ID (right-aligned) ───────────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(today, pw - m, y, { align: 'right' });
  y += 4.5;
  doc.text(`Berechnungs-Nr.: ${calcId}`, pw - m, y, { align: 'right' });
  y += 12;

  // ── 4. Subject line ─────────────────────────────────────────────────
  const subjectText = getSubjectLine(data, result);
  const subjectParts = subjectText.split('\n');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 45, 75);
  const mainSubject = doc.splitTextToSize(subjectParts[0], cw);
  doc.text(mainSubject, m, y);
  y += mainSubject.length * 5;

  if (subjectParts[1]) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subjectParts[1], m, y);
    y += 5;
  }

  y += 2;
  doc.setDrawColor(20, 45, 75);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);
  y += 10;

  // ── 5. Salutation & intro ──────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  const salutation = getSalutation(data);
  doc.text(salutation, m, y);
  y += 7;

  const introText = getIntroText(data, result);
  const introLines = doc.splitTextToSize(introText, cw);
  doc.text(introLines, m, y);
  y += introLines.length * 4.5 + 6;

  // ── 6. Summary sentence (bold) ──────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 45, 75);
  const summaryText = getSummaryText(data, result);
  const summaryLines = doc.splitTextToSize(summaryText, cw);
  doc.text(summaryLines, m, y);
  y += summaryLines.length * 4.5 + 8;

  // ── 7. Result box ───────────────────────────────────────────────────
  ensureSpace(45);
  doc.setFillColor(245, 247, 250);
  const boxRows = 3 + (result.reimbursementReductionApplied ? 1 : 0) + (result.usedDirectCost ? 1 : 0);
  const boxH = 10 + boxRows * 7;
  doc.roundedRect(m, y - 2, cw, boxH, 2, 2, 'F');

  y += 3;
  const drawRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(label, m + 5, y);
    doc.text(value, pw - m - 5, y, { align: 'right' });
    y += 7;
  };

  drawRow('Gesamte CO2-Kosten (brutto):', fmt.currency(result.totalCO2Cost), true);
  drawRow(`Anteil Vermieter (${result.landlordPercent} %):`, fmt.currency(result.landlordShare));
  drawRow(`Anteil Mieter (${result.tenantPercent} %):`, fmt.currency(result.tenantShare));

  if (result.reimbursementReductionApplied && result.landlordShareBeforeReduction != null) {
    doc.setFontSize(8);
    doc.setTextColor(140, 100, 20);
    doc.text(`Vermieteranteil vor 5 %-Kürzung: ${fmt.currency(result.landlordShareBeforeReduction)}`, m + 5, y);
    y += 6;
  }

  if (result.usedDirectCost) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Die CO2-Kosten wurden direkt aus der Abrechnung übernommen.', m + 5, y);
    y += 6;
  }

  y += 6;

  // ── Tenant reimbursement highlight ─────────────────────────────────
  if (docCase === 'C' || docCase === 'D') {
    ensureSpace(14);
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(m, y - 2, cw, 12, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 70, 120);
    doc.text('Möglicher Erstattungsanspruch gegenüber dem Vermieter:', m + 5, y + 4);
    doc.text(fmt.currency(result.landlordShare), pw - m - 5, y + 4, { align: 'right' });
    y += 16;
  }

  // ── 8. Context paragraphs (restriction notes, etc.) ─────────────────
  if (result.restrictionNote) {
    ensureSpace(20);
    doc.setFontSize(9);
    doc.setTextColor(140, 100, 20);
    const noteLines = doc.splitTextToSize(`Hinweis: ${result.restrictionNote}`, cw);
    doc.text(noteLines, m, y);
    y += noteLines.length * 4 + 4;
  }

  if (result.notes.length > 0) {
    ensureSpace(12);
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    for (const note of result.notes) {
      const nLines = doc.splitTextToSize(`• ${note}`, cw);
      doc.text(nLines, m, y);
      y += nLines.length * 3.5 + 2;
    }
    y += 4;
  }

  // ── 9. Technical appendix ───────────────────────────────────────────
  ensureSpace(60);
  doc.setDrawColor(200, 200, 200);
  doc.line(m, y, pw - m, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Berechnungsgrundlagen', m, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  const details: [string, string][] = [
    ['Gebäudetyp:', getBuildingTypeLabel(data)],
    ['Wärmeversorgung:', getHeatSupplyLabel(data)],
    ['Bezugsfläche:', `${fmt.number(result.relevantArea, 0)} m²`],
    ['Brennstoff:', result.fuelResults.length > 1 ? `${result.fuelResults.length} Brennstoffe (s. unten)` : result.fuelLabel],
    ['Emissionsfaktor:', result.fuelResults.length > 1 ? `${fmt.number(result.weightedEmissionFactor, 5)} kg CO2/kWh (gewichtet)` : `${fmt.number(result.emissionFactor, 4)} kg CO2/kWh`],
    ['CO2-Preis:', `${fmt.currency(result.co2PricePerTon)} pro Tonne`],
    ['Gesamtemissionen:', `${fmt.number(result.totalEmissionsKg, 1)} kg CO2`],
    ['Gesamtenergie (Heizwert):', `${fmt.number(result.totalEnergyHeatingValueKwh, 0)} kWh`],
    ['CO2 pro m²/Jahr:', `${fmt.number(result.emissionsPerSqmYear)} kg/m²`],
  ];

  if (result.isResidential && result.stufenmodellStep > 0) {
    details.push(['Stufe (10-Stufen-Modell):', `Stufe ${result.stufenmodellStep}`]);
  }
  if (!result.isResidential) {
    details.push(['Aufteilungsregel:', 'Hälftige Aufteilung (50/50) für Nichtwohngebäude']);
  }
  if (result.restrictionApplied !== 'fall3' && result.isResidential) {
    details.push(['Basis-Aufteilung:', `Mieter ${result.baseTenantPercent} % / Vermieter ${result.baseLandlordPercent} %`]);
  }

  for (const [label, value] of details) {
    ensureSpace(6);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(label, m + 2, y);
    doc.text(value, m + 62, y);
    y += 5;
  }

  // Multi-fuel breakdown
  if (result.fuelResults.length > 1) {
    y += 3;
    ensureSpace(10 + result.fuelResults.length * 6);
    doc.setFont('helvetica', 'bold');
    doc.text('Einzelne Brennstoffe:', m + 2, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    for (const fr of result.fuelResults) {
      ensureSpace(6);
      doc.text(
        `${fr.fuelLabel}: ${fmt.number(fr.co2Kg, 1)} kg CO2, ${fmt.number(fr.energyHeatingValueKwh, 0)} kWh, ${fmt.currency(fr.co2CostGross)}`,
        m + 4,
        y,
      );
      y += 5;
    }
  }

  y += 8;

  // ── 10. Closing ─────────────────────────────────────────────────────
  ensureSpace(35);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  const closingText = getClosingText(data);
  const closingLines = doc.splitTextToSize(closingText, cw);
  doc.text(closingLines, m, y);
  y += closingLines.length * 4.5 + 12;

  if (senderName) {
    ensureSpace(8);
    doc.text(senderName, m, y);
  }

  // ── 11. Footer ──────────────────────────────────────────────────────
  const footerY = ph - 10;
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Erstellt mit CO2-Kostenaufteilungsrechner · ${calcId} · ${today} · Alle Angaben ohne Gewähr`,
    pw / 2,
    footerY,
    { align: 'center' },
  );

  doc.save(`CO2-Kostenaufteilung_${calcId}.pdf`);
}
