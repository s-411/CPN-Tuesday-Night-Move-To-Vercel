import { vi } from 'vitest';

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};

// Mock canvas for socialShare tests
class MockCanvasRenderingContext2D {
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 0;
  font = '';
  textAlign = 'left';

  fillRect() {}
  strokeRect() {}
  fillText() {}
  strokeText() {}
  measureText(text: string) {
    return { width: text.length * 10 };
  }
  drawImage() {}
}

HTMLCanvasElement.prototype.getContext = function (contextType: string) {
  if (contextType === '2d') {
    return new MockCanvasRenderingContext2D() as any;
  }
  return null;
};

HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
  // Simulate async blob creation
  setTimeout(() => {
    callback(new Blob(['mock-image-data'], { type: 'image/png' }));
  }, 0);
};

// Mock Image constructor
global.Image = class MockImage {
  onload: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  src = '';
  width = 100;
  height = 100;

  constructor() {
    // Simulate successful image load after a tick
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;