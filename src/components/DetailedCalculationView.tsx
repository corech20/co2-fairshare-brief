import type { WizardData, CalculationResult } from '@/lib/calculator/types';
import {
  fmt,
  getDocumentCase,
  getHeatSupplyLabel,
  getBuildingTypeLabel,
  getAreaLabelForPDF,
  getSpecialCircumstancesText,
  getFuelCalculationSteps,
  getEnergyHeatingValueLabel,
} from '@/lib/calculator/pdf-helpers';

interface Props {
  data: WizardData;
  result: CalculationResult;
}

/**
 * Mirrors the PDF document layout (sections 1–4) on screen.
 * All four sections share the same heading, typography and rhythm so the
 * detailed view reads as one coherent formal document.
 */
export function DetailedCalculationView({ data, result }: Props) {
  const docCase = getDocumentCase(data);
  const isNonResidential = data.buildingType === 'nichtwohngebaeude';
  const isApartmentLevel =
    data.heatSupplyType === 'etage' ||
    (data.userRole === 'mieter' && data.heatSupplyType === 'fernwaerme');
  const areaLabel = getAreaLabelForPDF(data);

  const baseDiffersFromFinal =
    result.isResidential &&
    result.stufenmodellStep > 0 &&
    (result.baseLandlordPercent !== result.landlordPercent ||
      result.baseTenantPercent !== result.tenantPercent);

  // Mixed VAT detection (gas/Fernwärme spanning Apr 1, 2024)
  const gasFuelsSet = new Set(['erdgas', 'erdgas_kwk', 'fernwaerme']);
  const primaryFuel = data.fuelType ?? result.fuelResults[0]?.fuelType;
  const pStart = data.billingPeriodStart ? new Date(data.billingPeriodStart) : null;
  const pEnd = data.billingPeriodEnd ? new Date(data.billingPeriodEnd) : null;
  const vatBoundary = new Date('2024-04-01');
  const mixedVAT =
    primaryFuel && gasFuelsSet.has(primaryFuel) &&
    pStart && pEnd && pStart < vatBoundary && pEnd >= vatBoundary && !result.isCrossYear;

  let mixedVATDays: { reduced: number; standard: number } | null = null;
  if (mixedVAT && pStart && pEnd) {
    const dayMs = 1000 * 60 * 60 * 24;
    const total = Math.round((pEnd.getTime() - pStart.getTime()) / dayMs) + 1;
    const reduced = Math.round((vatBoundary.getTime() - pStart.getTime()) / dayMs);
    mixedVATDays = { reduced, standard: total - reduced };
  }

  const specialText = getSpecialCircumstancesText(data, result);
  const specialParagraphs = specialText.split('\n\n').filter(p => p.trim());

  const Row = ({ label, value, bold = false, indent = 0 }: { label: string; value: string; bold?: boolean; indent?: number }) => {
    const isCurrency = value.includes('€') || value.includes('EUR');
    return (
      <div
        className="flex items-baseline gap-2 text-[13px] leading-[1.5]"
        style={{ paddingLeft: indent }}
      >
        <span className={bold ? 'font-semibold text-foreground' : 'text-foreground/80'}>{label}</span>
        <span
          className={`tabular-nums ${isCurrency ? 'ml-auto text-right' : 'text-left'} ${bold ? 'font-semibold text-foreground' : 'text-foreground/90'}`}
        >
          {value}
        </span>
      </div>
    );
  };

  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[15px] font-bold text-primary border-b-2 border-primary pb-1.5 mb-3 mt-1">
      {children}
    </h3>
  );

  return (
    <article className="rounded-lg border border-border bg-card font-sans px-6 py-6 space-y-7">
      <header className="border-b border-border pb-3">
        <h2 className="text-base font-bold text-foreground">CO2-Kostenaufteilung – Berechnungsnachweis</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Abrechnungszeitraum: {fmt.date(data.billingPeriodStart)} – {fmt.date(data.billingPeriodEnd)}
          {result.isCrossYear && ' (jahresübergreifend)'}
        </p>
      </header>

      {/* ═══ Section 1 ═══ */}
      <section>
        <SectionHeading>1. Brennstoff, Energiegehalt und CO2-Kosten</SectionHeading>


        <div className="mt-3 space-y-3">
          {result.isCrossYear && result.segmentResults && result.segmentResults.length > 0 ? (
            <>
              {result.segmentResults.map((seg, i) => (
                <div key={i} className="border-l-2 border-border pl-3">
                  <p className="text-[13px] font-semibold text-foreground mb-1">
                    Abschnitt {seg.year} ({fmt.date(seg.periodStart)} – {fmt.date(seg.periodEnd)})
                  </p>
                  <Row label="Menge:" value={fmt.number(seg.amount, 0)} indent={8} />
                  <Row label="CO2-Preis:" value={`${fmt.number(seg.co2PricePerTon, 2)} EUR/Tonne`} indent={8} />
                  <Row label={`${getEnergyHeatingValueLabel(primaryFuel ?? '')}:`} value={`${fmt.number(seg.energyHeatingValueKwh, 2)} kWh`} indent={8} />
                  <Row label="CO2-Emissionen:" value={`${fmt.number(seg.co2Kg, 1)} kg`} indent={8} />
                  <Row label="CO2-Kosten netto:" value={fmt.currency(seg.co2CostNet)} indent={8} />
                  <Row label="CO2-Kosten brutto:" value={fmt.currency(seg.co2CostGross)} indent={8} />
                </div>
              ))}
              <hr className="border-border" />
              <Row label="Gesamte CO2-Emissionen:" value={`${fmt.number(result.totalEmissionsKg, 1)} kg`} bold />
              <Row label="Gesamte CO2-Kosten netto:" value={fmt.currency(result.totalCO2CostNet)} />
              <Row label="Gesamte CO2-Kosten brutto:" value={fmt.currency(result.totalCO2Cost)} bold />
            </>
          ) : (
            <>
              {result.fuelResults.map((fr, i) => {
                const steps = getFuelCalculationSteps(fr);
                if (result.fuelResults.length > 1) {
                  return (
                    <div key={i} className="border-l-2 border-border pl-3">
                      <p className="text-[13px] font-semibold text-foreground mb-1">Brennstoff {i + 1}: {fr.fuelLabel}</p>
                      {steps.slice(1).map((s, j) => (
                        <p key={j} className="text-[13px] text-foreground/80 leading-relaxed">{s}</p>
                      ))}
                    </div>
                  );
                }
                return (
                  <div key={i} className="space-y-0.5">
                    {steps.map((s, j) => (
                      <p key={j} className="text-[13px] text-foreground/80 leading-relaxed">{s}</p>
                    ))}
                  </div>
                );
              })}

              {result.fuelResults.length > 1 && (
                <>
                  <hr className="border-border" />
                  <Row label="Gesamtenergie (Heizwert):" value={`${fmt.number(result.totalEnergyHeatingValueKwh, 2)} kWh`} bold />
                  <Row label="Gesamte CO2-Emissionen:" value={`${fmt.number(result.totalEmissionsKg, 1)} kg`} bold />
                  <Row label="Gewichteter Emissionsfaktor:" value={`${fmt.number(result.weightedEmissionFactor, 5)} kg CO2/kWh`} />
                </>
              )}

              <div className="pt-2 border-t border-border">
                <Row label="CO2-Kosten netto:" value={fmt.currency(result.totalCO2CostNet)} />
                <Row
                  label={
                    mixedVATDays
                      ? `USt. anteilig 7 % (${mixedVATDays.reduced} Tage) / 19 % (${mixedVATDays.standard} Tage):`
                      : `USt. (${result.vatPercent} %):`
                  }
                  value={fmt.currency(result.totalCO2Cost - result.totalCO2CostNet)}
                />
                <Row label="CO2-Kosten brutto:" value={fmt.currency(result.totalCO2Cost)} bold />
              </div>
            </>
          )}

          {result.fuelResults.some(fr => fr.fuelType === 'pellets' || fr.fuelType === 'hackschnitzel') && (
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
              Hinweis: Holzpellets weisen einen Emissionsfaktor auf, sind jedoch nicht dem Brennstoffemissionshandelsgesetz (BEHG)
              unterworfen. Die CO2-Kosten betragen daher 0,00 EUR.
            </p>
          )}
        </div>
      </section>

      {/* ═══ Section 2 ═══ */}
      <section>
        <SectionHeading>
          {result.isResidential
            ? '2. CO2-Aufteilung nach dem Stufenmodell für Wohngebäude'
            : '2. CO2-Aufteilung zwischen Vermieter und Mieter'}
        </SectionHeading>

        <div className="mt-3 space-y-1">
          <Row label="Gebäudetyp:" value={getBuildingTypeLabel(data)} />
          <Row label="Wärmeversorgung:" value={getHeatSupplyLabel(data)} />

          {isApartmentLevel ? (
            <>
              {data.buildingArea && (
                <Row
                  label={`${data.buildingType === 'nichtwohngebaeude' ? 'Gesamtnutzfläche des Gebäudes' : 'Gesamtwohnfläche des Gebäudes'}:`}
                  value={`${fmt.number(data.buildingArea, 0)} m²`}
                />
              )}
              <Row label={`${areaLabel}:`} value={`${fmt.number(data.apartmentArea || result.relevantArea, 0)} m²`} />
              <Row label="Berechnungsgrundlage:" value={`${fmt.number(result.relevantArea, 0)} m² (${areaLabel})`} />
            </>
          ) : (
            <Row label={`${areaLabel}:`} value={`${fmt.number(result.relevantArea, 0)} m²`} />
          )}

          <Row
            label="Spezifischer CO2-Ausstoß (Abrechnungszeitraum):"
            value={`${fmt.number(result.emissionsPerSqmYear, 2)} kg CO2 / m²`}
          />

          {result.annualizationFactor && result.emissionsPerSqmAnnualized && (
            <>
              <Row
                label="Hochgerechneter Jahreswert (nur für Einstufung):"
                value={`${fmt.number(result.emissionsPerSqmAnnualized, 2)} kg CO2 / m² / a`}
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Hochrechnung: {fmt.number(result.emissionsPerSqmYear, 2)} × {fmt.number(result.annualizationFactor, 4)} ={' '}
                {fmt.number(result.emissionsPerSqmAnnualized, 2)} kg CO2/m²/a. Dieser Wert wird ausschließlich für die Einstufung im
                Stufenmodell verwendet, nicht für die Kostenberechnung.
              </p>
            </>
          )}

          {result.isResidential && result.stufenmodellStep > 0 && (
            <>
              <Row label="Einstufung:" value={`Stufe ${result.stufenmodellStep} des 10-Stufen-Modells (§ 5 CO2KostAufG)`} />
              <Row
                label="Basis-Aufteilung nach Stufenmodell:"
                value={`Mieter ${result.baseTenantPercent} % / Vermieter ${result.baseLandlordPercent} %`}
              />
            </>
          )}

          {!result.isResidential && (
            <>
              {result.restrictionApplied === 'fall1und2' ? (
                <>
                  <Row label="Aufteilung:" value="Mieter 100 % / Vermieter 0 %" bold />
                  <p className="text-[13px] text-foreground/80 leading-relaxed">
                    Da beide öffentlich-rechtlichen Einschränkungen (Fall 1 und Fall 2) vorliegen, trägt der Mieter die CO2-Kosten
                    vollständig.
                  </p>
                </>
              ) : (result.restrictionApplied === 'fall1' || result.restrictionApplied === 'fall2') ? (
                <>
                  <Row
                    label="Aufteilung:"
                    value={`Mieter ${result.tenantPercent} % / Vermieter ${result.landlordPercent} %`}
                    bold
                  />
                  <p className="text-[13px] text-foreground/80 leading-relaxed">
                    Auf Grundlage der ausgewählten rechtlichen Beschränkung nach § 9 CO2KostAufG reduziert sich der
                    Vermieteranteil bei Nichtwohngebäuden von 50 % auf 25 %.
                  </p>
                </>
              ) : (
                <>
                  <Row label="Aufteilung:" value="Hälftige Aufteilung (50 % / 50 %) gemäß § 8 CO2KostAufG" bold />
                  <p className="text-[13px] text-foreground/80 leading-relaxed">
                    Für Nichtwohngebäude erfolgt im Regelfall eine hälftige Aufteilung der CO2-Kosten zwischen Mieter und Vermieter.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ═══ Section 3 ═══ — only when there is content */}
      {specialParagraphs.length > 0 && (
        <section>
          <SectionHeading>
            {isNonResidential
              ? '3. Besonderheiten zur Aufteilung der CO2-Kosten'
              : '3. Besonderheiten zur Aufteilung der CO2-Kosten / Abweichungen vom Stufenmodell'}
          </SectionHeading>
          <div className="mt-3 space-y-3">
            {specialParagraphs.map((p, i) => (
              <p key={i} className="text-[13px] text-foreground/80 leading-relaxed">{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* ═══ Section 4 ═══ — same typography as 1–3 (no alien styling) */}
      <section>
        <SectionHeading>
          4. Aufteilung der CO2-Kosten unter Berücksichtigung der vorgenannten Besonderheiten
        </SectionHeading>

        <div className="mt-3 space-y-3">
          <Row label="Gesamte CO2-Kosten (brutto):" value={fmt.currency(result.totalCO2Cost)} bold />

          {baseDiffersFromFinal && (
            <div className="text-[12px] text-muted-foreground space-y-0.5">
              <p>
                Basis-Aufteilung nach Stufenmodell: Mieter {result.baseTenantPercent} % / Vermieter {result.baseLandlordPercent} %
              </p>
              <p>Endgültige Aufteilung nach Anwendung der vorgenannten Besonderheiten:</p>
            </div>
          )}

          <div className="space-y-0">
            <Row label={`Anteil Vermieter (${result.landlordPercent} %):`} value={fmt.currency(result.landlordShare)} bold />
            <Row label={`Anteil Mieter (${result.tenantPercent} %):`} value={fmt.currency(result.tenantShare)} bold />
          </div>

          {result.reimbursementReductionApplied && result.landlordShareBeforeReduction != null && (
            <p className="text-[11px] text-muted-foreground">
              Vermieteranteil vor {result.reimbursementReductionPercent} %-Kürzung:{' '}
              {fmt.currency(result.landlordShareBeforeReduction)}
            </p>
          )}

          {(docCase === 'C' || docCase === 'D') && result.landlordShare > 0 && (
            <div className="border-t border-border pt-3 flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-foreground">Erstattungsanspruch:</span>
              <span className="ml-auto text-right text-[13px] font-semibold text-foreground tabular-nums">
                {fmt.currency(result.landlordShare)}
              </span>
            </div>
          )}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
        Diese Berechnung dient der unverbindlichen Information und ersetzt keine rechtliche oder steuerliche Beratung. Alle Angaben
        ohne Gewähr.
      </p>
    </article>
  );
}
