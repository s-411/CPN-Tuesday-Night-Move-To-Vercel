import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateShareImage, downloadImage, shareImage, type ShareData } from './socialShare';

// Mock the calculations module
vi.mock('./calculations', () => ({
  formatCurrency: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
  formatRating: vi.fn((rating: number) => `★${rating.toFixed(1)}/10`),
}));

describe('socialShare module', () => {
  describe('generateShareImage', () => {
    it('should generate image for girl type share data', async () => {
      const shareData: ShareData = {
        type: 'girl',
        girlName: 'Test Girl',
        rating: 8.5,
        costPerNut: 12.50,
        timePerNut: 45,
        costPerHour: 16.67,
        totalSpent: 125.00,
        totalNuts: 10,
        totalTime: 450,
        entryCount: 5,
      };

      const blob = await generateShareImage(shareData);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should generate image for overview type share data', async () => {
      const shareData: ShareData = {
        type: 'overview',
        overviewStats: {
          totalGirls: 5,
          totalSpent: 500.00,
          totalNuts: 50,
          avgCostPerNut: 10.00,
          bestValueGirl: 'Best Girl',
        },
      };

      const blob = await generateShareImage(shareData);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should generate image for achievement type share data', async () => {
      const shareData: ShareData = {
        type: 'achievement',
        achievementTitle: 'First Milestone',
        achievementDescription: 'You have tracked your first entry!',
      };

      const blob = await generateShareImage(shareData);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should handle overview without best value girl', async () => {
      const shareData: ShareData = {
        type: 'overview',
        overviewStats: {
          totalGirls: 0,
          totalSpent: 0,
          totalNuts: 0,
          avgCostPerNut: 0,
        },
      };

      const blob = await generateShareImage(shareData);

      expect(blob).toBeInstanceOf(Blob);
    });

    it('should handle missing optional fields gracefully', async () => {
      const shareData: ShareData = {
        type: 'girl',
        girlName: 'Test Girl',
      };

      const blob = await generateShareImage(shareData);

      expect(blob).toBeInstanceOf(Blob);
    });

    it('should reject when canvas context is null', async () => {
      // Override the mock to return null context
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

      const shareData: ShareData = {
        type: 'girl',
        girlName: 'Test',
      };

      await expect(generateShareImage(shareData)).rejects.toThrow('Could not get canvas context');

      // Restore
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('should handle canvas toBlob failure', async () => {
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
        callback(null);
      };

      const shareData: ShareData = {
        type: 'girl',
        girlName: 'Test',
      };

      await expect(generateShareImage(shareData)).rejects.toThrow('Failed to generate image');

      // Restore
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
    });

    it('should handle logo loading failure gracefully', async () => {
      // Mock Image to fail loading
      const OriginalImage = global.Image;
      global.Image = class MockImage {
        onerror: ((error: any) => void) | null = null;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Failed to load'));
            }
          }, 0);
        }
      } as any;

      const shareData: ShareData = {
        type: 'girl',
        girlName: 'Test',
      };

      // Should not throw, just continue without logo
      const blob = await generateShareImage(shareData);
      expect(blob).toBeInstanceOf(Blob);

      // Restore
      global.Image = OriginalImage;
    });
  });

  describe('downloadImage', () => {
    it('should create a download link and trigger download', () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tag: string) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick,
          } as any;
        }
        return originalCreateElement.call(document, tag);
      }) as any;

      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      downloadImage(mockBlob, 'test-image.png');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use provided filename', () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      let downloadName = '';

      document.createElement = vi.fn((tag: string) => {
        if (tag === 'a') {
          return {
            set download(value: string) {
              downloadName = value;
            },
            get download() {
              return downloadName;
            },
            href: '',
            click: vi.fn(),
          } as any;
        }
        return {} as any;
      }) as any;

      downloadImage(mockBlob, 'custom-filename.png');

      expect(downloadName).toBe('custom-filename.png');
    });
  });

  describe('shareImage', () => {
    it('should use navigator.share when available and canShare returns true', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);

      global.navigator.share = mockShare;
      global.navigator.canShare = mockCanShare;

      const result = await shareImage(mockBlob, 'Test Title', 'Test Text');

      expect(mockCanShare).toHaveBeenCalled();
      expect(mockShare).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when canShare returns false', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const mockCanShare = vi.fn().mockReturnValue(false);

      global.navigator.canShare = mockCanShare;

      const result = await shareImage(mockBlob, 'Test Title', 'Test Text');

      expect(result).toBe(false);
    });

    it('should return false when navigator.share is not available', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });

      const originalShare = global.navigator.share;
      (global.navigator as any).share = undefined;

      const result = await shareImage(mockBlob, 'Test Title', 'Test Text');

      expect(result).toBe(false);

      // Restore
      global.navigator.share = originalShare;
    });

    it('should handle AbortError gracefully', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const abortError = new Error('User aborted');
      abortError.name = 'AbortError';
      const mockShare = vi.fn().mockRejectedValue(abortError);
      const mockCanShare = vi.fn().mockReturnValue(true);

      global.navigator.share = mockShare;
      global.navigator.canShare = mockCanShare;

      const result = await shareImage(mockBlob, 'Test Title', 'Test Text');

      expect(result).toBe(false);
    });

    it('should handle other share errors', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
      const mockCanShare = vi.fn().mockReturnValue(true);

      global.navigator.share = mockShare;
      global.navigator.canShare = mockCanShare;

      const result = await shareImage(mockBlob, 'Test Title', 'Test Text');

      expect(result).toBe(false);
    });
  });
});