"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  ShieldCheck, 
  Users, 
  FileText,
  BarChart,
  Settings,
  FileTerminal,
  LogOut,
  LayoutDashboard,
  Search,
  Flag,
  HelpCircle,
  MessageSquare,
  Target,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const StatCard = ({ title, value, change }: { title: string, value: string | number, change?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && <p className="text-xs text-muted-foreground">{change}</p>}
      </CardContent>
    </Card>
);

const AdminPage = () => {
  const { firebaseUser, user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.profile.isAdmin || firebaseUser?.email === 'sevans@hotmail.fr';

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification de l'accès...</p>
        </div>
      </main>
    );
  }

  const moderationItems = [
    {
      content: "Signalement: Contenu inapproprié dans quiz Python",
      score: 15,
      keywords: 1,
      type: "Signalement",
      typeIcon: <Flag className="h-4 w-4 text-red-500" />,
      priority: "Élevée",
      priorityClass: "text-red-400",
      status: "En cours de révision",
      statusIcon: <Eye className="h-4 w-4 text-yellow-500" />,
      submitted: "Il y a 2h",
      user: "user-123",
      moderator: "mod-1"
    },
    {
      content: "Quiz React Hooks - useState et useEffect",
      type: "Quiz",
      typeIcon: <HelpCircle className="h-4 w-4 text-blue-500" />,
      priority: "Moyenne",
      priorityClass: "text-yellow-400",
      status: "En attente",
      statusIcon: <Clock className="h-4 w-4 text-gray-500" />,
      submitted: "Il y a 40 min",
      user: "ai-system",
      moderator: "Non assigné"
    },
    {
      content: 'Commentaire sur "Introduction à Node.js"',
      type: "Commentaire",
      typeIcon: <MessageSquare className="h-4 w-4 text-green-500" />,
      priority: "Basse",
      priorityClass: "text-green-400",
      status: "Approuvé",
      statusIcon: <CheckCircle className="h-4 w-4 text-green-500" />,
      submitted: "Il y a 55 min",
      user: "user-321",
      moderator: "mod-2"
    },
    {
      content: "Nouvelle compétence: Développement Mobile Flutter",
      type: "Compétence",
      typeIcon: <Target className="h-4 w-4 text-purple-500" />,
      priority: "Basse",
      priorityClass: "text-green-400",
      status: "Approuvé",
      statusIcon: <CheckCircle className="h-4 w-4 text-green-500" />,
      submitted: "Il y a 1j",
      user: "user-789",
      moderator: "admin-1"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary flex flex-col p-4 border-r border-border">
        <div className="flex items-center gap-2 mb-8">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-headline">SkillForge</h1>
        </div>
        <div className="flex items-center gap-3 mb-8">
            <Avatar>
                <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="admin avatar" />
                <AvatarFallback>SA</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">Super Admin</p>
                <p className="text-xs text-muted-foreground">Connecté</p>
            </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
            <Button variant="ghost" className="justify-start gap-2"><LayoutDashboard /> Dashboard</Button>
            <Button variant="ghost" className="justify-start gap-2"><Users /> Utilisateurs</Button>
            <Button variant="secondary" className="justify-start gap-2"><FileText /> Contenu</Button>
            <Button variant="ghost" className="justify-start gap-2"><BarChart /> Analytics</Button>
            <Button variant="ghost" className="justify-start gap-2"><Settings /> Système</Button>
            <Button variant="ghost" className="justify-start gap-2"><FileTerminal /> Logs</Button>
        </nav>

        <Button variant="ghost" className="justify-start gap-2 mt-4"><LogOut /> Déconnexion</Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-2">Modération du Contenu</h1>
        <p className="text-muted-foreground mb-6">Gérez et modérez le contenu soumis par les utilisateurs et l'IA.</p>
        
        <Tabs defaultValue="moderation">
            <TabsList>
                <TabsTrigger value="moderation">Modération du Contenu</TabsTrigger>
                <TabsTrigger value="reports">Signalements</TabsTrigger>
                <TabsTrigger value="skill-tests">Tests de Compétences</TabsTrigger>
            </TabsList>

            <TabsContent value="moderation" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
                    <StatCard title="En Attente" value={1} />
                    <StatCard title="Approuvés" value={2} />
                    <StatCard title="Rejetés" value={0} />
                    <StatCard title="Signalés" value={0} />
                    <StatCard title="Temps Moyen" value="135m" />
                    <StatCard title="Traités Aujourd'hui" value={1} />
                </div>
                
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex-1 relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher..." className="pl-10 w-full md:w-80" />
                            </div>
                            <div className="flex gap-2">
                                <Select defaultValue="all-status">
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Tous les statuts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all-status">Tous les statuts</SelectItem>
                                        <SelectItem value="pending">En attente</SelectItem>
                                        <SelectItem value="approved">Approuvé</SelectItem>
                                        <SelectItem value="rejected">Rejeté</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Select defaultValue="all-types">
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Tous les types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all-types">Tous les types</SelectItem>
                                        <SelectItem value="quiz">Quiz</SelectItem>
                                        <SelectItem value="comment">Commentaire</SelectItem>
                                        <SelectItem value="skill">Compétence</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Select defaultValue="all-priorities">
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Toutes priorités" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all-priorities">Toutes priorités</SelectItem>
                                        <SelectItem value="high">Élevée</SelectItem>
                                        <SelectItem value="medium">Moyenne</SelectItem>
                                        <SelectItem value="low">Basse</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Contenu</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Priorité</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Soumis</TableHead>
                                    <TableHead>Modérateur</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {moderationItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                          {item.content}
                                          {item.score && <Badge variant="secondary" className="ml-2">Score: {item.score}</Badge>}
                                          {item.keywords && <Badge variant="destructive" className="ml-2">🚩 {item.keywords} mots-clés</Badge>}
                                        </TableCell>
                                        <TableCell><div className="flex items-center gap-2">{item.typeIcon} {item.type}</div></TableCell>
                                        <TableCell><Badge variant="outline" className={item.priorityClass}>{item.priority === 'Élevée' && '🚨'} {item.priority}</Badge></TableCell>
                                        <TableCell><div className="flex items-center gap-2">{item.statusIcon} {item.status}</div></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{item.submitted}</span>
                                                <span className="text-xs text-muted-foreground">par {item.user}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.moderator}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>Approuver</DropdownMenuItem>
                                                    <DropdownMenuItem>Rejeter</DropdownMenuItem>
                                                    <DropdownMenuItem>Modifier</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
