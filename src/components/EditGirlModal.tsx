import { useState, FormEvent, useEffect } from 'react';
import { Modal } from './Modal';
import { RatingTileSelector } from './RatingTileSelector';
import { supabase } from '../lib/supabase/client';
import { Database } from '../lib/types/database';

type Girl = Database['public']['Tables']['girls']['Row'];

interface EditGirlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  girl: Girl;
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

export function EditGirlModal({ isOpen, onClose, onSuccess, girl }: EditGirlModalProps) {
  const [name, setName] = useState(girl.name);
  const [age, setAge] = useState(girl.age.toString());
  const [ethnicity, setEthnicity] = useState(girl.ethnicity || '');
  const [hairColor, setHairColor] = useState(girl.hair_color || '');
  const [locationCity, setLocationCity] = useState(girl.location_city || '');
  const [locationCountry, setLocationCountry] = useState(girl.location_country || '');
  const [rating, setRating] = useState(girl.rating);
  const [isActive, setIsActive] = useState(girl.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(girl.name);
    setAge(girl.age.toString());
    setEthnicity(girl.ethnicity || '');
    setHairColor(girl.hair_color || '');
    setLocationCity(girl.location_city || '');
    setLocationCountry(girl.location_country || '');
    setRating(girl.rating);
    setIsActive(girl.is_active);
  }, [girl]);

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
      const { error: updateError } = await supabase
        .from('girls')
        .update({
          name,
          age: ageNum,
          ethnicity: ethnicity || null,
          hair_color: hairColor || null,
          location_city: locationCity || null,
          location_country: locationCountry || null,
          rating,
          is_active: isActive,
        })
        .eq('id', girl.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update girl');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Profile - ${girl.name}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="name" className="block text-sm text-cpn-gray mb-1">
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
          <label className="block text-sm text-cpn-gray mb-1">
            Hotness Rating <span className="text-red-500">*</span>
          </label>
          <RatingTileSelector value={rating} onChange={setRating} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        <div className="flex items-center gap-3 p-4 bg-cpn-dark rounded-lg">
          <label htmlFor="isActive" className="flex items-center gap-3 cursor-pointer flex-1">
            <div className="relative">
              <input
                id="isActive"
                type="checkbox"
                className="sr-only"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={loading}
              />
              <div
                className={`w-14 h-8 rounded-full transition-colors ${
                  isActive ? 'bg-cpn-yellow' : 'bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full bg-cpn-dark transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <div>
              <p className="font-bold">Active Profile</p>
              <p className="text-xs text-cpn-gray">Inactive profiles excluded from global stats</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-cpn flex-1" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
