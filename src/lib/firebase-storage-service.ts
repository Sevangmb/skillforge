import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  StorageReference 
} from 'firebase/storage';
import { storage } from './firebase';
import { logger } from './logger';
import type { Result, UserId } from './types';

// Configuration pour les avatars
const AVATAR_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.85
} as const;

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface ProcessedImage {
  file: File;
  preview: string;
  size: number;
  dimensions: { width: number; height: number };
}

export class FirebaseStorageService {
  
  /**
   * Upload avatar with progress tracking
   */
  static async uploadAvatar(
    userId: UserId,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Result<string, Error>> {
    try {
      // Validate file
      const validation = this.validateAvatarFile(file);
      if (!validation.success) {
        return validation;
      }

      // Process image (resize, compress)
      const processedImage = await this.processImage(file);
      if (!processedImage.success) {
        return processedImage;
      }

      // Generate storage reference
      const fileName = `avatar_${Date.now()}.webp`;
      const storageRef = ref(storage, `avatars/${userId}/${fileName}`);

      logger.info('Starting avatar upload', {
        userId,
        fileName,
        originalSize: file.size,
        processedSize: processedImage.data.file.size
      });

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, processedImage.data.file);

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              state: snapshot.state as any
            };

            if (onProgress) {
              onProgress(progress);
            }

            logger.debug('Upload progress', {
              userId,
              progress: progress.progress,
              state: progress.state
            });
          },
          (error) => {
            logger.error('Avatar upload failed', {
              userId,
              error: error.message,
              errorCode: error.code
            });
            resolve({ success: false, error });
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              logger.info('Avatar upload successful', {
                userId,
                downloadURL,
                finalSize: processedImage.data.file.size
              });

              resolve({ success: true, data: downloadURL });
            } catch (urlError) {
              resolve({ 
                success: false, 
                error: urlError instanceof Error ? urlError : new Error('Failed to get download URL')
              });
            }
          }
        );
      });

    } catch (error) {
      logger.error('Avatar upload error', { userId, error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Upload failed')
      };
    }
  }

  /**
   * Delete existing avatar
   */
  static async deleteAvatar(avatarUrl: string): Promise<Result<void, Error>> {
    try {
      // Extract path from URL
      const urlParts = avatarUrl.split('/');
      const pathIndex = urlParts.findIndex(part => part === 'avatars');
      
      if (pathIndex === -1) {
        return {
          success: false,
          error: new Error('Invalid avatar URL format')
        };
      }

      const path = urlParts.slice(pathIndex).join('/').split('?')[0];
      const storageRef = ref(storage, path);

      await deleteObject(storageRef);

      logger.info('Avatar deleted successfully', { avatarUrl });
      
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Avatar deletion failed', { avatarUrl, error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Delete failed')
      };
    }
  }

  /**
   * Validate avatar file before upload
   */
  private static validateAvatarFile(file: File): Result<void, Error> {
    // Check file type
    if (!AVATAR_CONFIG.allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: new Error(`Type de fichier non supporté. Types autorisés: ${AVATAR_CONFIG.allowedTypes.join(', ')}`)
      };
    }

    // Check file size
    if (file.size > AVATAR_CONFIG.maxSize) {
      const maxSizeMB = AVATAR_CONFIG.maxSize / (1024 * 1024);
      return {
        success: false,
        error: new Error(`Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB`)
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Process image: resize, compress, convert to WebP
   */
  private static async processImage(file: File): Promise<Result<ProcessedImage, Error>> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions (maintain aspect ratio)
          const { width: newWidth, height: newHeight } = this.calculateDimensions(
            img.width,
            img.height,
            AVATAR_CONFIG.maxWidth,
            AVATAR_CONFIG.maxHeight
          );

          // Set canvas dimensions
          canvas.width = newWidth;
          canvas.height = newHeight;

          // Draw and compress image
          if (ctx) {
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], `avatar.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now()
                });

                const preview = canvas.toDataURL('image/webp', AVATAR_CONFIG.quality);
                
                resolve({
                  success: true,
                  data: {
                    file: processedFile,
                    preview,
                    size: blob.size,
                    dimensions: { width: newWidth, height: newHeight }
                  }
                });
              } else {
                resolve({
                  success: false,
                  error: new Error('Échec du traitement de l\'image')
                });
              }
            },
            'image/webp',
            AVATAR_CONFIG.quality
          );
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error : new Error('Erreur de traitement')
          });
        }
      };

      img.onerror = () => {
        resolve({
          success: false,
          error: new Error('Impossible de charger l\'image')
        });
      };

      // Load image
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Scale down if too large
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Generate avatar placeholder URL
   */
  static generatePlaceholderAvatar(userId: UserId, displayName?: string): string {
    const initials = displayName
      ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    
    // Using DiceBear API for consistent avatars
    return `https://api.dicebear.com/7.x/initials/svg?seed=${userId}&chars=${initials}&backgroundColor=3b82f6&textColor=ffffff`;
  }

  /**
   * Get storage usage for user avatars
   */
  static async getStorageUsage(userId: UserId): Promise<Result<number, Error>> {
    try {
      // This would require Firebase Admin SDK in a real implementation
      // For now, return estimated usage
      logger.info('Getting storage usage', { userId });
      
      // Placeholder implementation
      return { success: true, data: 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get storage usage')
      };
    }
  }
}

export default FirebaseStorageService;