import { useState, useEffect, FormEvent } from 'react';
import { Check, Calendar, DollarSign, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { Database } from '../lib/types/database';
import { Toast } from '../components/Toast';

type Girl = Database['public']['Tables']['girls']['Row'];

interface DataEntryProps {
  userId: string;
  onSuccess: () => void;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export function DataEntry({ userId, onSuccess }: DataEntryProps) {
  const [girls, setGirls] = useState<Girl[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGirlId, setSelectedGirlId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountSpent, setAmountSpent] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [numberOfNuts, setNumberOfNuts] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadGirls();
  }, [userId]);

  const loadGirls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('girls')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setGirls(data || []);
    } catch (error) {
      console.error('Error loading girls:', error);
      showToast('Failed to load profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGirlSelect = (girlId: string) => {
    setSelectedGirlId(girlId);
    setIsFormOpen(true);
    setErrors({});
    resetForm();

    setTimeout(() => {
      const formElement = document.getElementById('entry-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setAmountSpent('');
    setHours('');
    setMinutes('');
    setNumberOfNuts('');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = 'This field is required';
    }

    if (!amountSpent || parseFloat(amountSpent) < 0) {
      newErrors.amountSpent = 'This field is required';
    }

    if (!hours || parseInt(hours) < 0) {
      newErrors.hours = 'This field is required';
    }

    if (!numberOfNuts || parseInt(numberOfNuts) < 0) {
      newErrors.numberOfNuts = 'This field is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedGirlId) {
      return;
    }

    setSubmitting(true);

    try {
      const totalMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0');
      const amount = parseFloat(amountSpent);
      const nuts = parseInt(numberOfNuts);

      const { error: insertError } = await supabase.from('data_entries').insert({
        girl_id: selectedGirlId,
        date,
        amount_spent: amount,
        duration_minutes: totalMinutes,
        number_of_nuts: nuts,
      });

      if (insertError) throw insertError;

      setIsFormOpen(false);
      setSelectedGirlId(null);
      resetForm();
      showToast('Entry added, data has been saved successfully', 'success');
      onSuccess();
    } catch (err: any) {
      console.error('Error adding entry:', err);
      showToast('Failed to save entry. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGirl = girls.find((g) => g.id === selectedGirlId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl mb-2">Data Entry</h2>
        <p className="text-cpn-gray">Quick entry form for adding data to any girl profile</p>
      </div>

      {loading ? (
        <div className="card-cpn">
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-cpn-yellow" size={48} />
          </div>
        </div>
      ) : girls.length === 0 ? (
        <div className="card-cpn">
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto mb-4 text-cpn-gray" />
            <p className="text-cpn-gray mb-2">No active girls found</p>
            <p className="text-sm text-cpn-gray">Add a girl profile first to start tracking data</p>
          </div>
        </div>
      ) : (
        <div className="card-cpn">
          <h3 className="text-xl mb-2 flex items-center gap-2">
            + Add New Entry
          </h3>
          <p className="text-sm text-cpn-gray mb-6">
            Enter data for any of your profiles. Statistics will update automatically.
          </p>

          <div className="mb-6">
            <label className="block text-cpn-yellow text-sm mb-3">
              Select Girl <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {girls.map((girl) => {
                const isSelected = selectedGirlId === girl.id;
                return (
                  <div
                    key={girl.id}
                    onClick={() => handleGirlSelect(girl.id)}
                    className={`girl-selection-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-1">{girl.name}</h4>
                      <p className="text-sm text-cpn-gray">
                        {girl.age} • {girl.ethnicity || girl.nationality || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cpn-yellow font-semibold">
                        ★{girl.rating.toFixed(1)}/10
                      </span>
                      {isSelected && <Check size={20} className="text-cpn-yellow" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isFormOpen && selectedGirl && (
            <div id="entry-form" className="form-container animate-slide-up">
              <h3 className="text-xl mb-6">Entry Details</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="date" className="block text-sm text-cpn-yellow mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="date"
                      type="date"
                      className={`input-cpn w-full pr-10 ${errors.date ? 'border-red-500' : ''}`}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      disabled={submitting}
                    />
                    <Calendar
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cpn-gray pointer-events-none"
                    />
                  </div>
                  {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label htmlFor="amountSpent" className="block text-sm text-cpn-yellow mb-2">
                    Amount Spent ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-cpn-gray pointer-events-none"
                    />
                    <input
                      id="amountSpent"
                      type="number"
                      step="0.01"
                      className={`input-cpn w-full pl-10 ${errors.amountSpent ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                      value={amountSpent}
                      onChange={(e) => setAmountSpent(e.target.value)}
                      min="0"
                      disabled={submitting}
                    />
                  </div>
                  {errors.amountSpent && (
                    <p className="text-red-400 text-xs mt-1">{errors.amountSpent}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-cpn-yellow mb-2">Duration</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="hours" className="block text-xs text-cpn-gray mb-2">
                        Hours <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="hours"
                        type="number"
                        className={`input-cpn w-full ${errors.hours ? 'border-red-500' : ''}`}
                        placeholder="0"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        min="0"
                        disabled={submitting}
                      />
                      {errors.hours && <p className="text-red-400 text-xs mt-1">{errors.hours}</p>}
                    </div>
                    <div>
                      <label htmlFor="minutes" className="block text-xs text-cpn-gray mb-2">
                        Minutes <span className="text-cpn-gray">(optional)</span>
                      </label>
                      <input
                        id="minutes"
                        type="number"
                        className="input-cpn w-full"
                        placeholder="0"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        min="0"
                        max="59"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="numberOfNuts" className="block text-sm text-cpn-yellow mb-2">
                    Nuts <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="numberOfNuts"
                    type="number"
                    className={`input-cpn w-full ${errors.numberOfNuts ? 'border-red-500' : ''}`}
                    value={numberOfNuts}
                    onChange={(e) => setNumberOfNuts(e.target.value)}
                    min="0"
                    disabled={submitting}
                  />
                  {errors.numberOfNuts && (
                    <p className="text-red-400 text-xs mt-1">{errors.numberOfNuts}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full btn-cpn flex items-center justify-center gap-2 h-12"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Submitting...
                    </>
                  ) : (
                    '+ Add Entry'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
