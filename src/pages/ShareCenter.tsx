import { useState, useEffect } from 'react';
import { Share2, DollarSign, Target, Trophy, Hash, Clock, Users, Star, TrendingUp, Lock, Download, Clipboard, RefreshCw, X, Loader } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/Toast';

interface Metric {
  id: string;
  category: 'Financial' | 'Efficiency' | 'Volume' | 'Time' | 'Quality' | 'Highlight';
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  rawValue: number | string;
}

interface ProfileStat {
  id: string;
  name: string;
  rating: number;
  totalSpent: number;
  costPerNut: number;
}

interface GeneratedImage {
  dataUrl: string;
  selectedMetrics: Metric[];
  timestamp: number;
  filename: string;
}

const categoryColors = {
  Financial: '#4ade80',
  Efficiency: '#60a5fa',
  Volume: '#a78bfa',
  Time: '#fb923c',
  Quality: '#f472b6',
  Highlight: '#f2f661'
};

export function ShareCenter() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [profileStats, setProfileStats] = useState<ProfileStat[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filename, setFilename] = useState('');

  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  const loadStatistics = async () => {
    if (!user) return;

    try {
      // Fetch all girls for the user
      const { data: girls, error: girlsError } = await supabase
        .from('girls')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (girlsError) throw girlsError;

      // Fetch all data entries for the user's girls
      const { data: entries, error: entriesError } = await supabase
        .from('data_entries')
        .select('*')
        .in('girl_id', girls?.map(g => g.id) || []);

      if (entriesError) throw entriesError;

      // Calculate aggregate metrics
      const totalSpent = entries?.reduce((sum, e) => sum + (e.amount_spent || 0), 0) || 0;
      const totalNuts = entries?.reduce((sum, e) => sum + (e.number_of_nuts || 0), 0) || 0;
      const totalMinutes = entries?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
      const totalHours = totalMinutes / 60;
      const costPerNut = totalNuts > 0 ? totalSpent / totalNuts : 0;
      const costPerHour = totalHours > 0 ? totalSpent / totalHours : 0;
      const avgRating = girls && girls.length > 0 ? girls.reduce((sum, g) => sum + g.rating, 0) / girls.length : 0;
      const topPerformer = girls && girls.length > 0 ? [...girls].sort((a, b) => b.rating - a.rating)[0] : null;

      const metricsData: Metric[] = [
        {
          id: 'total-spent',
          category: 'Financial',
          icon: <DollarSign size={24} />,
          title: 'Total Spent',
          description: 'Total amount spent across all entries',
          value: `$${totalSpent.toFixed(2)}`,
          rawValue: totalSpent
        },
        {
          id: 'cost-per-nut',
          category: 'Efficiency',
          icon: <Target size={24} />,
          title: 'Cost per Nut',
          description: 'Average cost per nut across all entries',
          value: `$${costPerNut.toFixed(2)}`,
          rawValue: costPerNut
        },
        {
          id: 'top-performer',
          category: 'Highlight',
          icon: <Trophy size={24} />,
          title: 'Top Performer',
          description: 'Highest spending profile name and rating',
          value: topPerformer ? `${topPerformer.name} (${topPerformer.rating.toFixed(1)}/10)` : 'N/A',
          rawValue: topPerformer?.name || 'N/A'
        },
        {
          id: 'total-nuts',
          category: 'Volume',
          icon: <Hash size={24} />,
          title: 'Total Nuts',
          description: 'Total number of nuts across all entries',
          value: totalNuts.toString(),
          rawValue: totalNuts
        },
        {
          id: 'total-time',
          category: 'Time',
          icon: <Clock size={24} />,
          title: 'Total Time',
          description: 'Total time spent across all entries',
          value: `${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m`,
          rawValue: totalHours
        },
        {
          id: 'cost-per-hour',
          category: 'Efficiency',
          icon: <TrendingUp size={24} />,
          title: 'Cost per Hour',
          description: 'Average cost per hour across all entries',
          value: `$${costPerHour.toFixed(2)}`,
          rawValue: costPerHour
        },
        {
          id: 'active-profiles',
          category: 'Volume',
          icon: <Users size={24} />,
          title: 'Active Profiles',
          description: 'Number of profiles with data entries',
          value: `${girls?.length || 0} profiles`,
          rawValue: girls?.length || 0
        },
        {
          id: 'average-rating',
          category: 'Quality',
          icon: <Star size={24} />,
          title: 'Average Rating',
          description: 'Average rating across all tracked profiles',
          value: `${avgRating.toFixed(1)}/10`,
          rawValue: avgRating
        }
      ];

      setMetrics(metricsData);

      // Calculate individual profile stats
      const profileStatsData: ProfileStat[] = [];
      for (const girl of girls || []) {
        const girlEntries = entries?.filter(e => e.girl_id === girl.id) || [];
        const girlTotalSpent = girlEntries.reduce((sum, e) => sum + (e.amount_spent || 0), 0);
        const girlTotalNuts = girlEntries.reduce((sum, e) => sum + (e.number_of_nuts || 0), 0);
        const girlCostPerNut = girlTotalNuts > 0 ? girlTotalSpent / girlTotalNuts : 0;

        profileStatsData.push({
          id: girl.id,
          name: girl.name,
          rating: girl.rating,
          totalSpent: girlTotalSpent,
          costPerNut: girlCostPerNut
        });
      }

      setProfileStats(profileStatsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
      showToast('Failed to load statistics', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleCategory = (category: string) => {
    setActiveCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      } else if (prev.length >= 3) {
        showToast('Maximum 3 metrics allowed', 'error');
        return prev;
      } else {
        return [...prev, metricId];
      }
    });
  };

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const generateImage = async () => {
    if (selectedMetrics.length === 0) return;

    setIsGenerating(true);

    try {
      const selectedMetricData = metrics.filter(m => selectedMetrics.includes(m.id));

      // Create hidden template element
      const template = document.createElement('div');
      template.style.position = 'absolute';
      template.style.left = '-9999px';
      template.style.width = '1080px';
      template.style.height = '1920px';
      template.style.backgroundColor = '#1a1a1a';
      template.style.padding = '80px 60px';
      template.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      template.style.color = '#ffffff';

      // Add content
      template.innerHTML = `
        <div style="text-align: center; margin-bottom: 80px;">
          <h1 style="font-size: 72px; color: #f2f661; margin: 0 0 20px 0; font-weight: bold;">My CPN Stats</h1>
          <p style="font-size: 32px; color: #999; margin: 0;">${selectedMetricData.length} Key Metric${selectedMetricData.length > 1 ? 's' : ''}</p>
        </div>
        ${selectedMetricData.map(metric => `
          <div style="background: #2a2a2a; border: 2px solid ${categoryColors[metric.category]}; border-radius: 20px; padding: 40px; margin-bottom: 40px;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${categoryColors[metric.category]}; margin-right: 20px;"></div>
              <span style="font-size: 36px; color: #999;">${metric.title}</span>
            </div>
            <div style="font-size: 64px; color: #f2f661; font-weight: bold;">${metric.value}</div>
          </div>
        `).join('')}
        <div style="text-align: center; margin-top: 80px; font-size: 24px; color: #666;">
          Generated with CPN • ${new Date().toLocaleDateString()}
        </div>
      `;

      document.body.appendChild(template);

      // Generate canvas
      const canvas = await html2canvas(template, {
        width: 1080,
        height: 1920,
        backgroundColor: '#1a1a1a',
        scale: 2
      });

      document.body.removeChild(template);

      const dataUrl = canvas.toDataURL('image/png');
      const metricNames = selectedMetricData.map(m => m.title.toLowerCase().replace(/\s+/g, '-')).join('-');
      const generatedFilename = `cpn-${metricNames}-${new Date().toISOString().split('T')[0]}`;

      setGeneratedImage({
        dataUrl,
        selectedMetrics: selectedMetricData,
        timestamp: Date.now(),
        filename: generatedFilename
      });

      setFilename(generatedFilename);
      showToast('Image generated successfully!', 'success');

      // Scroll to generated image section
      setTimeout(() => {
        document.getElementById('generated-image-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error generating image:', error);
      showToast('Failed to generate image. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage.dataUrl;
    link.download = `${filename}.png`;
    link.click();
    showToast('Image downloaded successfully!', 'success');
  };

  const copyToClipboard = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage.dataUrl);
      const blob = await response.blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      showToast('Image copied to clipboard!', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast('Failed to copy image. Please try downloading instead.', 'error');
    }
  };

  const generateNew = () => {
    setGeneratedImage(null);
    setSelectedMetrics([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredMetrics = activeCategories.length === 0
    ? metrics
    : metrics.filter(m => activeCategories.includes(m.category));

  const categoryCounts = metrics.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allCategories = Object.keys(categoryCounts);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Share2 className="text-cpn-yellow" size={32} />
          <h2 className="text-3xl font-bold">Share Center</h2>
        </div>
        <p className="text-cpn-gray">Share your achievements and insights with beautiful, privacy-respecting content</p>
      </div>

      {/* Create Custom Share Image Section */}
      <div className="card-cpn space-y-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Create Custom Share Image</h3>
          <p className="text-cpn-gray text-sm">Select 1-3 metrics to include on your Instagram Story-sized image</p>
        </div>

        {/* Category Filters */}
        <div>
          <h4 className="text-lg font-bold mb-3">Choose Your Metrics</h4>
          <div className="flex flex-wrap gap-2">
            {allCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategories.includes(category) || activeCategories.length === 0
                    ? 'text-white'
                    : 'text-white opacity-50'
                }`}
                style={{
                  border: `1px solid ${categoryColors[category as keyof typeof categoryColors]}`,
                  backgroundColor: activeCategories.includes(category)
                    ? categoryColors[category as keyof typeof categoryColors]
                    : 'transparent'
                }}
              >
                {category} ({categoryCounts[category]})
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetrics.map(metric => {
            const isSelected = selectedMetrics.includes(metric.id);
            const color = categoryColors[metric.category];

            return (
              <div
                key={metric.id}
                onClick={() => toggleMetric(metric.id)}
                className="relative p-5 rounded-lg cursor-pointer transition-all duration-300"
                style={{
                  backgroundColor: '#2a2a2a',
                  border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? color : '#3a3a3a'}`,
                  boxShadow: isSelected ? `0 0 20px ${color}33` : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }}></div>
                    <div style={{ color }}>{metric.icon}</div>
                  </div>
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center"
                    style={{ borderColor: color, backgroundColor: isSelected ? color : 'transparent' }}
                  >
                    {isSelected && <div style={{ width: '8px', height: '8px', backgroundColor: '#1a1a1a', clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)' }}></div>}
                  </div>
                </div>
                <h5 className="font-bold mb-1">{metric.title}</h5>
                <p className="text-xs text-cpn-gray mb-3">{metric.description}</p>
                <p className="text-2xl font-bold" style={{ color: isSelected ? '#f2f661' : '#ffffff' }}>
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <p className="text-sm text-cpn-gray mb-4">Select at least 1 metric to generate an image</p>
          <button
            onClick={generateImage}
            disabled={selectedMetrics.length === 0 || isGenerating}
            className="btn-cpn px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <Loader size={20} className="animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Image'
            )}
          </button>
        </div>
      </div>

      {/* Generated Image Section */}
      {generatedImage && (
        <div id="generated-image-section" className="card-cpn space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Your Generated Image</h3>
            <span className="text-xs text-cpn-gray bg-cpn-dark px-3 py-1 rounded-full">
              1080×1920px • Instagram Story
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-6">
            {/* Image Preview */}
            <div
              className="cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-105"
              onClick={() => setShowImageModal(true)}
              style={{ border: '1px solid #3a3a3a' }}
            >
              <img
                src={generatedImage.dataUrl}
                alt="Generated Share Image"
                className="w-full h-auto"
                style={{ aspectRatio: '9/16', objectFit: 'cover' }}
              />
            </div>

            {/* Options */}
            <div className="space-y-6">
              {/* Selected Metrics */}
              <div>
                <h4 className="text-sm font-bold mb-2 text-cpn-gray">Selected Metrics</h4>
                <div className="flex flex-wrap gap-2">
                  {generatedImage.selectedMetrics.map(metric => (
                    <span key={metric.id} className="text-xs px-2 py-1 rounded bg-cpn-yellow text-cpn-dark font-medium">
                      {metric.title}
                    </span>
                  ))}
                </div>
              </div>

              {/* Download Options */}
              <div>
                <h4 className="text-sm font-bold mb-3 text-cpn-gray">Download Options</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-cpn-gray mb-1 block">Filename</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        className="flex-1 bg-cpn-dark border border-cpn-gray/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-cpn-yellow"
                      />
                      <select className="bg-cpn-dark border border-cpn-gray/20 rounded px-2 py-2 text-sm">
                        <option>.png</option>
                        <option>.jpg</option>
                      </select>
                    </div>
                    <p className="text-xs text-cpn-gray mt-1">Estimated file size: ~8MB</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={downloadImage}
                      className="btn-cpn w-full flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download Image
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="btn-secondary w-full flex items-center justify-center gap-2"
                    >
                      <Clipboard size={18} />
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={generateNew}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-transparent border border-cpn-gray/20 text-white hover:bg-cpn-dark transition-colors"
                    >
                      <RefreshCw size={18} />
                      Generate New
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Statistics Section */}
      <div className="card-cpn space-y-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Individual Statistics</h3>
          <p className="text-cpn-gray text-sm">Share specific profile performance</p>
        </div>

        {profileStats.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-cpn-gray" />
            <p className="text-cpn-gray mb-2">No profiles to share</p>
            <p className="text-sm text-cpn-gray">Add a profile and some data entries first</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileStats.map(profile => {
              const isSelected = selectedProfiles.includes(profile.id);

              return (
                <div
                  key={profile.id}
                  onClick={() => toggleProfile(profile.id)}
                  className="relative p-5 rounded-lg cursor-pointer transition-all duration-300"
                  style={{
                    backgroundColor: '#2a2a2a',
                    border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#f2f661' : '#3a3a3a'}`,
                    boxShadow: isSelected ? '0 0 20px rgba(242, 246, 97, 0.2)' : 'none'
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{profile.name}</h4>
                      <p className="text-sm text-cpn-gray">Rating: {profile.rating.toFixed(1)}/10</p>
                    </div>
                    <Share2 size={20} className={isSelected ? 'text-cpn-yellow' : 'text-cpn-gray'} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-cpn-gray mb-1">Total Spent</p>
                      <p className="font-bold">${profile.totalSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-cpn-gray mb-1">Cost/Nut</p>
                      <p className="font-bold text-cpn-yellow">${profile.costPerNut.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedProfiles.length > 0 && (
          <div className="text-center">
            <button className="btn-cpn px-8 py-3 text-lg font-semibold">
              Generate Profile {selectedProfiles.length > 1 ? 'Images' : 'Image'}
            </button>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="card-cpn bg-cpn-dark" style={{ borderLeft: '4px solid #f2f661' }}>
        <div className="flex gap-4">
          <Lock className="text-cpn-yellow flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold mb-2">Privacy First</h4>
            <p className="text-sm text-cpn-gray">
              All shareable content is generated locally on your device. You control exactly what information is included,
              and sensitive data can be automatically redacted or anonymized.
            </p>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageModal && generatedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-cpn-dark/80 hover:bg-cpn-dark flex items-center justify-center transition-colors"
          >
            <X size={24} />
          </button>

          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={generatedImage.dataUrl}
              alt="Generated Share Image"
              className="w-full h-auto rounded-lg mb-6"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={downloadImage}
                className="btn-cpn px-6 py-3 flex items-center gap-2"
              >
                <Download size={18} />
                Download
              </button>
              <button
                onClick={copyToClipboard}
                className="btn-secondary px-6 py-3 flex items-center gap-2"
              >
                <Clipboard size={18} />
                Copy
              </button>
            </div>

            <p className="text-center text-cpn-gray text-sm mt-6">
              Click outside or press ESC to close
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}