import { useState, useMemo } from 'react';
import { Plus, CreditCard as Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Share2 } from 'lucide-react';
import { formatCurrency, formatRating, formatTime, calculateCostPerNut } from '../lib/calculations';
import { ShareModal } from '../components/ShareModal';

interface Girl {
  id: string;
  name: string;
  age: number;
  rating: number;
  is_active: boolean;
  totalSpent: number;
  totalNuts: number;
  totalTime: number;
  costPerNut: number;
  timePerNut: number;
  costPerHour: number;
  entryCount: number;
}

interface OverviewProps {
  girls: Girl[];
  onAddData: (girl: Girl) => void;
  onEdit: (girl: Girl) => void;
  onDelete: (girl: Girl) => void;
}

type SortField = 'name' | 'rating' | 'totalNuts' | 'totalSpent' | 'costPerNut' | 'totalTime' | 'timePerNut' | 'costPerHour';
type SortDirection = 'asc' | 'desc' | null;

export function Overview({ girls, onAddData, onEdit, onDelete }: OverviewProps) {
  const [sortField, setSortField] = useState<SortField>('costPerNut');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [showShareModal, setShowShareModal] = useState(false);

  const filteredGirls = useMemo(() => {
    let filtered = girls;
    if (filter === 'active') {
      filtered = girls.filter((g) => g.is_active);
    } else if (filter === 'inactive') {
      filtered = girls.filter((g) => !g.is_active);
    }
    return filtered;
  }, [girls, filter]);

  const sortedGirls = useMemo(() => {
    if (!sortDirection) return filteredGirls;

    return [...filteredGirls].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [filteredGirls, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField('costPerNut');
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-cpn-gray/50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={14} className="text-cpn-yellow" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown size={14} className="text-cpn-yellow" />;
    }
    return <ArrowUpDown size={14} className="text-cpn-gray/50" />;
  };

  const activeGirls = girls.filter((g) => g.is_active);
  const totalSpent = activeGirls.reduce((sum, g) => sum + g.totalSpent, 0);
  const totalNuts = activeGirls.reduce((sum, g) => sum + g.totalNuts, 0);
  const avgCostPerNut = calculateCostPerNut(totalSpent, totalNuts);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl mb-2">Overview</h2>
          <p className="text-cpn-gray">Compare all profiles in a comprehensive table view</p>
        </div>
        {girls.length > 0 && (
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Share2 size={20} />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          className={filter === 'all' ? 'btn-cpn' : 'btn-secondary'}
          onClick={() => setFilter('all')}
        >
          All ({girls.length})
        </button>
        <button
          className={filter === 'active' ? 'btn-cpn' : 'btn-secondary'}
          onClick={() => setFilter('active')}
        >
          Active ({girls.filter((g) => g.is_active).length})
        </button>
        <button
          className={filter === 'inactive' ? 'btn-cpn' : 'btn-secondary'}
          onClick={() => setFilter('inactive')}
        >
          Inactive ({girls.filter((g) => !g.is_active).length})
        </button>
      </div>

      {sortedGirls.length === 0 ? (
        <div className="card-cpn text-center py-12">
          <p className="text-cpn-gray">No profiles found with current filter</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="table-cpn">
              <thead>
                <tr>
                  <th>
                    <button
                      className="flex items-center gap-2 hover:text-white transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      <SortIcon field="name" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="flex items-center gap-2 hover:text-white transition-colors"
                      onClick={() => handleSort('rating')}
                    >
                      Rating
                      <SortIcon field="rating" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button
                      className="flex items-center gap-2 ml-auto hover:text-white transition-colors"
                      onClick={() => handleSort('totalNuts')}
                    >
                      Total Nuts
                      <SortIcon field="totalNuts" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button
                      className="flex items-center gap-2 ml-auto hover:text-white transition-colors"
                      onClick={() => handleSort('totalSpent')}
                    >
                      Total Spent
                      <SortIcon field="totalSpent" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button
                      className="flex items-center gap-2 ml-auto hover:text-white transition-colors"
                      onClick={() => handleSort('costPerNut')}
                    >
                      Cost/Nut
                      <SortIcon field="costPerNut" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button
                      className="flex items-center gap-2 ml-auto hover:text-white transition-colors"
                      onClick={() => handleSort('totalTime')}
                    >
                      Total Time
                      <SortIcon field="totalTime" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button
                      className="flex items-center gap-2 ml-auto hover:text-white transition-colors"
                      onClick={() => handleSort('timePerNut')}
                    >
                      Time/Nut
                      <SortIcon field="timePerNut" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button
                      className="flex items-center gap-2 ml-auto hover:text-white transition-colors"
                      onClick={() => handleSort('costPerHour')}
                    >
                      Cost/Hour
                      <SortIcon field="costPerHour" />
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedGirls.map((girl) => (
                  <tr key={girl.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{girl.name}</span>
                        {!girl.is_active && (
                          <span className="px-2 py-0.5 text-xs bg-cpn-gray/20 text-cpn-gray rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-cpn-yellow">{formatRating(girl.rating)}</span>
                    </td>
                    <td className="text-right font-bold">{girl.totalNuts}</td>
                    <td className="text-right font-bold">{formatCurrency(girl.totalSpent)}</td>
                    <td className="text-right font-bold text-cpn-yellow">
                      {girl.entryCount > 0 ? formatCurrency(girl.costPerNut) : '-'}
                    </td>
                    <td className="text-right">
                      {girl.totalTime > 0 ? formatTime(girl.totalTime) : '-'}
                    </td>
                    <td className="text-right">
                      {girl.entryCount > 0 ? `${girl.timePerNut.toFixed(1)}m` : '-'}
                    </td>
                    <td className="text-right">
                      {girl.entryCount > 0 ? formatCurrency(girl.costPerHour) : '-'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAddData(girl)}
                          className="p-2 hover:bg-cpn-yellow/10 rounded transition-colors"
                          title="Add Data"
                        >
                          <Plus size={16} className="text-cpn-yellow" />
                        </button>
                        <button
                          onClick={() => onEdit(girl)}
                          className="p-2 hover:bg-blue-500/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} className="text-blue-400" />
                        </button>
                        <button
                          onClick={() => onDelete(girl)}
                          className="p-2 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {sortedGirls.map((girl) => (
              <div key={girl.id} className="card-cpn">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{girl.name}</h3>
                    <p className="text-cpn-yellow text-sm">{formatRating(girl.rating)}</p>
                  </div>
                  {!girl.is_active && (
                    <span className="px-2 py-1 text-xs bg-cpn-gray/20 text-cpn-gray rounded">Inactive</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                  <div className="text-center">
                    <p className="text-cpn-gray text-xs mb-1">Nuts</p>
                    <p className="font-bold">{girl.totalNuts}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cpn-gray text-xs mb-1">Spent</p>
                    <p className="font-bold">{formatCurrency(girl.totalSpent)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cpn-gray text-xs mb-1">Cost/Nut</p>
                    <p className="font-bold text-cpn-yellow">
                      {girl.entryCount > 0 ? formatCurrency(girl.costPerNut) : '-'}
                    </p>
                  </div>
                </div>

                <details className="mb-4">
                  <summary className="text-sm text-cpn-gray cursor-pointer hover:text-white transition-colors">
                    More metrics
                  </summary>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <p className="text-cpn-gray text-xs mb-1">Total Time</p>
                      <p className="font-bold">{girl.totalTime > 0 ? formatTime(girl.totalTime) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-cpn-gray text-xs mb-1">Time/Nut</p>
                      <p className="font-bold">
                        {girl.entryCount > 0 ? `${girl.timePerNut.toFixed(1)}m` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-cpn-gray text-xs mb-1">Cost/Hour</p>
                      <p className="font-bold">
                        {girl.entryCount > 0 ? formatCurrency(girl.costPerHour) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-cpn-gray text-xs mb-1">Entries</p>
                      <p className="font-bold">{girl.entryCount}</p>
                    </div>
                  </div>
                </details>

                <div className="flex gap-2">
                  <button
                    className="btn-cpn flex-1 flex items-center justify-center gap-2"
                    onClick={() => onAddData(girl)}
                  >
                    <Plus size={16} />
                    Add Data
                  </button>
                  <button
                    className="btn-secondary px-4"
                    onClick={() => onEdit(girl)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn-danger px-4"
                    onClick={() => onDelete(girl)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareData={{
          type: 'overview',
          overviewStats: {
            totalGirls: activeGirls.length,
            totalSpent,
            totalNuts,
            avgCostPerNut,
            bestValueGirl: activeGirls.length > 0 ? activeGirls.sort((a, b) => a.costPerNut - b.costPerNut)[0]?.name : undefined,
          },
        }}
        title="My CPN Stats"
      />
    </div>
  );
}
