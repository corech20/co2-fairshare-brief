import { useCalculator } from '@/context/CalculatorContext';

export default function StepBillingPeriod() {
  const { wizardData, setWizardField } = useCalculator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Abrechnungszeitraum</h2>
        <p className="text-muted-foreground mt-2">
          Bitte tragen Sie den Zeitraum genau so ein, wie er in Ihrer Heizkosten- oder Brennstoffabrechnung angegeben ist.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Von</label>
          <input
            type="date"
            value={wizardData.billingPeriodStart ?? ''}
            onChange={e => setWizardField('billingPeriodStart', e.target.value)}
            className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-foreground focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Bis</label>
          <input
            type="date"
            value={wizardData.billingPeriodEnd ?? ''}
            onChange={e => setWizardField('billingPeriodEnd', e.target.value)}
            className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-foreground focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        In vielen Fällen umfasst der Abrechnungszeitraum 12 Monate. Wenn Ihre Abrechnung davon abweicht, übernehmen Sie bitte trotzdem den tatsächlichen Zeitraum aus der Abrechnung.
      </p>
    </div>
  );
}
