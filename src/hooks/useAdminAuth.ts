import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoleFromEmail, hasPermission, isAdmin, isModerator } from '@/lib/admin/permissions';
import type { UserRole, Permission } from '@/lib/types/admin';

interface AdminAuthState {
  role: UserRole;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  canAccessAdmin: boolean;
}

export function useAdminAuth(): AdminAuthState {
  const { user, firebaseUser, loading } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }

    if (!user || !firebaseUser) {
      setRole('user');
      setIsLoading(false);
      return;
    }

    // Get role based on email and potentially stored role in user profile
    const emailBasedRole = getUserRoleFromEmail(firebaseUser.email || '');
    
    // In a real app, you'd also check the user's stored role in Firestore
    // For now, we'll use email-based role as the primary source
    setRole(emailBasedRole);
    setIsLoading(false);
  }, [user, firebaseUser, loading]);

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(role, permission);
  };

  const canAccessAdmin = isAdmin(role) || isModerator(role);

  return {
    role,
    isAdmin: isAdmin(role),
    isModerator: isModerator(role),
    isLoading,
    hasPermission: checkPermission,
    canAccessAdmin
  };
}