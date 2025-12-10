import { useState, useCallback, memo } from 'react';
import { formatInputValue, getRawNumber } from '../lib/formatNumber';

type AmountInputProps = {
  value: string;
  onChange: (value: string) => void;
  currencySymbol: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  locale?: string;
};

function AmountInputComponent({
  value,
  onChange,
  currencySymbol,
  placeholder = '0',
  required = false,
  className = '',
  locale = 'id-ID',
}: AmountInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (!value) return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : formatInputValue(Math.floor(num).toString(), locale);
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const raw = getRawNumber(input);
    
    if (!raw) {
      setDisplayValue('');
      onChange('');
      return;
    }

    const formatted = formatInputValue(raw, locale);
    setDisplayValue(formatted);
    onChange(raw); // Store raw number
  }, [onChange, locale]);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-base pointer-events-none">
        {currencySymbol}
      </span>
      <input
        type="text"
        inputMode="numeric"
        required={required}
        value={displayValue}
        onChange={handleChange}
        className={`w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-lg hover:border-slate-300 font-medium ${className}`}
        placeholder={placeholder}
      />
    </div>
  );
}

export const AmountInput = memo(AmountInputComponent);
