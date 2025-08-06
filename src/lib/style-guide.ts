/**
 * SkillForge AI Style Guide and Code Standards
 * Enforces consistent patterns across the codebase
 */

// ==================== NAMING CONVENTIONS ====================

export const namingConventions = {
  // Components: PascalCase
  components: {
    valid: ['SkillNode', 'QuizModal', 'UserProfile'],
    invalid: ['skillNode', 'quiz-modal', 'user_profile']
  },
  
  // Hooks: camelCase starting with 'use'
  hooks: {
    valid: ['useSkillTree', 'useAuthState', 'useThrottledCallback'],
    invalid: ['UseSkillTree', 'skillTreeHook', 'use-skill-tree']
  },
  
  // Constants: SCREAMING_SNAKE_CASE
  constants: {
    valid: ['API_ENDPOINTS', 'DEFAULT_TIMEOUT', 'MAX_RETRIES'],
    invalid: ['apiEndpoints', 'defaultTimeout', 'maxRetries']
  },
  
  // Variables/Functions: camelCase
  variables: {
    valid: ['skillData', 'handleClick', 'isLoading'],
    invalid: ['skill_data', 'handle-click', 'IsLoading']
  },
  
  // Types/Interfaces: PascalCase
  types: {
    valid: ['User', 'SkillStatus', 'QuizQuestion'],
    invalid: ['user', 'skillStatus', 'quiz_question']
  }
};

// ==================== FILE ORGANIZATION ====================

export const fileOrganization = {
  // Component files should follow this structure
  componentStructure: `
    // 1. React imports
    import React, { useState, useEffect, memo } from 'react';
    
    // 2. Third-party imports
    import { SomeLibrary } from 'some-library';
    
    // 3. Internal type imports
    import type { User, Skill } from '@/lib/types';
    
    // 4. Internal component/hook imports
    import { Button } from '@/components/ui/button';
    import { useAuth } from '@/hooks/useAuth';
    
    // 5. Internal utility imports
    import { cn } from '@/lib/utils';
    import { logger } from '@/lib/logger';
    
    // 6. Constants (at file level)
    const DEFAULT_TIMEOUT = 5000;
    
    // 7. Types (component-specific)
    interface ComponentProps {
      // props here
    }
    
    // 8. Component implementation
    function Component({ ... }: ComponentProps) {
      // hooks first
      // then other logic
      // then render
    }
    
    // 9. Memoization/exports
    export default memo(Component);
  `,
  
  // Directory structure guidelines
  directories: {
    components: 'UI components, organized by feature/type',
    lib: 'Shared utilities, services, and configurations', 
    hooks: 'Reusable React hooks',
    types: 'TypeScript type definitions',
    contexts: 'React context providers',
    stores: 'State management (Zustand stores)',
    ai: 'AI-related flows and utilities'
  }
};

// ==================== CODE PATTERNS ====================

export const codePatterns = {
  // Error handling pattern
  errorHandling: `
    try {
      const result = await riskyOperation();
      return result;
    } catch (error) {
      logger.error('Operation failed', {
        action: 'operation_name',
        error: error instanceof Error ? error.message : String(error),
        context: { userId, operationId }
      });
      throw error; // or handle gracefully
    }
  `,
  
  // Component prop patterns
  componentProps: `
    interface ComponentProps {
      // Required props first
      id: string;
      name: string;
      
      // Optional props after
      className?: string;
      disabled?: boolean;
      
      // Event handlers last
      onClick?: (id: string) => void;
      onSubmit?: (data: FormData) => void;
    }
  `,
  
  // State management patterns
  stateManagement: `
    // Prefer single state object for related values
    const [formState, setFormState] = useState({
      email: '',
      password: '',
      isSubmitting: false,
      error: null
    });
    
    // Use callback for complex updates
    const updateFormField = useCallback((field: string, value: string) => {
      setFormState(prev => ({ ...prev, [field]: value }));
    }, []);
  `,
  
  // Performance optimization patterns
  performanceOptimization: `
    // Memoize expensive calculations
    const expensiveValue = useMemo(() => {
      return complexCalculation(data);
    }, [data]);
    
    // Memoize callback functions
    const handleClick = useCallback((id: string) => {
      onItemClick(id);
    }, [onItemClick]);
    
    // Use React.memo for components with stable props
    export default memo(Component, (prevProps, nextProps) => {
      return prevProps.id === nextProps.id;
    });
  `
};

// ==================== ACCESSIBILITY PATTERNS ====================

