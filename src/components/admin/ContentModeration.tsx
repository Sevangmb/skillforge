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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportManagement from './ReportManagement';
import SkillTestManagement from './SkillTestManagement';
import { 
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  BarChart3,
  Zap,
  Shield
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  getStatusInfo,
  getPriorityInfo,
  getContentTypeInfo,
  calculateModerationStats,
  filterModerationItems
} from '@/lib/admin/moderation';
import type { 
  ContentModerationItem, 
  ModerationStatus, 
  ModerationAction,
  ContentType,
  ModerationFilter
} from '@/lib/types/admin';

// Mock data - in real app, this would come from Firestore
const MOCK_MODERATION_ITEMS: ContentModerationItem[] = [
  {
    id: '1',
    type: 'quiz',
    title: 'Quiz React Hooks - useState et useEffect',
    content: {
      question: 'Quelle est la différence principale entre useState et useEffect?',
      options: ['useState gère l\'état, useEffect gère les effets de bord', 'Aucune différence', 'useState est obsolète', 'useEffect est plus rapide'],
      correctAnswer: 0,
      explanation: 'useState est utilisé pour gérer l\'état local du composant, tandis que useEffect permet de gérer les effets de bord comme les appels API.'
    },
    metadata: {
      category: 'Frontend Development',
      difficulty: 'intermediate',
      language: 'fr',
      aiGenerated: true
    },
    submittedBy: 'ai-system',
    submittedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    priority: 'medium',
    status: 'pending',
    moderationHistory: [],
    autoModerationScore: 2,
    tags: ['react', 'hooks', 'frontend']
  },
  {
    id: '2',
    type: 'user_report',
    title: 'Signalement: Contenu inapproprié dans quiz Python',
    content: {
      reportedContent: 'Ce quiz contient des informations incorrectes sur Python',
      reportType: 'incorrect_information',
      details: 'La réponse correcte est fausse selon la documentation officielle Python'
    },
    submittedBy: 'user-123',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    reportedBy: 'user-456',
    reportReason: 'Informations incorrectes',
    priority: 'high',
    status: 'under_review',
    moderatedBy: 'mod-1',
    moderationHistory: [
      {
        id: 'hist-1',
        action: 'flag',
        moderatorId: 'mod-1',
        moderatorName: 'Alice Modérateur',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        reason: 'Vérification en cours',
        previousStatus: 'pending',
        newStatus: 'under_review',
        notes: 'Vérification avec l\'équipe technique'
      }
    ],
    autoModerationScore: 15,
    flaggedKeywords: ['inapproprié'],
    tags: ['python', 'signalement', 'incorrect']
  },
  {
    id: '3',
    type: 'skill',
    title: 'Nouvelle compétence: Développement Mobile Flutter',
    content: {
      name: 'Flutter Development Basics',
      description: 'Apprendre les bases du développement mobile avec Flutter et Dart',
      objectives: ['Comprendre l\'architecture Flutter', 'Créer des widgets personnalisés', 'Gérer l\'état avec Provider'],
      prerequisites: ['Dart basics', 'OOP concepts']
    },
    metadata: {
      category: 'Mobile Development',
      difficulty: 'beginner',
      language: 'fr',
      aiGenerated: false
    },
    submittedBy: 'user-789',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    priority: 'low',
    status: 'approved',
    moderatedBy: 'admin-1',
    moderatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20), // 20 hours ago
    moderationNotes: 'Excellent contenu, bien structuré',
    moderationHistory: [
      {
        id: 'hist-2',
        action: 'approve',
        moderatorId: 'admin-1',
        moderatorName: 'Bob Administrateur',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20),
        reason: 'Contenu de qualité',
        previousStatus: 'pending',
        newStatus: 'approved',
        notes: 'Contenu bien rédigé et pertinent'
      }
    ],
    autoModerationScore: 0,
    tags: ['flutter', 'mobile', 'dart']
  },
  {
    id: '4',
    type: 'comment',
    title: 'Commentaire sur "Introduction à Node.js"',
    content: {
      text: 'Ce cours est vraiment excellent! Merci pour les explications claires.',
      rating: 5,
      skillId: 'nodejs-intro'
    },
    submittedBy: 'user-321',
    submittedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    priority: 'low',
    status: 'approved',
    moderatedBy: 'mod-2',
    moderatedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    moderationHistory: [
      {
        id: 'hist-3',
        action: 'approve',
        moderatorId: 'mod-2',
        moderatorName: 'Charlie Modérateur',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        reason: 'Commentaire positif',
        previousStatus: 'pending',
        newStatus: 'approved'
      }
    ],
    autoModerationScore: 0,
    tags: ['nodejs', 'feedback', 'positif']
  }
];

