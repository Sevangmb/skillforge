// Admin and moderation types
export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
};

export type Permission = 
  | 'users.view'
  | 'users.edit' 
  | 'users.ban'
  | 'users.promote'
  | 'content.moderate'
  | 'content.delete'
  | 'analytics.view'
  | 'system.configure'
  | 'logs.view'
  | 'skills.manage'
  | 'achievements.manage';

export type UserManagementAction = {
  id: string;
  adminId: string;
  targetUserId: string;
  action: 'ban' | 'unban' | 'promote' | 'demote' | 'edit' | 'delete';
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

export type SystemMetrics = {
  totalUsers: number;
  activeUsers: number;
  totalSkills: number;
  completedQuizzes: number;
  averageSessionTime: number;
  signupsToday: number;
  signupsThisWeek: number;
  signupsThisMonth: number;
  topSkillCategories: Array<{
    category: string;
    completions: number;
    percentage: number;
  }>;
};

export type ContentType = 'quiz' | 'skill' | 'user_report' | 'comment' | 'achievement' | 'user_content';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'under_review';

export type ModerationAction = 'approve' | 'reject' | 'flag' | 'edit' | 'delete' | 'escalate';

export type ContentModerationItem = {
  id: string;
  type: ContentType;
  title: string;
  content: any;
  metadata?: {
    category?: string;
    difficulty?: string;
    language?: string;
    aiGenerated?: boolean;
    sourceUrl?: string;
  };
  submittedBy: string;
  submittedAt: Date;
  reportedBy?: string;
  reportReason?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: ModerationStatus;
  moderatedBy?: string;
  moderatedAt?: Date;
  moderationNotes?: string;
  moderationHistory: ModerationHistoryEntry[];
  flaggedKeywords?: string[];
  autoModerationScore?: number;
  tags?: string[];
};

export type ModerationHistoryEntry = {
  id: string;
  action: ModerationAction;
  moderatorId: string;
  moderatorName: string;
  timestamp: Date;
  reason?: string;
  previousStatus: ModerationStatus;
  newStatus: ModerationStatus;
  notes?: string;
};

export type ModerationStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  underReview: number;
  avgProcessingTime: number; // in minutes
  todayProcessed: number;
  weekProcessed: number;
  monthProcessed: number;
  byCategory: Record<string, number>;
  byModerator: Record<string, number>;
};

export type ModerationFilter = {
  status?: ModerationStatus[];
  type?: ContentType[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  moderator?: string;
  category?: string;
  aiGenerated?: boolean;
  flaggedOnly?: boolean;
};

export type AuditLog = {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
};