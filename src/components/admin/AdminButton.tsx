"use client";

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminButton() {
  const { role, canAccessAdmin, isAdmin, isModerator } = useAdminAuth();
  const router = useRouter();

  if (!canAccessAdmin) {
    return null;
  }

  const handleAdminClick = () => {
    router.push('/admin');
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleAdminClick}
      className="flex items-center space-x-2 border-primary/20 hover:border-primary"
    >
      {isAdmin ? (
        <Crown className="h-4 w-4 text-amber-500" />
      ) : (
        <Shield className="h-4 w-4 text-blue-500" />
      )}
      <span className="hidden sm:inline">Admin</span>
      <Badge 
        variant="secondary" 
        className="text-xs px-1 py-0 ml-1"
      >
        {isAdmin ? 'Admin' : 'Mod'}
      </Badge>
    </Button>
  );
}