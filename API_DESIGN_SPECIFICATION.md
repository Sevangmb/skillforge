# SkillForge AI - API Design Specification

## Overview

This document defines the comprehensive API design patterns, interfaces, and specifications for SkillForge AI, ensuring consistency, scalability, and developer experience across all endpoints.

## 1. API Design Principles

### 1.1 RESTful Design
- **Resource-based URLs**: `/api/skills/:id` not `/api/getSkill`
- **HTTP Methods**: Semantic use of GET, POST, PUT, DELETE
- **Status Codes**: Proper HTTP status code usage
- **Idempotency**: Safe retry mechanisms for operations

### 1.2 TypeScript-First Design
- **Schema Validation**: Zod schemas for request/response validation
- **Type Generation**: Automatic TypeScript type generation
- **Runtime Safety**: Input validation and sanitization
- **Documentation**: Self-documenting API interfaces

### 1.3 Performance & Reliability
- **Caching**: Intelligent caching strategies with ETags
- **Rate Limiting**: Protection against abuse
- **Circuit Breakers**: Resilient service communication
- **Monitoring**: Comprehensive request/response tracking

## 2. Core API Interfaces

### 2.1 Base Response Interface

```typescript
// Standard API Response Format
interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata: ResponseMetadata;
}

interface APIError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  processingTime: number;
  cacheStatus?: 'HIT' | 'MISS' | 'BYPASS';
}

// Paginated Response
interface PaginatedAPIResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### 2.2 Request/Response Validation

```typescript
// Zod Schema Patterns
const BaseRequestSchema = z.object({
  requestId: z.string().uuid().optional(),
  timestamp: z.string().datetime().optional(),
  clientVersion: z.string().optional(),
});

const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const FilterSchema = z.object({
  category: z.array(z.nativeEnum(SkillCategory)).optional(),
  difficulty: z.array(z.nativeEnum(DifficultyLevel)).optional(),
  status: z.array(z.nativeEnum(SkillStatus)).optional(),
  search: z.string().max(100).optional(),
});
```

## 3. Authentication API

### 3.1 Authentication Endpoints

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: PublicUserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  permissions: UserPermission[];
}

// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  preferences: Partial<UserPreferences>;
}

interface RegisterResponse {
  user: PublicUserProfile;
  verificationRequired: boolean;
  onboardingRequired: boolean;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// GET /api/auth/profile
interface ProfileResponse {
  user: UserProfile;
  statistics: UserStatistics;
  achievements: Achievement[];
  lastActivity: Date;
}
```

### 3.2 Authorization Middleware

```typescript
// Authorization Patterns
interface AuthorizationMiddleware {
  // Role-based access control
  requireRole(roles: UserRole[]): MiddlewareFunction;
  
  // Permission-based access control
  requirePermission(permission: Permission): MiddlewareFunction;
  
  // Resource ownership validation
  requireOwnership(resourceType: ResourceType): MiddlewareFunction;
  
  // Rate limiting by user
  rateLimit(options: RateLimitOptions): MiddlewareFunction;
}

// JWT Token Structure
interface JWTPayload {
  userId: UserId;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
```

## 4. Skills & Learning API

### 4.1 Skills Management

```typescript
// GET /api/skills
interface SkillsListRequest {
  pagination: PaginationParams;
  filters: SkillFilters;
  includeHidden: boolean;
}

interface SkillsListResponse {
  skills: Skill[];
  categories: SkillCategory[];
  userProgress: Map<SkillId, CompetenceStatus>;
}

// GET /api/skills/:id
interface SkillDetailResponse {
  skill: Skill;
  prerequisites: Skill[];
  dependents: Skill[];
  userStatus: CompetenceStatus;
  recommendations: SkillRecommendation[];
  analytics: SkillAnalytics;
}

// POST /api/skills/:id/attempt
interface SkillAttemptRequest {
  answers: QuizAnswer[];
  timeSpent: number;
  metadata: AttemptMetadata;
}

interface SkillAttemptResponse {
  result: AttemptResult;
  feedback: PersonalizedFeedback;
  nextRecommendations: SkillRecommendation[];
  achievementsUnlocked: Achievement[];
}

// GET /api/skills/tree
interface SkillTreeResponse {
  skills: Skill[];
  connections: SkillConnection[];
  userProgress: Map<SkillId, CompetenceStatus>;
  recommendations: SkillRecommendation[];
  visualLayout: TreeLayoutData;
}
```

