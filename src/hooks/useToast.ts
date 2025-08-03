"use client";

import { useState, useCallback } from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      variant: 'default',
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return addToast({ title, description, variant: 'success' });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    return addToast({ title, description, variant: 'destructive' });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ title, description, variant: 'warning' });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    return addToast({ title, description, variant: 'info' });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
} 