"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useModerationNotifications } from '@/hooks/useModerationNotifications';

interface ModerationNotificationsProps {
  onNotificationClick?: (itemId: string) => void;
}

export default function ModerationNotifications({ onNotificationClick }: ModerationNotificationsProps) {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor
  } = useModerationNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (onNotificationClick) {
      onNotificationClick(notification.itemId);
    }
    setIsOpen(false);
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return `${diffDays}j`;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications de Modération</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-6 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout lire
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            {notifications.map((notification) => {
              const isRead = (notification as any).read;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-4 cursor-pointer ${
                    !isRead ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="flex-shrink-0 text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {getTimeSince(notification.timestamp)}
                          </span>
                          {!isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getNotificationColor(notification.priority)}`}
                        >
                          {notification.priority === 'urgent' && '🚨 '}
                          {notification.priority === 'high' && '⚠️ '}
                          {notification.priority === 'medium' && '📋 '}
                          {notification.priority === 'low' && '📝 '}
                          {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  if (onNotificationClick) {
                    onNotificationClick('content-tab');
                  }
                  setIsOpen(false);
                }}
              >
                Voir tout le contenu à modérer
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}