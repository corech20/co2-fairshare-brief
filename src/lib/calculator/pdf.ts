import jsPDF from 'jspdf';
import { hyphenateSync } from 'hyphen/de';
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
  getPropertyLabel,
  getPeriodString,
  getFuelCalculationSteps,
  getStufenmodellRangeText,
  getAreaLabelForPDF,
  getEnergyHeatingValueLabel,
} from './pdf-helpers';

export function generatePDF(
  data: WizardData,
  result: CalculationResult,
  outputType: string = 'calculation',
  externalCalcId?: string,
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mL = 25;
  const mR = 20;
  const cw = pw - mL - mR;
  let y = 20;

  const calcId = externalCalcId ?? `CO2-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const docCase = getDocumentCase(data);
  const period = getPeriodString(data);
  const isApartmentLevel = data.heatSupplyType === 'etage' || (data.userRole === 'mieter' && data.heatSupplyType === 'fernwaerme');
  const isNonResidential = data.buildingType === 'nichtwohngebaeude';

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
    ensureSpace(16);
    y += 2.4;
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 55, 90);
    doc.text(title, mL, y);
    y += 2;
    doc.setDrawColor(30, 55, 90);
    doc.setLineWidth(0.5);
    doc.line(mL, y, pw - mR, y);
    y += 7;
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

  /**
   * Justified body text for the cover-letter (page 1) only.
   * Renders the paragraph with clean left/right alignment ("Blocksatz")
   * and real German hyphenation (Knuth-Liang patterns, de-1996 reform spelling)
   * via the `hyphen/de` library. Long words are broken at valid hyphenation
   * points when they don't fit on a line, then the line is justified by
   * distributing extra space evenly between words. The last line of each
   * paragraph stays left-aligned (standard typographic rule).
   */
  const justifiedLetterBody = (text: string, indent = 0) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const maxWidth = cw - indent;
    const SOFT = '\u00AD';
    const HYPHEN_CHAR = '-';

    // Pre-hyphenate the entire paragraph: inserts soft hyphens (U+00AD) at
    // every valid German break point. This does NOT add any visible character
    // until we explicitly choose to break a word.
    const hyphenated = hyphenateSync(text, { hyphenChar: SOFT }) as string;

    // Tokenize on whitespace (preserve no whitespace inside tokens).
    const tokens = hyphenated.split(/\s+/).filter(Boolean);

    // Greedy line-break with hyphenation fallback.
    const builtLines: string[] = [];
    let current: string[] = []; // visible words on the current line
    let currentWidth = 0;
    const spaceW = doc.getTextWidth(' ');

    const stripSoft = (s: string) => s.replace(/\u00AD/g, '');
    const widthOf = (s: string) => doc.getTextWidth(stripSoft(s));

    const flush = () => {
      if (current.length) {
        builtLines.push(current.join(' '));
        current = [];
        currentWidth = 0;
      }
    };

    for (const rawToken of tokens) {
      const tokenWidth = widthOf(rawToken);
      const addedWidth = current.length ? spaceW + tokenWidth : tokenWidth;

      if (currentWidth + addedWidth <= maxWidth) {
        current.push(stripSoft(rawToken));
        currentWidth += addedWidth;
        continue;
      }

      // Token doesn't fit. Try to hyphenate it across the line break.
      const parts = rawToken.split(SOFT);
      if (parts.length > 1) {
        // Find the largest prefix (joined with HYPHEN_CHAR at the break) that
        // still fits on the current line.
        const remainingWidth = maxWidth - currentWidth - (current.length ? spaceW : 0);
        let bestPrefixIdx = -1;
        for (let p = 1; p < parts.length; p++) {
          const head = parts.slice(0, p).join('') + HYPHEN_CHAR;
          if (doc.getTextWidth(head) <= remainingWidth) {
            bestPrefixIdx = p;
          } else {
            break;
          }
        }
        if (bestPrefixIdx > 0) {
          const head = parts.slice(0, bestPrefixIdx).join('') + HYPHEN_CHAR;
          const tail = parts.slice(bestPrefixIdx).join('');
          current.push(head);
          flush();
          // Push the tail back through the same logic by treating it as the next token.
          const tailWidth = widthOf(tail);
          if (tailWidth <= maxWidth) {
            current.push(stripSoft(tail));
            currentWidth = tailWidth;
          } else {
            // Tail still too long — recursively try hyphenating it once more.
            // (Rare; falls back to flushing the tail on its own line as-is.)
            const tailParts = tail.split(SOFT);
            if (tailParts.length > 1) {
              // Take prefix that fits maxWidth.
              let q = -1;
              for (let p = 1; p < tailParts.length; p++) {
                const head2 = tailParts.slice(0, p).join('') + HYPHEN_CHAR;
                if (doc.getTextWidth(head2) <= maxWidth) q = p;
                else break;
              }
              if (q > 0) {
                current.push(tailParts.slice(0, q).join('') + HYPHEN_CHAR);
                flush();
                current.push(stripSoft(tailParts.slice(q).join('')));
                currentWidth = widthOf(tailParts.slice(q).join(''));
              } else {
                current.push(stripSoft(tail));
                currentWidth = tailWidth;
              }
            } else {
              current.push(stripSoft(tail));
              currentWidth = tailWidth;
            }
          }
          continue;
        }
      }

      // No hyphenation possible (or no break point fits): wrap the whole token
      // to the next line.
      flush();
      current.push(stripSoft(rawToken));
      currentWidth = tokenWidth;
    }
    flush();

    // Render with justification (last line of paragraph remains left-aligned).
    for (let i = 0; i < builtLines.length; i++) {
      ensureSpace(5);
      const line = builtLines[i];
      const isLast = i === builtLines.length - 1;
      const words = line.split(' ').filter(Boolean);
      if (isLast || words.length < 2) {
        doc.text(line, mL + indent, y);
      } else {
        const wordsWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
        const gap = (maxWidth - wordsWidth) / (words.length - 1);
        let x = mL + indent;
        for (let w = 0; w < words.length; w++) {
          doc.text(words[w], x, y);
          x += doc.getTextWidth(words[w]) + gap;
        }
      }
      y += 4;
    }
  };

  const detailRow = (label: string, value: string, indent = 0, bold = false) => {
    ensureSpace(5);
    doc.setFontSize(9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(label, mL + indent, y);
    // Currency values (containing €/EUR) are right-aligned to the page margin;
    // all other values are placed left-aligned directly after the label.
    const isCurrency = value.includes('€') || value.includes('EUR');
    if (isCurrency) {
      const valueWidth = doc.getTextWidth(value);
      doc.text(value, pw - mR - valueWidth, y);
    } else {
      const labelWidth = doc.getTextWidth(label);
      doc.text(value, mL + indent + labelWidth + 2, y);
    }
    y += 4.5;
  };

  const isLetterMode = outputType === 'letter_tenant_reimbursement' || outputType === 'letter_landlord_info';

  // ═══════════════════════════════════════════════════════════════════════
  // PART I — HEADER (always) or FORMAL LETTER (letter mode only)
  // ═══════════════════════════════════════════════════════════════════════

  if (isLetterMode) {
    // ═══ 1. SENDER BLOCK ═══
    const senderName2 = getSenderName(data);
    const senderLines2 = getSenderAddressLines(data);

    if (senderName2 || senderLines2.length > 0) {
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      const senderCompact = [senderName2, ...senderLines2].filter(Boolean).join(' · ');
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
    const recipientName2 = getRecipientName(data);
    const recipientLines2 = getRecipientAddressLines(data);

    if (recipientName2 || recipientLines2.length > 0) {
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      if (recipientName2) { doc.text(recipientName2, mL, y); y += 5; }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      for (const line of recipientLines2) { doc.text(line, mL, y); y += 4.5; }
      y += 4;
    }

    // ═══ 3. DATE + CALC-ID ═══
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
      doc.text('(jahresübergreifend – Berechnung mit getrennten CO2-Preisen pro Kalenderjahr)', mL, y);
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
    justifiedLetterBody(introText);
    y += 6;

    // ═══ COMPACT RESULT SUMMARY on letter page ═══
    ensureSpace(30);
    detailRow('Gesamte CO2-Kosten (brutto):', fmt.currency(result.totalCO2Cost), 2, true);
    detailRow(`Anteil Vermieter (${result.landlordPercent} %):`, fmt.currency(result.landlordShare), 2, true);
    detailRow(`Anteil Mieter (${result.tenantPercent} %):`, fmt.currency(result.tenantShare), 2, true);
    y += 4;

    // Closing on letter page
    const closingText = getClosingText(data);
    const closingParagraphs = closingText.split('\n\n');
    for (const para of closingParagraphs) {
      if (para.trim()) { justifiedLetterBody(para.trim()); y += 2; }
    }
    y += 4;
    if (senderName2) {
      doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
      doc.text(senderName2, mL, y); y += 6;
    }

    // Start new page for calculation details
    addFooter();
    doc.addPage();
    y = 20;

    // Calculation page title
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 40, 70);
    doc.text('Berechnungsgrundlage', mL, y);
    y += 3;
    doc.setDrawColor(20, 40, 70); doc.setLineWidth(0.5);
    doc.line(mL, y, pw - mR, y);
    y += 8;

    // Metadata on calc page
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text(`Berechnungs-Nr.: ${calcId}`, mL, y); y += 4;
    doc.text(`Abrechnungszeitraum: ${period}`, mL, y); y += 8;

  } else {
    // ═══ CALCULATION-ONLY MODE: compact header ═══
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 40, 70);
    doc.text('CO2-Kostenaufteilung – Berechnungsnachweis', mL, y);
    y += 3;
    doc.setDrawColor(20, 40, 70);
    doc.setLineWidth(0.5);
    doc.line(mL, y, pw - mR, y);
    y += 7;

    // Meta info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Erstellt am: ${today}`, mL, y);
    doc.text(`Berechnungs-Nr.: ${calcId}`, pw - mR, y, { align: 'right' });
    y += 5;
    doc.setTextColor(60, 60, 60);
    doc.text(`Abrechnungszeitraum: ${period}`, mL, y);
    if (result.isCrossYear) {
      y += 4;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('(jahresübergreifend – Berechnung mit getrennten CO2-Preisen pro Kalenderjahr)', mL, y);
    }
    y += 6.4;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PART II — TECHNICAL CALCULATION
  // ═══════════════════════════════════════════════════════════════════════

  // Show fuel type(s) explicitly at the top of the calculation section
  sectionHeading('1. Brennstoff, Energiegehalt und CO2-Kosten');

  // Multi-fuel summary line (single fuel is already shown inside the detail block)
  if (result.fuelResults.length > 1) {
    detailRow('Brennstoffe:', result.fuelResults.map(fr => fr.fuelLabel).join(', '), 2, true);
    y += 2;
  }

  // Cross-year segment display
  if (result.isCrossYear && result.segmentResults && result.segmentResults.length > 0) {
    for (const seg of result.segmentResults) {
      ensureSpace(24);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(`Abschnitt ${seg.year} (${fmt.date(seg.periodStart)} – ${fmt.date(seg.periodEnd)})`, mL + 2, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      detailRow('Menge:', fmt.number(seg.amount, 0), 4);
      detailRow('CO2-Preis:', `${fmt.number(seg.co2PricePerTon, 2)} EUR/Tonne`, 4);
      detailRow(`${getEnergyHeatingValueLabel(data.fuelType ?? result.fuelResults[0]?.fuelType ?? '')}:`, `${fmt.number(seg.energyHeatingValueKwh, 2)} kWh`, 4);
      detailRow('CO2-Emissionen (aus Brennstoff-/Wärmeabrechnung):', `${fmt.number(seg.co2Kg, 1)} kg`, 4);
      detailRow('CO2-Kosten netto:', fmt.currency(seg.co2CostNet), 4);
      detailRow('CO2-Kosten brutto:', fmt.currency(seg.co2CostGross), 4);
      y += 3;
    }
    ensureSpace(12);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(mL + 2, y, pw - mR, y);
    y += 5;
    detailRow('Gesamte CO2-Emissionen:', `${fmt.number(result.totalEmissionsKg, 1)} kg`, 2, true);
    detailRow('Gesamte CO2-Kosten netto:', fmt.currency(result.totalCO2CostNet), 2);
    detailRow('Gesamte CO2-Kosten brutto:', fmt.currency(result.totalCO2Cost), 2, true);
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
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(mL + 2, y, pw - mR, y);
      y += 5;
      detailRow('Gesamtenergie (Heizwert):', `${fmt.number(result.totalEnergyHeatingValueKwh, 2)} kWh`, 2, true);
      detailRow('Gesamte CO2-Emissionen:', `${fmt.number(result.totalEmissionsKg, 1)} kg`, 2, true);
      detailRow('Gewichteter Emissionsfaktor:', `${fmt.number(result.weightedEmissionFactor, 5)} kg CO2/kWh`, 2);
    }

    // Net / Gross / VAT breakdown
    ensureSpace(16);
    y += 2;
    
    // Detect mixed VAT for gas/Fernwärme spanning Apr 1, 2024
    const gasFuelsSet = new Set(['erdgas', 'erdgas_kwk', 'fernwaerme']);
    const pdfPrimaryFuel = data.fuelType ?? result.fuelResults[0]?.fuelType;
    const pdfPStart = data.billingPeriodStart ? new Date(data.billingPeriodStart) : null;
    const pdfPEnd = data.billingPeriodEnd ? new Date(data.billingPeriodEnd) : null;
    const pdfVatBoundary = new Date('2024-04-01');
    const pdfMixedVAT = pdfPrimaryFuel && gasFuelsSet.has(pdfPrimaryFuel) &&
      pdfPStart && pdfPEnd && pdfPStart < pdfVatBoundary && pdfPEnd >= pdfVatBoundary;

    detailRow('CO2-Kosten netto:', fmt.currency(result.totalCO2CostNet), 2);
    
    if (pdfMixedVAT) {
      const dayMs = 1000 * 60 * 60 * 24;
      const pdfTotalDays = Math.round((pdfPEnd!.getTime() - pdfPStart!.getTime()) / dayMs) + 1;
      const pdfReducedDays = Math.round((pdfVatBoundary.getTime() - pdfPStart!.getTime()) / dayMs);
      const pdfStandardDays = pdfTotalDays - pdfReducedDays;
      detailRow(
        `USt. anteilig 7 % (${pdfReducedDays} Tage) / 19 % (${pdfStandardDays} Tage):`,
        fmt.currency(result.totalCO2Cost - result.totalCO2CostNet), 2,
      );
    } else {
      detailRow(`USt. (${result.vatPercent} %):`, fmt.currency(result.totalCO2Cost - result.totalCO2CostNet), 2);
    }
    
    detailRow('CO2-Kosten brutto:', fmt.currency(result.totalCO2Cost), 2, true);
  }

  // Pellets / biomass note
  if (result.fuelResults.some(fr => fr.fuelType === 'pellets' || fr.fuelType === 'hackschnitzel')) {
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const biomassNote = doc.splitTextToSize(
      'Hinweis: Holzpellets weisen einen Emissionsfaktor auf, sind jedoch nicht dem Brennstoffemissionshandelsgesetz (BEHG) unterworfen. Die CO2-Kosten betragen daher 0,00 EUR.',
      cw - 4,
    );
    for (const line of biomassNote) {
      ensureSpace(4);
      doc.text(line, mL + 2, y);
      y += 3.5;
    }
  }

  y += 6.4;

  // ═══════════════════════════════════════════════════════════════════════
  // PART III — ALLOCATION
  // ═══════════════════════════════════════════════════════════════════════

  if (result.isResidential) {
    sectionHeading('2. CO2-Aufteilung nach dem Stufenmodell für Wohngebäude');
  } else {
    sectionHeading('2. CO2-Aufteilung zwischen Vermieter und Mieter');
  }

  detailRow('Gebäudetyp:', getBuildingTypeLabel(data), 2);
  detailRow('Wärmeversorgung:', getHeatSupplyLabel(data), 2);

  // Area display — dynamic labels
  const areaLabel = getAreaLabelForPDF(data);
  if (isApartmentLevel) {
    if (data.buildingArea) {
      const totalLabel = data.buildingType === 'nichtwohngebaeude'
        ? 'Gesamtnutzfläche des Gebäudes:'
        : 'Gesamtwohnfläche des Gebäudes:';
      detailRow(totalLabel, `${fmt.number(data.buildingArea, 0)} m²`, 2);
    }
    detailRow(`${areaLabel}:`, `${fmt.number(data.apartmentArea || result.relevantArea, 0)} m²`, 2);
    detailRow('Berechnungsgrundlage:', `${fmt.number(result.relevantArea, 0)} m² (${areaLabel})`, 2);
  } else {
    detailRow(`${areaLabel}:`, `${fmt.number(result.relevantArea, 0)} m²`, 2);
  }

  detailRow('Spezifischer CO2-Ausstoß (Abrechnungszeitraum):', `${fmt.number(result.emissionsPerSqmYear, 2)} kg CO2 / m²`, 2);

  // Annualized value – clearly labeled as classification-only
  if (result.annualizationFactor && result.emissionsPerSqmAnnualized) {
    detailRow('Hochgerechneter Jahreswert (nur für Einstufung):', `${fmt.number(result.emissionsPerSqmAnnualized, 2)} kg CO2 / m² / a`, 2);
    y += 1;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const annNote = doc.splitTextToSize(
      `Hochrechnung: ${fmt.number(result.emissionsPerSqmYear, 2)} × ${fmt.number(result.annualizationFactor, 4)} = ${fmt.number(result.emissionsPerSqmAnnualized, 2)} kg CO2/m²/a. Dieser Wert wird ausschließlich für die Einstufung im Stufenmodell verwendet, nicht für die Kostenberechnung.`,
      cw - 6,
    );
    for (const line of annNote) {
      ensureSpace(4);
      doc.text(line, mL + 2, y);
      y += 3.5;
    }
  }

  // Stufenmodell display
  if (result.isResidential && result.stufenmodellStep > 0) {
    y += 2;
    detailRow('Einstufung:', `Stufe ${result.stufenmodellStep} des 10-Stufen-Modells (§ 5 CO2KostAufG)`, 2);
    detailRow('Basis-Aufteilung nach Stufenmodell:', `Mieter ${result.baseTenantPercent} % / Vermieter ${result.baseLandlordPercent} %`, 2);
  }

  if (!result.isResidential) {
    y += 2;
    if (result.restrictionApplied === 'fall1und2') {
      detailRow('Aufteilung:', 'Mieter 100 % / Vermieter 0 %', 2, true);
      y += 1;
      bodyText('Da beide öffentlich-rechtlichen Einschränkungen (Fall 1 und Fall 2) vorliegen, trägt der Mieter die CO2-Kosten vollständig.', 2);
    } else if (result.restrictionApplied === 'fall1' || result.restrictionApplied === 'fall2') {
      detailRow('Aufteilung:', `Mieter ${result.tenantPercent} % / Vermieter ${result.landlordPercent} %`, 2, true);
      y += 1;
      bodyText('Auf Grundlage der ausgewählten rechtlichen Beschränkung nach § 9 CO2KostAufG reduziert sich der Vermieteranteil bei Nichtwohngebäuden von 50 % auf 25 %.', 2);
    } else {
      detailRow('Aufteilung:', 'Hälftige Aufteilung (50 % / 50 %) gemäß § 8 CO2KostAufG', 2, true);
      y += 1;
      bodyText('Für Nichtwohngebäude erfolgt im Regelfall eine hälftige Aufteilung der CO2-Kosten zwischen Vermieter und Mieter.', 2);
    }
  }
  y += 6;

  // ═══════════════════════════════════════════════════════════════════════
  // PART IV — SPECIAL CIRCUMSTANCES
  // ═══════════════════════════════════════════════════════════════════════

  // Section 3 — only when there is content (mirrors website)
  const specialText = getSpecialCircumstancesText(data, result);
  const specialParagraphs = specialText.split('\n\n').filter(p => p.trim());

  if (specialParagraphs.length > 0) {
    y += 1.6;
    const section3Title = isNonResidential
      ? '3. Besonderheiten zur Aufteilung der CO2-Kosten'
      : '3. Besonderheiten zur Aufteilung der CO2-Kosten / Abweichungen vom Stufenmodell';
    sectionHeading(section3Title);

    for (const para of specialParagraphs) {
      bodyText(para, 2);
      y += 2;
    }
    y += 3.2;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PART V — FINAL RESULT (same typography as sections 1–3, no alien box)
  // ═══════════════════════════════════════════════════════════════════════

  sectionHeading('4. Aufteilung der CO2-Kosten unter Berücksichtigung der vorgenannten Besonderheiten');

  detailRow('Gesamte CO2-Kosten (brutto):', fmt.currency(result.totalCO2Cost), 2, true);

  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(mL + 2, y, pw - mR, y);
  y += 4;

  // Show base vs final reference if they differ (residential only)
  const baseDiffersFromFinal = result.isResidential
    && result.stufenmodellStep > 0
    && (result.baseLandlordPercent !== result.landlordPercent || result.baseTenantPercent !== result.tenantPercent);

  if (baseDiffersFromFinal) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Basis-Aufteilung nach Stufenmodell: Mieter ${result.baseTenantPercent} % / Vermieter ${result.baseLandlordPercent} %`,
      mL + 2, y,
    );
    y += 4;
    doc.text('Endgültige Aufteilung nach Anwendung der vorgenannten Besonderheiten:', mL + 2, y);
    y += 5;
  }

  detailRow(`Anteil Vermieter (${result.landlordPercent} %):`, fmt.currency(result.landlordShare), 2, true);
  detailRow(`Anteil Mieter (${result.tenantPercent} %):`, fmt.currency(result.tenantShare), 2, true);

  if (result.reimbursementReductionApplied && result.landlordShareBeforeReduction != null) {
    y += 2;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const reductionNote = `Vermieteranteil vor ${result.reimbursementReductionPercent} %-Kürzung: ${fmt.currency(result.landlordShareBeforeReduction)}`;
    doc.text(reductionNote, mL + 2, y);
    y += 5;
  }

  // Erstattungsanspruch — same typography as the rest, no colored box
  if ((docCase === 'C' || docCase === 'D') && result.landlordShare > 0) {
    y += 3;
    ensureSpace(8);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(mL + 2, y, pw - mR, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Erstattungsanspruch:', mL + 2, y);
    doc.text(fmt.currency(result.landlordShare), pw - mR, y, { align: 'right' });
    y += 5;
  }

  y += 8;

  // ═══════════════════════════════════════════════════════════════════════
  // CLOSING
  // ═══════════════════════════════════════════════════════════════════════

  ensureSpace(25);
  y += 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  const disclaimer = 'Diese Berechnung dient der unverbindlichen Information und ersetzt keine rechtliche oder steuerliche Beratung. Alle Angaben ohne Gewähr.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, cw - 4);
  for (const line of disclaimerLines) {
    ensureSpace(4);
    doc.text(line, mL + 2, y);
    y += 3.5;
  }

  y += 6;

  y += 4;
  addFooter();

  doc.save(`CO2-Kostenaufteilung_${calcId}.pdf`);
}
