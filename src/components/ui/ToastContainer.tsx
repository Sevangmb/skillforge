"use client";

import { useEffect, useState } from 'react';
import { Toast, ToastDescription, ToastTitle } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getIcon = (variant?: string) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'destructive':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          className="flex items-start space-x-2"
          onOpenChange={() => removeToast(toast.id)}
        >
          <div className="flex items-center space-x-2">
            {getIcon(toast.variant)}
            <div className="flex-1">
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
          </div>
        </Toast>
      ))}
    </div>
  );
} 