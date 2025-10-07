import { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Loader, CheckCircle, AlertCircle, Clock, DollarSign, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { Database } from '../lib/types/database';
import { calculateCostPerNut, calculateTimePerNut, calculateCostPerHour, formatCurrency } from '../lib/calculations';

type Girl = Database['public']['Tables']['girls']['Row'];
type DataEntry = Database['public']['Tables']['data_entries']['Row'];

interface AddDataPageProps {
  girlId: string;
  onBack: () => void;
}

interface GirlWithMetrics extends Girl {
  totalSpent: number;
  totalNuts: number;
  totalTime: number;
  costPerNut: number;
  timePerNut: number;
  costPerHour: number;
  entryCount: number;
}

export function AddDataPage({ girlId, onBack }: AddDataPageProps) {
  const [girl, setGirl] = useState<GirlWithMetrics | null>(null);
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<DataEntry | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountSpent, setAmountSpent] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [numberOfNuts, setNumberOfNuts] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadGirlData();
  }, [girlId]);

  const loadGirlData = async () => {
    setLoading(true);
    try {
      const { data: girlData, error: girlError } = await supabase
        .from('girls')
        .select('*')
        .eq('id', girlId)
        .maybeSingle();

      if (girlError) throw girlError;
      if (!girlData) {
        setError('Girl not found');
        return;
      }

      const { data: entriesData, error: entriesError } = await supabase
        .from('data_entries')
        .select('*')
        .eq('girl_id', girlId)
        .order('date', { ascending: false });

      if (entriesError) throw entriesError;

      const allEntries = entriesData || [];
      const totalSpent = allEntries.reduce((sum, e) => sum + Number(e.amount_spent), 0);
      const totalNuts = allEntries.reduce((sum, e) => sum + e.number_of_nuts, 0);
      const totalTime = allEntries.reduce((sum, e) => sum + e.duration_minutes, 0);

      setGirl({
        ...girlData,
        totalSpent,
        totalNuts,
        totalTime,
        costPerNut: calculateCostPerNut(totalSpent, totalNuts),
        timePerNut: calculateTimePerNut(totalTime, totalNuts),
        costPerHour: calculateCostPerHour(totalSpent, totalTime),
        entryCount: allEntries.length,
      });

      setEntries(allEntries);
    } catch (err: any) {
      console.error('Error loading girl data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const totalMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0');
  const amount = parseFloat(amountSpent || '0');
  const nuts = parseInt(numberOfNuts || '0');

  const previewCostPerNut = nuts >= 0 ? calculateCostPerNut(amount, nuts) : 0;
  const previewTimePerNut = nuts >= 0 ? calculateTimePerNut(totalMinutes, nuts) : 0;
  const previewCostPerHour = totalMinutes > 0 ? calculateCostPerHour(amount, totalMinutes) : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

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

    setSubmitting(true);

    try {
      if (editingEntry) {
        const { error: updateError } = await supabase
          .from('data_entries')
          .update({
            date,
            amount_spent: amount,
            duration_minutes: totalMinutes,
            number_of_nuts: nuts,
          })
          .eq('id', editingEntry.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('data_entries').insert({
          girl_id: girlId,
          date,
          amount_spent: amount,
          duration_minutes: totalMinutes,
          number_of_nuts: nuts,
        });

        if (insertError) throw insertError;
      }

      setDate(new Date().toISOString().split('T')[0]);
      setAmountSpent('');
      setHours('');
      setMinutes('');
      setNumberOfNuts('');
      setEditingEntry(null);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);

      await loadGirlData();
    } catch (err: any) {
      setError(err.message || 'Failed to save data entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry: DataEntry) => {
    setEditingEntry(entry);
    setDate(entry.date);
    setAmountSpent(entry.amount_spent.toString());
    const entryHours = Math.floor(entry.duration_minutes / 60);
    const entryMinutes = entry.duration_minutes % 60;
    setHours(entryHours > 0 ? entryHours.toString() : '');
    setMinutes(entryMinutes > 0 ? entryMinutes.toString() : '');
    setNumberOfNuts(entry.number_of_nuts.toString());
    setError('');
    setSuccess(false);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('data_entries')
        .delete()
        .eq('id', entryId);

      if (deleteError) throw deleteError;

      await loadGirlData();
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry');
    }
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setDate(new Date().toISOString().split('T')[0]);
    setAmountSpent('');
    setHours('');
    setMinutes('');
    setNumberOfNuts('');
    setError('');
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-cpn-yellow" size={48} />
      </div>
    );
  }

  if (!girl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AlertCircle className="text-red-400 mb-4" size={64} />
        <h2 className="text-2xl mb-2">Girl Not Found</h2>
        <p className="text-cpn-gray mb-6">{error || 'This profile does not exist or you do not have access to it.'}</p>
        <button onClick={onBack} className="btn-cpn">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-cpn-dark rounded-lg transition-colors group"
          aria-label="Go back"
        >
          <ArrowLeft className="text-cpn-gray group-hover:text-cpn-yellow transition-colors" size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Data for {girl.name}</h1>
          <p className="text-cpn-gray">
            {girl.age} • {girl.ethnicity || 'N/A'} • {girl.rating.toFixed(1)}/10
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
          <p className="text-green-400 text-sm">Entry {editingEntry ? 'updated' : 'added'} successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-cpn">
          <h3 className="text-xl mb-6 flex items-center gap-2">
            {editingEntry ? (
              <>
                <Pencil size={20} className="text-cpn-yellow" />
                Edit Entry
              </>
            ) : (
              '+ Add New Entry'
            )}
          </h3>

          {editingEntry && (
            <div className="mb-4 p-3 bg-cpn-yellow/10 border border-cpn-yellow/30 rounded-lg flex items-center justify-between">
              <p className="text-cpn-yellow text-sm">
                Editing entry from {new Date(editingEntry.date).toLocaleDateString()}
              </p>
              <button onClick={cancelEdit} className="text-cpn-gray hover:text-white text-sm">
                Cancel
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="date" className="block text-sm text-cpn-yellow mb-2">
                Date
              </label>
              <input
                id="date"
                type="date"
                className="input-cpn w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="amountSpent" className="block text-sm text-cpn-yellow mb-2">
                Amount Spent ($)
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
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm text-cpn-yellow mb-2">Duration</label>
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
                    disabled={submitting}
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
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="numberOfNuts" className="block text-sm text-cpn-yellow mb-2">
                Nuts
              </label>
              <input
                id="numberOfNuts"
                type="number"
                className="input-cpn w-full"
                value={numberOfNuts}
                onChange={(e) => setNumberOfNuts(e.target.value)}
                required
                min="0"
                disabled={submitting}
              />
            </div>

            <button type="submit" className="w-full btn-cpn flex items-center justify-center gap-2" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  {editingEntry ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                editingEntry ? '+ Update Entry' : '+ Add Entry'
              )}
            </button>
          </form>
        </div>

        <div className="card-cpn">
          <h3 className="text-xl mb-6">Overall Statistics</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-cpn-gray mb-1">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(girl.totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-cpn-gray mb-1">Total Nuts</p>
              <p className="text-2xl font-bold">{girl.totalNuts}</p>
            </div>
            <div>
              <p className="text-sm text-cpn-gray mb-1">Total Time</p>
              <p className="text-2xl font-bold">{formatDuration(girl.totalTime)}</p>
            </div>
            <div>
              <p className="text-sm text-cpn-gray mb-1">Time Per Nut</p>
              <p className="text-2xl font-bold">{girl.timePerNut.toFixed(0)} mins</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-cpn-gray/20">
            <div className="flex items-center justify-between p-3 bg-cpn-dark rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="text-cpn-yellow" size={20} />
                <span className="text-cpn-gray">Cost Per Nut</span>
              </div>
              <span className="text-cpn-yellow font-bold text-lg">{formatCurrency(girl.costPerNut)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-cpn-dark rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="text-cpn-yellow" size={20} />
                <span className="text-cpn-gray">Cost Per Hour</span>
              </div>
              <span className="text-cpn-yellow font-bold text-lg">{formatCurrency(girl.costPerHour)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-cpn-dark rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-cpn-yellow" size={20} />
                <span className="text-cpn-gray">Entries</span>
              </div>
              <span className="text-white font-bold text-lg">{girl.entryCount}</span>
            </div>
          </div>

          {amount >= 0 && nuts >= 0 && totalMinutes > 0 && (
            <div className="mt-6 p-4 bg-cpn-yellow/10 border border-cpn-yellow/30 rounded-lg">
              <h4 className="text-sm text-cpn-yellow mb-3 font-bold">This Entry Preview</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
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
        </div>
      </div>

      <div className="card-cpn">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl">History</h3>
          <span className="text-sm text-cpn-gray">{entries.length} entries</span>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto mb-4 text-cpn-gray" />
            <p className="text-cpn-gray">No entries yet</p>
            <p className="text-sm text-cpn-gray mt-1">Add your first entry above to start tracking</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-cpn-gray/20">
                    <th className="pb-3 text-cpn-yellow text-sm font-semibold">Date</th>
                    <th className="pb-3 text-cpn-yellow text-sm font-semibold">Amount</th>
                    <th className="pb-3 text-cpn-yellow text-sm font-semibold">Duration</th>
                    <th className="pb-3 text-cpn-yellow text-sm font-semibold">Nuts</th>
                    <th className="pb-3 text-cpn-yellow text-sm font-semibold">Cost/Nut</th>
                    <th className="pb-3 text-cpn-yellow text-sm font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const entryCostPerNut = calculateCostPerNut(Number(entry.amount_spent), entry.number_of_nuts);
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-cpn-gray/10 hover:bg-cpn-dark/50 transition-colors ${
                          index % 2 === 0 ? 'bg-cpn-dark/20' : ''
                        }`}
                      >
                        <td className="py-4">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="py-4">{formatCurrency(Number(entry.amount_spent))}</td>
                        <td className="py-4">{formatDuration(entry.duration_minutes)}</td>
                        <td className="py-4">{entry.number_of_nuts}</td>
                        <td className="py-4 text-cpn-yellow">{formatCurrency(entryCostPerNut)}</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-2 hover:bg-cpn-yellow/10 rounded transition-colors"
                              aria-label="Edit entry"
                            >
                              <Pencil size={16} className="text-cpn-yellow" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 hover:bg-red-500/10 rounded transition-colors"
                              aria-label="Delete entry"
                            >
                              <Trash2 size={16} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {entries.map((entry) => {
                const entryCostPerNut = calculateCostPerNut(Number(entry.amount_spent), entry.number_of_nuts);
                return (
                  <div key={entry.id} className="p-4 bg-cpn-dark rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold">{new Date(entry.date).toLocaleDateString()}</p>
                        <p className="text-sm text-cpn-gray">{formatDuration(entry.duration_minutes)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-2 hover:bg-cpn-yellow/10 rounded transition-colors"
                        >
                          <Pencil size={16} className="text-cpn-yellow" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-cpn-gray/20">
                      <div>
                        <p className="text-xs text-cpn-gray">Amount</p>
                        <p className="font-bold">{formatCurrency(Number(entry.amount_spent))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-cpn-gray">Nuts</p>
                        <p className="font-bold">{entry.number_of_nuts}</p>
                      </div>
                      <div>
                        <p className="text-xs text-cpn-gray">Cost/Nut</p>
                        <p className="font-bold text-cpn-yellow">{formatCurrency(entryCostPerNut)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
