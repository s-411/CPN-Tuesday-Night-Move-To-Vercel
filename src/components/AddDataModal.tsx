import { useState, FormEvent } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase/client';
import { calculateCostPerNut, calculateTimePerNut, calculateCostPerHour, formatCurrency } from '../lib/calculations';

interface AddDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  girlId: string;
  girlName: string;
}

export function AddDataModal({ isOpen, onClose, onSuccess, girlId, girlName }: AddDataModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountSpent, setAmountSpent] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [numberOfNuts, setNumberOfNuts] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0');
  const amount = parseFloat(amountSpent || '0');
  const nuts = parseInt(numberOfNuts || '0');

  const previewCostPerNut = nuts >= 0 ? calculateCostPerNut(amount, nuts) : 0;
  const previewTimePerNut = nuts >= 0 ? calculateTimePerNut(totalMinutes, nuts) : 0;
  const previewCostPerHour = totalMinutes > 0 ? calculateCostPerHour(amount, totalMinutes) : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

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
        date,
        amount_spent: amount,
        duration_minutes: totalMinutes,
        number_of_nuts: nuts,
      });

      if (insertError) throw insertError;

      setDate(new Date().toISOString().split('T')[0]);
      setAmountSpent('');
      setHours('');
      setMinutes('');
      setNumberOfNuts('');
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
      <form onSubmit={handleSubmit} className="space-y-6">
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
            disabled={loading}
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
            value={amountSpent}
            onChange={(e) => setAmountSpent(e.target.value)}
            required
            min="0"
            disabled={loading}
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
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                min="0"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-cpn-gray mb-2">Minutes (optional)</label>
              <input
                type="number"
                className="input-cpn w-full"
                placeholder="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                min="0"
                max="59"
                disabled={loading}
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
            value={numberOfNuts}
            onChange={(e) => setNumberOfNuts(e.target.value)}
            required
            min="0"
            disabled={loading}
          />
        </div>

        {amount >= 0 && nuts >= 0 && totalMinutes > 0 && (
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
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-cpn flex-1" disabled={loading}>
            {loading ? 'Adding...' : 'Add Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
