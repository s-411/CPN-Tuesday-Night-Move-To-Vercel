import { useState } from 'react';
import { Share2, Image as ImageIcon, Download } from 'lucide-react';
import { calculateCostPerNut } from '../lib/calculations';
import { ShareModal } from '../components/ShareModal';
import { ShareData } from '../lib/socialShare';

interface Girl {
  id: string;
  name: string;
  rating: number;
  totalSpent: number;
  totalNuts: number;
  totalTime: number;
  costPerNut: number;
  timePerNut: number;
  costPerHour: number;
  entryCount: number;
  is_active: boolean;
}

interface ShareProps {
  girls: Girl[];
}

export function Share({ girls }: ShareProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [shareTitle, setShareTitle] = useState('');

  const activeGirls = girls.filter((g) => g.is_active);
  const totalSpent = activeGirls.reduce((sum, g) => sum + g.totalSpent, 0);
  const totalNuts = activeGirls.reduce((sum, g) => sum + g.totalNuts, 0);
  const avgCostPerNut = calculateCostPerNut(totalSpent, totalNuts);

  const handleShareOverview = () => {
    setShareData({
      type: 'overview',
      overviewStats: {
        totalGirls: activeGirls.length,
        totalSpent,
        totalNuts,
        avgCostPerNut,
        bestValueGirl: activeGirls.length > 0
          ? activeGirls.sort((a, b) => a.costPerNut - b.costPerNut)[0]?.name
          : undefined,
      },
    });
    setShareTitle('My CPN Stats');
    setShowShareModal(true);
  };

  const handleShareGirl = (girl: Girl) => {
    setShareData({
      type: 'girl',
      girlName: girl.name,
      rating: girl.rating,
      costPerNut: girl.costPerNut,
      timePerNut: girl.timePerNut,
      costPerHour: girl.costPerHour,
      totalSpent: girl.totalSpent,
      totalNuts: girl.totalNuts,
      totalTime: girl.totalTime,
      entryCount: girl.entryCount,
    });
    setShareTitle(`${girl.name}'s CPN Stats`);
    setShowShareModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl mb-2">Share</h2>
        <p className="text-cpn-gray">Generate and share your CPN statistics</p>
      </div>

      <div className="card-cpn">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="text-cpn-yellow" size={24} />
          <div>
            <h3 className="text-xl font-bold">Overall Statistics</h3>
            <p className="text-sm text-cpn-gray">Share your complete CPN overview</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-cpn-dark rounded-lg">
            <p className="text-cpn-gray text-xs mb-1">Active Girls</p>
            <p className="text-2xl font-bold text-cpn-yellow">{activeGirls.length}</p>
          </div>
          <div className="text-center p-3 bg-cpn-dark rounded-lg">
            <p className="text-cpn-gray text-xs mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-cpn-yellow">${totalSpent.toFixed(0)}</p>
          </div>
          <div className="text-center p-3 bg-cpn-dark rounded-lg">
            <p className="text-cpn-gray text-xs mb-1">Total Nuts</p>
            <p className="text-2xl font-bold text-cpn-yellow">{totalNuts}</p>
          </div>
          <div className="text-center p-3 bg-cpn-dark rounded-lg">
            <p className="text-cpn-gray text-xs mb-1">Avg Cost/Nut</p>
            <p className="text-2xl font-bold text-cpn-yellow">
              ${avgCostPerNut > 0 ? avgCostPerNut.toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        <button
          onClick={handleShareOverview}
          disabled={activeGirls.length === 0}
          className="btn-cpn w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon size={20} />
          Generate Overview Image
        </button>
      </div>

      <div className="card-cpn">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="text-cpn-yellow" size={24} />
          <div>
            <h3 className="text-xl font-bold">Individual Statistics</h3>
            <p className="text-sm text-cpn-gray">Share stats for a specific girl</p>
          </div>
        </div>

        {girls.length === 0 ? (
          <div className="text-center py-12">
            <Share2 size={48} className="mx-auto mb-4 text-cpn-gray" />
            <p className="text-cpn-gray mb-2">No girls to share</p>
            <p className="text-sm text-cpn-gray">Add a girl profile first to start sharing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {girls
              .filter((g) => g.entryCount > 0)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((girl) => (
                <div
                  key={girl.id}
                  className="flex items-center justify-between p-4 bg-cpn-dark rounded-lg hover:bg-cpn-dark/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold">{girl.name}</h4>
                      <span className="text-sm text-cpn-yellow">{girl.rating.toFixed(1)}/10</span>
                      {!girl.is_active && (
                        <span className="text-xs px-2 py-1 bg-cpn-gray/20 text-cpn-gray rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-cpn-gray">
                      <span>{girl.totalNuts} nuts</span>
                      <span>${girl.totalSpent.toFixed(0)} spent</span>
                      <span className="text-cpn-yellow">
                        ${girl.costPerNut.toFixed(2)}/nut
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShareGirl(girl)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <ImageIcon size={16} />
                    <span className="hidden sm:inline">Generate</span>
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="card-cpn bg-cpn-dark">
        <div className="flex items-start gap-3">
          <Download className="text-cpn-yellow flex-shrink-0 mt-1" size={20} />
          <div className="text-sm text-cpn-gray">
            <p className="font-bold text-white mb-2">How to Share</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Generate" to create a shareable image</li>
              <li>Preview your stats in the branded CPN format</li>
              <li>Download or share directly to social media</li>
              <li>Images include your stats with the CPN branding</li>
            </ol>
          </div>
        </div>
      </div>

      {shareData && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareData(null);
          }}
          shareData={shareData}
          title={shareTitle}
        />
      )}
    </div>
  );
}
