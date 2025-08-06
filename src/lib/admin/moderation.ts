import type { 
  ContentModerationItem, 
  ModerationStatus, 
  ModerationAction,
  ModerationStats,
  ContentType,
  ModerationFilter
} from '@/lib/types/admin';

// Auto-moderation keywords for content filtering
export const FLAGGED_KEYWORDS = [
  // Offensive language
  'hate', 'spam', 'scam', 'fake', 'virus', 'phishing',
  // Inappropriate content
  'inappropriate', 'violence', 'harassment', 'abuse',
  // Commercial spam
  'buy now', 'click here', 'make money', 'free money',
  // Other flags
  'illegal', 'copyright', 'stolen', 'plagiarism'
];

/**
 * Calculate auto-moderation score based on content analysis
 */
export function calculateAutoModerationScore(content: any): {
  score: number;
  flaggedKeywords: string[];
  risk: 'low' | 'medium' | 'high';
} {
  const contentText = JSON.stringify(content).toLowerCase();
  const flaggedKeywords: string[] = [];
  let score = 0;

  // Check for flagged keywords
  FLAGGED_KEYWORDS.forEach(keyword => {
    if (contentText.includes(keyword.toLowerCase())) {
      flaggedKeywords.push(keyword);
      score += 10;
    }
  });

  // Check content length (very short or very long content might be suspicious)
  if (contentText.length < 10) {
    score += 5; // Too short
  } else if (contentText.length > 5000) {
    score += 3; // Very long
  }

  // Check for excessive capitalization
  const capsRatio = (contentText.match(/[A-Z]/g) || []).length / contentText.length;
  if (capsRatio > 0.3) {
    score += 8; // Excessive caps
  }

  // Check for repeated characters
  if (/(.)\1{3,}/.test(contentText)) {
    score += 5; // Repeated characters
  }

  // Check for URLs (might be spam)
  if (/https?:\/\//.test(contentText)) {
    score += 3;
  }

  // Determine risk level
  let risk: 'low' | 'medium' | 'high' = 'low';
  if (score >= 20) risk = 'high';
  else if (score >= 10) risk = 'medium';

  return { score, flaggedKeywords, risk };
}

/**
 * Get status badge information
 */
export function getStatusInfo(status: ModerationStatus): {
  label: string;
  color: string;
  icon: string;
} {
  const statusMap = {
    pending: {
      label: 'En attente',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⏳'
    },
    approved: {
      label: 'Approuvé',
      color: 'bg-green-100 text-green-800',
      icon: '✅'
    },
    rejected: {
      label: 'Rejeté',
      color: 'bg-red-100 text-red-800',
      icon: '❌'
    },
    flagged: {
      label: 'Signalé',
      color: 'bg-orange-100 text-orange-800',
      icon: '🚩'
    },
    under_review: {
      label: 'En cours de révision',
      color: 'bg-blue-100 text-blue-800',
      icon: '👁️'
    }
  };

  return statusMap[status];
}

/**
 * Get priority badge information
 */
export function getPriorityInfo(priority: 'low' | 'medium' | 'high' | 'urgent'): {
  label: string;
  color: string;
  icon: string;
} {
  const priorityMap = {
    low: {
      label: 'Basse',
      color: 'bg-gray-100 text-gray-800',
      icon: '📝'
    },
    medium: {
      label: 'Moyenne',
      color: 'bg-blue-100 text-blue-800',
      icon: '📋'
    },
    high: {
      label: 'Élevée',
      color: 'bg-orange-100 text-orange-800',
      icon: '⚠️'
    },
    urgent: {
      label: 'Urgente',
      color: 'bg-red-100 text-red-800',
      icon: '🚨'
    }
  };

  return priorityMap[priority];
}

/**
 * Get content type display information
 */
export function getContentTypeInfo(type: ContentType): {
  label: string;
  icon: string;
  description: string;
} {
  const typeMap = {
    quiz: {
      label: 'Quiz',
      icon: '❓',
      description: 'Question de quiz générée par IA'
    },
    skill: {
      label: 'Compétence',
      icon: '🎯',
      description: 'Compétence personnalisée soumise par un utilisateur'
    },
    user_report: {
      label: 'Signalement',
      icon: '🚨',
      description: 'Signalement de contenu inapproprié'
    },
    comment: {
      label: 'Commentaire',
      icon: '💬',
      description: 'Commentaire ou feedback utilisateur'
    },
    achievement: {
      label: 'Achievement',
      icon: '🏆',
      description: 'Badge ou achievement personnalisé'
    },
    user_content: {
      label: 'Contenu utilisateur',
      icon: '📝',
      description: 'Contenu généré par un utilisateur'
    }
  };

  return typeMap[type];
}

