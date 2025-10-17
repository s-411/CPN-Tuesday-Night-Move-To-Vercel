import { useState, useMemo } from 'react';
import { BarChart3, Trophy } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
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

type Category = 'all' | 'spending' | 'time' | 'cost-efficiency';

const GIRL_COLORS: Record<string, string> = {
  'Sarah': '#4A90E2',
  'Emma': '#B565D8',
  'Maria': '#52C41A',
  'Sofia': '#EC7063',
};

const getGirlColor = (name: string, index: number): string => {
  // Pastel colors for first 7 girls, then vibrant variations for 8-15
  const defaultColors = [
    '#fda4af', // 1. Pink (pastel rose)
    '#60a5fa', // 2. Blue (pastel)
    '#4ade80', // 3. Green (pastel)
    '#fb923c', // 4. Orange
    '#f87171', // 5. Red (pastel coral)
    '#fde047', // 6. Yellow (lighter, less harsh)
    '#c084fc', // 7. Purple (pastel)
    '#2dd4bf', // 8. Teal (vibrant)
    '#818cf8', // 9. Indigo (vibrant)
    '#10b981', // 10. Emerald (vibrant)
    '#fbbf24', // 11. Amber (vibrant)
    '#e879f9', // 12. Fuchsia (vibrant)
    '#22d3ee', // 13. Cyan (vibrant)
    '#84cc16', // 14. Lime (vibrant)
    '#38bdf8', // 15. Sky (vibrant)
  ];
  return GIRL_COLORS[name] || defaultColors[index % defaultColors.length];
};

