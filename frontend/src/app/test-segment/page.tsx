'use client';

import { useEffect, useState } from 'react';
import { segment } from '@/utils/segment';

export default function TestSegmentPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLandingPageVisit = async () => {
    setIsLoading(true);
    addLog('Testing Landing Page Visit...');
    
    try {
      // Use a specific test event name to avoid conflicts with automatic page tracking
      await segment.track('Test Landing Page Visit', {
        test_mode: true,
        source: 'test_page',
        page: '/test-segment'
      });
      addLog('✅ Landing Page Visit event sent successfully');
    } catch (error) {
      addLog(`❌ Landing Page Visit failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCTAClick = async () => {
    setIsLoading(true);
    addLog('Testing CTA Click...');
    
    try {
      // Use a specific test event name to avoid conflicts
      await segment.track('Test CTA Click', {
        test_mode: true,
        button_text: 'Test Button',
        location: 'test_page',
        button_type: 'test'
      });
      addLog('✅ CTA Click event sent successfully');
    } catch (error) {
      addLog(`❌ CTA Click failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCustomEvent = async () => {
    setIsLoading(true);
    addLog('Testing Custom Event...');
    
    try {
      await segment.track('Test Event', {
        test_mode: true,
        custom_property: 'test_value',
        timestamp: new Date().toISOString()
      });
      addLog('✅ Custom Event sent successfully');
    } catch (error) {
      addLog(`❌ Custom Event failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    addLog('Test page loaded');
    addLog(`Environment: ${process.env.NODE_ENV}`);
    addLog(`Segment enabled: ${process.env.NEXT_PUBLIC_ENABLE_ANALYTICS}`);
    addLog(`Write key: ${process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY ? 'Set' : 'Not set'}`);
    
    // Clear any session tracking flags to ensure clean test
    sessionStorage.removeItem('session_started');
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('onboarding_started_tracked');
    sessionStorage.removeItem('free_pic_review_page_tracked');
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Segment Analytics Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Events</h2>
          <div className="space-y-4">
            <button
              onClick={testLandingPageVisit}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Landing Page Visit
            </button>
            
            <button
              onClick={testCTAClick}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
            >
              Test CTA Click
            </button>
            
            <button
              onClick={testCustomEvent}
              disabled={isLoading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-4"
            >
              Test Custom Event
            </button>
            
            <button
              onClick={clearLogs}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-4"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click a test button above.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instructions</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>Open your browser's Developer Tools (F12)</li>
            <li>Go to the Network tab</li>
            <li>Click the test buttons above</li>
            <li>Look for requests to <code>api.segment.io/v1/t</code> in the Network tab</li>
            <li>Check the Console tab for Segment initialization messages</li>
            <li>Verify events appear in your Segment debugger</li>
          </ol>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-semibold text-green-800 mb-2">Expected Events (No Duplicates):</h4>
            <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
              <li><code>Test Landing Page Visit</code> - Only when clicking "Test Landing Page Visit"</li>
              <li><code>Test CTA Click</code> - Only when clicking "Test CTA Click"</li>
              <li><code>Test Event</code> - Only when clicking "Test Custom Event"</li>
              <li><strong>No automatic "Page Visited" or "Session Started" events</strong></li>
              <li><strong>No "Session Ended" events during testing</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
