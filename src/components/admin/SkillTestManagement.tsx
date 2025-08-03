"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search,
  Plus,
  Edit,
  Eye,
  Settings,
  BookOpen,
  Target,
  Clock,
  Award,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { 
  SKILL_DOMAINS, 
  WEB_FUNDAMENTALS_LEVELS, 
  HTML_BASICS_QUESTIONS,
  SKILL_TEST_CONFIG 
} from '@/lib/skills/skillData';
import type { SkillDomain, SkillLevel, SkillQuestion } from '@/lib/types/skills';

// Mock analytics data
const MOCK_ANALYTICS = {
  totalDomains: 5,
  activeDomains: 2,
  totalLevels: 15,
  totalQuestions: 120,
  totalAttempts: 450,
  averageScore: 73.5,
  passRate: 68.2,
  popularDomains: [
    { id: 'web-fundamentals', name: 'Fondamentaux Web', attempts: 285, averageScore: 75.2 },
    { id: 'frontend-frameworks', name: 'Frameworks Frontend', attempts: 165, averageScore: 71.8 },
  ],
  recentActivity: [
    { user: 'user123', domain: 'web-fundamentals', level: 'html-basics', score: 85, timestamp: new Date() },
    { user: 'user456', domain: 'web-fundamentals', level: 'css-styling', score: 72, timestamp: new Date() },
  ]
};