export function Analytics({ girls }: AnalyticsProps) {
  const [category, setCategory] = useState<Category>('all');

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


  // Data for Total Nuts Per Girl (SPENDING category)
  const nutsPerGirlData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0)
      .map((girl, index) => ({
        name: girl.name,
        nuts: girl.totalNuts,
        fill: getGirlColor(girl.name, index),
      }))
      .sort((a, b) => b.nuts - a.nuts);
  }, [girls]);

  // Data for Time Distribution Per Girl (TIME category)
  const timeDistributionData = useMemo(() => {
    const totalTime = girls.reduce((sum, g) => sum + g.totalTime, 0);
    return girls
      .filter((g) => g.totalTime > 0)
      .map((girl, index) => ({
        name: girl.name,
        value: girl.totalTime / 60, // in hours
        percent: totalTime > 0 ? ((girl.totalTime / totalTime) * 100).toFixed(1) : '0.0',
        fill: getGirlColor(girl.name, index),
      }))
      .sort((a, b) => b.value - a.value);
  }, [girls]);

  // Data for Average Time Per Nut Comparison (TIME category)
  const avgTimePerNutData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0 && g.totalNuts > 0)
      .map((girl, index) => ({
        name: girl.name,
        avgTimePerNut: girl.totalTime / girl.totalNuts, // in minutes
        fill: getGirlColor(girl.name, index),
      }))
      .sort((a, b) => a.avgTimePerNut - b.avgTimePerNut);
  }, [girls]);

  // Data for Average Cost Per Hour (COST EFFICIENCY category)
  const avgCostPerHourData = useMemo(() => {
    return girls
      .filter((g) => g.entryCount > 0 && g.totalTime > 0)
      .map((girl, index) => ({
        name: girl.name,
        costPerHour: (girl.totalSpent / (girl.totalTime / 60)), // dollars per hour
        fill: getGirlColor(girl.name, index),
      }))
      .sort((a, b) => a.costPerHour - b.costPerHour);
  }, [girls]);

  // Data for Cost Per Hour Distribution (COST EFFICIENCY category)
  const costPerHourDistributionData = useMemo(() => {
    const girlsWithTime = girls.filter((g) => g.totalTime > 0);
    const totalCostPerHour = girlsWithTime.reduce((sum, g) => sum + (g.totalSpent / (g.totalTime / 60)), 0);

    return girlsWithTime
      .map((girl, index) => {
        const costPerHour = girl.totalSpent / (girl.totalTime / 60);
        return {
          name: girl.name,
          value: costPerHour,
          percent: totalCostPerHour > 0 ? ((costPerHour / totalCostPerHour) * 100).toFixed(1) : '0.0',
          fill: getGirlColor(girl.name, index),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [girls]);

  // Calculate metrics (must be before early returns per React hooks rules)
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

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

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

      {/* Category Filter */}
      <div className="card-cpn">
        <h3 className="text-lg mb-4">Analytics Reports Categories</h3>
        <div className="flex flex-wrap gap-2">
          {(['all', 'spending', 'time', 'cost-efficiency'] as Category[]).map((cat) => (
            <button
              key={cat}
              className={category === cat ? 'btn-cpn' : 'btn-secondary'}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat === 'cost-efficiency' ? 'Cost Efficiency' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      {spendingData.length > 0 && (
        <>
          {/* SPENDING CATEGORY */}
          {(category === 'all' || category === 'spending') && (
            <>
              <div className="card-cpn bg-cpn-dark/30">
                <h2 className="text-2xl font-bold mb-4 text-cpn-yellow">SPENDING</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Money Spent Per Girl */}
                <div className="card-cpn">
                  <h3 className="text-lg mb-4">Total Money Spent Per Girl</h3>
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

              {/* Total Nuts Per Girl */}
              {nutsPerGirlData.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                  <div className="card-cpn">
                    <h3 className="text-lg mb-4">Total Nuts Per Girl</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={nutsPerGirlData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis dataKey="name" stroke="#ababab" />
                        <YAxis stroke="#ababab" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                          itemStyle={{ color: '#ffffff' }}
                          labelStyle={{ color: '#ffffff' }}
                          cursor={false}
                        />
                        <Bar dataKey="nuts" />
                        {nutsPerGirlData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TIME CATEGORY */}
          {(category === 'all' || category === 'time') && (
            <>
              <div className="card-cpn bg-cpn-dark/30">
                <h2 className="text-2xl font-bold mb-4 text-cpn-yellow">TIME</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Time Per Girl */}
                <div className="card-cpn">
                  <h3 className="text-lg mb-4">Total Time Per Girl</h3>
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

                {/* Average Time Per Nut Comparison */}
                {avgTimePerNutData.length > 0 && (
                  <div className="card-cpn">
                    <h3 className="text-lg mb-4">Average Time Per Nut Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={avgTimePerNutData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis dataKey="name" stroke="#ababab" />
                        <YAxis stroke="#ababab" label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                          itemStyle={{ color: '#ffffff' }}
                          labelStyle={{ color: '#ffffff' }}
                          formatter={(value: number) => `${Math.round(value)} mins`}
                          cursor={false}
                        />
                        <Bar dataKey="avgTimePerNut" />
                        {avgTimePerNutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Time Distribution Per Girl */}
              {timeDistributionData.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                  <div className="card-cpn">
                    <h3 className="text-lg mb-4">Time Distribution Per Girl</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={timeDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent}%`}
                          outerRadius={90}
                          dataKey="value"
                        >
                          {timeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                          itemStyle={{ color: '#ffffff' }}
                          labelStyle={{ color: '#ffffff' }}
                          formatter={(value: number) => `${value.toFixed(1)}h`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {/* COST EFFICIENCY CATEGORY */}
          {(category === 'all' || category === 'cost-efficiency') && (
            <>
              <div className="card-cpn bg-cpn-dark/30">
                <h2 className="text-2xl font-bold mb-4 text-cpn-yellow">COST EFFICIENCY</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Efficiency vs Rating Analysis */}
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

                {/* Average Cost Per Hour Per Girl */}
                {avgCostPerHourData.length > 0 && (
                  <div className="card-cpn">
                    <h3 className="text-lg mb-4">Average Cost Per Hour Per Girl</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={avgCostPerHourData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis dataKey="name" stroke="#ababab" />
                        <YAxis stroke="#ababab" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #ababab', color: '#ffffff' }}
                          itemStyle={{ color: '#ffffff' }}
                          labelStyle={{ color: '#ffffff' }}
                          formatter={(value: number) => formatCurrency(value)}
                          cursor={false}
                        />
                        <Bar dataKey="costPerHour" />
                        {avgCostPerHourData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Average Cost Per Hour Distribution */}
              {costPerHourDistributionData.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                  <div className="card-cpn">
                    <h3 className="text-lg mb-4">Average Cost Per Hour Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={costPerHourDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent}%`}
                          outerRadius={90}
                          dataKey="value"
                        >
                          {costPerHourDistributionData.map((entry, index) => (
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
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
