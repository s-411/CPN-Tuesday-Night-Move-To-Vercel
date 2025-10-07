import { useState, useEffect } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { generateShareImage, downloadImage, shareImage, ShareData } from '../lib/socialShare';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareData;
  title: string;
}

export function ShareModal({ isOpen, onClose, shareData, title }: ShareModalProps) {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateImage();
    } else {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(null);
      setImageBlob(null);
      setError(null);
    }
  }, [isOpen, shareData]);

  const generateImage = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const blob = await generateShareImage(shareData);
      setImageBlob(blob);
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate share image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageBlob) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `cpn-${shareData.type}-${timestamp}.png`;
    downloadImage(imageBlob, filename);
  };

  const handleShare = async () => {
    if (!imageBlob) return;

    setIsSharing(true);
    const shareTitle = title || 'My CPN Stats';
    const shareText = 'Check out my CPN stats!';

    const shared = await shareImage(imageBlob, shareTitle, shareText);

    if (!shared) {
      handleDownload();
    }

    setIsSharing(false);
  };

  const canShare = typeof navigator.share !== 'undefined';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Stats">
      <div className="space-y-6">
        <div className="bg-cpn-dark rounded-lg p-4 border border-gray-700">
          {isGenerating && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-cpn-yellow animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={generateImage}
                  className="btn-cpn"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {imageUrl && !isGenerating && !error && (
            <img
              src={imageUrl}
              alt="Share preview"
              className="w-full h-auto rounded"
            />
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            disabled={!imageBlob || isGenerating}
            className="flex-1 flex items-center justify-center gap-2 btn-cpn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Download Image
          </button>

          {canShare && (
            <button
              onClick={handleShare}
              disabled={!imageBlob || isGenerating || isSharing}
              className="flex-1 flex items-center justify-center gap-2 btn-cpn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
              Share
            </button>
          )}
        </div>

        <p className="text-sm text-cpn-gray text-center">
          Share your stats with friends or download for later
        </p>
      </div>
    </Modal>
  );
}