### 4.2 Quiz Generation API

```typescript
// POST /api/quiz/generate
interface QuizGenerationRequest {
  competenceId: SkillId;
  userId: UserId;
  userLevel: number;
  learningStyle: LearningStyle;
  language: SupportedLanguage;
  difficulty?: DifficultyLevel;
  questionCount?: number;
  excludeQuestions?: QuestionId[];
}

interface QuizGenerationResponse {
  quiz: {
    id: QuizId;
    questions: QuizQuestion[];
    estimatedTime: number;
    difficulty: DifficultyLevel;
    metadata: QuizMetadata;
  };
  personalizations: PersonalizationData;
  analytics: QuizAnalytics;
}

// POST /api/quiz/explanation
interface ExplanationRequest {
  questionId: QuestionId;
  userAnswer: string;
  correctAnswer: string;
  topic: string;
  language?: SupportedLanguage;
}

interface ExplanationResponse {
  explanation: {
    content: string;
    level: ExplanationLevel;
    examples: Example[];
    additionalResources: Resource[];
  };
  relatedConcepts: Concept[];
  nextSteps: LearningStep[];
}

// GET /api/quiz/history
interface QuizHistoryRequest {
  pagination: PaginationParams;
  filters: {
    skillId?: SkillId;
    dateRange?: DateRange;
    completed?: boolean;
  };
}

interface QuizHistoryResponse {
  attempts: QuizAttempt[];
  statistics: QuizStatistics;
  trends: PerformanceTrend[];
}
```

## 5. Analytics & Progress API

### 5.1 Learning Analytics

```typescript
// GET /api/analytics/overview
interface AnalyticsOverviewResponse {
  summary: {
    totalSkillsCompleted: number;
    currentStreak: number;
    totalTimeSpent: number;
    averageScore: number;
  };
  progress: {
    weekly: WeeklyProgress[];
    monthly: MonthlyProgress[];
    categories: CategoryProgress[];
  };
  insights: LearningInsight[];
  recommendations: PersonalizedRecommendation[];
}

// GET /api/analytics/learning-metrics
interface LearningMetricsResponse {
  metrics: {
    retention: RetentionMetrics;
    engagement: EngagementMetrics;
    performance: PerformanceMetrics;
    learning: LearningVelocityMetrics;
  };
  comparisons: {
    peers: PeerComparison;
    personal: PersonalComparison;
    benchmarks: BenchmarkComparison;
  };
  predictions: {
    completion: CompletionPrediction;
    difficulty: DifficultyPrediction;
    timeEstimates: TimeEstimate[];
  };
}

// POST /api/analytics/track-event
interface EventTrackingRequest {
  event: {
    type: EventType;
    category: EventCategory;
    action: string;
    label?: string;
    value?: number;
  };
  context: {
    page: string;
    component: string;
    sessionId: string;
    timestamp: string;
  };
  user: {
    userId: UserId;
    sessionData: SessionData;
  };
}

interface EventTrackingResponse {
  eventId: string;
  processed: boolean;
  insights: RealTimeInsight[];
}
```

### 5.2 Achievement System

```typescript
// GET /api/achievements
interface AchievementsResponse {
  earned: Achievement[];
  available: Achievement[];
  progress: AchievementProgress[];
  recommendations: AchievementRecommendation[];
  leaderboard: LeaderboardEntry[];
}

// POST /api/achievements/claim
interface AchievementClaimRequest {
  achievementId: AchievementId;
  context: AchievementContext;
}

interface AchievementClaimResponse {
  achievement: Achievement;
  rewards: Reward[];
  newBadges: Badge[];
  pointsEarned: number;
  nextAchievements: Achievement[];
}
```

## 6. User Management API

### 6.1 Profile Management

