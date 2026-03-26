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
  getSpecialCircumstancesText,
  getClosingText,
  getDocumentCase,
  getHeatSupplyLabel,
  getBuildingTypeLabel,
  getBuildingReference,
  getPeriodString,
  getFuelCalculationSteps,
} from './pdf-helpers';

export function generatePDF(data: WizardData, result: CalculationResult) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mL = 25;
  const mR = 20;
  const cw = pw - mL - mR;
  let y = 20;

  const calcId = `CO2-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const docCase = getDocumentCase(data);
  const period = getPeriodString(data);

  // ── Helpers ──────────────────────────────────────────────────────────
  const ensureSpace = (needed: number) => {
    if (y + needed > ph - 25) {
      addFooter();
      doc.addPage();
      y = 20;
    }
  };

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `CO2-Kostenaufteilungsrechner · ${calcId} · Erstellt am ${today} · Alle Angaben ohne Gewähr`,
      pw / 2, ph - 8, { align: 'center' },
    );
  };

  const sectionHeading = (title: string) => {
    ensureSpace(14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 55, 90);
    doc.text(title, mL, y);
    y += 1.5;
    doc.setDrawColor(30, 55, 90);
    doc.setLineWidth(0.4);
    doc.line(mL, y, pw - mR, y);
    y += 6;
  };

  const bodyText = (text: string, indent = 0) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, cw - indent);
    for (const line of lines) {
      ensureSpace(5);
      doc.text(line, mL + indent, y);
      y += 4;
    }
  };

  const detailRow = (label: string, value: string, indent = 0, bold = false) => {
    ensureSpace(5);
    doc.setFontSize(9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(label, mL + indent, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, pw - mR, y, { align: 'right' });
    y += 4.5;
  };

  // ═══ 1. SENDER BLOCK ═══
  const senderName = getSenderName(data);
  const senderLines = getSenderAddressLines(data);

  if (senderName || senderLines.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    const senderCompact = [senderName, ...senderLines].filter(Boolean).join(' · ');
    doc.text(senderCompact, mL, y);
    y += 2.5;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(mL, y, mL + 85, y);
    y += 6;
  } else {
    y += 8;
  }

  // ═══ 2. RECIPIENT BLOCK ═══
  const recipientName = getRecipientName(data);
  const recipientLines = getRecipientAddressLines(data);

  if (recipientName || recipientLines.length > 0) {
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    if (recipientName) { doc.text(recipientName, mL, y); y += 5; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const line of recipientLines) { doc.text(line, mL, y); y += 4.5; }
    y += 4;
  }

  // ═══ 3. DATE + CALC-ID + BILLING PERIOD ═══
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(today, pw - mR, y, { align: 'right' });
  y += 4.5;
  doc.text(`Berechnungs-Nr.: ${calcId}`, pw - mR, y, { align: 'right' });
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Abrechnungszeitraum: ${period}`, mL, y);
  if (result.isCrossYear) {
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('(jahresübergreifend, Berechnung mit getrennten CO2-Preisen pro Kalenderjahr)', mL, y);
  }
  y += 8;

  // ═══ 4. SUBJECT LINE ═══
  const subjectText = getSubjectLine(data, result);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 40, 70);
  const subjLines = doc.splitTextToSize(subjectText, cw);
  doc.text(subjLines, mL, y);
  y += subjLines.length * 5 + 2;
  doc.setDrawColor(20, 40, 70);
  doc.setLineWidth(0.5);
  doc.line(mL, y, pw - mR, y);
  y += 8;

  // ═══ 5. SALUTATION + INTRO ═══
  const salutation = getSalutation(data);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(salutation, mL, y);
  y += 6;

  const introText = getIntroText(data, result);
  bodyText(introText);
  y += 4;

  // ═══ SECTION 1: Energy / Emissions / CO2 Costs ═══
  sectionHeading('1. Energiegehalt, CO2-Emissionen und CO2-Kosten');

  // Cross-year segment display
  if (result.isCrossYear && result.segmentResults && result.segmentResults.length > 0) {
    for (const seg of result.segmentResults) {
      ensureSpace(20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(`Abschnitt ${seg.year} (${fmt.date(seg.periodStart)} – ${fmt.date(seg.periodEnd)})`, mL + 2, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      detailRow('Menge:', fmt.number(seg.amount, 0), 4);
      detailRow('CO2-Preis:', `${seg.co2PricePerTon} EUR/Tonne`, 4);
      detailRow('Energie (Heizwert):', `${fmt.number(seg.energyHeatingValueKwh, 0)} kWh`, 4);
      detailRow('CO2-Emissionen:', `${fmt.number(seg.co2Kg, 1)} kg`, 4);
      detailRow('CO2-Kosten (brutto):', fmt.currency(seg.co2CostGross), 4);
      y += 2;
    }
    // Totals
    ensureSpace(12);
    doc.setDrawColor(200, 200, 200);
    doc.line(mL + 2, y, pw - mR, y);
    y += 4;
    detailRow('Gesamte CO2-Emissionen:', `${fmt.number(result.totalEmissionsKg, 1)} kg`, 2, true);
    detailRow('Gesamte CO2-Kosten (brutto):', fmt.currency(result.totalCO2Cost), 2, true);
  } else {
    // Standard per-fuel details
    for (let i = 0; i < result.fuelResults.length; i++) {
      const fr = result.fuelResults[i];
      const steps = getFuelCalculationSteps(fr);

      if (result.fuelResults.length > 1) {
        ensureSpace(8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text(`Brennstoff ${i + 1}: ${fr.fuelLabel}`, mL + 2, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        for (const step of steps.slice(1)) { bodyText(step, 4); }
      } else {
        for (const step of steps) { bodyText(step, 2); }
      }
      y += 2;
    }

    // Totals for multi-fuel
    if (result.fuelResults.length > 1) {
      ensureSpace(20);
      doc.setDrawColor(200, 200, 200);
      doc.line(mL + 2, y, pw - mR, y);
      y += 4;
      detailRow('Gesamtenergie (Heizwert):', `${fmt.number(result.totalEnergyHeatingValueKwh, 0)} kWh`, 2, true);
      detailRow('Gesamte CO2-Emissionen:', `${fmt.number(result.totalEmissionsKg, 1)} kg`, 2, true);
      detailRow('Gewichteter Emissionsfaktor:', `${fmt.number(result.weightedEmissionFactor, 5)} kg CO2/kWh`, 2);
      detailRow('Gesamte CO2-Kosten (brutto):', fmt.currency(result.totalCO2Cost), 2, true);
    } else {
      ensureSpace(8);
      detailRow('Gesamte CO2-Kosten (brutto):', fmt.currency(result.totalCO2Cost), 2, true);
    }

    // CO2 price note
    y += 2;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`CO2-Preis: ${fmt.currency(result.co2PricePerTon)} pro Tonne (${result.billingYear})`, mL + 2, y);
  }

  y += 8;

  // ═══ SECTION 2: Allocation ═══
  if (result.isResidential) {
    sectionHeading('2. CO2-Aufteilung nach dem Stufenmodell für Wohngebäude');
  } else {
    sectionHeading('2. CO2-Aufteilung zwischen Vermieter und Mieter');
  }

  detailRow('Gebäudetyp:', getBuildingTypeLabel(data), 2);
  detailRow('Wärmeversorgung:', getHeatSupplyLabel(data), 2);
  detailRow('Bezugsfläche:', `${fmt.number(result.relevantArea, 0)} m²`, 2);
  detailRow('CO2-Ausstoß pro m²/Jahr:', `${fmt.number(result.emissionsPerSqmYear, 2)} kg CO2/m²`, 2);

  if (result.isResidential && result.stufenmodellStep > 0) {
    detailRow('Stufe (10-Stufen-Modell):', `Stufe ${result.stufenmodellStep}`, 2, true);
    detailRow('Aufteilung laut Stufenmodell:', `Mieter ${result.baseTenantPercent} % / Vermieter ${result.baseLandlordPercent} %`, 2);
  }

  if (!result.isResidential) {
    if (result.restrictionApplied === 'fall1und2') {
      detailRow('Aufteilung:', 'Mieter 100 % / Vermieter 0 % (beide Einschränkungen)', 2, true);
      y += 2;
      bodyText('Da beide öffentlich-rechtlichen Einschränkungen vorliegen, trägt der Mieter die CO2-Kosten vollständig.', 2);
    } else {
      detailRow('Aufteilung:', 'Hälftige Aufteilung (50 % / 50 %) gemäß § 8 CO2KostAufG', 2, true);
      y += 2;
      bodyText('Für Nichtwohngebäude erfolgt im Regelfall eine hälftige Aufteilung der CO2-Kosten zwischen Mieter und Vermieter.', 2);
    }
  }
  y += 4;

  // ═══ SECTION 3: Special circumstances ═══
  sectionHeading('3. Besonderheiten / Abweichungen vom Stufenmodell');

  const specialText = getSpecialCircumstancesText(data, result);
  bodyText(specialText);

  // Pellets note
  if (result.fuelResults.some(fr => fr.fuelType === 'pellets' || fr.fuelType === 'hackschnitzel')) {
    y += 2;
    bodyText('Hinweis: Holzpellets und Holzhackschnitzel haben einen Emissionsfaktor, sind jedoch nicht BEHG-pflichtig. Die CO2-Kosten betragen daher 0,00 EUR.', 2);
  }

  y += 4;

  // ═══ SECTION 4: Final allocation result ═══
  sectionHeading('4. Aufteilung der CO2-Kosten');

  ensureSpace(40);
  const boxStartY = y - 2;

  detailRow('Gesamte CO2-Kosten (brutto):', fmt.currency(result.totalCO2Cost), 4, true);

  y += 1;
  doc.setDrawColor(200, 200, 200);
  doc.line(mL + 4, y, pw - mR - 4, y);
  y += 4;

  detailRow(`Anteil Vermieter (${result.landlordPercent} %):`, fmt.currency(result.landlordShare), 4, true);
  detailRow(`Anteil Mieter (${result.tenantPercent} %):`, fmt.currency(result.tenantShare), 4, true);

  if (result.reimbursementReductionApplied && result.landlordShareBeforeReduction != null) {
    y += 1;
    doc.setFontSize(8);
    doc.setTextColor(120, 90, 20);
    doc.text(`Vermieteranteil vor ${result.reimbursementReductionPercent} %-Kürzung: ${fmt.currency(result.landlordShareBeforeReduction)}`, mL + 4, y);
    y += 5;
  }

  // Tenant reimbursement highlight
  if (docCase === 'C' || docCase === 'D') {
    y += 2;
    ensureSpace(14);
    doc.setFillColor(235, 245, 255);
    doc.roundedRect(mL + 2, y - 3, cw - 4, 12, 1.5, 1.5, 'F');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 60, 110);
    doc.text('Möglicher Erstattungsanspruch gegenüber dem Vermieter:', mL + 6, y + 3);
    doc.text(fmt.currency(result.landlordShare), pw - mR - 6, y + 3, { align: 'right' });
    y += 14;
  }

  // Draw box
  const boxH = y - boxStartY + 2;
  doc.setDrawColor(30, 55, 90);
  doc.setLineWidth(0.3);
  doc.roundedRect(mL, boxStartY, cw, boxH, 2, 2, 'S');

  y += 6;

  // ═══ CLOSING ═══
  ensureSpace(30);
  const closingText = getClosingText(data);
  bodyText(closingText);
  y += 6;

  if (senderName) {
    ensureSpace(6);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(senderName, mL, y);
    y += 8;
  }

  // ═══ FOOTER / META BLOCK ═══
  ensureSpace(30);
  doc.setDrawColor(180, 180, 180);
  doc.line(mL, y, pw - mR, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const metaRows: [string, string][] = [
    ['Erstellt am:', today],
    ['Berechnungs-Nr.:', calcId],
  ];
  const buildingRef = getBuildingReference(data);
  if (buildingRef) metaRows.push(['Berechnung erstellt für:', buildingRef]);

  for (const [label, val] of metaRows) {
    ensureSpace(5);
    doc.text(label, mL, y);
    doc.text(val, mL + 40, y);
    y += 4;
  }
  y += 4;

  // ═══ COMPACT SUMMARY BOX ═══
  ensureSpace(28);
  doc.setFillColor(240, 243, 248);
  doc.roundedRect(mL, y - 2, cw, 22, 2, 2, 'F');
  doc.setDrawColor(30, 55, 90);
  doc.setLineWidth(0.3);
  doc.roundedRect(mL, y - 2, cw, 22, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 55, 90);
  doc.text(`Zusammenfassung – CO2-Kosten ${result.isCrossYear ? `${result.segmentResults?.[0]?.year}/${result.billingYear}` : result.billingYear}`, mL + 4, y + 2);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  y += 7;
  doc.text(`CO2-Kosten inkl. USt.: ${fmt.currency(result.totalCO2Cost)}`, mL + 4, y);
  doc.text(`Anteil Vermieter: ${fmt.currency(result.landlordShare)} (${result.landlordPercent} %)`, mL + 4 + cw * 0.4, y);
  y += 4;
  doc.text(`Anteil Mieter: ${fmt.currency(result.tenantShare)} (${result.tenantPercent} %)`, mL + 4, y);
  if (docCase === 'C' || docCase === 'D') {
    doc.setFont('helvetica', 'bold');
    doc.text(`Erstattungsanspruch: ${fmt.currency(result.landlordShare)}`, mL + 4 + cw * 0.4, y);
  }

  y += 12;
  addFooter();

  doc.save(`CO2-Kostenaufteilung_${calcId}.pdf`);
}
