'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { googleAuthService } from '@/services/google-auth.service';

export default function DebugGooglePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState<string>('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog('🔍 Starting Google OAuth Debug...');
    
    // Set current origin safely
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
      addLog(`🌐 Current URL: ${window.location.href}`);
      addLog(`🌐 Origin: ${window.location.origin}`);
      addLog(`🌐 Protocol: ${window.location.protocol}`);
      addLog(`🌐 Hostname: ${window.location.hostname}`);
      addLog(`🌐 Port: ${window.location.port}`);
    }
    
    // Get debug info
    const info = googleAuthService.getDebugInfo();
    setDebugInfo(info);
    addLog(`📋 Debug Info: ${JSON.stringify(info, null, 2)}`);
    
    // Check environment variables
    addLog(`📋 Google Client ID: ${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`);
    addLog(`📋 Frontend URL: ${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
    addLog(`📋 API URL: ${process.env.NEXT_PUBLIC_API_URL}`);
  }, []);

  const testGoogleSignIn = async () => {
    setIsLoading(true);
    addLog('🧪 Testing Google Sign-In initialization...');
    
    try {
      await googleAuthService.initializeGoogleSignIn();
      addLog('✅ Google Sign-In initialized successfully');
      
      // Test button rendering
      const success = googleAuthService.renderSignInButton('test-google-button');
      if (success) {
        addLog('✅ Google Sign-In button rendered successfully');
      } else {
        addLog('❌ Failed to render Google Sign-In button');
      }
      
      // Test One Tap
      setTimeout(() => {
        addLog('🧪 Testing Google One Tap...');
        googleAuthService.promptOneTap();
      }, 1000);
      
    } catch (error) {
      addLog(`❌ Google Sign-In initialization failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testOAuthRedirect = () => {
    addLog('🧪 Testing OAuth redirect...');
    const authUrl = googleAuthService.getAuthUrl();
    addLog(`🔗 OAuth URL: ${authUrl}`);
    
    // Open in new window for testing
    if (typeof window !== 'undefined') {
      window.open(authUrl, '_blank', 'width=500,height=600');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">🔍 Google OAuth Debug</h1>
          <p className="text-gray-600 mt-2">Debug and test Google OAuth configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Current OAuth settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Client ID:</strong> {debugInfo?.clientId || 'Loading...'}</div>
                <div><strong>Redirect URI:</strong> {debugInfo?.redirectUri || 'Loading...'}</div>
                <div><strong>Frontend URL:</strong> {debugInfo?.frontendUrl || 'Loading...'}</div>
                <div><strong>Current Origin:</strong> {currentOrigin || 'Loading...'}</div>
                <div><strong>Configured:</strong> {debugInfo?.isConfigured ? '✅ Yes' : '❌ No'}</div>
                <div><strong>Initialized:</strong> {debugInfo?.isInitialized ? '✅ Yes' : '❌ No'}</div>
                <div><strong>Google Script:</strong> {debugInfo?.hasGoogleScript ? '✅ Loaded' : '❌ Not loaded'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
              <CardDescription>Test OAuth functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testGoogleSignIn} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Google Sign-In'}
              </Button>
              
              <Button 
                onClick={testOAuthRedirect} 
                variant="outline"
                className="w-full"
              >
                Test OAuth Redirect
              </Button>
              
              <Button 
                onClick={clearLogs} 
                variant="outline"
                className="w-full"
              >
                Clear Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Button Container */}
        <Card>
          <CardHeader>
            <CardTitle>Test Google Button</CardTitle>
            <CardDescription>Rendered Google Sign-In button for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div id="test-google-button" className="w-full max-w-sm mx-auto"></div>
          </CardContent>
        </Card>

        {/* Debug Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
            <CardDescription>Real-time debug information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Troubleshooting Guide</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-red-600">❌ &ldquo;The given origin is not allowed for the given client ID&rdquo;</h4>
                <p className="text-gray-600 mt-1">
                  This means the Google OAuth client is not configured to allow your current domain. 
                  You need to add <code className="bg-gray-100 px-1 rounded">{currentOrigin || 'your-origin'}</code> 
                  to the authorized origins in Google Cloud Console.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-600">⚠️ &ldquo;Google OAuth is not properly configured&rdquo;</h4>
                <p className="text-gray-600 mt-1">
                  Check that all environment variables are set correctly in your .env.local file.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-600">ℹ️ Steps to fix:</h4>
                <ol className="list-decimal list-inside text-gray-600 mt-1 space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a></li>
                  <li>Navigate to APIs & Services → Credentials</li>
                  <li>Find your OAuth 2.0 Client ID</li>
                  <li>Add <code className="bg-gray-100 px-1 rounded">{currentOrigin || 'your-origin'}</code> to Authorized JavaScript origins</li>
                  <li>Add <code className="bg-gray-100 px-1 rounded">{currentOrigin || 'your-origin'}/auth/google/callback</code> to Authorized redirect URIs</li>
                  <li>Save and wait a few minutes for changes to propagate</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}