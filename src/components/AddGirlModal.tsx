import { useState, FormEvent } from 'react';
import { Modal } from './Modal';
import { RatingTileSelector } from './RatingTileSelector';
import { supabase } from '../lib/supabase/client';

interface AddGirlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const ETHNICITIES = [
  'Asian',
  'Black',
  'Latina',
  'White',
  'Middle Eastern',
  'Indian',
  'Mixed',
  'Native American',
  'Pacific Islander',
  'Other',
];

const HAIR_COLORS = [
  'Blonde',
  'Brunette',
  'Black',
  'Red',
  'Auburn',
  'Gray/Silver',
  'Dyed/Colorful',
  'Other',
];

export function AddGirlModal({ isOpen, onClose, onSuccess, userId }: AddGirlModalProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [rating, setRating] = useState(6.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const ageNum = parseInt(age);
    if (ageNum < 18) {
      setError('Age must be 18 or older');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('girls').insert({
        user_id: userId,
        name,
        age: ageNum,
        ethnicity: ethnicity || null,
        hair_color: hairColor || null,
        location_city: locationCity || null,
        location_country: locationCountry || null,
        rating,
        is_active: true,
      });

      if (insertError) throw insertError;

      setName('');
      setAge('');
      setEthnicity('');
      setHairColor('');
      setLocationCity('');
      setLocationCountry('');
      setRating(6.0);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add girl');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Girl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm text-cpn-gray mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className="input-cpn w-full"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
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
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min="18"
              max="120"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-cpn-gray mb-2">
            Hotness Rating <span className="text-red-500">*</span>
          </label>
          <RatingTileSelector value={rating} onChange={setRating} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ethnicity" className="block text-sm text-cpn-gray mb-2">
              Ethnicity <span className="text-xs">(Optional)</span>
            </label>
            <select
              id="ethnicity"
              className="select-cpn w-full"
              value={ethnicity}
              onChange={(e) => setEthnicity(e.target.value)}
              disabled={loading}
            >
              <option value="">Select ethnicity</option>
              {ETHNICITIES.map((eth) => (
                <option key={eth} value={eth}>
                  {eth}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="hairColor" className="block text-sm text-cpn-gray mb-2">
              Hair Color <span className="text-xs">(Optional)</span>
            </label>
            <select
              id="hairColor"
              className="select-cpn w-full"
              value={hairColor}
              onChange={(e) => setHairColor(e.target.value)}
              disabled={loading}
            >
              <option value="">Select hair color</option>
              {HAIR_COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="locationCity" className="block text-sm text-cpn-gray mb-2">
              City <span className="text-xs">(Optional)</span>
            </label>
            <input
              id="locationCity"
              type="text"
              className="input-cpn w-full"
              placeholder="Enter city"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="locationCountry" className="block text-sm text-cpn-gray mb-2">
              Country <span className="text-xs">(Optional)</span>
            </label>
            <input
              id="locationCountry"
              type="text"
              className="input-cpn w-full"
              placeholder="Enter country"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-cpn flex-1" disabled={loading}>
            {loading ? 'Adding...' : 'Add Girl'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
