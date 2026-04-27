import type { WizardData, CalculationResult } from './types';

const STORAGE_KEY = 'co2-calc-history-v1';
const MAX_ENTRIES = 100;

export interface HistoryEntry {
  /** Stable calculation ID, also used in the PDF */
  calcId: string;
  /** ISO timestamp when the calculation was saved */
  savedAt: string;
  wizardData: WizardData;
  result: CalculationResult;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: HistoryEntry[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors silently
  }
}

/** Generate a stable calc ID matching the previous PDF format. */
export function generateCalcId(): string {
  return `CO2-${Date.now().toString(36).toUpperCase()}`;
}

export function listHistory(): HistoryEntry[] {
  // newest first
  return readAll().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function getHistoryEntry(calcId: string): HistoryEntry | undefined {
  return readAll().find(e => e.calcId === calcId);
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  const all = readAll().filter(e => e.calcId !== entry.calcId);
  all.unshift(entry);
  if (all.length > MAX_ENTRIES) all.length = MAX_ENTRIES;
  writeAll(all);
}

export function deleteHistoryEntry(calcId: string): void {
  writeAll(readAll().filter(e => e.calcId !== calcId));
}

export function clearHistory(): void {
  writeAll([]);
}