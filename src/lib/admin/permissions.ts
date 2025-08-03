import type { UserRole, Permission, AdminUser } from '@/lib/types/admin';

// Admin email configuration
export const ADMIN_EMAILS = [
  'sevans@hotmail.fr'
];

// Role hierarchy and permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [],
  moderator: [
    'users.view',
    'content.moderate',
    'analytics.view',
    'logs.view'
  ],
  admin: [
    'users.view',
    'users.edit',
    'users.ban',
    'users.promote',
    'content.moderate',
    'content.delete',
    'analytics.view',
    'system.configure',
    'logs.view',
    'skills.manage',
    'achievements.manage'
  ],
  super_admin: [
    'users.view',
    'users.edit',
    'users.ban',
    'users.promote',
    'content.moderate',
    'content.delete',
    'analytics.view',
    'system.configure',
    'logs.view',
    'skills.manage',
    'achievements.manage'
  ]
};

// Role hierarchy for promotion/demotion rules
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  super_admin: 3
};

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

/**
 * Check if user can perform action on target user
 */
export function canManageUser(adminRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[adminRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Get user role from email (for initial admin setup)
 */
export function getUserRoleFromEmail(email: string): UserRole {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return 'super_admin';
  }
  return 'user';
}

/**
 * Get available actions for a role
 */
export function getAvailablePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user is admin or higher
 */
export function isAdmin(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

/**
 * Check if user is moderator or higher
 */
export function isModerator(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.moderator;
}

/**
 * Get next role in hierarchy (for promotion)
 */
export function getNextRole(currentRole: UserRole): UserRole | null {
  const currentLevel = ROLE_HIERARCHY[currentRole];
  const nextLevel = currentLevel + 1;
  
  const nextRole = Object.entries(ROLE_HIERARCHY).find(
    ([role, level]) => level === nextLevel
  );
  
  return nextRole ? (nextRole[0] as UserRole) : null;
}

/**
 * Get previous role in hierarchy (for demotion)
 */
export function getPreviousRole(currentRole: UserRole): UserRole | null {
  const currentLevel = ROLE_HIERARCHY[currentRole];
  const previousLevel = currentLevel - 1;
  
  const previousRole = Object.entries(ROLE_HIERARCHY).find(
    ([role, level]) => level === previousLevel
  );
  
  return previousRole ? (previousRole[0] as UserRole) : null;
}

/**
 * Validate role transition
 */
export function canPromoteToRole(
  adminRole: UserRole,
  currentTargetRole: UserRole,
  newTargetRole: UserRole
): boolean {
  // Admin must be higher than both current and target roles
  const adminLevel = ROLE_HIERARCHY[adminRole];
  const currentLevel = ROLE_HIERARCHY[currentTargetRole];
  const newLevel = ROLE_HIERARCHY[newTargetRole];
  
  return adminLevel > Math.max(currentLevel, newLevel);
}

/**
 * Get role display information
 */
export function getRoleInfo(role: UserRole): {
  name: string;
  color: string;
  description: string;
} {
  const roleInfo = {
    user: {
      name: 'User',
      color: 'bg-gray-100 text-gray-800',
      description: 'Standard user with basic access'
    },
    moderator: {
      name: 'Moderator',
      color: 'bg-blue-100 text-blue-800',
      description: 'Can moderate content and view analytics'
    },
    admin: {
      name: 'Administrator',
      color: 'bg-purple-100 text-purple-800',
      description: 'Full system access and user management'
    },
    super_admin: {
      name: 'Super Admin',
      color: 'bg-red-100 text-red-800',
      description: 'Complete system control and admin management'
    }
  };

  return roleInfo[role];
}