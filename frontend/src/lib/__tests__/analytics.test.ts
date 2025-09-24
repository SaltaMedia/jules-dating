import { analytics } from '../analytics';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
  value: jest.fn(),
  writable: true,
});

// Mock performance
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => 1000),
  },
  writable: true,
});

describe('AnalyticsTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  describe('Initialization', () => {
    it('should initialize with session ID and user ID', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      // Mock JWT decode
      const mockJwtPayload = { userId: 'test-user-id' };
      jest.spyOn(global, 'atob').mockReturnValue(JSON.stringify(mockJwtPayload));
      
      const tracker = new (analytics as any).constructor();
      
      expect(tracker.sessionId).toBeDefined();
      expect(tracker.sessionStartTime).toBeInstanceOf(Date);
      expect(tracker.userId).toBe('test-user-id');
    });

    it('should handle missing token gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const tracker = new (analytics as any).constructor();
      
      expect(tracker.userId).toBeUndefined();
    });
  });

  describe('Event Batching', () => {
    it('should batch events and flush when batch size reached', async () => {
      const tracker = new (analytics as any).constructor();
      
      // Send 10 events (batch size)
      for (let i = 0; i < 10; i++) {
        await tracker.trackPageView(`/test-${i}`, `Test Page ${i}`);
      }
      
      // Should have flushed once
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body).toHaveLength(10);
    });

    it('should flush remaining events on destroy', async () => {
      const tracker = new (analytics as any).constructor();
      
      // Send 5 events (less than batch size)
      for (let i = 0; i < 5; i++) {
        await tracker.trackPageView(`/test-${i}`, `Test Page ${i}`);
      }
      
      // Should not have flushed yet
      expect(mockFetch).toHaveBeenCalledTimes(0);
      
      // Destroy should flush remaining events
      tracker.destroy();
      
      // Should have flushed once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session End Tracking', () => {
    it('should use sendBeacon for session end events', () => {
      const mockSendBeacon = jest.fn();
      Object.defineProperty(navigator, 'sendBeacon', {
        value: mockSendBeacon,
        writable: true,
      });
      
      const tracker = new (analytics as any).constructor();
      
      // Simulate page unload
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);
      
      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/analytics/events',
        expect.any(Blob)
      );
      
      const blob = mockSendBeacon.mock.calls[0][1];
      expect(blob.type).toBe('application/json');
    });

    it('should fallback to XMLHttpRequest when sendBeacon unavailable', () => {
      // Mock sendBeacon as unavailable
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        writable: true,
      });
      
      // Mock XMLHttpRequest
      const mockXHR = {
        open: jest.fn(),
        setRequestHeader: jest.fn(),
        send: jest.fn(),
      };
      global.XMLHttpRequest = jest.fn(() => mockXHR) as any;
      
      const tracker = new (analytics as any).constructor();
      
      // Simulate page unload
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);
      
      expect(mockXHR.open).toHaveBeenCalledWith('POST', '/api/analytics/events', false);
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockXHR.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should track analytics API failures', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);
      
      const tracker = new (analytics as any).constructor();
      await tracker.trackPageView('/test', 'Test Page');
      
      // Should track the failure
      expect(mockFetch).toHaveBeenCalledTimes(2); // Original + error tracking
    });

    it('should track network failures', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const tracker = new (analytics as any).constructor();
      await tracker.trackPageView('/test', 'Test Page');
      
      // Should track the failure
      expect(mockFetch).toHaveBeenCalledTimes(2); // Original + error tracking
    });
  });

  describe('Performance Tracking', () => {
    it('should track page load times', async () => {
      const tracker = new (analytics as any).constructor();
      
      await tracker.trackPageLoadTime(1500, '/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"eventType":"performance"'),
        })
      );
    });

    it('should track API response times', async () => {
      const tracker = new (analytics as any).constructor();
      
      await tracker.trackApiResponseTime('/api/test', 250);
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"metric":"api_response_time"'),
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('should clear intervals on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const tracker = new (analytics as any).constructor();
      tracker.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});

