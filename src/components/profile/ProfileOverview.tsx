"use client";

// Avatar upload functionality now handled by AvatarUpload component
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Avatar and upload button now handled by AvatarUpload component
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Trophy, 
  Target, 
  Clock,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AvatarUpload from './AvatarUpload';

interface ProfileOverviewProps {
  user: User;
}

export default function ProfileOverview({ user }: ProfileOverviewProps) {
  // Avatar upload state management now handled by AvatarUpload component
  
  // Calculate level progress (assuming max level 100)
  const levelProgress = (user.profile.level / 100) * 100;
  const nextLevelPoints = (user.profile.level + 1) * 1000; // Example calculation
  const pointsToNextLevel = nextLevelPoints - user.profile.totalPoints;

  // Calculate completion stats from competences
  const totalSkills = Object.keys(user.competences).length;
  const completedSkills = Object.values(user.competences).filter(
    comp => comp.completed
  ).length;
  const completionRate = totalSkills > 0 ? (completedSkills / totalSkills) * 100 : 0;

  // Get average score
  const scoresWithValues = Object.values(user.competences)
    .filter(comp => comp.averageScore !== undefined)
    .map(comp => comp.averageScore!);
  const averageScore = scoresWithValues.length > 0 
    ? scoresWithValues.reduce((acc, score) => acc + score, 0) / scoresWithValues.length
    : 0;

  // Avatar upload functionality moved to AvatarUpload component

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profil Personnel
          </CardTitle>
          <CardDescription>
            Vos informations principales et progression
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-3">
              <AvatarUpload 
                userId={user.id}
                currentAvatarUrl={user.profile.avatar}
                displayName={user.profile.displayName}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{user.profile.displayName}</h2>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{user.profile.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Inscrit le {
                    user.profile.joinedAt ? 
                    format(user.profile.joinedAt, 'dd MMMM yyyy', { locale: fr }) :
                    'Date inconnue'
                  }</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Dernière visite: {
                    user.profile.lastLogin ? 
                    format(user.profile.lastLogin, 'dd/MM/yyyy à HH:mm', { locale: fr }) :
                    'Jamais'
                  }</span>
                </div>
              </div>

              {user.profile.isAdmin && (
                <Badge variant="secondary" className="w-fit">
                  <Star className="h-3 w-3 mr-1" />
                  Administrateur
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Level & Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Niveau</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {user.profile.level}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progression</span>
                    <span>{Math.round(levelProgress)}%</span>
                  </div>
                  <Progress value={levelProgress} className="h-2" />
                  {pointsToNextLevel > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {pointsToNextLevel.toLocaleString()} points pour le niveau suivant
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Points Totaux</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {user.profile.totalPoints.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score Moyen</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {Math.round(averageScore)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Skills Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progression des Compétences</CardTitle>
          <CardDescription>
            Votre avancement dans les différents domaines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Compétences maîtrisées</span>
              <span className="text-sm text-muted-foreground">
                {completedSkills} sur {totalSkills}
              </span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{completedSkills}</p>
                <p className="text-sm text-muted-foreground">Compétences réussies</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
                <p className="text-sm text-muted-foreground">Taux de réussite</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}