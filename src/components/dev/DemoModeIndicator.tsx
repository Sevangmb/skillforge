"use client";

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, X, Database, Wifi, WifiOff } from 'lucide-react';
import { hybridQuizService } from '@/lib/hybrid-quiz-service';

export function DemoModeIndicator() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  useEffect(() => {
    setIsFirebaseConnected(hybridQuizService.isUsingFirebase());
  }, []);

  if (isFirebaseConnected || !isVisible) {
    return null;
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <WifiOff className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <Database className="h-3 w-3 mr-1" />
                Mode Démonstration
              </Badge>
            </div>
            <AlertDescription className="text-blue-800">
              <strong>Firebase non configuré</strong> - L'application utilise des données de démonstration.
              <br />
              Toutes les fonctionnalités sont disponibles avec des données mockées réalistes.
            </AlertDescription>
            <div className="mt-3 text-sm text-blue-700">
              <p><strong>Fonctionnalités actives :</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>✅ Parcours de quiz interactifs</li>
                <li>✅ Défis quotidiens avec système de streak</li> 
                <li>✅ Génération de nouveaux parcours par IA (simulée)</li>
                <li>✅ Système de progression et points</li>
              </ul>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-4 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          💡 <strong>Pour activer Firebase :</strong> Suivez le guide dans{' '}
          <code className="bg-blue-100 px-1 rounded">URGENCE_FIREBASE.md</code>
        </p>
      </div>
    </Alert>
  );
}

export default DemoModeIndicator;