export default function ContentModeration() {
  const { hasPermission, role } = useAdminAuth();
  const [items, setItems] = useState<ContentModerationItem[]>(MOCK_MODERATION_ITEMS);
  const [selectedItem, setSelectedItem] = useState<ContentModerationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'low' | 'medium' | 'high' | 'urgent' | 'all'>('all');
  const [moderationNotes, setModerationNotes] = useState('');
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    item: ContentModerationItem;
    action: ModerationAction;
  } | null>(null);

  // Calculate statistics
  const stats = useMemo(() => calculateModerationStats(items), [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }

    return filtered.sort((a, b) => {
      // Sort by priority first, then by submission date
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }, [items, searchTerm, statusFilter, typeFilter, priorityFilter]);

  const handleModerationAction = async (item: ContentModerationItem, action: ModerationAction) => {
    if (!hasPermission('content.moderate')) {
      return;
    }

    setPendingAction({ item, action });
    setIsActionDialogOpen(true);
  };

  const confirmModerationAction = async () => {
    if (!pendingAction) return;

    const { item, action } = pendingAction;
    const now = new Date();

    // Determine new status based on action
    let newStatus: ModerationStatus = item.status;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'flag':
        newStatus = 'flagged';
        break;
      case 'escalate':
        newStatus = 'under_review';
        break;
    }

    // Create history entry
    const historyEntry = {
      id: `hist-${Date.now()}`,
      action,
      moderatorId: 'current-user-id', // In real app, get from auth
      moderatorName: 'Current User', // In real app, get from auth
      timestamp: now,
      reason: moderationNotes || undefined,
      previousStatus: item.status,
      newStatus,
      notes: moderationNotes || undefined
    };

    // Update item
    const updatedItem: ContentModerationItem = {
      ...item,
      status: newStatus,
      moderatedBy: 'current-user-id',
      moderatedAt: now,
      moderationNotes: moderationNotes || item.moderationNotes,
      moderationHistory: [...item.moderationHistory, historyEntry]
    };

    // Update items state
    setItems(prevItems =>
      prevItems.map(i => i.id === item.id ? updatedItem : i)
    );

    // Reset dialog state
    setIsActionDialogOpen(false);
    setPendingAction(null);
    setModerationNotes('');
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return `Il y a ${diffDays}j`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Modération du Contenu</h2>
          <p className="text-muted-foreground">
            Gérez et modérez le contenu soumis par les utilisateurs et l'IA
          </p>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Modération du Contenu</TabsTrigger>
          <TabsTrigger value="reports">Signalements</TabsTrigger>
          <TabsTrigger value="skills">Tests de Compétences</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signalés</CardTitle>
            <Flag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.flagged}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.avgProcessingTime.toFixed(0)}m
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traités Aujourd'hui</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.todayProcessed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
                <SelectItem value="flagged">Signalés</SelectItem>
                <SelectItem value="under_review">En révision</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="skill">Compétences</SelectItem>
                <SelectItem value="user_report">Signalements</SelectItem>
                <SelectItem value="comment">Commentaires</SelectItem>
                <SelectItem value="achievement">Achievements</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu à Modérer</CardTitle>
          <CardDescription>
            {filteredItems.length} élément(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contenu</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Soumis</TableHead>
                <TableHead>Modérateur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                const priorityInfo = getPriorityInfo(item.priority);
                const typeInfo = getContentTypeInfo(item.type);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="flex items-center space-x-2">
                          {item.autoModerationScore && item.autoModerationScore > 10 && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Score: {item.autoModerationScore}
                            </Badge>
                          )}
                          {item.flaggedKeywords && item.flaggedKeywords.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              🚩 {item.flaggedKeywords.length} mots-clés
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityInfo.color}>
                        {priorityInfo.icon} {priorityInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        {statusInfo.icon} {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{getTimeSince(item.submittedAt)}</div>
                      <div className="text-xs">par {item.submittedBy}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.moderatedBy ? (
                        <div className="text-green-600">
                          <User className="h-3 w-3 inline mr-1" />
                          {item.moderatedBy}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>

                          {hasPermission('content.moderate') && item.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleModerationAction(item, 'approve')}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleModerationAction(item, 'reject')}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejeter
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleModerationAction(item, 'flag')}
                                className="text-orange-600"
                              >
                                <Flag className="mr-2 h-4 w-4" />
                                Signaler
                              </DropdownMenuItem>
                            </>
                          )}

                          {hasPermission('content.delete') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleModerationAction(item, 'delete')}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'action de modération</DialogTitle>
            <DialogDescription>
              {pendingAction && (
                <>
                  Vous êtes sur le point de <strong>{pendingAction.action}</strong> le contenu "{pendingAction.item.title}".
                  Cette action sera enregistrée dans l'historique de modération.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes de modération (optionnel)</label>
              <Textarea
                placeholder="Ajoutez des notes sur votre décision..."
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmModerationAction}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{getContentTypeInfo(selectedItem.type).icon}</span>
                <span>{selectedItem.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informations Générales</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {getContentTypeInfo(selectedItem.type).label}</div>
                    <div><strong>Statut:</strong> 
                      <Badge className={`ml-2 ${getStatusInfo(selectedItem.status).color}`}>
                        {getStatusInfo(selectedItem.status).label}
                      </Badge>
                    </div>
                    <div><strong>Priorité:</strong>
                      <Badge className={`ml-2 ${getPriorityInfo(selectedItem.priority).color}`}>
                        {getPriorityInfo(selectedItem.priority).label}
                      </Badge>
                    </div>
                    <div><strong>Soumis par:</strong> {selectedItem.submittedBy}</div>
                    <div><strong>Date:</strong> {selectedItem.submittedAt.toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Métadonnées</h4>
                  <div className="space-y-2 text-sm">
                    {selectedItem.metadata?.category && (
                      <div><strong>Catégorie:</strong> {selectedItem.metadata.category}</div>
                    )}
                    {selectedItem.metadata?.difficulty && (
                      <div><strong>Difficulté:</strong> {selectedItem.metadata.difficulty}</div>
                    )}
                    {selectedItem.metadata?.aiGenerated !== undefined && (
                      <div><strong>Généré par IA:</strong> {selectedItem.metadata.aiGenerated ? 'Oui' : 'Non'}</div>
                    )}
                    {selectedItem.autoModerationScore !== undefined && (
                      <div><strong>Score Auto:</strong> {selectedItem.autoModerationScore}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h4 className="font-medium mb-2">Contenu</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(selectedItem.content, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Tags & Keywords */}
              {(selectedItem.tags || selectedItem.flaggedKeywords) && (
                <div>
                  <h4 className="font-medium mb-2">Tags et Mots-clés</h4>
                  <div className="space-y-2">
                    {selectedItem.tags && (
                      <div>
                        <span className="text-sm font-medium">Tags: </span>
                        {selectedItem.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="ml-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {selectedItem.flaggedKeywords && selectedItem.flaggedKeywords.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Mots-clés signalés: </span>
                        {selectedItem.flaggedKeywords.map(keyword => (
                          <Badge key={keyword} variant="destructive" className="ml-1">
                            🚩 {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Moderation History */}
              {selectedItem.moderationHistory.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Historique de Modération</h4>
                  <div className="space-y-3">
                    {selectedItem.moderationHistory.map(entry => (
                      <div key={entry.id} className="border-l-2 border-muted pl-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            {entry.moderatorName} - {entry.action}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.previousStatus} → {entry.newStatus}
                        </div>
                        {entry.notes && (
                          <div className="text-sm mt-1 bg-muted p-2 rounded">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
        </TabsContent>

        <TabsContent value="reports">
          <ReportManagement />
        </TabsContent>

        <TabsContent value="skills">
          <SkillTestManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}