/**
 * Determine automatic priority based on content analysis
 */
export function calculatePriority(
  autoModerationScore: number,
  type: ContentType,
  hasReport: boolean
): 'low' | 'medium' | 'high' | 'urgent' {
  // Base priority on content type
  let basePriority = 0;
  
  switch (type) {
    case 'user_report':
      basePriority = 3; // Reports are always high priority
      break;
    case 'quiz':
    case 'skill':
      basePriority = 1; // Educational content is medium priority
      break;
    case 'comment':
    case 'user_content':
      basePriority = 0; // User content is low priority
      break;
    case 'achievement':
      basePriority = 0; // Achievements are low priority
      break;
  }

  // Adjust based on auto-moderation score
  if (autoModerationScore >= 20) basePriority += 3;
  else if (autoModerationScore >= 10) basePriority += 2;
  else if (autoModerationScore >= 5) basePriority += 1;

  // Boost if manually reported
  if (hasReport) basePriority += 2;

  // Map to priority levels
  if (basePriority >= 5) return 'urgent';
  if (basePriority >= 3) return 'high';
  if (basePriority >= 1) return 'medium';
  return 'low';
}

/**
 * Filter moderation items based on criteria
 */
export function filterModerationItems(
  items: ContentModerationItem[],
  filter: ModerationFilter
): ContentModerationItem[] {
  return items.filter(item => {
    // Status filter
    if (filter.status && filter.status.length > 0) {
      if (!filter.status.includes(item.status)) return false;
    }

    // Type filter
    if (filter.type && filter.type.length > 0) {
      if (!filter.type.includes(item.type)) return false;
    }

    // Priority filter
    if (filter.priority && filter.priority.length > 0) {
      if (!filter.priority.includes(item.priority)) return false;
    }

    // Date range filter
    if (filter.dateRange) {
      const itemDate = new Date(item.submittedAt);
      if (itemDate < filter.dateRange.start || itemDate > filter.dateRange.end) {
        return false;
      }
    }

    // Moderator filter
    if (filter.moderator && item.moderatedBy !== filter.moderator) {
      return false;
    }

    // Category filter
    if (filter.category && item.metadata?.category !== filter.category) {
      return false;
    }

    // AI generated filter
    if (filter.aiGenerated !== undefined && item.metadata?.aiGenerated !== filter.aiGenerated) {
      return false;
    }

    // Flagged only filter
    if (filter.flaggedOnly && (!item.flaggedKeywords || item.flaggedKeywords.length === 0)) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate moderation statistics
 */
export function calculateModerationStats(items: ContentModerationItem[]): ModerationStats {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats: ModerationStats = {
    total: items.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
    underReview: 0,
    avgProcessingTime: 0,
    todayProcessed: 0,
    weekProcessed: 0,
    monthProcessed: 0,
    byCategory: {},
    byModerator: {}
  };

  let totalProcessingTime = 0;
  let processedItems = 0;

  items.forEach(item => {
    // Count by status
    switch (item.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'approved':
        stats.approved++;
        break;
      case 'rejected':
        stats.rejected++;
        break;
      case 'flagged':
        stats.flagged++;
        break;
      case 'under_review':
        stats.underReview++;
        break;
    }

    // Calculate processing time for completed items
    if (item.moderatedAt && item.status !== 'pending') {
      const processingTime = item.moderatedAt.getTime() - item.submittedAt.getTime();
      totalProcessingTime += processingTime;
      processedItems++;

      // Count processed today/week/month
      if (item.moderatedAt >= today) stats.todayProcessed++;
      if (item.moderatedAt >= weekAgo) stats.weekProcessed++;
      if (item.moderatedAt >= monthAgo) stats.monthProcessed++;

      // Count by moderator
      if (item.moderatedBy) {
        stats.byModerator[item.moderatedBy] = (stats.byModerator[item.moderatedBy] || 0) + 1;
      }
    }

    // Count by category
    const category = item.metadata?.category || 'other';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  });

  // Calculate average processing time in minutes
  if (processedItems > 0) {
    stats.avgProcessingTime = totalProcessingTime / processedItems / (1000 * 60);
  }

  return stats;
}

/**
 * Generate moderation action description
 */
export function getModerationActionDescription(action: ModerationAction): string {
  const actionMap = {
    approve: 'Contenu approuvé et publié',
    reject: 'Contenu rejeté et supprimé',
    flag: 'Contenu signalé pour révision',
    edit: 'Contenu modifié',
    delete: 'Contenu supprimé définitivement',
    escalate: 'Escaladé vers un administrateur'
  };

  return actionMap[action] || 'Action inconnue';
}