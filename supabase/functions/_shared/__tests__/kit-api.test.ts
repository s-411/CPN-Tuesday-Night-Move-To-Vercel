import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Deno environment
const mockEnv = {
  get: vi.fn((key: string) => {
    const env: Record<string, string> = {
      KIT_API_KEY: 'test-api-key',
      KIT_FORM_ID: 'test-form-id',
    };
    return env[key];
  }),
};

global.Deno = { env: mockEnv } as any;

// Mock fetch
global.fetch = vi.fn();

// Now import the module after mocks are set up
const kitApiModule = await import('../kit-api.ts');

const {
  getKitConfig,
  getSubscriberByEmail,
  addSubscriberToKit,
  tagSubscriber,
  addSubscriberWithTags,
  tagSubscriberByEmail,
} = kitApiModule;

describe('Kit API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getKitConfig', () => {
    it('should return config from environment variables', () => {
      const config = getKitConfig();

      expect(config.apiKey).toBe('test-api-key');
      expect(config.formId).toBe('test-form-id');
    });

    it('should throw error when KIT_API_KEY is not set', () => {
      mockEnv.get.mockReturnValue(undefined);

      expect(() => getKitConfig()).toThrow('KIT_API_KEY environment variable is not set');

      // Restore
      mockEnv.get.mockImplementation((key: string) => {
        const env: Record<string, string> = {
          KIT_API_KEY: 'test-api-key',
          KIT_FORM_ID: 'test-form-id',
        };
        return env[key];
      });
    });
  });

  describe('getSubscriberByEmail', () => {
    it('should return subscriber when found', async () => {
      const mockSubscriber = {
        id: 'sub-123',
        email_address: 'test@example.com',
        first_name: 'Test',
        state: 'active',
        created_at: '2024-01-01',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ subscribers: [mockSubscriber] }),
      });

      const result = await getSubscriberByEmail('test@example.com');

      expect(result).toEqual(mockSubscriber);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('email_address=test%40example.com'),
        expect.any(Object)
      );
    });

    it('should return null when subscriber not found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ subscribers: [] }),
      });

      const result = await getSubscriberByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not found',
      });

      const result = await getSubscriberByEmail('error@example.com');

      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await getSubscriberByEmail('error@example.com');

      expect(result).toBeNull();
    });
  });

  describe('addSubscriberToKit', () => {
    it('should create new subscriber when not exists', async () => {
      const mockSubscriber = {
        id: 'sub-123',
        email_address: 'new@example.com',
        first_name: 'New',
        state: 'active',
        created_at: '2024-01-01',
      };

      let callCount = 0;
      (global.fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('?email_address=')) {
          // getSubscriberByEmail call
          return {
            ok: true,
            json: async () => ({ subscribers: [] }),
          };
        } else if (url.endsWith('/subscribers') && callCount === 0) {
          // Create subscriber call
          callCount++;
          return {
            ok: true,
            json: async () => ({ subscriber: mockSubscriber }),
          };
        } else if (url.includes('/forms/')) {
          // Add to form call
          return {
            ok: true,
            json: async () => ({}),
          };
        }
        return { ok: true, json: async () => ({}) };
      });

      const result = await addSubscriberToKit({
        email: 'new@example.com',
        firstName: 'New',
        tags: [],
      });

      expect(result).toEqual(mockSubscriber);
    });

    it('should return existing subscriber if already exists', async () => {
      const existingSubscriber = {
        id: 'sub-existing',
        email_address: 'existing@example.com',
        first_name: 'Existing',
        state: 'active',
        created_at: '2024-01-01',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ subscribers: [existingSubscriber] }),
      });

      const result = await addSubscriberToKit({
        email: 'existing@example.com',
        tags: [],
      });

      expect(result).toEqual(existingSubscriber);
    });

    it('should apply tags to new subscriber', async () => {
      const mockSubscriber = {
        id: 'sub-123',
        email_address: 'tagged@example.com',
        state: 'active',
        created_at: '2024-01-01',
      };

      const mockTag = {
        id: 'tag-123',
        name: 'test-tag',
        created_at: '2024-01-01',
      };

      let callIndex = 0;
      (global.fetch as any).mockImplementation(async (url: string, options: any) => {
        if (url.includes('?email_address=')) {
          return { ok: true, json: async () => ({ subscribers: [] }) };
        } else if (url.endsWith('/subscribers') && options?.method === 'POST') {
          return { ok: true, json: async () => ({ subscriber: mockSubscriber }) };
        } else if (url.endsWith('/tags') && options?.method === 'GET') {
          return { ok: true, json: async () => ({ tags: [] }) };
        } else if (url.endsWith('/tags') && options?.method === 'POST') {
          return { ok: true, json: async () => ({ tag: mockTag }) };
        } else if (url.includes('/tags/') && url.includes('/subscribers/')) {
          return { ok: true, json: async () => ({}) };
        } else if (url.includes('/forms/')) {
          return { ok: true, json: async () => ({}) };
        }
        return { ok: true, json: async () => ({}) };
      });

      const result = await addSubscriberToKit({
        email: 'tagged@example.com',
        tags: ['test-tag'],
      });

      expect(result.id).toBe('sub-123');
    });

    it('should handle API errors when creating subscriber', async () => {
      (global.fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('?email_address=')) {
          return { ok: true, json: async () => ({ subscribers: [] }) };
        } else {
          return {
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: async () => 'Invalid email',
          };
        }
      });

      await expect(
        addSubscriberToKit({
          email: 'invalid@example.com',
          tags: [],
        })
      ).rejects.toThrow();
    });
  });

  describe('tagSubscriber', () => {
    it('should create tag and apply to subscriber', async () => {
      const mockTag = {
        id: 'tag-123',
        name: 'new-tag',
        created_at: '2024-01-01',
      };

      (global.fetch as any).mockImplementation(async (url: string, options: any) => {
        if (url.endsWith('/tags') && options?.method === 'GET') {
          // Tag doesn't exist
          return { ok: true, json: async () => ({ tags: [] }) };
        } else if (url.endsWith('/tags') && options?.method === 'POST') {
          // Create tag
          return { ok: true, json: async () => ({ tag: mockTag }) };
        } else if (url.includes('/tags/') && url.includes('/subscribers/')) {
          // Apply tag
          return { ok: true, json: async () => ({}) };
        }
        return { ok: true, json: async () => ({}) };
      });

      await tagSubscriber({
        subscriberId: 'sub-123',
        tagName: 'new-tag',
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should use existing tag if already exists', async () => {
      const existingTag = {
        id: 'tag-existing',
        name: 'existing-tag',
        created_at: '2024-01-01',
      };

      (global.fetch as any).mockImplementation(async (url: string, options: any) => {
        if (url.endsWith('/tags') && (!options?.method || options?.method === 'GET')) {
          return { ok: true, json: async () => ({ tags: [existingTag] }) };
        } else if (url.includes('/tags/') && url.includes('/subscribers/')) {
          return { ok: true, json: async () => ({}) };
        }
        return { ok: true, json: async () => ({}) };
      });

      await tagSubscriber({
        subscriberId: 'sub-123',
        tagName: 'existing-tag',
      });

      // Should not create new tag
      const createTagCalls = (global.fetch as any).mock.calls.filter(
        (call: any) => call[1]?.method === 'POST' && call[0].endsWith('/tags')
      );
      expect(createTagCalls).toHaveLength(0);
    });
  });

  describe('addSubscriberWithTags', () => {
    it('should add subscriber and apply tags', async () => {
      const mockSubscriber = {
        id: 'sub-123',
        email_address: 'test@example.com',
        state: 'active',
        created_at: '2024-01-01',
      };

      const mockTag = {
        id: 'tag-123',
        name: 'test-tag',
        created_at: '2024-01-01',
      };

      (global.fetch as any).mockImplementation(async (url: string, options: any) => {
        if (url.includes('?email_address=')) {
          return { ok: true, json: async () => ({ subscribers: [] }) };
        } else if (url.endsWith('/subscribers') && options?.method === 'POST') {
          return { ok: true, json: async () => ({ subscriber: mockSubscriber }) };
        } else if (url.endsWith('/tags') && options?.method === 'GET') {
          return { ok: true, json: async () => ({ tags: [] }) };
        } else if (url.endsWith('/tags') && options?.method === 'POST') {
          return { ok: true, json: async () => ({ tag: mockTag }) };
        } else if (url.includes('/tags/') && url.includes('/subscribers/')) {
          return { ok: true, json: async () => ({}) };
        } else if (url.includes('/forms/')) {
          return { ok: true, json: async () => ({}) };
        }
        return { ok: true, json: async () => ({}) };
      });

      const result = await addSubscriberWithTags(
        'test@example.com',
        ['test-tag'],
        'Test'
      );

      expect(result.subscriberId).toBe('sub-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should propagate errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      await expect(
        addSubscriberWithTags('error@example.com', ['tag'])
      ).rejects.toThrow('API Error');
    });
  });

  describe('tagSubscriberByEmail', () => {
    it('should look up subscriber and apply tag', async () => {
      const mockSubscriber = {
        id: 'sub-123',
        email_address: 'test@example.com',
        state: 'active',
        created_at: '2024-01-01',
      };

      const mockTag = {
        id: 'tag-123',
        name: 'test-tag',
        created_at: '2024-01-01',
      };

      (global.fetch as any).mockImplementation(async (url: string, options: any) => {
        if (url.includes('?email_address=')) {
          return { ok: true, json: async () => ({ subscribers: [mockSubscriber] }) };
        } else if (url.endsWith('/tags') && (!options?.method || options?.method === 'GET')) {
          return { ok: true, json: async () => ({ tags: [] }) };
        } else if (url.endsWith('/tags') && options?.method === 'POST') {
          return { ok: true, json: async () => ({ tag: mockTag }) };
        } else if (url.includes('/tags/') && url.includes('/subscribers/')) {
          return { ok: true, json: async () => ({}) };
        }
        return { ok: true, json: async () => ({}) };
      });

      await tagSubscriberByEmail('test@example.com', 'test-tag');

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw error when subscriber not found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ subscribers: [] }),
      });

      await expect(
        tagSubscriberByEmail('notfound@example.com', 'tag')
      ).rejects.toThrow('Subscriber not found');
    });
  });
});