```typescript
// GET /api/users/profile
interface UserProfileResponse {
  profile: UserProfile;
  preferences: UserPreferences;
  statistics: UserStatistics;
  privacy: PrivacySettings;
}

// PUT /api/users/profile
interface UpdateProfileRequest {
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  privacy?: Partial<PrivacySettings>;
}

interface UpdateProfileResponse {
  updated: UserProfile;
  validationErrors: ValidationError[];
  cacheInvalidated: boolean;
}

// GET /api/users/settings
interface UserSettingsResponse {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  data: DataManagementSettings;
}

// PUT /api/users/settings
interface UpdateSettingsRequest {
  notifications?: Partial<NotificationSettings>;
  privacy?: Partial<PrivacySettings>;
  accessibility?: Partial<AccessibilitySettings>;
}
```

### 6.2 Social Features

```typescript
// GET /api/users/leaderboard
interface LeaderboardRequest {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time';
  category?: SkillCategory;
  friends?: boolean;
}

interface LeaderboardResponse {
  rankings: LeaderboardEntry[];
  userPosition: number;
  statistics: LeaderboardStatistics;
  achievements: CompetitiveAchievement[];
}

// GET /api/users/social
interface SocialDataResponse {
  friends: Friend[];
  groups: StudyGroup[];
  activities: SocialActivity[];
  invitations: Invitation[];
}
```

## 7. Admin API

### 7.1 Content Management

```typescript
// GET /api/admin/content
interface AdminContentRequest {
  type: 'skills' | 'questions' | 'paths' | 'achievements';
  status: 'pending' | 'approved' | 'rejected' | 'all';
  pagination: PaginationParams;
}

interface AdminContentResponse {
  items: ContentItem[];
  moderation: ModerationData[];
  analytics: ContentAnalytics;
  pendingReviews: number;
}

// POST /api/admin/content/moderate
interface ModerationRequest {
  itemId: string;
  action: 'approve' | 'reject' | 'flag' | 'edit';
  reason?: string;
  changes?: Record<string, unknown>;
}

interface ModerationResponse {
  success: boolean;
  item: ContentItem;
  auditLog: AuditLogEntry;
  notifications: NotificationResult[];
}
```

### 7.2 User Management

```typescript
// GET /api/admin/users
interface AdminUsersRequest {
  filters: UserFilters;
  search?: string;
  pagination: PaginationParams;
}

interface AdminUsersResponse {
  users: AdminUserView[];
  statistics: UserStatistics;
  flags: UserFlag[];
  reports: UserReport[];
}

// POST /api/admin/users/:id/action
interface UserActionRequest {
  action: 'suspend' | 'activate' | 'promote' | 'demote' | 'delete';
  reason: string;
  duration?: number;
  notify?: boolean;
}

interface UserActionResponse {
  success: boolean;
  user: AdminUserView;
  auditLog: AuditLogEntry;
  notifications: NotificationResult[];
}
```

## 8. Error Handling Patterns

### 8.1 Error Response Format

```typescript
// Standardized Error Responses
interface APIError {
  code: ErrorCode;
  message: string;
  field?: string;
  details?: ErrorDetails;
  userMessage?: string;
  recoveryActions?: RecoveryAction[];
}

enum ErrorCode {
  // Authentication Errors
  INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation Errors
  INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'VALIDATION_MISSING_FIELD',
  INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  
  // Business Logic Errors
  SKILL_NOT_AVAILABLE = 'BUSINESS_SKILL_NOT_AVAILABLE',
  QUIZ_ALREADY_COMPLETED = 'BUSINESS_QUIZ_COMPLETED',
  PREREQUISITE_NOT_MET = 'BUSINESS_PREREQUISITE_NOT_MET',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'SYSTEM_INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SYSTEM_SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'SYSTEM_RATE_LIMITED',
}

interface RecoveryAction {
  type: 'retry' | 'redirect' | 'refresh' | 'contact_support';
  label: string;
  url?: string;
  delay?: number;
}
```

### 8.2 Error Handling Middleware

