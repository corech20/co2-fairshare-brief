import { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface IntegerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  className?: string;
}

const DECIMAL_RE = /[.,]/;

/**
 * IntegerInput – integer-only numeric input for fuel quantity fields (kWh, kg, l).
 * - Blocks "." and "," keystrokes
 * - Rejects pasted decimal values
 * - Surfaces a validation error when invalid input is attempted
 * - Keeps the mobile numeric keyboard via inputMode="numeric"
 */
export const IntegerInput = forwardRef<HTMLInputElement, IntegerInputProps>(
  ({ value, onChange, className, onBlur, ...rest }, ref) => {
    const [error, setError] = useState<string | null>(null);

    const showError = (msg: string) => {
      setError(msg);
      // Auto-clear after a short while so the field doesn't stay "stuck" once corrected
      window.setTimeout(() => setError(null), 4000);
    };

    return (
      <div className="space-y-1">
        <input
          ref={ref}
          type="number"
          inputMode="numeric"
          step={1}
          min={0}
          value={value ?? ''}
          onKeyDown={e => {
            if (DECIMAL_RE.test(e.key)) {
              e.preventDefault();
              showError('Bitte nur ganze Zahlen eingeben.');
            }
          }}
          onPaste={e => {
            const text = e.clipboardData.getData('text');
            if (DECIMAL_RE.test(text)) {
              e.preventDefault();
              showError('Bitte nur ganze Zahlen eingeben.');
            }
          }}
          onChange={e => {
            const raw = e.target.value;
            if (raw === '') {
              setError(null);
              onChange(undefined);
              return;
            }
            // Browsers may still deliver decimals (e.g. via stepper or programmatic input)
            if (DECIMAL_RE.test(raw) || !/^\d+$/.test(raw)) {
              showError('Bitte nur ganze Zahlen eingeben.');
              return;
            }
            const n = parseInt(raw, 10);
            if (Number.isFinite(n)) {
              setError(null);
              onChange(n);
            }
          }}
          onBlur={e => {
            // Final guard: strip any decimal that slipped through
            const v = e.target.value;
            if (v && DECIMAL_RE.test(v)) {
              showError('Bitte nur ganze Zahlen eingeben.');
            }
            onBlur?.(e);
          }}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full rounded-lg border-2 bg-background px-4 py-3 text-foreground focus:outline-none transition-colors',
            error ? 'border-destructive focus:border-destructive' : 'border-border focus:border-accent',
            className,
          )}
          {...rest}
        />
        {error && (
          <p className="text-xs text-destructive font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
IntegerInput.displayName = 'IntegerInput';
