/**
 * Composant de test pour vérifier le chargement des compétences
 * Utile pour diagnostiquer les problèmes de chargement
 */

"use client";

import { useEffect, useState } from 'react';
import { skillsService } from '@/lib/skills-service';
import { useSkills } from '@/hooks/useSkills';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function SkillsLoadingTest() {
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const { skills, isLoading, error, refreshData } = useSkills();

  useEffect(() => {
    const updateStatus = () => {
      // Service status is not available, remove this functionality
      setServiceStatus(null);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧪 Test de chargement des compétences</span>
            {skills.length > 0 && !isLoading && <CheckCircle className="h-5 w-5 text-green-500" />}
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            {error && <XCircle className="h-5 w-5 text-red-500" />}
          </CardTitle>
          <CardDescription>
            Diagnostic en temps réel du système de compétences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">État du Hook</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Chargement:</span>
                  <Badge variant={isLoading ? "default" : "secondary"}>
                    {isLoading ? "En cours" : "Terminé"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Compétences:</span>
                  <Badge variant={skills.length > 0 ? "default" : "destructive"}>
                    {skills.length} trouvées
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Erreur:</span>
                  <Badge variant={error ? "destructive" : "default"}>
                    {error || "Aucune"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Prêt:</span>
                  <Badge variant={skills.length > 0 && !isLoading ? "default" : "secondary"}>
                    {skills.length > 0 && !isLoading ? "Oui" : "Non"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">État des données</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Données disponibles:</span>
                  <Badge variant={skills.length > 0 ? "default" : "secondary"}>
                    {skills.length > 0 ? "Oui" : "Non"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Erreur réseau:</span>
                  <Badge variant={error ? "destructive" : "default"}>
                    {error ? "Oui" : "Non"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive font-medium">Erreur détectée:</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <button 
                onClick={() => refreshData()}
                className="inline-flex items-center mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Réessayer
              </button>
            </div>
          )}

          {skills.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✅ Compétences chargées avec succès!
              </p>
              <div className="mt-2 text-xs text-green-600 dark:text-green-300">
                <p>Première compétence: {skills[0]?.name}</p>
                <p>Total: {skills.length} compétences disponibles</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}