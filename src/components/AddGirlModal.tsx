import { useState, FormEvent } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase/client';
import { GirlForm, GirlFormValue } from './forms/GirlForm';

interface AddGirlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function AddGirlModal({ isOpen, onClose, onSuccess, userId }: AddGirlModalProps) {
  const [form, setForm] = useState<GirlFormValue>({
    name: '',
    age: '',
    ethnicity: '',
    hairColor: '',
    locationCity: '',
    locationCountry: '',
    rating: 6.0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const ageNum = parseInt(form.age);
    if (ageNum < 18) {
      setError('Age must be 18 or older');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('girls').insert({
        user_id: userId,
        name: form.name,
        age: ageNum,
        ethnicity: form.ethnicity || null,
        hair_color: form.hairColor || null,
        location_city: form.locationCity || null,
        location_country: form.locationCountry || null,
        rating: form.rating,
        is_active: true,
      });

      if (insertError) throw insertError;

      setForm({ name: '', age: '', ethnicity: '', hairColor: '', locationCity: '', locationCountry: '', rating: 6.0 });
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
      <GirlForm
        value={form}
        onChange={setForm}
        onSubmit={() => handleSubmit()}
        loading={loading}
        error={error}
        submitLabel={loading ? 'Adding...' : 'Add Girl'}
        secondaryAction={{ label: 'Cancel', onClick: onClose }}
      />
    </Modal>
  );
}
