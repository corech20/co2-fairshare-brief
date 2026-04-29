import { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface DecimalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  /** Maximum number of decimal places allowed after the comma. */
  maxDecimals: number;
  className?: string;
}

/**
 * DecimalInput – numeric input that allows up to N decimal places,
 * but ONLY with a comma as decimal separator. Dot is rejected.
 *
 * - Integer entries (no separator) remain valid.
 * - Decimal entries MUST use comma; dot keystrokes/pastes are rejected.
 * - Up to `maxDecimals` digits after the comma are allowed; more are rejected.
 * - No automatic rounding, no auto-replace of "." with ",", no truncation.
 */
export const DecimalInput = forwardRef<HTMLInputElement, DecimalInputProps>(
  ({ value, onChange, maxDecimals, className, onBlur, ...rest }, ref) => {
    const [error, setError] = useState<string | null>(null);
    // Keep a local string buffer so the user can type "12," without losing the comma.
    const [text, setText] = useState<string>(() =>
      value == null || Number.isNaN(value) ? '' : String(value).replace('.', ','),
    );

    const showError = (msg: string) => {
      setError(msg);
      window.setTimeout(() => setError(null), 4000);
    };

    const validRegex = new RegExp(`^\\d+(,\\d{0,${maxDecimals}})?$`);

    return (
      <div className="space-y-1">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={text}
          onKeyDown={e => {
            if (e.key === '.') {
              e.preventDefault();
              showError('Bitte Komma als Dezimaltrennzeichen verwenden.');
            }
          }}
          onPaste={e => {
            const t = e.clipboardData.getData('text');
            if (t.includes('.')) {
              e.preventDefault();
              showError('Bitte Komma als Dezimaltrennzeichen verwenden.');
            }
          }}
          onChange={e => {
            const raw = e.target.value;
            if (raw === '') {
              setText('');
              setError(null);
              onChange(undefined);
              return;
            }
            if (raw.includes('.')) {
              showError('Bitte Komma als Dezimaltrennzeichen verwenden.');
              return;
            }
            // Allow intermediate state like "12," (trailing comma while typing)
            const intermediateRegex = new RegExp(`^\\d+,?\\d{0,${maxDecimals}}$`);
            if (!intermediateRegex.test(raw)) {
              showError(`Maximal ${maxDecimals} Nachkommastellen erlaubt.`);
              return;
            }
            setText(raw);
            if (validRegex.test(raw) && !raw.endsWith(',')) {
              const n = parseFloat(raw.replace(',', '.'));
              if (Number.isFinite(n)) {
                setError(null);
                onChange(n);
              }
            } else {
              // Trailing comma: don't commit a number yet, but clear stored value
              onChange(undefined);
            }
          }}
          onBlur={e => {
            const v = e.target.value;
            if (v && !validRegex.test(v)) {
              showError('Ungültige Eingabe.');
            }
            onBlur?.(e);
          }}
          aria-invalid={error ? true : undefined}
          className={cn(
            'block w-full box-border h-12 rounded-lg border-2 bg-card px-4 py-3 text-base leading-tight text-foreground focus:outline-none transition-colors',
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
DecimalInput.displayName = 'DecimalInput';
