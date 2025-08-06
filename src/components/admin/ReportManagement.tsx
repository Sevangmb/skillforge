"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface UserReport {
  id: string;
  reportedContentId: string;
  reportedContentType: 'quiz' | 'skill' | 'comment' | 'user';
  reportedContentTitle: string;
  reportType: 'inappropriate' | 'spam' | 'incorrect_info' | 'copyright' | 'harassment' | 'other';
  reportReason: string;
  reporterUserId: string;
  reporterEmail: string;
  reportedUserId?: string;
  reportedUserEmail?: string;
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  resolution?: string;
}

// Mock data for demonstration
const MOCK_REPORTS: UserReport[] = [
  {
    id: 'report-1',
    reportedContentId: 'quiz-123',
    reportedContentType: 'quiz',
    reportedContentTitle: 'Quiz Python - Variables et Types',
    reportType: 'incorrect_info',
    reportReason: 'Informations incorrectes sur les types Python',
    reporterUserId: 'user-456',
    reporterEmail: 'reporter@example.com',
    reportedUserId: 'user-789',
    reportedUserEmail: 'content-creator@example.com',
    description: 'La réponse sur les types de données Python est incorrecte selon la documentation officielle. Le quiz indique que les tuples sont mutables, ce qui est faux.',
    status: 'under_review',
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
    reviewedBy: 'mod-1'
  },
  {
    id: 'report-2',
    reportedContentId: 'comment-456',
    reportedContentType: 'comment',
    reportedContentTitle: 'Commentaire sur "Introduction à React"',
    reportType: 'harassment',
    reportReason: 'Commentaire offensant envers d\'autres utilisateurs',
    reporterUserId: 'user-123',
    reporterEmail: 'victim@example.com',
    description: 'L\'utilisateur a posté un commentaire très offensant qui attaque personnellement d\'autres apprenants. Ce comportement est inacceptable.',
    status: 'pending',
    priority: 'urgent',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: 'report-3',
    reportedContentId: 'skill-789',
    reportedContentType: 'skill',
    reportedContentTitle: 'Compétence: Machine Learning Avancé',
    reportType: 'copyright',
    reportReason: 'Contenu copié sans autorisation',
    reporterUserId: 'user-321',
    reporterEmail: 'copyright-owner@example.com',
    description: 'Cette compétence utilise des contenus protégés par droits d\'auteur provenant de mon cours en ligne sans permission.',
    status: 'resolved',
    priority: 'medium',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 20), // 20h ago
    reviewedBy: 'admin-1',
    reviewNotes: 'Contenu retiré et utilisateur contacté',
    resolution: 'Content removed and user warned'
  }
];

