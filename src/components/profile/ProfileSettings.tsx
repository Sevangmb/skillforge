"use client";

import { useState, useEffect } from 'react';
import { User, LearningStyle, AdaptiveMode, SupportedLanguage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User as UserIcon, 
  Settings, 
  Bell, 
  Globe, 
  Brain,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { profileService } from '@/lib/firebase-profile-service';

interface ProfileSettingsProps {
  user: User;
}

interface FormData {
  displayName: string;
  email: string;
  learningStyle: LearningStyle;
  adaptiveMode: AdaptiveMode;
  language: SupportedLanguage;
  notifications: {
    achievements: boolean;
    daily: boolean;
    weekly: boolean;
  };
  coachSettings: {
    enabled: boolean;
    insightFrequency: 'low' | 'medium' | 'high';
    recommendationsEnabled: boolean;
    adaptiveLearning: boolean;
    analysisMode: 'basic' | 'advanced';
  };
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState<FormData>({
    displayName: user.profile.displayName,
    email: user.profile.email,
    learningStyle: user.preferences.learningStyle,
    adaptiveMode: user.preferences.adaptiveMode,
    language: user.preferences.language,
    notifications: user.preferences.notifications || {
      achievements: true,
      daily: true,
      weekly: false
    },
    coachSettings: {
      enabled: true,
      insightFrequency: 'medium',
      recommendationsEnabled: true,
      adaptiveLearning: true,
      analysisMode: 'advanced'
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for changes
  useEffect(() => {
    const originalData = {
      displayName: user.profile.displayName,
      email: user.profile.email,
      learningStyle: user.preferences.learningStyle,
      adaptiveMode: user.preferences.adaptiveMode,
      language: user.preferences.language,
      notifications: user.preferences.notifications || {
        achievements: true,
        daily: true,
        weekly: false
      },
      coachSettings: {
        enabled: true,
        insightFrequency: 'medium' as const,
        recommendationsEnabled: true,
        adaptiveLearning: true,
        analysisMode: 'advanced' as const
      }
    };

    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate display name
    if (!formData.displayName.trim()) {
      newErrors.displayName = "Le nom d'affichage est requis";
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.displayName.trim().length > 50) {
      newErrors.displayName = "Le nom ne peut pas dépasser 50 caractères";
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "L'adresse e-mail est requise";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Veuillez saisir une adresse e-mail valide";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Préparer les données à sauvegarder
      const profileData = {
        displayName: formData.displayName,
        email: formData.email,
      };

      const preferencesData = {
        learningStyle: formData.learningStyle,
        adaptiveMode: formData.adaptiveMode,
        language: formData.language,
        notifications: formData.notifications,
        coachSettings: formData.coachSettings
      };

      // Sauvegarder via Firebase
      const result = await profileService.updateUserProfile(user.uid, {
        profile: profileData,
        preferences: preferencesData
      });

      if (!result.success) {
        throw result.error;
      }
      
      setLastSaved(new Date());
      setHasChanges(false);
      setErrors({});
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos modifications ont été enregistrées avec succès.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite';
      
      toast({
        title: "Erreur de sauvegarde",
        description: `Impossible de sauvegarder les paramètres: ${errorMessage}`,
        variant: "destructive",
      });

      // Log error for debugging
      console.error('Profile save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      displayName: user.profile.displayName,
      email: user.profile.email,
      learningStyle: user.preferences.learningStyle,
      adaptiveMode: user.preferences.adaptiveMode,
      language: user.preferences.language,
      notifications: user.preferences.notifications || {
        achievements: true,
        daily: true,
        weekly: false
      },
      coachSettings: {
        enabled: true,
        insightFrequency: 'medium',
        recommendationsEnabled: true,
        adaptiveLearning: true,
        analysisMode: 'advanced'
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Save Status */}
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous avez des modifications non sauvegardées. N'oubliez pas de les enregistrer.
          </AlertDescription>
        </Alert>
      )}

      {lastSaved && !hasChanges && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Paramètres sauvegardés le {lastSaved.toLocaleString('fr-FR')}.
          </AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Informations Personnelles
          </CardTitle>
          <CardDescription>
            Modifiez vos informations de base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  displayName: e.target.value
                }))}
                placeholder="Votre nom d'affichage"
                className={errors.displayName ? "border-red-500" : ""}
              />
              {errors.displayName && (
                <p className="text-sm text-red-500">{errors.displayName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                placeholder="votre@email.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Préférences d'Apprentissage
          </CardTitle>
          <CardDescription>
            Personnalisez votre expérience d'apprentissage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="learningStyle">Style d'apprentissage</Label>
              <Select
                value={formData.learningStyle}
                onValueChange={(value: LearningStyle) => 
                  setFormData(prev => ({ ...prev, learningStyle: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visual">Visuel</SelectItem>
                  <SelectItem value="Auditory">Auditif</SelectItem>
                  <SelectItem value="Kinesthetic">Kinesthésique</SelectItem>
                  <SelectItem value="Reading">Lecture/Écriture</SelectItem>
                  <SelectItem value="Mixed">Mixte</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Influence la présentation des contenus pédagogiques
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adaptiveMode">Mode adaptatif</Label>
              <Select
                value={formData.adaptiveMode}
                onValueChange={(value: AdaptiveMode) => 
                  setFormData(prev => ({ ...prev, adaptiveMode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default">Par défaut</SelectItem>
                  <SelectItem value="Accelerated">Accéléré</SelectItem>
                  <SelectItem value="Thorough">Approfondi</SelectItem>
                  <SelectItem value="Review">Révision</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Ajuste la difficulté et le rythme d'apprentissage
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & Locale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Langue et Région
          </CardTitle>
          <CardDescription>
            Configurez la langue de l'interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language">Langue de l'interface</Label>
            <Select
              value={formData.language}
              onValueChange={(value: SupportedLanguage) => 
                setFormData(prev => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coach Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Paramètres du Coach IA
          </CardTitle>
          <CardDescription>
            Configurez votre assistant d'apprentissage intelligent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Activer le Coach IA</Label>
              <p className="text-sm text-muted-foreground">
                Active l'assistant d'apprentissage intelligent avec analyses et recommandations
              </p>
            </div>
            <Switch
              checked={formData.coachSettings.enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  coachSettings: { ...prev.coachSettings, enabled: checked }
                }))
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Fréquence des insights</Label>
            <Select
              value={formData.coachSettings.insightFrequency}
              onValueChange={(value: 'low' | 'medium' | 'high') =>
                setFormData(prev => ({
                  ...prev,
                  coachSettings: { ...prev.coachSettings, insightFrequency: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Faible - Insights hebdomadaires</SelectItem>
                <SelectItem value="medium">Modérée - Insights tous les 2-3 jours</SelectItem>
                <SelectItem value="high">Élevée - Insights quotidiens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Recommandations intelligentes</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des recommandations personnalisées basées sur vos performances
              </p>
            </div>
            <Switch
              checked={formData.coachSettings.recommendationsEnabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  coachSettings: { ...prev.coachSettings, recommendationsEnabled: checked }
                }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Apprentissage adaptatif</Label>
              <p className="text-sm text-muted-foreground">
                Ajuste automatiquement la difficulté selon vos performances
              </p>
            </div>
            <Switch
              checked={formData.coachSettings.adaptiveLearning}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  coachSettings: { ...prev.coachSettings, adaptiveLearning: checked }
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Mode d'analyse</Label>
            <Select
              value={formData.coachSettings.analysisMode}
              onValueChange={(value: 'basic' | 'advanced') =>
                setFormData(prev => ({
                  ...prev,
                  coachSettings: { ...prev.coachSettings, analysisMode: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basique - Analyses simples et rapides</SelectItem>
                <SelectItem value="advanced">Avancé - Analyses détaillées et prédictives</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Le mode avancé fournit des analyses plus approfondies mais consomme plus de ressources
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Gérez vos préférences de notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Notifications de succès</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications lors de l'obtention de nouveaux badges
                </p>
              </div>
              <Switch
                checked={formData.notifications.achievements}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, achievements: checked }
                  }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Rappels quotidiens</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des rappels pour maintenir votre progression
                </p>
              </div>
              <Switch
                checked={formData.notifications.daily}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, daily: checked }
                  }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Résumés hebdomadaires</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un résumé de vos progrès chaque semaine
                </p>
              </div>
              <Switch
                checked={formData.notifications.weekly}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, weekly: checked }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarder les modifications
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
            >
              Annuler les modifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}