export default function SkillTestManagement() {
  const { hasPermission } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDomain, setSelectedDomain] = useState<SkillDomain | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Combine mock data
  const domains = SKILL_DOMAINS;
  const levels = WEB_FUNDAMENTALS_LEVELS;
  const questions = HTML_BASICS_QUESTIONS;

  const filteredDomains = useMemo(() => {
    return domains.filter(domain =>
      domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [domains, searchTerm]);

  const getDomainStats = (domainId: string) => {
    // Mock statistics
    return {
      totalLevels: domainId === 'web-fundamentals' ? 3 : Math.floor(Math.random() * 5) + 2,
      completedUsers: Math.floor(Math.random() * 150) + 50,
      averageScore: Math.floor(Math.random() * 20) + 70,
      totalQuestions: Math.floor(Math.random() * 50) + 30,
    };
  };

  const getLevelStats = (levelId: string) => {
    return {
      attempts: Math.floor(Math.random() * 100) + 20,
      passRate: Math.floor(Math.random() * 30) + 60,
      averageTime: Math.floor(Math.random() * 10) + 15,
      difficulty: Math.floor(Math.random() * 3) + 6,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestion des Tests de Compétences</h2>
          <p className="text-muted-foreground">
            Gérez les domaines, niveaux et questions de test
          </p>
        </div>
        {hasPermission('skills.manage') && (
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouveau Domaine</span>
          </Button>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="domains">Domaines</TabsTrigger>
          <TabsTrigger value="levels">Niveaux</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Domaines Actifs</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_ANALYTICS.activeDomains}</div>
                <p className="text-xs text-muted-foreground">
                  sur {MOCK_ANALYTICS.totalDomains} domaines
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tentatives</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_ANALYTICS.totalAttempts}</div>
                <p className="text-xs text-muted-foreground">
                  +12% ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_ANALYTICS.averageScore}%</div>
                <p className="text-xs text-muted-foreground">
                  +2.3% vs mois dernier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_ANALYTICS.passRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Seuil: {SKILL_TEST_CONFIG.globalSettings.defaultPassingScore}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuration Globale</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Score de Passage (%)</label>
                  <Input 
                    type="number" 
                    defaultValue={SKILL_TEST_CONFIG.globalSettings.defaultPassingScore}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tentatives Max</label>
                  <Input 
                    type="number" 
                    defaultValue={SKILL_TEST_CONFIG.globalSettings.maxAttemptsPerTest}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Temps par Question (sec)</label>
                  <Input 
                    type="number" 
                    defaultValue={SKILL_TEST_CONFIG.globalSettings.timePerQuestion}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <Button variant="outline">Réinitialiser</Button>
                <Button>Sauvegarder</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_ANALYTICS.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.domain} - {activity.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={activity.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {activity.score}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Il y a 2h</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un domaine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Domains Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDomains.map((domain) => {
              const stats = getDomainStats(domain.id);
              return (
                <Card key={domain.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${domain.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                          {domain.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{domain.name}</CardTitle>
                          <Badge variant="outline">Niveau {domain.level}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {domain.isVisible ? (
                          <Unlock className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{domain.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center space-x-1">
                          <Target className="h-3 w-3" />
                          <span>Niveaux: {stats.totalLevels}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>Utilisateurs: {stats.completedUsers}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Score: {stats.averageScore}%</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>Questions: {stats.totalQuestions}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => setSelectedDomain(domain)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                    </div>

                    {domain.metadata.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {domain.metadata.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {domain.metadata.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{domain.metadata.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Levels Tab */}
        <TabsContent value="levels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Niveaux - Fondamentaux Web</CardTitle>
              <CardDescription>
                Gérez les niveaux et leur progression dans le domaine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prérequis</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Statistiques</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levels.map((level) => {
                    const stats = getLevelStats(level.id);
                    return (
                      <TableRow key={level.id}>
                        <TableCell>
                          <Badge variant="outline">Niveau {level.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{level.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {level.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {level.prerequisites.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {level.prerequisites.map(prereq => (
                                <Badge key={prereq} variant="secondary" className="text-xs">
                                  {prereq}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Aucun</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{level.testConfiguration.questionCount} questions</div>
                            <div className="text-muted-foreground">
                              {level.testConfiguration.timeLimit}min
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{stats.attempts} tentatives</div>
                            <div className="text-muted-foreground">
                              {stats.passRate}% réussite
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {level.isVisible ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Visible
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              <Lock className="h-3 w-3 mr-1" />
                              Verrouillé
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedLevel(level)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Popular Domains */}
            <Card>
              <CardHeader>
                <CardTitle>Domaines Populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_ANALYTICS.popularDomains.map((domain, index) => (
                    <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{domain.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {domain.attempts} tentatives
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{domain.averageScore}%</div>
                        <div className="text-sm text-muted-foreground">Score moyen</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Tendances de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Questions les plus difficiles</span>
                      <Badge variant="destructive">45% réussite</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Structure HTML5 sémantique
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Questions les plus faciles</span>
                      <Badge className="bg-green-100 text-green-800">92% réussite</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Balises de titre HTML
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Temps moyen par test</span>
                      <Badge variant="outline">18 minutes</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sur 30 minutes autorisées
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Domain Detail Dialog */}
      {selectedDomain && (
        <Dialog open={!!selectedDomain} onOpenChange={() => setSelectedDomain(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${selectedDomain.color} rounded-lg flex items-center justify-center text-white`}>
                  {selectedDomain.icon}
                </div>
                <span>{selectedDomain.name}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedDomain.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informations Générales</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Niveau:</strong> {selectedDomain.level}</div>
                    <div><strong>Difficulté:</strong> {selectedDomain.metadata.difficulty}</div>
                    <div><strong>Heures estimées:</strong> {selectedDomain.metadata.estimatedHours}h</div>
                    <div><strong>Visible:</strong> {selectedDomain.isVisible ? 'Oui' : 'Non'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Critères de Déblocage</h4>
                  {selectedDomain.unlockCriteria ? (
                    <div className="space-y-1 text-sm">
                      {selectedDomain.unlockCriteria.requiredDomains && (
                        <div><strong>Domaines requis:</strong> {selectedDomain.unlockCriteria.requiredDomains.join(', ')}</div>
                      )}
                      {selectedDomain.unlockCriteria.requiredPoints && (
                        <div><strong>Points requis:</strong> {selectedDomain.unlockCriteria.requiredPoints}</div>
                      )}
                      {selectedDomain.unlockCriteria.requiredLevel && (
                        <div><strong>Niveau requis:</strong> {selectedDomain.unlockCriteria.requiredLevel}</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun prérequis</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDomain.metadata.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Level Detail Dialog */}
      {selectedLevel && (
        <Dialog open={!!selectedLevel} onOpenChange={() => setSelectedLevel(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLevel.name} - Niveau {selectedLevel.level}
              </DialogTitle>
              <DialogDescription>
                {selectedLevel.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Configuration du Test</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Questions:</strong> {selectedLevel.testConfiguration.questionCount}</div>
                    <div><strong>Temps limite:</strong> {selectedLevel.testConfiguration.timeLimit} min</div>
                    <div><strong>Score de passage:</strong> {selectedLevel.testConfiguration.passingScore}%</div>
                    <div><strong>Tentatives max:</strong> {selectedLevel.testConfiguration.maxAttempts}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Récompenses</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Points:</strong> {selectedLevel.rewards.points}</div>
                    <div><strong>Débloque suivant:</strong> {selectedLevel.rewards.unlocksNext ? 'Oui' : 'Non'}</div>
                    {selectedLevel.rewards.badges && (
                      <div><strong>Badges:</strong> {selectedLevel.rewards.badges.join(', ')}</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Objectifs d'Apprentissage</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {selectedLevel.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>

              {selectedLevel.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Prérequis</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLevel.prerequisites.map(prereq => (
                      <Badge key={prereq} variant="outline">{prereq}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}