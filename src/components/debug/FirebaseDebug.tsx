"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { testFirebaseConfiguration, initializeTestData } from '@/lib/firebase-test';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function FirebaseDebug() {
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const { user } = useAuth();

  const runFirebaseTest = async () => {
    setTesting(true);
    setTestResult('🔍 Running Firebase tests...\n');
    
    try {
      const success = await testFirebaseConfiguration();
      if (success) {
        setTestResult(prev => prev + '\n✅ All tests passed! Firebase is working correctly.');
      } else {
        setTestResult(prev => prev + '\n❌ Tests failed. Check console for details.');
      }
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Error: ${error.message}`);
    }
    
    setTesting(false);
  };

  const initializeData = async () => {
    try {
      await initializeTestData();
      setTestResult(prev => prev + '\n✅ Test data initialized successfully.');
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Failed to initialize data: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Firebase Diagnostic</CardTitle>
        <CardDescription>
          Test Firebase configuration and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Auth Status:</strong> {auth ? '✅ Initialized' : '❌ Not initialized'}
          </div>
          <div>
            <strong>Firestore:</strong> {db ? '✅ Initialized' : '❌ Not initialized'}
          </div>
          <div>
            <strong>User:</strong> {user ? `✅ ${user.email || user.id}` : '❌ Not authenticated'}
          </div>
          <div>
            <strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing'}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={runFirebaseTest}
            disabled={testing}
            variant="outline"
          >
            {testing ? 'Testing...' : 'Run Firebase Test'}
          </Button>
          
          <Button 
            onClick={initializeData}
            variant="outline"
          >
            Initialize Test Data
          </Button>
        </div>

        {testResult && (
          <Alert>
            <AlertDescription>
              <pre className="whitespace-pre-wrap text-sm">
                {testResult}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertDescription>
            <strong>Si vous voyez "Missing or insufficient permissions":</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Allez sur <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 underline">Firebase Console</a></li>
              <li>Sélectionnez le projet "skillforge-ai-tk7mp"</li>
              <li>Allez dans "Firestore Database" → "Règles"</li>
              <li>Copiez les règles du fichier <code>firestore.rules</code></li>
              <li>Cliquez "Publier"</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default FirebaseDebug;