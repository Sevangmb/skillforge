import { useState, useCallback } from 'react';
import { FirebaseStorageService, UploadProgress } from '@/lib/firebase-storage-service';
import { profileService } from '@/lib/firebase-profile-service';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';
import type { UserId } from '@/lib/types';

interface UseAvatarUploadState {
  isUploading: boolean;
  progress: UploadProgress | null;
  previewUrl: string | null;
  error: string | null;
}

interface UseAvatarUploadActions {
  uploadAvatar: (file: File) => Promise<boolean>;
  deleteAvatar: () => Promise<boolean>;
  resetState: () => void;
  setPreviewUrl: (url: string | null) => void;
}

export interface UseAvatarUploadReturn extends UseAvatarUploadState, UseAvatarUploadActions {}

export function useAvatarUpload(userId: UserId, currentAvatarUrl?: string) {
  const [state, setState] = useState<UseAvatarUploadState>({
    isUploading: false,
    progress: null,
    previewUrl: null,
    error: null
  });

  const updateState = useCallback((updates: Partial<UseAvatarUploadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<boolean> => {
    updateState({
      isUploading: true,
      progress: null,
      error: null
    });

    try {
      logger.info('Starting avatar upload', {
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Upload to Firebase Storage with progress tracking
      const result = await FirebaseStorageService.uploadAvatar(
        userId,
        file,
        (progress) => {
          updateState({ progress });
          
          // Show progress toast for long uploads
          if (progress.progress % 25 === 0 && progress.progress > 0 && progress.progress < 100) {
            toast({
              title: "Upload en cours...",
              description: `${Math.round(progress.progress)}% terminé`,
            });
          }
        }
      );

      if (!result.success) {
        throw result.error;
      }

      const newAvatarUrl = result.data;

      // Update user profile with new avatar URL
      const profileResult = await profileService.updateUserProfile(userId, {
        profile: { avatar: newAvatarUrl }
      });

      if (!profileResult.success) {
        // Rollback: delete the uploaded image
        await FirebaseStorageService.deleteAvatar(newAvatarUrl);
        throw profileResult.error;
      }

      // Delete old avatar if it exists and it's not a placeholder
      if (currentAvatarUrl && !currentAvatarUrl.includes('dicebear.com')) {
        const deleteResult = await FirebaseStorageService.deleteAvatar(currentAvatarUrl);
        if (!deleteResult.success) {
          logger.warn('Failed to delete old avatar', {
            userId,
            oldAvatarUrl: currentAvatarUrl,
            error: deleteResult.error
          });
        }
      }

      updateState({
        isUploading: false,
        progress: { 
          bytesTransferred: file.size,
          totalBytes: file.size,
          progress: 100,
          state: 'success'
        },
        previewUrl: newAvatarUrl,
        error: null
      });

      toast({
        title: "Avatar mis à jour !",
        description: "Votre photo de profil a été changée avec succès.",
      });

      logger.info('Avatar upload completed successfully', {
        userId,
        newAvatarUrl,
        originalSize: file.size
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      updateState({
        isUploading: false,
        progress: null,
        error: errorMessage
      });

      toast({
        title: "Erreur d'upload",
        description: errorMessage,
        variant: "destructive",
      });

      logger.error('Avatar upload failed', {
        userId,
        error: errorMessage,
        fileName: file.name
      });

      return false;
    }
  }, [userId, currentAvatarUrl, updateState]);

  const deleteAvatar = useCallback(async (): Promise<boolean> => {
    if (!currentAvatarUrl || currentAvatarUrl.includes('dicebear.com')) {
      toast({
        title: "Aucun avatar à supprimer",
        description: "Vous utilisez un avatar par défaut.",
        variant: "default",
      });
      return true;
    }

    updateState({
      isUploading: true,
      error: null
    });

    try {
      logger.info('Starting avatar deletion', {
        userId,
        avatarUrl: currentAvatarUrl
      });

      // Delete from Firebase Storage
      const deleteResult = await FirebaseStorageService.deleteAvatar(currentAvatarUrl);
      if (!deleteResult.success) {
        throw deleteResult.error;
      }

      // Generate placeholder avatar
      const placeholderUrl = FirebaseStorageService.generatePlaceholderAvatar(userId);

      // Update user profile to remove avatar URL
      const profileResult = await profileService.updateUserProfile(userId, {
        profile: { avatar: placeholderUrl }
      });

      if (!profileResult.success) {
        throw profileResult.error;
      }

      updateState({
        isUploading: false,
        previewUrl: placeholderUrl,
        error: null
      });

      toast({
        title: "Avatar supprimé",
        description: "Votre photo de profil a été supprimée.",
      });

      logger.info('Avatar deletion completed successfully', {
        userId,
        placeholderUrl
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      updateState({
        isUploading: false,
        error: errorMessage
      });

      toast({
        title: "Erreur de suppression",
        description: errorMessage,
        variant: "destructive",
      });

      logger.error('Avatar deletion failed', {
        userId,
        error: errorMessage
      });

      return false;
    }
  }, [userId, currentAvatarUrl, updateState]);

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      progress: null,
      previewUrl: null,
      error: null
    });
  }, []);

  const setPreviewUrl = useCallback((url: string | null) => {
    updateState({ previewUrl: url });
  }, [updateState]);

  return {
    ...state,
    uploadAvatar,
    deleteAvatar,
    resetState,
    setPreviewUrl
  };
}