```typescript
// Global Error Handler
interface ErrorHandlingMiddleware {
  // Error classification
  classifyError(error: Error): ErrorClassification;
  
  // Error transformation
  transformError(error: Error, context: RequestContext): APIError;
  
  // Recovery suggestion
  suggestRecovery(error: APIError, context: RequestContext): RecoveryAction[];
  
  // Logging and monitoring
  logError(error: APIError, context: RequestContext): void;
}

// Circuit Breaker Pattern
interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
  onOpen: () => APIResponse<null>;
  onHalfOpen: () => boolean;
  healthCheck: () => Promise<boolean>;
}
```

## 9. Rate Limiting & Security

### 9.1 Rate Limiting Strategy

```typescript
// Rate Limiting Configuration
interface RateLimitConfig {
  // Global limits
  global: {
    requests: 1000;
    window: '15m';
    burst: 100;
  };
  
  // Endpoint-specific limits
  endpoints: {
    '/api/auth/login': { requests: 5; window: '15m' };
    '/api/quiz/generate': { requests: 20; window: '1h' };
    '/api/analytics/*': { requests: 100; window: '1h' };
  };
  
  // User-tier limits
  tiers: {
    free: { requests: 100; window: '1h' };
    premium: { requests: 500; window: '1h' };
    admin: { requests: 2000; window: '1h' };
  };
}

// Rate Limit Response Headers
interface RateLimitHeaders {
  'X-RateLimit-Limit': number;
  'X-RateLimit-Remaining': number;
  'X-RateLimit-Reset': number;
  'X-RateLimit-Retry-After'?: number;
}
```

### 9.2 Security Headers

```typescript
// Security Headers Configuration
interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Content-Type-Options': 'nosniff';
  'X-Frame-Options': 'DENY';
  'X-XSS-Protection': '1; mode=block';
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains';
  'Referrer-Policy': 'strict-origin-when-cross-origin';
  'Permissions-Policy': string;
}

// CORS Configuration
interface CORSConfig {
  origin: string[];
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}
```

## 10. API Versioning Strategy

### 10.1 Versioning Approach

```typescript
// URL-based versioning
interface APIVersioning {
  current: 'v1';
  supported: ['v1'];
  deprecated: [];
  
  // Version-specific configurations
  versions: {
    v1: {
      baseUrl: '/api/v1';
      features: FeatureFlag[];
      deprecationDate: null;
      maintenanceMode: false;
    };
  };
}

// Backward compatibility
interface BackwardCompatibility {
  // Field mapping between versions
  fieldMappings: Record<string, FieldMapping>;
  
  // Response transformation
  responseTransforms: ResponseTransform[];
  
  // Feature toggles
  featureFlags: FeatureFlag[];
}
```

### 10.2 Migration Strategy

```typescript
// API Migration Framework
interface APIMigration {
  // Client notifications
  deprecationWarnings: {
    headers: DeprecationHeaders;
    documentation: MigrationGuide;
    timeline: MigrationTimeline;
  };
  
  // Gradual rollout
  rolloutStrategy: {
    canaryDeployment: CanaryConfig;
    featureFlags: FeatureFlagConfig;
    monitoringAlerts: AlertConfig;
  };
  
  // Rollback procedures
  rollbackPlan: {
    triggers: RollbackTrigger[];
    procedures: RollbackProcedure[];
    dataConsistency: ConsistencyCheck[];
  };
}
```

---

## Implementation Guidelines

### Development Standards
- **Type Safety**: All endpoints must have TypeScript interfaces
- **Validation**: Zod schemas for all request/response validation
- **Testing**: Unit and integration tests for all endpoints
- **Documentation**: OpenAPI/Swagger documentation generation

### Performance Requirements
- **Response Time**: < 200ms for read operations, < 500ms for write operations
- **Throughput**: > 1000 requests/second per endpoint
- **Availability**: 99.9% uptime SLA
- **Scalability**: Horizontal scaling capability

### Security Requirements
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role and permission-based access control
- **Input Validation**: Comprehensive sanitization and validation
- **Audit Logging**: All user actions and admin operations logged

This API design specification ensures consistent, secure, and performant API development for SkillForge AI.