export default function ReportManagement() {
  const [reports, setReports] = useState<UserReport[]>(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserReport['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<UserReport['reportType'] | 'all'>('all');

  const getStatusInfo = (status: UserReport['status']) => {
    const statusMap = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      under_review: { label: 'En révision', color: 'bg-blue-100 text-blue-800', icon: '👁️' },
      resolved: { label: 'Résolu', color: 'bg-green-100 text-green-800', icon: '✅' },
      dismissed: { label: 'Rejeté', color: 'bg-gray-100 text-gray-800', icon: '❌' }
    };
    return statusMap[status];
  };

  const getPriorityInfo = (priority: UserReport['priority']) => {
    const priorityMap = {
      low: { label: 'Basse', color: 'bg-gray-100 text-gray-800', icon: '📝' },
      medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-800', icon: '📋' },
      high: { label: 'Élevée', color: 'bg-orange-100 text-orange-800', icon: '⚠️' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800', icon: '🚨' }
    };
    return priorityMap[priority];
  };

  const getReportTypeInfo = (type: UserReport['reportType']) => {
    const typeMap = {
      inappropriate: { label: 'Contenu inapproprié', icon: '🚫' },
      spam: { label: 'Spam', icon: '📧' },
      incorrect_info: { label: 'Informations incorrectes', icon: '❌' },
      copyright: { label: 'Violation de droits d\'auteur', icon: '©️' },
      harassment: { label: 'Harcèlement', icon: '⚠️' },
      other: { label: 'Autre', icon: '📝' }
    };
    return typeMap[type];
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.reportedContentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporterEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.reportType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    // Sort by priority first, then by date
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    underReview: reports.filter(r => r.status === 'under_review').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    urgent: reports.filter(r => r.priority === 'urgent').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestion des Signalements</h2>
          <p className="text-muted-foreground">
            Gérez les signalements soumis par les utilisateurs
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Flag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Révision</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgents</CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un signalement..."
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
                <SelectItem value="under_review">En révision</SelectItem>
                <SelectItem value="resolved">Résolus</SelectItem>
                <SelectItem value="dismissed">Rejetés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Type de signalement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="inappropriate">Contenu inapproprié</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="incorrect_info">Informations incorrectes</SelectItem>
                <SelectItem value="copyright">Violation de droits</SelectItem>
                <SelectItem value="harassment">Harcèlement</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Signalements</CardTitle>
          <CardDescription>
            {filteredReports.length} signalement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contenu Signalé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Rapporteur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => {
                const statusInfo = getStatusInfo(report.status);
                const priorityInfo = getPriorityInfo(report.priority);
                const typeInfo = getReportTypeInfo(report.reportType);

                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{report.reportedContentTitle}</div>
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.icon} {typeInfo.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.reportedContentType}
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
                    <TableCell className="text-sm">
                      <div>
                        <User className="h-3 w-3 inline mr-1" />
                        {report.reporterEmail}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getTimeSince(report.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Détails du Signalement</DialogTitle>
                            <DialogDescription>
                              Signalement #{report.id}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedReport && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Contenu Signalé</h4>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Titre:</strong> {selectedReport.reportedContentTitle}</div>
                                    <div><strong>Type:</strong> {selectedReport.reportedContentType}</div>
                                    <div><strong>ID:</strong> {selectedReport.reportedContentId}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Signalement</h4>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Type:</strong> {getReportTypeInfo(selectedReport.reportType).label}</div>
                                    <div><strong>Priorité:</strong> 
                                      <Badge className={`ml-1 ${getPriorityInfo(selectedReport.priority).color}`}>
                                        {getPriorityInfo(selectedReport.priority).label}
                                      </Badge>
                                    </div>
                                    <div><strong>Statut:</strong>
                                      <Badge className={`ml-1 ${getStatusInfo(selectedReport.status).color}`}>
                                        {getStatusInfo(selectedReport.status).label}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Description du Problème</h4>
                                <div className="bg-muted p-3 rounded text-sm">
                                  <div className="mb-2"><strong>Raison:</strong> {selectedReport.reportReason}</div>
                                  <div><strong>Description:</strong> {selectedReport.description}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Rapporteur</h4>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Email:</strong> {selectedReport.reporterEmail}</div>
                                    <div><strong>ID:</strong> {selectedReport.reporterUserId}</div>
                                  </div>
                                </div>
                                {selectedReport.reportedUserEmail && (
                                  <div>
                                    <h4 className="font-medium mb-2">Utilisateur Signalé</h4>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Email:</strong> {selectedReport.reportedUserEmail}</div>
                                      <div><strong>ID:</strong> {selectedReport.reportedUserId}</div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Informations de Révision</h4>
                                <div className="space-y-1 text-sm">
                                  <div><strong>Créé le:</strong> {selectedReport.createdAt.toLocaleString()}</div>
                                  {selectedReport.reviewedAt && (
                                    <div><strong>Révisé le:</strong> {selectedReport.reviewedAt.toLocaleString()}</div>
                                  )}
                                  {selectedReport.reviewedBy && (
                                    <div><strong>Révisé par:</strong> {selectedReport.reviewedBy}</div>
                                  )}
                                  {selectedReport.reviewNotes && (
                                    <div className="mt-2">
                                      <strong>Notes de révision:</strong>
                                      <div className="bg-muted p-2 rounded mt-1">{selectedReport.reviewNotes}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}