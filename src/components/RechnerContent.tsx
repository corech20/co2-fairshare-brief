export default function RechnerContent() {
  return (
    <section className="border-t border-border bg-background py-12">
      <div className="container-narrow px-4 space-y-10">
        <h2 className="text-2xl font-semibold text-foreground">
          So funktioniert die CO2-Kostenaufteilung
        </h2>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Das 10-Stufen-Modell für Wohngebäude</h3>
          <p className="text-sm text-muted-foreground">
            Bei Wohngebäuden richtet sich der Vermieteranteil nach dem jährlichen CO2-Ausstoß pro
            Quadratmeter Wohnfläche. Je schlechter die energetische Qualität, desto höher der Anteil
            des Vermieters.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-2 border-b border-border">Stufe</th>
                  <th className="text-left p-2 border-b border-border">CO2-Ausstoß (kg/m²/Jahr)</th>
                  <th className="text-left p-2 border-b border-border">Mieter</th>
                  <th className="text-left p-2 border-b border-border">Vermieter</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1', 'unter 12', '100 %', '0 %'],
                  ['2', '12 bis unter 17', '90 %', '10 %'],
                  ['3', '17 bis unter 22', '80 %', '20 %'],
                  ['4', '22 bis unter 27', '70 %', '30 %'],
                  ['5', '27 bis unter 32', '60 %', '40 %'],
                  ['6', '32 bis unter 37', '50 %', '50 %'],
                  ['7', '37 bis unter 42', '40 %', '60 %'],
                  ['8', '42 bis unter 47', '30 %', '70 %'],
                  ['9', '47 bis unter 52', '20 %', '80 %'],
                  ['10', '52 und mehr', '5 %', '95 %'],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-border last:border-0">
                    {row.map((cell, i) => (
                      <td key={i} className="p-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Nichtwohngebäude</h3>
          <p className="text-sm text-muted-foreground">
            Bei Nichtwohngebäuden gilt derzeit eine pauschale Aufteilung von 50 % Mieter und 50 %
            Vermieter. Das in § 8 CO2KostAufG ab dem Abrechnungsjahr 2025 vorgesehene Stufenmodell
            für Nichtwohngebäude ist bislang nicht eingeführt worden; bis dahin bleibt es bei der
            hälftigen Aufteilung.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Emissionsfaktoren der Brennstoffe</h3>
          <p className="text-sm text-muted-foreground">
            Der CO2-Ausstoß wird aus der verbrauchten Energiemenge und dem Emissionsfaktor des
            jeweiligen Brennstoffs berechnet (Heizwert-Basis).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-2 border-b border-border">Brennstoff</th>
                  <th className="text-left p-2 border-b border-border">Emissionsfaktor (kg CO2/kWh)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Erdgas', '0,20088'],
                  ['Heizöl', '0,2664'],
                  ['Flüssiggas (LPG)', '0,2358'],
                  ['Altholz A I/A II', '0,3132'],
                  ['Braunkohlebriketts', '0,35712'],
                  ['Holzpellets', '0 (keine zu verteilenden CO2-Kosten)'],
                  ['Holzhackschnitzel', '0 (keine zu verteilenden CO2-Kosten)'],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-border last:border-0">
                    <td className="p-2">{row[0]}</td>
                    <td className="p-2">{row[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Bei Fernwärme wird der vom Wärmelieferanten ausgewiesene CO2-Wert verwendet. Für
            Holzpellets und Holzhackschnitzel fallen keine nach dem CO2KostAufG zu verteilenden
            CO2-Kosten an.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Mehrwertsteuer bei Gas und Fernwärme</h3>
          <p className="text-sm text-muted-foreground">
            Für Erdgas und Fernwärme galt vom 1. Oktober 2022 bis zum 31. März 2024 ein ermäßigter
            Umsatzsteuersatz von 7 %. Seit dem 1. April 2024 gilt wieder der reguläre Satz von 19 %.
            Erstreckt sich ein Abrechnungszeitraum über den 1. April 2024 hinaus, teilt dieser
            Rechner die CO2-Kosten taggenau auf beide Zeiträume auf und wendet den jeweils gültigen
            Satz an. Für alle anderen Brennstoffe gilt durchgehend 19 %.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Jahresübergreifende Abrechnungszeiträume</h3>
          <p className="text-sm text-muted-foreground">
            Erstreckt sich der Abrechnungszeitraum über einen Jahreswechsel, berücksichtigt der
            Rechner für jedes Kalenderjahr den jeweils gültigen CO2-Preis. Für die Einstufung in das
            Stufenmodell werden die Emissionen auf ein volles Jahr normiert; die CO2-Kosten selbst
            werden auf Basis des tatsächlichen Verbrauchs und nicht hochgerechnet angesetzt.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Einschränkungen (z. B. Denkmalschutz)</h3>
          <p className="text-sm text-muted-foreground">
            Bestehen öffentlich-rechtliche Vorgaben, die eine wesentliche energetische Verbesserung
            des Gebäudes verhindern – etwa denkmalschutzrechtliche Auflagen oder ein Anschluss- und
            Benutzungszwang –, kann sich der Vermieteranteil verringern. Liegt ein solcher Fall vor,
            wird der Vermieteranteil halbiert. Sind beide Einschränkungen gleichzeitig gegeben,
            entfällt der Vermieteranteil vollständig.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Rechtsgrundlage</h3>
          <p className="text-sm text-muted-foreground">
            Grundlage ist das Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG), in Kraft seit dem
            1. Januar 2023. Es regelt die Aufteilung der CO2-Kosten zwischen Mieter und Vermieter
            bei mit fossilen Brennstoffen beheizten Gebäuden. Der vollständige Gesetzestext:{' '}
            <a
              href="https://www.gesetze-im-internet.de/co2kostaufg/"
              target="_blank"
              rel="noopener"
              className="text-accent underline hover:no-underline"
            >
              Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG)
            </a>
            .
          </p>
          <p className="text-sm text-muted-foreground">
            Ab dem Jahr 2027 wird der nationale CO2-Preis voraussichtlich durch den europäischen
            Emissionshandel (EU-ETS 2) abgelöst. Die Aufteilung nach dem Stufenmodell bleibt davon
            unberührt.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Dieser Überblick dient der allgemeinen Information und ersetzt keine rechtliche oder
          steuerliche Beratung.
        </p>
      </div>
    </section>
  );
}