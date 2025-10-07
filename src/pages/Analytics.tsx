import { useState, useMemo } from 'react';
import { BarChart3, Trophy } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { formatCurrency } from '../lib/calculations';

interface Girl {
  id: string;
  name: string;
  rating: number;
  totalSpent: number;
  totalNuts: number;
  totalTime: number;
  costPerNut: number;
  entryCount: number;
}

interface AnalyticsProps {
  girls: Girl[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const GIRL_COLORS: Record<string, string> = {
  'Sarah': '#4A90E2',
  'Emma': '#B565D8',
  'Maria': '#52C41A',
  'Sofia': '#EC7063',
};

const getGirlColor = (name: string, index: number): string => {
  return GIRL_COLORS[name] || ['#f2f661', '#60a5fa', '#4ade80', '#f87171', '#c084fc', '#fb923c'][index % 6];
};

export function Analytics({ girls }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const spendingData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0)
      .map((girl, index) => ({
        name: girl.name,
        spent: girl.totalSpent,
        nuts: girl.totalNuts,
        time: girl.totalTime / 60,
        costPerNut: girl.costPerNut,
        fill: getGirlColor(girl.name, index),
      }))
      .sort((a, b) => b.spent - a.spent);
  }, [girls]);

  const efficiencyData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0)
      .map((girl) => ({
        name: girl.name,
        costPerNut: girl.costPerNut,
        entries: girl.entryCount,
      }))
      .sort((a, b) => a.costPerNut - b.costPerNut);
  }, [girls]);

  const distributionData = useMemo(() => {
    const totalSpent = girls.reduce((sum, g) => sum + g.totalSpent, 0);
    return girls
      .filter((g) => g.totalSpent > 0)
      .map((girl, index) => ({
        name: girl.name,
        value: girl.totalSpent,
        percent: totalSpent > 0 ? ((girl.totalSpent / totalSpent) * 100).toFixed(1) : '0.0',
        fill: getGirlColor(girl.name, index),
      }))
      .sort((a, b) => b.value - a.value);
  }, [girls]);

  const scatterData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0)
      .map((girl, index) => ({
        name: girl.name,
        rating: girl.rating,
        costPerNut: girl.costPerNut,
        fill: getGirlColor(girl.name, index),
      }));
  }, [girls]);

  const monthlyTrendData = useMemo(() => {
    return [];
  }, []);

  const costEfficiencyTrendData = useMemo(() => {
    return [];
  }, []);

  const roiData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0)
      .map((girl) => ({
        name: girl.name,
        costPerNut: girl.costPerNut,
        nutsPerDollar: girl.totalSpent > 0 ? (girl.totalNuts / girl.totalSpent).toFixed(2) : 0,
        totalNuts: girl.totalNuts,
      }))
      .sort((a, b) => a.costPerNut - b.costPerNut)
      .slice(0, 10);
  }, [girls]);

  if (girls.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl mb-2">Analytics</h2>
          <p className="text-cpn-gray">Visualize your relationship efficiency data</p>
        </div>

        <div className="card-cpn text-center py-12">
          <BarChart3 size={64} className="mx-auto mb-4 text-cpn-gray" />
          <h3 className="text-xl mb-2">No profiles yet</h3>
          <p className="text-cpn-gray">Add your first girl to get started</p>
        </div>
      </div>
    );
  }

  if (girls.every((g) => g.entryCount === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl mb-2">Analytics</h2>
          <p className="text-cpn-gray">Visualize your relationship efficiency data</p>
        </div>

        <div className="card-cpn text-center py-12">
          <BarChart3 size={64} className="mx-auto mb-4 text-cpn-gray" />
          <h3 className="text-xl mb-2">No data entries yet</h3>
          <p className="text-cpn-gray">
            You have {girls.length} {girls.length === 1 ? 'profile' : 'profiles'}, but no data entries yet.
            <br />
            Add data entries to see analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  const totalSpent = useMemo(() => girls.reduce((sum, g) => sum + g.totalSpent, 0), [girls]);
  const totalNuts = useMemo(() => girls.reduce((sum, g) => sum + g.totalNuts, 0), [girls]);
  const totalTime = useMemo(() => girls.reduce((sum, g) => sum + g.totalTime, 0), [girls]);
  const activeProfiles = useMemo(() => girls.filter((g) => g.entryCount > 0).length, [girls]);
  const avgCostPerNut = useMemo(() => (totalNuts > 0 ? totalSpent / totalNuts : 0), [totalSpent, totalNuts]);
  const avgTimePerNut = useMemo(() => (totalNuts > 0 ? totalTime / totalNuts : 0), [totalTime, totalNuts]);

  const bestCostPerNut = useMemo(() => {
    const girlsWithData = girls.filter((g) => g.entryCount > 0 && g.costPerNut > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.reduce((best, g) => (g.costPerNut < best.costPerNut ? g : best));
  }, [girls]);

  const highestSpender = useMemo(() => {
    const girlsWithData = girls.filter((g) => g.entryCount > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.reduce((highest, g) => (g.totalSpent > highest.totalSpent ? g : highest));
  }, [girls]);

  const mostTimeSpent = useMemo(() => {
    const girlsWithData = girls.filter((g) => g.entryCount > 0);
    if (girlsWithData.length === 0) return null;
    return girlsWithData.reduce((most, g) => (g.totalTime > most.totalTime ? g : most));
  }, [girls]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const roiRankings = useMemo(() => {
    const girlsWithData = girls.filter((g) => g.entryCount > 0 && g.costPerNut > 0);
    if (girlsWithData.length === 0) return [];

    return girlsWithData
      .map((girl) => {
        const nutsPerHour = girl.totalTime > 0 ? (girl.totalNuts / (girl.totalTime / 60)) : 0;
        const efficiencyScore = (
          (girl.rating / 10) * 30 +
          (1 / girl.costPerNut) * 500 +
          nutsPerHour * 10
        );

        return {
          name: girl.name,
          rating: girl.rating,
          costPerNut: girl.costPerNut,
          nutsPerHour,
          efficiencyScore,
        };
      })
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }, [girls]);

  const getEfficiencyColor = (score: number) => {
    if (score >= 13) return 'text-green-500';
    if (score >= 11) return 'text-cpn-yellow';
    return 'text-orange-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Analytics</h2>
        <p className="text-cpn-gray">Insights and trends across all your data</p>
      </div>

      {/* Top Metrics Grid - 3x2 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Row 1 - Card 1: Total Spent */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalSpent)}</p>
        </div>

        {/* Row 1 - Card 2: Total Nuts */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Total Nuts</p>
          <p className="text-3xl font-bold text-white">{totalNuts}</p>
          <p className="text-xs text-cpn-gray/60 mt-1">of {girls.length} total</p>
        </div>

        {/* Row 1 - Card 3: Active Profiles */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Active Profiles</p>
          <p className="text-3xl font-bold text-white">{activeProfiles}</p>
        </div>

        {/* Row 2 - Card 4: Average Cost Per Nut */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Average Cost Per Nut</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(avgCostPerNut)}</p>
        </div>

        {/* Row 2 - Card 5: Total Time */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Total Time</p>
          <p className="text-3xl font-bold text-white">{formatTime(totalTime)}</p>
        </div>

        {/* Row 2 - Card 6: Average Time Per Nut */}
        <div className="card-cpn bg-cpn-dark border border-cpn-gray/20">
          <p className="text-sm text-cpn-gray mb-2">Average Time Per Nut</p>
          <p className="text-3xl font-bold text-white">{Math.round(avgTimePerNut)} mins</p>
        </div>
      </div>

      {/* Performance Insights Section */}
      <div className="card-cpn">
        <h3 className="text-lg mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Best Cost/Nut - Gold Trophy */}
          <div className="card-cpn bg-cpn-dark border border-cpn-gray/20 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
            <p className="text-sm text-cpn-gray mb-2">Best Cost/Nut</p>
            {bestCostPerNut ? (
              <>
                <p className="text-xl font-bold text-cpn-yellow mb-1">{bestCostPerNut.name}</p>
                <p className="text-lg text-white">{formatCurrency(bestCostPerNut.costPerNut)}</p>
              </>
            ) : (
              <p className="text-sm text-cpn-gray">No data</p>
            )}
          </div>

          {/* Highest Spender - Silver Trophy */}
          <div className="card-cpn bg-cpn-dark border border-cpn-gray/20 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-cpn-gray mb-2">Highest Spender</p>
            {highestSpender ? (
              <>
                <p className="text-xl font-bold text-cpn-yellow mb-1">{highestSpender.name}</p>
                <p className="text-lg text-white">{formatCurrency(highestSpender.totalSpent)}</p>
              </>
            ) : (
              <p className="text-sm text-cpn-gray">No data</p>
            )}
          </div>

          {/* Most Time Spent - Bronze Trophy */}
          <div className="card-cpn bg-cpn-dark border border-cpn-gray/20 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-orange-600" />
            <p className="text-sm text-cpn-gray mb-2">Most Time Spent</p>
            {mostTimeSpent ? (
              <>
                <p className="text-xl font-bold text-cpn-yellow mb-1">{mostTimeSpent.name}</p>
                <p className="text-lg text-white">{formatTime(mostTimeSpent.totalTime)}</p>
              </>
            ) : (
              <p className="text-sm text-cpn-gray">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* ROI Performance Ranking */}
      {roiRankings.length > 0 && (
        <div className="card-cpn">
          <h3 className="text-lg mb-4">ROI Performance Ranking</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cpn-gray/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-cpn-gray">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cpn-gray">Name</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-cpn-gray">Rating</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cpn-gray">Cost/Nut</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cpn-gray">Nuts/Hour</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cpn-gray">Efficiency Score</th>
                </tr>
              </thead>
              <tbody>
                {roiRankings.map((girl, index) => (
                  <tr
                    key={girl.name}
                    className={index % 2 === 0 ? 'bg-cpn-dark/50' : 'bg-transparent'}
                  >
                    <td className="py-3 px-4 text-white font-bold">{index + 1}</td>
                    <td className="py-3 px-4 text-white font-medium">{girl.name}</td>
                    <td className="py-3 px-4 text-center text-white">{girl.rating}/10</td>
                    <td className="py-3 px-4 text-right text-white">{formatCurrency(girl.costPerNut)}</td>
                    <td className="py-3 px-4 text-right text-white">{girl.nutsPerHour.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-bold ${getEfficiencyColor(girl.efficiencyScore)}`}>
                      {girl.efficiencyScore.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Color Legend Section */}
      {spendingData.length > 0 && (
        <div className="card-cpn bg-cpn-dark/50">
          <h3 className="text-lg mb-3">Color Legend</h3>
          <div className="flex flex-wrap gap-4 mb-2">
            {spendingData.map((girl) => (
              <div key={girl.name} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: girl.fill }}
                />
                <span className="text-white text-sm">{girl.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-cpn-gray mt-2">
            Each girl maintains the same color across all charts for easy identification
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
          <button
            key={range}
            className={timeRange === range ? 'btn-cpn' : 'btn-secondary'}
            onClick={() => setTimeRange(range)}
          >
            {range === 'all' ? 'All Time' : range}
          </button>
        ))}
      </div>

      {/* Charts Section */}
      {spendingData.length > 0 && (
        <>
          {/* Row 1: Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Total Spent per Girl */}
            <div className="card-cpn">
              <h3 className="text-lg mb-4">Total Spent per Girl</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="name" stroke="#ababab" />
                  <YAxis stroke="#ababab" domain={[0, 600]} ticks={[0, 150, 300, 450, 600]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={false}
                  />
                  <Bar dataKey="spent" />
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cost per Nut Comparison */}
            <div className="card-cpn">
              <h3 className="text-lg mb-4">Cost per Nut Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="name" stroke="#ababab" />
                  <YAxis stroke="#ababab" domain={[0, 120]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={false}
                  />
                  <Bar dataKey="costPerNut" />
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Bar Chart */}
          <div className="grid grid-cols-1 gap-6">
            {/* Time Spent per Girl */}
            <div className="card-cpn">
              <h3 className="text-lg mb-4">Time Spent per Girl</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="name" stroke="#ababab" />
                  <YAxis stroke="#ababab" domain={[0, 40]} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    formatter={(value: number) => `${value.toFixed(1)}h`}
                    cursor={false}
                  />
                  <Bar dataKey="time" />
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Pie Chart */}
          <div className="grid grid-cols-1 gap-6">
            {/* Spending Distribution */}
            <div className="card-cpn">
              <h3 className="text-lg mb-4">Spending Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 4: Scatter Plot */}
          <div className="grid grid-cols-1 gap-6">
            <div className="card-cpn">
              <h3 className="text-lg mb-4">Efficiency vs Rating Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    type="number"
                    dataKey="rating"
                    name="Rating"
                    stroke="#ababab"
                    domain={[0, 10]}
                    label={{ value: 'Rating', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="costPerNut"
                    name="Cost per Nut"
                    stroke="#ababab"
                    domain={[0, 120]}
                    label={{ value: 'Cost per Nut ($)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Scatter data={scatterData} fill="#8884d8">
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
