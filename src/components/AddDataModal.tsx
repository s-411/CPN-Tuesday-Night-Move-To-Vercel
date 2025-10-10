import { useState, FormEvent } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase/client';
import { DataEntryForm, DataEntryFormValue } from './forms/DataEntryForm';

interface AddDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  girlId: string;
  girlName: string;
}

export function AddDataModal({ isOpen, onClose, onSuccess, girlId, girlName }: AddDataModalProps) {
  const [form, setForm] = useState<DataEntryFormValue>({
    date: new Date().toISOString().split('T')[0],
    amountSpent: '',
    hours: '',
    minutes: '',
    numberOfNuts: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const totalMinutes = parseInt(form.hours || '0') * 60 + parseInt(form.minutes || '0');
    const amount = parseFloat(form.amountSpent || '0');
    const nuts = parseInt(form.numberOfNuts || '0');

    if (totalMinutes <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    if (nuts < 0) {
      setError('Number of nuts cannot be negative');
      return;
    }

    if (amount < 0) {
      setError('Amount spent cannot be negative');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('data_entries').insert({
        girl_id: girlId,
        date: form.date,
        amount_spent: amount,
        duration_minutes: totalMinutes,
        number_of_nuts: nuts,
      });

      if (insertError) throw insertError;

      setForm({ date: new Date().toISOString().split('T')[0], amountSpent: '', hours: '', minutes: '', numberOfNuts: '' });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add data entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Data Entry - ${girlName}`}>
      <DataEntryForm
        value={form}
        onChange={setForm}
        onSubmit={(e?: any) => handleSubmit(e as FormEvent)}
        loading={loading}
        error={error}
        submitLabel={loading ? 'Adding...' : 'Add Entry'}
        secondaryAction={{ label: 'Cancel', onClick: onClose }}
      />
    </Modal>
  );
}
