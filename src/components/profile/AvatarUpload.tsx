"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Upload, 
  Camera, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  X,
  Edit3
} from 'lucide-react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { cn } from '@/lib/utils';
import type { UserId } from '@/lib/types';

interface AvatarUploadProps {
  userId: UserId;
  currentAvatarUrl?: string;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  className?: string;
}

const sizeConfig = {
  sm: { avatar: 'h-8 w-8', button: 'h-6 w-6', icon: 'h-3 w-3' },
  md: { avatar: 'h-12 w-12', button: 'h-8 w-8', icon: 'h-4 w-4' },
  lg: { avatar: 'h-16 w-16', button: 'h-10 w-10', icon: 'h-5 w-5' },
  xl: { avatar: 'h-24 w-24', button: 'h-12 w-12', icon: 'h-6 w-6' }
};

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  displayName,
  size = 'lg',
  onAvatarUpdate,
  className
}: AvatarUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isUploading,
    progress,
    error,
    uploadAvatar,
    deleteAvatar,
    resetState
  } = useAvatarUpload(userId, currentAvatarUrl);

  const sizeClasses = sizeConfig[size];

  // Generate initials for fallback
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    const success = await uploadAvatar(selectedFile);
    if (success && onAvatarUpdate) {
      // The new URL would be available from the upload result
      // For now, we'll use the preview URL as a placeholder
      onAvatarUpdate(previewUrl || currentAvatarUrl || '');
    }

    if (success) {
      setIsDialogOpen(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
  }, [selectedFile, uploadAvatar, onAvatarUpdate, previewUrl, currentAvatarUrl]);

  const handleDelete = useCallback(async () => {
    const success = await deleteAvatar();
    if (success) {
      setIsDialogOpen(false);
      if (onAvatarUpdate) {
        const placeholderUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${userId}&chars=${initials}&backgroundColor=3b82f6&textColor=ffffff`;
        onAvatarUpdate(placeholderUrl);
      }
    }
  }, [deleteAvatar, onAvatarUpdate, userId, initials]);

  const handleCancel = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    resetState();
    setIsDialogOpen(false);
  }, [previewUrl, resetState]);

  const handleBrowseFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Display URL: preview > current > placeholder
  const displayUrl = previewUrl || currentAvatarUrl || 
    `https://api.dicebear.com/7.x/initials/svg?seed=${userId}&chars=${initials}&backgroundColor=3b82f6&textColor=ffffff`;

  return (
    <div className={cn("relative", className)}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div className="relative group cursor-pointer">
            <Avatar className={cn(sizeClasses.avatar, "ring-2 ring-background")}>
              <AvatarImage src={displayUrl} alt={displayName || 'Avatar'} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            
            {/* Edit overlay */}
            <div className={cn(
              "absolute inset-0 bg-black bg-opacity-50 rounded-full",
              "flex items-center justify-center",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              sizeClasses.avatar
            )}>
              <Edit3 className={cn("text-white", sizeClasses.icon)} />
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer la photo de profil</DialogTitle>
            <DialogDescription>
              Téléchargez une nouvelle photo ou supprimez l'actuelle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current/Preview Avatar */}
            <div className="flex justify-center">
              <Avatar className="h-32 w-32 ring-2 ring-border">
                <AvatarImage src={displayUrl} alt="Aperçu" />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
            </div>

            {/* Upload Progress */}
            {isUploading && progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload en cours...</span>
                  <span>{Math.round(progress.progress)}%</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {Math.round(progress.bytesTransferred / 1024)}KB / {Math.round(progress.totalBytes / 1024)}KB
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* File Selection */}
            {!selectedFile && !isUploading && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center",
                  "hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer",
                  dragActive ? "border-primary bg-accent/50" : "border-muted"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleBrowseFiles}
              >
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Glissez votre image ici ou cliquez pour parcourir
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP jusqu'à 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected File Info */}
            {selectedFile && !isUploading && (
              <div className="bg-accent rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Télécharger
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!selectedFile && !isUploading && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBrowseFiles}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Choisir un fichier
                </Button>
                
                {currentAvatarUrl && !currentAvatarUrl.includes('dicebear.com') && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isUploading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
            )}

            {/* Cancel Button */}
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isUploading}
              className="w-full"
            >
              Annuler
            </Button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileInput}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}