/**
 * Tests for Firebase Profile Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { profileService } from '../firebase-profile-service';
import type { UserId, UserPreferences, UserProfile } from '../types';

// Mock Firebase Firestore
vi.mock('../firebase', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  }
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ timestamp: true })),
}));

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

import { updateDoc, getDoc } from 'firebase/firestore';

describe('FirebaseProfileService', () => {
  const mockUserId = '12345' as UserId;
  const mockUserProfile: Partial<UserProfile> = {
    displayName: 'Test User',
    email: 'test@example.com',
  };
  
  const mockUserPreferences: Partial<UserPreferences> = {
    learningStyle: 'Visual',
    adaptiveMode: 'Default',
    language: 'fr',
    notificationsEnabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateUserProfile', () => {
    it('should successfully update user profile', async () => {
      // Mock successful Firestore operations
      const mockUserSnapshot = {
        exists: () => true,
        data: () => ({ uid: mockUserId })
      };
      
      vi.mocked(getDoc).mockResolvedValue(mockUserSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await profileService.updateUserProfile(mockUserId, {
        profile: mockUserProfile,
        preferences: mockUserPreferences
      });

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('should handle user not found error', async () => {
      // Mock user not found
      const mockUserSnapshot = {
        exists: () => false,
      };
      
      vi.mocked(getDoc).mockResolvedValue(mockUserSnapshot as any);

      const result = await profileService.updateUserProfile(mockUserId, {
        profile: mockUserProfile
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to update profile: User not found');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should validate profile data', async () => {
      const invalidProfileData = {
        displayName: '', // Invalid: empty string
        email: 'invalid-email', // Invalid: not a valid email
      };

      const result = await profileService.updateUserProfile(mockUserId, {
        profile: invalidProfileData
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid profile data');
    });

    it('should validate preferences data', async () => {
      const invalidPreferencesData = {
        learningStyle: 'InvalidStyle' as any, // Invalid learning style
        language: 'zz' as any, // Invalid language
      };

      const result = await profileService.updateUserProfile(mockUserId, {
        preferences: invalidPreferencesData
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid preferences data');
    });

    it('should handle Firestore errors gracefully', async () => {
      const mockUserSnapshot = {
        exists: () => true,
        data: () => ({ uid: mockUserId })
      };
      
      vi.mocked(getDoc).mockResolvedValue(mockUserSnapshot as any);
      vi.mocked(updateDoc).mockRejectedValue(new Error('Firestore error'));

      const result = await profileService.updateUserProfile(mockUserId, {
        profile: mockUserProfile
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to update profile: Firestore error');
    });
  });

  describe('getUserProfile', () => {
    it('should successfully retrieve user profile', async () => {
      const mockUserData = {
        uid: mockUserId,
        profile: mockUserProfile,
        preferences: mockUserPreferences,
      };

      const mockUserSnapshot = {
        exists: () => true,
        data: () => mockUserData
      };
      
      vi.mocked(getDoc).mockResolvedValue(mockUserSnapshot as any);

      const result = await profileService.getUserProfile(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserData);
    });

    it('should handle user not found', async () => {
      const mockUserSnapshot = {
        exists: () => false,
      };
      
      vi.mocked(getDoc).mockResolvedValue(mockUserSnapshot as any);

      const result = await profileService.getUserProfile(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to retrieve profile: User not found');
    });
  });

  describe('updateUserAvatar', () => {
    it('should successfully update avatar with valid URL', async () => {
      const validAvatarUrl = 'https://example.com/avatar.jpg';
      
      const mockUserSnapshot = {
        exists: () => true,
        data: () => ({ uid: mockUserId })
      };
      
      vi.mocked(getDoc).mockResolvedValue(mockUserSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await profileService.updateUserAvatar(mockUserId, validAvatarUrl);

      expect(result.success).toBe(true);
    });

    it('should reject invalid avatar URL', async () => {
      const invalidAvatarUrl = 'not-a-valid-url';

      const result = await profileService.updateUserAvatar(mockUserId, invalidAvatarUrl);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Invalid avatar URL provided');
    });
  });

  describe('updateUserPreferences', () => {
    it('should successfully update only preferences', async () => {
      const mockUserSnapshot = {
        exists: () => true,
        data: () => ({ uid: mockUserId })
      };
      
      vi.mocked(getDoc).mockResolvedValue(mockUserSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await profileService.updateUserPreferences(mockUserId, mockUserPreferences);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(1);
      
      // Verify the call includes preferences fields and timestamp
      const [, updatePayload] = vi.mocked(updateDoc).mock.calls[0];
      expect(updatePayload).toEqual(expect.objectContaining({
        'preferences.learningStyle': 'Visual',
        'preferences.adaptiveMode': 'Default',
        'preferences.language': 'fr',
        'preferences.notificationsEnabled': true,
        'updatedAt': expect.objectContaining({ timestamp: true }),
      }));
    });
  });

  describe('updateProfileInfo', () => {
    it('should successfully update only profile info', async () => {
      const mockUserSnapshot = {
        exists: () => true,
        data: () => ({ uid: mockUserId })
      };
      
      vi.mocked(getDoc).mockResolvedValue(mockUserSnapshot as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await profileService.updateProfileInfo(mockUserId, mockUserProfile);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(1);
      
      // Verify the call includes profile fields and timestamp
      const [, updatePayload] = vi.mocked(updateDoc).mock.calls[0];
      expect(updatePayload).toEqual(expect.objectContaining({
        'profile.displayName': 'Test User',
        'profile.email': 'test@example.com',
        'updatedAt': expect.objectContaining({ timestamp: true }),
      }));
    });
  });
});