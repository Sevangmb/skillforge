"use client";

import React, { useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import type { User } from '@/lib/types';
import { useIntersectionObserver } from '@/hooks/usePerformanceOptimized';

interface VirtualizedLeaderboardProps {
  users: User[];
  height?: number;
  itemSize?: number;
  className?: string;
}

interface LeaderboardItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    users: User[];
    getRankIcon: (rank: number) => JSX.Element | null;
  };
}

const getRankIcon = (rank: number): JSX.Element | null => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return null;
  }
};

const LeaderboardItem = memo(({ index, style, data }: LeaderboardItemProps) => {
  const { users, getRankIcon } = data;
  const user = users[index];
  const rank = index + 1;
  const isTopThree = rank <= 3;

  if (!user) return null;

  return (
    <div style={style} className="px-4">
      <div 
        className={`
          flex items-center justify-between p-3 rounded-lg transition-colors
          ${isTopThree 
            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' 
            : 'hover:bg-muted/50'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8">
            {getRankIcon(rank) || (
              <span className="text-sm font-medium text-muted-foreground">
                {rank}
              </span>
            )}
          </div>
          
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.profile?.avatar} 
              alt={user.profile?.displayName || 'User'} 
            />
            <AvatarFallback>
              {(user.profile?.displayName || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {user.profile?.displayName || 'Anonymous User'}
            </span>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-muted-foreground">
                Level {user.profile?.level || 1}
              </span>
              {user.profile?.streak && user.profile.streak > 0 && (
                <Badge variant="secondary" className="text-xs h-4 px-1">
                  🔥 {user.profile.streak}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-primary">
            {user.totalPoints || 0}
          </div>
          <div className="text-xs text-muted-foreground">
            points
          </div>
        </div>
      </div>
    </div>
  );
});

LeaderboardItem.displayName = 'LeaderboardItem';

function VirtualizedLeaderboard({ 
  users, 
  height = 400, 
  itemSize = 70,
  className = "" 
}: VirtualizedLeaderboardProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(containerRef);

  // Sort users by points descending, memoized for performance
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }, [users]);

  // Memoized data for the list
  const listData = useMemo(() => ({
    users: sortedUsers,
    getRankIcon
  }), [sortedUsers]);

  // Only render if component has been viewed
  if (!hasIntersected) {
    return (
      <div ref={containerRef} className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sortedUsers.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users in leaderboard yet</p>
              <p className="text-sm">Be the first to earn points!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
            <Badge variant="secondary" className="ml-2">
              {sortedUsers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <List
            height={Math.min(height, sortedUsers.length * itemSize)}
            itemCount={sortedUsers.length}
            itemSize={itemSize}
            itemData={listData}
            width="100%"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent' 
            }}
          >
            {LeaderboardItem}
          </List>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(VirtualizedLeaderboard);