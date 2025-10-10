import { RatingTileSelector } from '../RatingTileSelector';

export interface GirlFormValue {
  name: string;
  age: string; // keep as string for controlled input
  ethnicity: string;
  hairColor: string;
  locationCity: string;
  locationCountry: string;
  rating: number;
}

export function GirlForm({
  value,
  onChange,
  onSubmit,
  loading,
  error,
  submitLabel = 'Continue',
  secondaryAction,
}: {
  value: GirlFormValue;
  onChange: (next: GirlFormValue) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string;
  submitLabel?: string;
  secondaryAction?: { label: string; onClick: () => void };
}) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm text-cpn-gray mb-2">
            Her First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="input-cpn w-full"
            placeholder="Enter her first name"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            required
            disabled={!!loading}
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm text-cpn-gray mb-2">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            id="age"
            type="number"
            className="input-cpn w-full"
            placeholder="18+"
            value={value.age}
            onChange={(e) => onChange({ ...value, age: e.target.value })}
            required
            min={18}
            max={120}
            disabled={!!loading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-cpn-gray mb-2">
          Hotness Rating <span className="text-red-500">*</span>
        </label>
        <RatingTileSelector value={value.rating} onChange={(rating) => onChange({ ...value, rating })} />
      </div>

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


