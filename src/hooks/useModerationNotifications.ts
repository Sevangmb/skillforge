"use client";

import { useState, useEffect } from 'react';
import type { ContentModerationItem } from '@/lib/types/admin';

export interface ModerationNotification {
  id: string;
  type: 'pending' | 'flagged' | 'urgent';
  title: string;
  message: string;
  timestamp: Date;
  itemId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function useModerationNotifications() {
  const [notifications, setNotifications] = useState<ModerationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications - in real app, this would come from Firebase
  useEffect(() => {
    const mockNotifications: ModerationNotification[] = [
      {
        id: 'notif-1',
        type: 'urgent',
        title: 'Contenu signalé',
        message: 'Un quiz Python a été signalé pour informations incorrectes',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        itemId: '2',
        priority: 'high'
      },
      {
        id: 'notif-2',
        type: 'pending',
        title: 'Nouveau quiz en attente',
        message: 'Quiz React Hooks en attente de modération',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
        itemId: '1',
        priority: 'medium'
      },
      {
        id: 'notif-3',
        type: 'flagged',
        title: 'Score de modération élevé',
        message: 'Contenu détecté avec score auto-modération: 15',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
        itemId: '2',
        priority: 'high'
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.length);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true } as ModerationNotification & { read: boolean }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true } as ModerationNotification & { read: boolean }))
    );
    setUnreadCount(0);
  };

  const addNotification = (notification: Omit<ModerationNotification, 'id' | 'timestamp'>) => {
    const newNotification: ModerationNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const getNotificationIcon = (type: ModerationNotification['type']) => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'flagged': return '🚩';
      case 'pending': return '⏳';
      default: return '📢';
    }
  };

  const getNotificationColor = (priority: ModerationNotification['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-200 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium': return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'low': return 'bg-gray-100 border-gray-200 text-gray-800';
      default: return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    getNotificationIcon,
    getNotificationColor
  };
}