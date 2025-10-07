import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, CreditCard as Edit, Trash2, Calendar, DollarSign, Clock, Target, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { Database } from '../lib/types/database';
import { formatCurrency, formatRating, formatTime, calculateCostPerNut, calculateTimePerNut, calculateCostPerHour } from '../lib/calculations';
import { AddDataModal } from '../components/AddDataModal';
import { EditDataModal } from '../components/EditDataModal';
import { ShareModal } from '../components/ShareModal';

type Girl = Database['public']['Tables']['girls']['Row'];
type DataEntry = Database['public']['Tables']['data_entries']['Row'];

interface GirlDetailProps {
  girl: Girl;
  onBack: () => void;
  onRefresh: () => void;
}

export function GirlDetail({ girl, onBack, onRefresh }: GirlDetailProps) {
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DataEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, [girl.id]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_entries')
        .select('*')
        .eq('girl_id', girl.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Delete this data entry? This action cannot be undone.')) return;

    try {
      const { error } = await supabase.from('data_entries').delete().eq('id', entryId);
      if (error) throw error;
      await loadEntries();
      onRefresh();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const handleEditEntry = (entry: DataEntry) => {
    setSelectedEntry(entry);
    setShowEditModal(true);
  };

  const handleSuccess = async () => {
    await loadEntries();
    onRefresh();
  };

  const totalSpent = entries.reduce((sum, e) => sum + Number(e.amount_spent), 0);
  const totalNuts = entries.reduce((sum, e) => sum + e.number_of_nuts, 0);
  const totalTime = entries.reduce((sum, e) => sum + e.duration_minutes, 0);

  const costPerNut = calculateCostPerNut(totalSpent, totalNuts);
  const timePerNut = calculateTimePerNut(totalTime, totalNuts);
  const costPerHour = calculateCostPerHour(totalSpent, totalTime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-cpn-gray hover:text-white mb-4">
          <ArrowLeft size={20} />
          <span>Back to Girls</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl mb-2">{girl.name}</h2>
            <div className="flex items-center gap-4 text-cpn-gray">
              <span>{girl.age} years old</span>
              <span className="text-cpn-yellow">{formatRating(girl.rating)}</span>
              {!girl.is_active && (
                <span className="px-2 py-1 text-xs bg-cpn-gray/20 text-cpn-gray rounded">Inactive</span>
              )}
            </div>
            {(girl.ethnicity || girl.hair_color || girl.location_city) && (
              <div className="flex items-center gap-3 mt-2 text-sm text-cpn-gray">
                {girl.ethnicity && <span>{girl.ethnicity}</span>}
                {girl.hair_color && <span>{girl.hair_color}</span>}
                {girl.location_city && <span>{girl.location_city}{girl.location_country ? `, ${girl.location_country}` : ''}</span>}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-secondary flex items-center gap-2"
              disabled={entries.length === 0}
            >
              <Share2 size={20} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-cpn flex items-center gap-2">
              <Plus size={20} />
              Add Data
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-cpn">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-cpn-gray" />
            <p className="text-sm text-cpn-gray">Total Spent</p>
          </div>
          <p className="text-2xl font-bold text-cpn-yellow">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="card-cpn">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-cpn-gray" />
            <p className="text-sm text-cpn-gray">Total Nuts</p>
          </div>
          <p className="text-2xl font-bold text-cpn-yellow">{totalNuts}</p>
        </div>
        <div className="card-cpn">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-cpn-gray" />
            <p className="text-sm text-cpn-gray">Cost/Nut</p>
          </div>
          <p className="text-2xl font-bold text-cpn-yellow">
            {entries.length > 0 ? formatCurrency(costPerNut) : '-'}
          </p>
        </div>
        <div className="card-cpn">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-cpn-gray" />
            <p className="text-sm text-cpn-gray">Total Time</p>
          </div>
          <p className="text-2xl font-bold text-cpn-yellow">
            {totalTime > 0 ? formatTime(totalTime) : '-'}
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-cpn bg-cpn-dark">
          <p className="text-sm text-cpn-gray mb-1">Time per Nut</p>
          <p className="text-xl font-bold">
            {entries.length > 0 ? `${timePerNut.toFixed(1)}m` : '-'}
          </p>
        </div>
        <div className="card-cpn bg-cpn-dark">
          <p className="text-sm text-cpn-gray mb-1">Cost per Hour</p>
          <p className="text-xl font-bold">
            {entries.length > 0 ? formatCurrency(costPerHour) : '-'}
          </p>
        </div>
        <div className="card-cpn bg-cpn-dark">
          <p className="text-sm text-cpn-gray mb-1">Total Entries</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
      </div>

      {/* Data Entry History */}
      <div className="card-cpn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl">Data Entry History</h3>
          <p className="text-sm text-cpn-gray">{entries.length} entries</p>
        </div>

        {loading ? (
          <p className="text-cpn-gray text-center py-8">Loading entries...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto mb-4 text-cpn-gray" />
            <p className="text-cpn-gray mb-4">No data entries yet</p>
            <button onClick={() => setShowAddModal(true)} className="btn-cpn">
              Add First Entry
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table-cpn">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Duration</th>
                    <th className="text-right">Nuts</th>
                    <th className="text-right">Cost/Nut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const entryCostPerNut = calculateCostPerNut(
                      Number(entry.amount_spent),
                      entry.number_of_nuts
                    );
                    return (
                      <tr key={entry.id}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="text-right font-bold">{formatCurrency(Number(entry.amount_spent))}</td>
                        <td className="text-right">{formatTime(entry.duration_minutes)}</td>
                        <td className="text-right font-bold">{entry.number_of_nuts}</td>
                        <td className="text-right font-bold text-cpn-yellow">
                          {formatCurrency(entryCostPerNut)}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className="p-2 hover:bg-blue-500/10 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} className="text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-2 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete"
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {entries.map((entry) => {
                const entryCostPerNut = calculateCostPerNut(
                  Number(entry.amount_spent),
                  entry.number_of_nuts
                );
                return (
                  <div key={entry.id} className="p-4 bg-cpn-dark rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-cpn-gray">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-2 hover:bg-blue-500/10 rounded transition-colors"
                        >
                          <Edit size={16} className="text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-cpn-gray text-xs mb-1">Amount</p>
                        <p className="font-bold">{formatCurrency(Number(entry.amount_spent))}</p>
                      </div>
                      <div>
                        <p className="text-cpn-gray text-xs mb-1">Duration</p>
                        <p className="font-bold">{formatTime(entry.duration_minutes)}</p>
                      </div>
                      <div>
                        <p className="text-cpn-gray text-xs mb-1">Nuts</p>
                        <p className="font-bold">{entry.number_of_nuts}</p>
                      </div>
                      <div>
                        <p className="text-cpn-gray text-xs mb-1">Cost/Nut</p>
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

      <AddDataModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
        girlId={girl.id}
        girlName={girl.name}
      />

      {selectedEntry && (
        <EditDataModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEntry(null);
          }}
          onSuccess={handleSuccess}
          entry={selectedEntry}
          girlName={girl.name}
        />
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareData={{
          type: 'girl',
          girlName: girl.name,
          rating: girl.rating,
          costPerNut,
          timePerNut,
          costPerHour,
          totalSpent,
          totalNuts,
          totalTime,
          entryCount: entries.length,
        }}
        title={`${girl.name}'s CPN Stats`}
      />
    </div>
  );
}
