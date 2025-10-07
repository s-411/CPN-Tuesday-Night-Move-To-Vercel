import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, Clock, Users, Plus, BarChart3, Table, PlayCircle, CheckCircle2, Trophy, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { formatCurrency, formatTime, calculateCostPerNut, calculateTimePerNut, calculateCostPerHour, formatRating } from '../lib/calculations';

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

interface DataEntry {
  id: string;
  girl_id: string;
  date: string;
  amount_spent: number;
  duration_minutes: number;
  number_of_nuts: number;
  created_at: string;
}

interface DataEntryWithGirl extends DataEntry {
  girlName: string;
}

interface DashboardProps {
  girls: Girl[];
  onNavigate: (view: string) => void;
}

export function Dashboard({ girls, onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [recentEntries, setRecentEntries] = useState<DataEntryWithGirl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentEntries();
  }, [user, girls]);

  const loadRecentEntries = async () => {
    if (!user || girls.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('data_entries')
        .select('*')
        .in('girl_id', girls.map(g => g.id))
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;

      const entriesWithGirls = (data || []).map(entry => {
        const girl = girls.find(g => g.id === entry.girl_id);
        return {
          ...entry,
          girlName: girl?.name || 'Unknown'
        };
      });

      setRecentEntries(entriesWithGirls);
    } catch (error) {
      console.error('Error loading recent entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeGirls = girls.filter(g => g.is_active);
  const inactiveCount = girls.length - activeGirls.length;

  const totalSpent = activeGirls.reduce((sum, g) => sum + g.totalSpent, 0);
  const totalNuts = activeGirls.reduce((sum, g) => sum + g.totalNuts, 0);
  const totalTime = activeGirls.reduce((sum, g) => sum + g.totalTime, 0);
  const avgCostPerNut = calculateCostPerNut(totalSpent, totalNuts);

  const bestValueGirl = useMemo(() => {
    const girlsWithData = activeGirls.filter(g => g.entryCount > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.sort((a, b) => a.costPerNut - b.costPerNut)[0];
  }, [activeGirls]);

  const highestInvestmentGirl = useMemo(() => {
    const girlsWithData = activeGirls.filter(g => g.entryCount > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [activeGirls]);

  const mostTimeGirl = useMemo(() => {
    const girlsWithData = activeGirls.filter(g => g.entryCount > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.sort((a, b) => b.totalTime - a.totalTime)[0];
  }, [activeGirls]);

  const topGirlsByInvestment = useMemo(() => {
    if (activeGirls.length === 0) return [];
    const total = totalSpent;
    return activeGirls
      .filter(g => g.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(g => ({
        name: g.name,
        percentage: total > 0 ? (g.totalSpent / total) * 100 : 0
      }));
  }, [activeGirls, totalSpent]);

  const totalEntries = activeGirls.reduce((sum, g) => sum + g.entryCount, 0);
  const totalHours = Math.floor(totalTime / 60);
  const avgTimePerSession = totalEntries > 0 ? totalTime / totalEntries : 0;

  const efficiencyGrade = useMemo(() => {
    if (totalNuts === 0) return 'N/A';
    if (avgCostPerNut < 20) return 'A+';
    if (avgCostPerNut < 40) return 'A';
    if (avgCostPerNut < 60) return 'B+';
    if (avgCostPerNut < 80) return 'B';
    if (avgCostPerNut < 100) return 'C+';
    return 'C';
  }, [avgCostPerNut, totalNuts]);

  const efficiencyLabel = useMemo(() => {
    if (totalNuts === 0) return 'No data';
    if (avgCostPerNut < 40) return 'Excellent efficiency';
    if (avgCostPerNut < 80) return 'Good efficiency';
    return 'Room for improvement';
  }, [avgCostPerNut, totalNuts]);

  const currentStreak = 7;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDayOfMonth = new Date().getDate();
  const monthProgress = (currentDayOfMonth / daysInMonth) * 100;
  const targetMet = totalEntries >= 10;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Dashboard</h2>
        <p className="text-cpn-gray">Your performance insights and recent activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-cpn group hover:border-green-500/30 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="text-green-500" size={20} />
            </div>
            <div className="text-green-500 text-sm flex items-center gap-1">
              <TrendingUp size={14} />
              +12%
            </div>
          </div>
          <div className="text-cpn-gray text-sm mb-1">Total Investment</div>
          <div className="text-2xl font-bold mb-1">{formatCurrency(totalSpent)}</div>
          <div className="text-xs text-cpn-gray">Across {activeGirls.length} {activeGirls.length === 1 ? 'profile' : 'profiles'}</div>
        </div>

        <div className="card-cpn group hover:border-green-500/30 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div className="text-cpn-yellow text-sm">Average</div>
          </div>
          <div className="text-cpn-gray text-sm mb-1">Avg Cost/Nut</div>
          <div className="text-2xl font-bold mb-1">{formatCurrency(avgCostPerNut)}</div>
          <div className="text-xs text-cpn-gray">Efficiency rating</div>
        </div>

        <div className="card-cpn group hover:border-blue-500/30 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="text-blue-500" size={20} />
            </div>
            <div className="text-blue-500 text-sm">{totalHours} hrs</div>
          </div>
          <div className="text-cpn-gray text-sm mb-1">Time Investment</div>
          <div className="text-2xl font-bold mb-1">{formatTime(totalTime)}</div>
          <div className="text-xs text-cpn-gray">{formatCurrency(avgTimePerSession)}/m rate</div>
        </div>

        <div className="card-cpn group hover:border-purple-500/30 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="text-purple-500" size={20} />
            </div>
            <div className="text-green-500 text-sm flex items-center gap-1">
              <CheckCircle2 size={14} />
              Active
            </div>
          </div>
          <div className="text-cpn-gray text-sm mb-1">Active Profiles</div>
          <div className="text-2xl font-bold mb-1">{activeGirls.length}</div>
          <div className="text-xs text-cpn-gray">{inactiveCount} inactive</div>
        </div>
      </div>

      <div className="card-cpn">
        <h3 className="text-xl font-bold mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all group cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-500" size={18} />
              <span className="text-green-500 text-sm font-medium">Best Value</span>
            </div>
            {bestValueGirl ? (
              <>
                <div className="text-lg font-bold mb-1">{bestValueGirl.name}</div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Cost per Nut:</span>
                  <span className="text-green-500 font-bold">{formatCurrency(bestValueGirl.costPerNut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Total Spent:</span>
                  <span className="font-bold">{formatCurrency(bestValueGirl.totalSpent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Total Nuts:</span>
                  <span className="font-bold">{bestValueGirl.totalNuts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Rating:</span>
                  <span className="text-cpn-yellow font-bold">{formatRating(bestValueGirl.rating)}</span>
                </div>
              </>
            ) : (
              <div className="text-cpn-gray text-sm">No data yet</div>
            )}
          </div>

          <div className="p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all group cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-yellow-500" size={18} />
              <span className="text-yellow-500 text-sm font-medium">Highest Investment</span>
            </div>
            {highestInvestmentGirl ? (
              <>
                <div className="text-lg font-bold mb-1">{highestInvestmentGirl.name}</div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Total Spent:</span>
                  <span className="text-yellow-500 font-bold">{formatCurrency(highestInvestmentGirl.totalSpent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Cost per Nut:</span>
                  <span className="font-bold">{formatCurrency(highestInvestmentGirl.costPerNut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Total Nuts:</span>
                  <span className="font-bold">{highestInvestmentGirl.totalNuts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Rating:</span>
                  <span className="text-cpn-yellow font-bold">{formatRating(highestInvestmentGirl.rating)}</span>
                </div>
              </>
            ) : (
              <div className="text-cpn-gray text-sm">No data yet</div>
            )}
          </div>

          <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all group cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-blue-500" size={18} />
              <span className="text-blue-500 text-sm font-medium">Most Time</span>
            </div>
            {mostTimeGirl ? (
              <>
                <div className="text-lg font-bold mb-1">{mostTimeGirl.name}</div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Total Time:</span>
                  <span className="text-blue-500 font-bold">{formatTime(mostTimeGirl.totalTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Time per Nut:</span>
                  <span className="font-bold">{mostTimeGirl.timePerNut.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Cost per Hour:</span>
                  <span className="font-bold">{formatCurrency(mostTimeGirl.costPerHour)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cpn-gray">Rating:</span>
                  <span className="text-cpn-yellow font-bold">{formatRating(mostTimeGirl.rating)}</span>
                </div>
              </>
            ) : (
              <div className="text-cpn-gray text-sm">No data yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-cpn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Performance Comparison</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-cpn-gray">Your Average</span>
                <span className="font-bold">{formatCurrency(avgCostPerNut)}</span>
              </div>
              <div className="h-2 bg-cpn-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-cpn-yellow rounded-full transition-all"
                  style={{ width: `${Math.min((avgCostPerNut / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-cpn-gray">Best Performer</span>
                <span className="font-bold text-green-500">{bestValueGirl ? formatCurrency(bestValueGirl.costPerNut) : '$0.00'}</span>
              </div>
              <div className="h-2 bg-cpn-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: bestValueGirl ? `${Math.min((bestValueGirl.costPerNut / 100) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-cpn-gray/20">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{efficiencyGrade}</div>
                <div className="text-sm text-cpn-gray mb-1">Overall Efficiency</div>
                <div className="text-xs text-cpn-gray">{efficiencyLabel}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-cpn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Investment Distribution</h3>
          </div>
          <div className="space-y-3">
            {topGirlsByInvestment.length > 0 ? (
              topGirlsByInvestment.map((girl, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">#{idx + 1} {girl.name}</span>
                    <span className="text-cpn-gray">{girl.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-cpn-dark rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${girl.percentage}%`,
                        backgroundColor: idx === 0 ? '#F7DC6F' : idx === 1 ? '#52D726' : idx === 2 ? '#3B82F6' : idx === 3 ? '#8B5CF6' : '#EC4899'
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-cpn-gray">
                No investment data yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('dataentry')}
          className="card-cpn hover:bg-green-500/5 hover:border-green-500/30 transition-all group cursor-pointer text-left"
        >
          <div className="flex flex-col items-center justify-center py-6">
            <div className="p-3 bg-green-500/10 rounded-lg mb-3 group-hover:bg-green-500/20 transition-all">
              <Plus className="text-green-500" size={24} />
            </div>
            <div className="font-bold mb-1">Add Data</div>
            <div className="text-xs text-cpn-gray">Log new activity</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('girls')}
          className="card-cpn hover:bg-blue-500/5 hover:border-blue-500/30 transition-all group cursor-pointer text-left"
        >
          <div className="flex flex-col items-center justify-center py-6">
            <div className="p-3 bg-blue-500/10 rounded-lg mb-3 group-hover:bg-blue-500/20 transition-all">
              <Users className="text-blue-500" size={24} />
            </div>
            <div className="font-bold mb-1">Add Girl</div>
            <div className="text-xs text-cpn-gray">Create new profile</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="card-cpn hover:bg-purple-500/5 hover:border-purple-500/30 transition-all group cursor-pointer text-left"
        >
          <div className="flex flex-col items-center justify-center py-6">
            <div className="p-3 bg-purple-500/10 rounded-lg mb-3 group-hover:bg-purple-500/20 transition-all">
              <BarChart3 className="text-purple-500" size={24} />
            </div>
            <div className="font-bold mb-1">Analytics</div>
            <div className="text-xs text-cpn-gray">Deep dive insights</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('overview')}
          className="card-cpn hover:bg-yellow-500/5 hover:border-yellow-500/30 transition-all group cursor-pointer text-left"
        >
          <div className="flex flex-col items-center justify-center py-6">
            <div className="p-3 bg-yellow-500/10 rounded-lg mb-3 group-hover:bg-yellow-500/20 transition-all">
              <Table className="text-cpn-yellow" size={24} />
            </div>
            <div className="font-bold mb-1">Overview</div>
            <div className="text-xs text-cpn-gray">All data table</div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card-cpn text-center">
          <div className="text-4xl font-bold mb-2">{totalEntries}</div>
          <div className="text-sm text-cpn-gray mb-1">Total Nuts</div>
          <div className="text-xs text-cpn-gray">All time</div>
        </div>

        <div className="card-cpn text-center">
          <div className="text-4xl font-bold mb-2">{activeGirls.length}</div>
          <div className="text-sm text-cpn-gray mb-1">Total Profiles</div>
          <div className="text-xs text-cpn-gray">Active tracking</div>
        </div>

        <div className="card-cpn text-center">
          <div className="text-4xl font-bold mb-2">{totalHours}</div>
          <div className="text-sm text-cpn-gray mb-1">Hours Logged</div>
          <div className="text-xs text-cpn-gray">Time invested</div>
        </div>

        <div className="card-cpn text-center">
          <div className="text-4xl font-bold mb-2">{(totalSpent / (activeGirls.length || 1)).toFixed(0)}</div>
          <div className="text-sm text-cpn-gray mb-1">Avg Minutes/Nut</div>
          <div className="text-xs text-cpn-gray">Per session</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-cpn">
          <h3 className="text-xl font-bold mb-4">Monthly Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-cpn-gray">December 2024</span>
                <span className="font-bold">{currentDayOfMonth} days</span>
              </div>
              <div className="text-xs text-cpn-gray mb-2">16/22</div>
              <div className="h-3 bg-cpn-dark rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-cpn-yellow rounded-full transition-all"
                  style={{ width: `${monthProgress}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target size={16} className="text-cpn-gray" />
                <span className="text-cpn-gray">Efficiency Target</span>
              </div>
            </div>
            <div className="pt-4 border-t border-cpn-gray/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="text-orange-500" size={20} />
                <span className="text-2xl font-bold">{currentStreak}</span>
              </div>
              <div className="text-sm text-cpn-gray">day streak</div>
              <div className="text-xs text-cpn-gray mt-1">Keep logging data to maintain your streak!</div>
            </div>
          </div>
        </div>

        <div className="card-cpn">
          <h3 className="text-xl font-bold mb-4">Achievement Badges</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-lg border text-center ${totalEntries > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-cpn-dark border-cpn-gray/20'}`}>
              <div className="text-3xl mb-2">
                {totalEntries > 0 ? <CheckCircle2 className="text-green-500 mx-auto" size={32} /> : '❤️'}
              </div>
              <div className="text-sm font-bold mb-1">First Entry</div>
              <div className="text-xs text-cpn-gray">Log your first data</div>
            </div>

            <div className={`p-4 rounded-lg border text-center ${avgCostPerNut < 30 && totalNuts > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-cpn-dark border-cpn-gray/20'}`}>
              <div className="text-3xl mb-2">💎</div>
              <div className="text-sm font-bold mb-1">Efficiency Master</div>
              <div className="text-xs text-cpn-gray">Sub $30/nut average</div>
            </div>

            <div className={`p-4 rounded-lg border text-center ${totalEntries >= 100 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-cpn-dark border-cpn-gray/20'}`}>
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-bold mb-1">Data Collector</div>
              <div className="text-xs text-cpn-gray">100+ entries</div>
            </div>

            <div className={`p-4 rounded-lg border text-center ${bestValueGirl && bestValueGirl.costPerNut < 10 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-cpn-dark border-cpn-gray/20'}`}>
              <div className="text-3xl mb-2">👑</div>
              <div className="text-sm font-bold mb-1">High Roller</div>
              <div className="text-xs text-cpn-gray">$1000+ invested</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-xs text-cpn-gray">
              Next Achievement: <span className="text-white font-bold">Efficiency Master under $30/nut</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-cpn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Recent Activity</h3>
          <button
            onClick={() => onNavigate('datavault')}
            className="text-sm text-cpn-yellow hover:text-white transition-colors"
          >
            View all entries →
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-cpn-gray">Loading...</div>
        ) : recentEntries.length === 0 ? (
          <div className="text-center py-8 text-cpn-gray">
            No activity yet. Start by adding your first data entry!
          </div>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-cpn-dark rounded-lg hover:bg-cpn-dark/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-cpn-yellow/10 rounded-full">
                    <PlayCircle className="text-cpn-yellow" size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold mb-1">{entry.girlName}</div>
                    <div className="text-sm text-cpn-gray">
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm text-cpn-gray mb-1">Spent</div>
                    <div className="text-cpn-yellow font-bold">{formatCurrency(entry.amount_spent)}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm text-cpn-gray mb-1">Nuts</div>
                    <div className="font-bold">{entry.number_of_nuts}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm text-cpn-gray mb-1">Time</div>
                    <div className="font-bold">{formatTime(entry.duration_minutes)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-cpn-gray mb-1">Cost/Nut</div>
                    <div className="font-bold">{formatCurrency(entry.amount_spent / entry.number_of_nuts)}</div>
                  </div>
                </div>
                <button className="ml-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} className="text-cpn-gray" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
