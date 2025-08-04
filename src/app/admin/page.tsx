import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, Users, FileText, BarChart2, Server, Shield, Home, Settings, LogOut, ChevronRight, GripVertical, MoreHorizontal, Flag, MessageSquare, Target, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

const AdminPage = () => {
    const moderationItems = [
    {
      content: "Signalement: Contenu inapproprié dans quiz Python",
      score: 15,
      keywords: 1,
      type: "Signalement",
      typeIcon: <Flag className="h-4 w-4 text-red-500" />,
      priority: "Élevée",
      priorityBadge: "destructive",
      status: "En cours de révision",
      statusIcon: <ChevronRight className="h-4 w-4" />,
      submitted: "Il y a 2h",
      user: "user-123",
      moderator: "mod-1"
    },
    {
      content: "Quiz React Hooks - useState et useEffect",
      type: "Quiz",
      typeIcon: <MessageSquare className="h-4 w-4 text-blue-500" />,
      priority: "Moyenne",
      priorityBadge: "secondary",
      status: "En attente",
      statusIcon: <ChevronRight className="h-4 w-4" />,
      submitted: "Il y a 40 min",
      user: "ai-system",
      moderator: "Non assigné"
    },
    {
      content: 'Commentaire sur "Introduction à Node.js"',
      type: "Commentaire",
      typeIcon: <MessageSquare className="h-4 w-4 text-gray-500" />,
      priority: "Basse",
      priorityBadge: "outline",
      status: "Approuvé",
      statusIcon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      submitted: "Il y a 55 min",
      user: "user-321",
      moderator: "mod-2"
    },
    {
      content: "Nouvelle compétence: Développement Mobile Flutter",
      type: "Compétence",
      typeIcon: <Target className="h-4 w-4 text-purple-500" />,
      priority: "Basse",
      priorityBadge: "outline",
      status: "Approuvé",
      statusIcon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      submitted: "Il y a 1j",
      user: "user-789",
      moderator: "admin-1"
    },
  ];


  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="#" className="flex items-center gap-2 font-semibold">
              <Shield className="h-6 w-6" />
              <span>Administration SkillForge</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <Link href="#" className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                <Users className="h-4 w-4" />
                Utilisateurs
              </Link>
              <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                <FileText className="h-4 w-4" />
                Contenu
              </Link>
              <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                <BarChart2 className="h-4 w-4" />
                Analytics
              </Link>
               <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                <Server className="h-4 w-4" />
                Système
              </Link>
               <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                <Shield className="h-4 w-4" />
                Logs
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-4">
                 <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png" />
                    <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">Super Admin</p>
                    <p className="text-xs text-gray-500">Connecté</p>
                </div>
                <Button variant="outline" size="icon" className="ml-auto">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
           <Link href="#" className="lg:hidden">
              <Shield className="h-6 w-6" />
              <span className="sr-only">Home</span>
            </Link>
            <div className="w-full flex-1">
                <h1 className="text-lg font-semibold">Modération du contenu</h1>
            </div>
            <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
            </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">Traités Aujourd'hui: 1</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Temps Moyen: 135m</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Signalés</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Contenu à Modérer</CardTitle>
              <CardDescription>
                {moderationItems.length} élément(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Rechercher..." className="w-auto md:w-64" />
                    <Select>
                      <SelectTrigger className="w-auto md:w-[180px]">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in-review">En cours de révision</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                     <Select>
                      <SelectTrigger className="w-auto md:w-[180px]">
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="comment">Commentaire</SelectItem>
                        <SelectItem value="skill">Compétence</SelectItem>
                        <SelectItem value="report">Signalement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <TabsContent value="all">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Contenu</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Soumis</TableHead>
                            <TableHead>Modérateur</TableHead>
                            <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {moderationItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="font-medium">{item.content}</div>
                                    {item.score && <div className="text-sm text-muted-foreground">Score: {item.score}</div>}
                                    {item.keywords && <div className="text-sm text-muted-foreground">🚩 {item.keywords} mots-clés</div>}
                                </TableCell>
                                <TableCell><Badge variant="outline">{item.typeIcon} {item.type}</Badge></TableCell>
                                <TableCell><Badge variant={item.priorityBadge as any}>{item.priority}</Badge></TableCell>
                                <TableCell className="flex items-center gap-2">{item.statusIcon} {item.status}</TableCell>
                                <TableCell>{item.submitted}<div className="text-sm text-muted-foreground">par {item.user}</div></TableCell>
                                <TableCell>{item.moderator}</TableCell>
                                <TableCell>
                                <Button variant="outline" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
