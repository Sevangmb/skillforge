"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Shield, 
  Crown,
  Eye,
  Edit,
  Ban,
  UserPlus
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getRoleInfo, canManageUser } from '@/lib/admin/permissions';
import type { User } from '@/lib/types';
import type { UserRole } from '@/lib/types/admin';

// Mock data - in real app, this would come from Firestore
const MOCK_USERS: Array<User & { role: UserRole; lastLogin: Date; status: 'active' | 'banned' }> = [
  {
    id: '1',
    profile: {
      displayName: 'Sébastien Evans',
      email: 'sevans@hotmail.fr',
      totalPoints: 2500,
      level: 5
    },
    competences: {},
    preferences: {
      learningStyle: 'visual',
      favoriteTopics: ['frontend', 'javascript'],
      adaptiveMode: 'auto',
      language: 'fr'
    },
    role: 'super_admin',
    lastLogin: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'active'
  },
  {
    id: '2',
    profile: {
      displayName: 'Alice Dupont',
      email: 'alice.dupont@email.com',
      totalPoints: 1800,
      level: 4
    },
    competences: {},
    preferences: {
      learningStyle: 'hands-on',
      favoriteTopics: ['backend', 'databases'],
      adaptiveMode: 'guided',
      language: 'fr'
    },
    role: 'moderator',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'active'
  },
  {
    id: '3',
    profile: {
      displayName: 'Bob Martin',
      email: 'bob.martin@email.com',
      totalPoints: 950,
      level: 2
    },
    competences: {},
    preferences: {
      learningStyle: 'reading',
      favoriteTopics: ['design', 'ux'],
      adaptiveMode: 'auto',
      language: 'en'
    },
    role: 'user',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: 'active'
  },
  {
    id: '4',
    profile: {
      displayName: 'Charlie Brown',
      email: 'charlie.brown@email.com',
      totalPoints: 0,
      level: 1
    },
    competences: {},
    preferences: {
      learningStyle: 'visual',
      favoriteTopics: [],
      adaptiveMode: 'auto',
      language: 'en'
    },
    role: 'user',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    status: 'banned'
  }
];

export default function UserManagement() {
  const { role: adminRole, hasPermission } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState(MOCK_USERS);

  const filteredUsers = users.filter(user => 
    user.profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = (userId: string, action: string) => {
    console.log(`Action: ${action} on user ${userId}`);
    // In real app, implement actual user management actions
  };

  const getStatusBadge = (status: 'active' | 'banned') => {
    if (status === 'banned') {
      return <Badge variant="destructive">Banni</Badge>;
    }
    return <Badge variant="secondary">Actif</Badge>;
  };

  const getRoleBadge = (role: UserRole) => {
    const roleInfo = getRoleInfo(role);
    return (
      <Badge className={roleInfo.color}>
        {roleInfo.name}
      </Badge>
    );
  };

  const getLastLoginText = (lastLogin: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
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
      {/* Header and Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestion des Utilisateurs</h2>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, leurs rôles et leurs permissions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.status === 'active').length} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modérateurs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'moderator').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Bannis</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.status === 'banned').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Dernière Connexion</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.profile.displayName}</div>
                      <div className="text-sm text-muted-foreground">{user.profile.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Niveau {user.profile.level}</Badge>
                  </TableCell>
                  <TableCell>{user.profile.totalPoints.toLocaleString()} XP</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getLastLoginText(user.lastLogin)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.status)}
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
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'view')}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir le profil
                        </DropdownMenuItem>
                        
                        {hasPermission('users.edit') && (
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, 'edit')}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {hasPermission('users.promote') && canManageUser(adminRole, user.role) && (
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, 'promote')}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Promouvoir
                          </DropdownMenuItem>
                        )}
                        
                        {hasPermission('users.ban') && canManageUser(adminRole, user.role) && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, user.status === 'banned' ? 'unban' : 'ban')}
                            className={user.status === 'banned' ? 'text-green-600' : 'text-red-600'}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            {user.status === 'banned' ? 'Débannir' : 'Bannir'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}