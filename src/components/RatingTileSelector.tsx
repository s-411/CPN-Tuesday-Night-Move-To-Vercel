interface RatingTileSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const RATINGS = [
  { value: 5.0, label: '5.0' },
  { value: 5.5, label: '5.5' },
  { value: 6.0, label: '6.0' },
  { value: 6.5, label: '6.5' },
  { value: 7.0, label: '7.0' },
  { value: 7.5, label: '7.5' },
  { value: 8.0, label: '8.0' },
  { value: 8.5, label: '8.5' },
  { value: 9.0, label: '9.0' },
  { value: 9.5, label: '9.5' },
  { value: 10.0, label: '10.0' },
];

export function RatingTileSelector({ value, onChange }: RatingTileSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {RATINGS.slice(0, 6).map((rating) => (
          <button
            key={rating.value}
            type="button"
            onClick={() => onChange(rating.value)}
            className={`rating-tile ${value === rating.value ? 'selected' : ''}`}
          >
            <span className="font-bold">{rating.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {RATINGS.slice(6).map((rating) => (
          <button
            key={rating.value}
            type="button"
            onClick={() => onChange(rating.value)}
            className={`rating-tile ${value === rating.value ? 'selected' : ''}`}
          >
            <span className="font-bold">{rating.label}</span>
          </button>
        ))}
      </div>
      <div className="text-sm text-cpn-gray text-center">
        Selected: <span className="text-cpn-yellow font-bold">★{value.toFixed(1)}/10</span>
      </div>
    </div>
  );
}