export const accessibilityPatterns = {
  // Button patterns
  buttons: `
    <Button
      aria-label="Close modal"
      aria-describedby="modal-description"
      onClick={handleClose}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  `,
  
  // Form patterns
  forms: `
    <div>
      <label htmlFor="email" className="block text-sm font-medium">
        Email Address
      </label>
      <input
        id="email"
        type="email"
        required
        aria-describedby="email-error"
        aria-invalid={!!emailError}
        className="..."
      />
      {emailError && (
        <p id="email-error" role="alert" className="text-red-600">
          {emailError}
        </p>
      )}
    </div>
  `,
  
  // Navigation patterns
  navigation: `
    <nav role="navigation" aria-label="Main navigation">
      <ul>
        <li>
          <Link 
            href="/skills" 
            aria-current={pathname === '/skills' ? 'page' : undefined}
          >
            Skills
          </Link>
        </li>
      </ul>
    </nav>
  `
};

// ==================== STYLE CONVENTIONS ====================

export const styleConventions = {
  // CSS class naming (using Tailwind)
  cssClasses: {
    // Responsive design mobile-first
    responsive: 'text-sm md:text-base lg:text-lg',
    
    // State variants
    states: 'hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50',
    
    // Semantic spacing
    spacing: 'p-4 mb-6 gap-3',
    
    // Color usage
    colors: 'bg-primary text-primary-foreground border-border'
  },
  
  // Component styling patterns
  componentStyling: `
    // Use cn() for conditional classes
    const buttonClasses = cn(
      'base-button-classes',
      variant === 'primary' && 'primary-variant-classes',
      disabled && 'disabled-classes',
      className // Allow prop override
    );
  `
};

// ==================== TESTING PATTERNS ====================

export const testingPatterns = {
  // Component testing
  componentTesting: `
    describe('SkillNode', () => {
      const defaultProps = {
        skill: mockSkill,
        status: 'available' as const,
        onClick: jest.fn()
      };
      
      it('renders skill information correctly', () => {
        render(<SkillNode {...defaultProps} />);
        expect(screen.getByText(mockSkill.name)).toBeInTheDocument();
      });
      
      it('calls onClick when clicked', () => {
        render(<SkillNode {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));
        expect(defaultProps.onClick).toHaveBeenCalledWith(mockSkill);
      });
    });
  `,
  
  // Hook testing
  hookTesting: `
    describe('useSkillTree', () => {
      it('loads skills on mount', async () => {
        const { result } = renderHook(() => useSkillTree(mockUser));
        
        await waitFor(() => {
          expect(result.current.skills).toHaveLength(5);
        });
      });
    });
  `
};

// ==================== VALIDATION FUNCTIONS ====================

export const validators = {
  // Check if component follows naming convention
  validateComponentName: (name: string): boolean => {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  },
  
  // Check if hook follows naming convention
  validateHookName: (name: string): boolean => {
    return /^use[A-Z][a-zA-Z0-9]*$/.test(name);
  },
  
  // Check if constant follows naming convention
  validateConstantName: (name: string): boolean => {
    return /^[A-Z][A-Z0-9_]*$/.test(name);
  },
  
  // Validate import order
  validateImportOrder: (imports: string[]): boolean => {
    const reactImports = imports.filter(imp => imp.includes('react'));
    const thirdPartyImports = imports.filter(imp => !imp.includes('@/') && !imp.includes('react'));
    const internalImports = imports.filter(imp => imp.includes('@/'));
    
    // Check if React imports come first, then third-party, then internal
    return reactImports.length === 0 || 
           (imports.indexOf(reactImports[0]) < 
            (thirdPartyImports[0] ? imports.indexOf(thirdPartyImports[0]) : Infinity) &&
            imports.indexOf(reactImports[0]) < 
            (internalImports[0] ? imports.indexOf(internalImports[0]) : Infinity));
  }
};

// ==================== LINTING RULES ====================

export const lintingRules = {
  // ESLint rules to enforce
  eslintRules: {
    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'interface', format: ['PascalCase'] },
      { selector: 'typeAlias', format: ['PascalCase'] },
      { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
      { selector: 'function', format: ['camelCase'] }
    ],
    
    // Import ordering
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external', 
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' }
      }
    ],
    
    // React specific
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-bind': 'warn'
  },
  
  // Prettier configuration
  prettierConfig: {
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 100,
    tabWidth: 2,
    useTabs: false
  }
};

// Export style guide as default
const styleGuide = {
  namingConventions,
  fileOrganization, 
  codePatterns,
  accessibilityPatterns,
  styleConventions,
  testingPatterns,
  validators,
  lintingRules
};

export default styleGuide;