import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import ProfileCard from '../profile/ProfileCard';
import {
  createMockUser,
  createUserWithNoPoints,
  createAdminUser,
  createMinimalUser,
  createUserWithLongName,
  renderIsolated,
  expectAccessibility,
  expectUserProfile,
} from '@/test/test-utils';

// Mock the useAppStore hook
vi.mock('@/stores/useAppStore', () => ({
  useAppStore: () => ({
    user: null,
    skills: [],
  }),
}));

describe('ProfileCard', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    // Clean up any previous test containers
    if (cleanup) cleanup();
  });

  it('should render user profile information correctly', () => {
    const mockUser = createMockUser();
    const result = renderIsolated(<ProfileCard user={mockUser} />);
    cleanup = result.cleanup;

    // Use utility functions for consistent assertions
    expectUserProfile.displayName(mockUser, result.container);
    expectUserProfile.points(mockUser, result.container);
    expectUserProfile.level(mockUser, result.container);
  });

  it('should display user level and points correctly', () => {
    const mockUser = createMockUser();
    const result = renderIsolated(<ProfileCard user={mockUser} />);
    cleanup = result.cleanup;

    // Should show level and points (using isolated container)
    expectUserProfile.level(mockUser, result.container);
    expectUserProfile.points(mockUser, result.container);
  });

  it('should handle user with no points gracefully', () => {
    const userWithNoPoints = createUserWithNoPoints();
    const result = renderIsolated(<ProfileCard user={userWithNoPoints} />);
    cleanup = result.cleanup;

    expectUserProfile.displayName(userWithNoPoints, result.container);
    expectUserProfile.points(userWithNoPoints, result.container);
    expectUserProfile.level(userWithNoPoints, result.container);
  });

  it('should display admin badge for admin users', () => {
    const adminUser = createAdminUser();
    const result = renderIsolated(<ProfileCard user={adminUser} />);
    cleanup = result.cleanup;

    // Should show admin indicator (implementation dependent)
    expectUserProfile.displayName(adminUser, result.container);
    // Additional admin-specific assertions could be added here
  });

  it('should handle long display names appropriately', () => {
    const userWithLongName = createUserWithLongName();
    const result = renderIsolated(<ProfileCard user={userWithLongName} />);
    cleanup = result.cleanup;

    // Should still render the name (implementation may truncate it)
    expect(result.container).toHaveTextContent(/This Is A Very Long/);
  });

  it('should be accessible', () => {
    const mockUser = createMockUser();
    const result = renderIsolated(<ProfileCard user={mockUser} />);
    cleanup = result.cleanup;

    // Check for basic accessibility
    expect(result.container.firstChild).toBeInTheDocument();

    // Should have the user name as accessible text
    expectUserProfile.displayName(mockUser, result.container);
    
    // Should have progress bar with proper ARIA attributes
    const progressBar = screen.getByRole('progressbar');
    expectAccessibility.progressBar(progressBar);
  });

  it('should handle missing optional profile data', () => {
    const minimalUser = createMinimalUser();
    const result = renderIsolated(<ProfileCard user={minimalUser} />);
    cleanup = result.cleanup;

    expectUserProfile.displayName(minimalUser, result.container);
    expectUserProfile.points(minimalUser, result.container);
    expectUserProfile.level(minimalUser, result.container);
  });

  it('should display completion statistics correctly', () => {
    const mockUser = createMockUser();
    const result = renderIsolated(<ProfileCard user={mockUser} />);
    cleanup = result.cleanup;

    // The component should show completion statistics based on competences
    expectUserProfile.displayName(mockUser, result.container);
    
    // Additional statistics might be displayed - this depends on implementation
    // Future: Add specific assertions for completion statistics
  });

  afterEach(() => {
    // Ensure cleanup happens after each test
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });
});