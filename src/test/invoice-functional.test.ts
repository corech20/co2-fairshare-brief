import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pdfCapture = vi.hoisted(() => ({ bytes: null as ArrayBuffer | null, filename: '', saveCalls: 0 }));

// Use the real jsPDF layout/serialization engine; only intercept the browser download.
vi.mock('jspdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jspdf')>();
  return {
    ...actual,
    default: function MockJsPDF(...args: ConstructorParameters<typeof actual.default>) {
      const doc = new actual.default(...args);
      doc.save = ((filename: string) => {
        pdfCapture.bytes = doc.output('arraybuffer');
        pdfCapture.filename = filename;
        pdfCapture.saveCalls++;
        return doc;
      }) as typeof doc.save;
      return doc;
    },
  };
});
import { calculateCO2Allocation, validateBillingPeriod } from '../lib/calculator/engine';
import { generatePDF } from '../lib/calculator/pdf';
import type { WizardData } from '../lib/calculator/types';

const sample: WizardData = {
  userRole: 'vermieter',
  buildingType: 'wohngebaeude',
  heatSupplyType: 'zentral',
  restrictionCase: 'fall3',
  billingPeriodStart: '2025-01-01',
  billingPeriodEnd: '2025-12-31',
  fuelType: 'erdgas',
  buildingArea: 500,
  co2EmissionsDirect: 20_000,
  co2CostDirect: 1_000,
  co2CostDirectType: 'brutto',
};

describe('Invoice-based calculation - independent reference cases', () => {
  it('takes gross invoice emissions and costs unchanged; allocates 40 kg/m2 with 60% landlord share', () => {
    const result = calculateCO2Allocation(sample);
    expect(result.usedDirectCost).toBe(true);
    expect(result.fuelResults[0].usedDirectEmissions).toBe(true);
    expect(result.totalEmissionsKg).toBe(20_000);
    expect(result.totalCO2Cost).toBe(1_000);
    expect(result.emissionsPerSqmYear).toBe(40);
    expect(result.landlordPercent).toBe(60);
    expect(result.tenantPercent).toBe(40);
    expect(result.landlordShare).toBe(600);
    expect(result.tenantShare).toBe(400);
  });

  it('preserves invoice values independently of the statutory year price', () => {
    const in2024 = calculateCO2Allocation({
      ...sample,
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-12-31',
    });
    const in2026 = calculateCO2Allocation({
      ...sample,
      billingPeriodStart: '2026-01-01',
      billingPeriodEnd: '2026-10-31',
    });
    expect(in2024.totalCO2Cost).toBe(1_000);
    expect(in2026.totalCO2Cost).toBe(1_000);
    expect(in2024.totalEmissionsKg).toBe(20_000);
    expect(in2026.totalEmissionsKg).toBe(20_000);
    expect(in2024.usedDirectCost).toBe(true);
    expect(in2026.usedDirectCost).toBe(true);
    expect(in2024.landlordShare + in2024.tenantShare).toBe(1_000);
    expect(in2026.landlordShare + in2026.tenantShare).toBe(1_000);
  });

  it('calculates residential restrictions from billed costs, not a newly estimated carbon price', () => {
    const result = calculateCO2Allocation({ ...sample, restrictionCase: 'fall1' });
    expect(result.landlordPercent).toBe(30);
    expect(result.landlordShare).toBe(300);
    expect(result.tenantShare).toBe(700);
  });

  it('splits non-residential costs 50/50 for the standard case', () => {
    const result = calculateCO2Allocation({ ...sample, buildingType: 'nichtwohngebaeude' });
    expect(result.landlordPercent).toBe(50);
    expect(result.tenantPercent).toBe(50);
    expect(result.landlordShare).toBe(500);
    expect(result.tenantShare).toBe(500);
  });

  it('uses invoice net costs and applies the correct 2025 VAT to obtain gross cost', () => {
    const result = calculateCO2Allocation({ ...sample, co2CostDirect: 1_000, co2CostDirectType: 'netto' });
    expect(result.totalCO2CostNet).toBe(1_000);
    expect(result.totalCO2Cost).toBe(1_190);
    expect(result.landlordShare).toBe(714);
    expect(result.tenantShare).toBe(476);
  });

  it('honours a cross-year invoice without prorating the entered gross costs', () => {
    const result = calculateCO2Allocation({
      ...sample,
      billingPeriodStart: '2024-07-01',
      billingPeriodEnd: '2025-06-30',
    });
    expect(result.isCrossYear).toBe(true);
    expect(result.usedDirectCost).toBe(true);
    expect(result.totalCO2Cost).toBe(1_000);
    expect(result.totalEmissionsKg).toBe(20_000);
    expect(result.landlordShare + result.tenantShare).toBe(1_000);
  });

  it('continues to reject the intentionally unsupported year 2023', () => {
    expect(validateBillingPeriod('2023-01-01', '2023-12-31')).not.toBeNull();
  });

  it('allocates cent-exact costs without losing a cent in rounding', () => {
    const result = calculateCO2Allocation({ ...sample, co2CostDirect: 1_000.01 });
    expect(result.totalCO2Cost).toBe(1_000.01);
    expect(result.landlordShare).toBe(600.01);
    expect(result.tenantShare).toBe(400);
    expect(Number((result.landlordShare + result.tenantShare).toFixed(2))).toBe(1_000.01);
  });
});

describe('PDF creation - real jsPDF engine smoke checks', () => {
  beforeEach(() => {
    pdfCapture.bytes = null;
    pdfCapture.filename = '';
    pdfCapture.saveCalls = 0;
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    'calculation',
    'letter_tenant_reimbursement',
    'letter_landlord_info',
  ] as const)('generates a valid PDF for %s and uses the provided calculation ID', (kind) => {
    const data: WizardData = {
      ...sample,
      userRole: kind === 'calculation' ? 'vermieter' : 'mieter',
      heatSupplyType: kind === 'calculation' ? 'zentral' : 'etage',
      apartmentArea: 500,
      tenantIsDirectContractParty: kind === 'calculation' ? false : true,
      tenantAddress: { firstName: 'Max', lastName: 'Mustermann', street: 'Testweg', houseNumber: '1', postalCode: '65183', city: 'Wiesbaden' },
      landlordAddress: { firstName: 'Anna', lastName: 'Beispiel', street: 'Pruefstrasse', houseNumber: '5', postalCode: '65185', city: 'Wiesbaden' },
    };
    const result = calculateCO2Allocation(data);
    generatePDF(data, result, kind, 'QA-2026-TEST');

    expect(pdfCapture.saveCalls).toBe(1);
    expect(pdfCapture.filename).toBe('CO2-Kostenaufteilung_QA-2026-TEST.pdf');
    expect(pdfCapture.bytes).toBeInstanceOf(ArrayBuffer);
    const bytes = pdfCapture.bytes!;
    const header = String.fromCharCode(...new Uint8Array(bytes).slice(0, 8));
    expect(header.startsWith('%PDF-')).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(2_000);
  });
});
