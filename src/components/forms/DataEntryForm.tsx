import { calculateCostPerNut, calculateTimePerNut, calculateCostPerHour, formatCurrency } from '../../lib/calculations';

export interface DataEntryFormValue {
  date: string;
  amountSpent: string;
  hours: string;
  minutes: string;
  numberOfNuts: string;
}

export function DataEntryForm({
  value,
  onChange,
  onSubmit,
  loading,
  error,
  showPreview = true,
  submitLabel = 'Continue',
  secondaryAction,
}: {
  value: DataEntryFormValue;
  onChange: (next: DataEntryFormValue) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string;
  showPreview?: boolean;
  submitLabel?: string;
  secondaryAction?: { label: string; onClick: () => void };
}) {
  const totalMinutes = parseInt(value.hours || '0') * 60 + parseInt(value.minutes || '0');
  const amount = parseFloat(value.amountSpent || '0');
  const nuts = parseInt(value.numberOfNuts || '0');

  const previewCostPerNut = nuts >= 0 ? calculateCostPerNut(amount, nuts) : 0;
  const previewTimePerNut = nuts >= 0 ? calculateTimePerNut(totalMinutes, nuts) : 0;
  const previewCostPerHour = totalMinutes > 0 ? calculateCostPerHour(amount, totalMinutes) : 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="date" className="block text-sm text-cpn-gray mb-2">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          id="date"
          type="date"
          className="input-cpn w-full"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          max={new Date().toISOString().split('T')[0]}
          required
          disabled={!!loading}
        />
      </div>

      <div>
        <label htmlFor="amountSpent" className="block text-sm text-cpn-gray mb-2">
          Amount Spent ($) <span className="text-red-500">*</span>
        </label>
        <input
          id="amountSpent"
          type="number"
          step="0.01"
          className="input-cpn w-full"
          placeholder="0.00"
          value={value.amountSpent}
          onChange={(e) => onChange({ ...value, amountSpent: e.target.value })}
          required
          min={0}
          disabled={!!loading}
        />
      </div>

      <div>
        <label className="block text-sm text-cpn-gray mb-2">
          Duration <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-cpn-gray mb-2">Hours</label>
            <input
              type="number"
              className="input-cpn w-full"
              placeholder="0"
              value={value.hours}
              onChange={(e) => onChange({ ...value, hours: e.target.value })}
              min={0}
              disabled={!!loading}
            />
          </div>
          <div>
            <label className="block text-xs text-cpn-gray mb-2">Minutes (optional)</label>
            <input
              type="number"
              className="input-cpn w-full"
              placeholder="0"
              value={value.minutes}
              onChange={(e) => onChange({ ...value, minutes: e.target.value })}
              min={0}
              max={59}
              disabled={!!loading}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="numberOfNuts" className="block text-sm text-cpn-gray mb-2">
          Number of Nuts <span className="text-red-500">*</span>
        </label>
        <input
          id="numberOfNuts"
          type="number"
          className="input-cpn w-full"
          value={value.numberOfNuts}
          onChange={(e) => onChange({ ...value, numberOfNuts: e.target.value })}
          required
          min={0}
          disabled={!!loading}
        />
      </div>

      {showPreview && amount >= 0 && nuts >= 0 && totalMinutes > 0 && (
        <div className="card-cpn bg-cpn-dark">
          <h4 className="text-sm text-cpn-gray mb-3">Calculated Metrics Preview</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-cpn-gray mb-1">Cost/Nut</p>
              <p className="text-cpn-yellow font-bold">{formatCurrency(previewCostPerNut)}</p>
            </div>
            <div>
              <p className="text-xs text-cpn-gray mb-1">Time/Nut</p>
              <p className="text-cpn-yellow font-bold">{previewTimePerNut.toFixed(1)}m</p>
            </div>
            <div>
              <p className="text-xs text-cpn-gray mb-1">Cost/Hour</p>
              <p className="text-cpn-yellow font-bold">{formatCurrency(previewCostPerHour)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {secondaryAction && (
          <button type="button" className="btn-secondary flex-1" onClick={secondaryAction.onClick} disabled={!!loading}>
            {secondaryAction.label}
          </button>
        )}
        <button type="submit" className="btn-cpn flex-1" disabled={!!loading}>
          {loading ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  );
}


