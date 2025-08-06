/**
 * Diagnostic utilities for quiz question validation and debugging
 */

import type { QuizQuestion } from './types';

export interface QuestionDiagnostic {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  repairAttempted: boolean;
  repairedQuestion?: QuizQuestion;
}

/**
 * Comprehensive diagnostic for quiz questions
 */
export function diagnoseQuizQuestion(question: any): QuestionDiagnostic {
  const diagnostic: QuestionDiagnostic = {
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: [],
    repairAttempted: false
  };

  // Basic structure validation
  if (!question) {
    diagnostic.errors.push('Question is null or undefined');
    return diagnostic;
  }

  if (typeof question !== 'object') {
    diagnostic.errors.push('Question is not an object');
    return diagnostic;
  }

  // Question text validation
  if (!question.question) {
    diagnostic.errors.push('Missing question text');
  } else if (typeof question.question !== 'string') {
    diagnostic.errors.push('Question text must be a string');
  } else if (question.question.trim().length === 0) {
    diagnostic.errors.push('Question text is empty');
  } else if (question.question.length < 10) {
    diagnostic.warnings.push('Question text is very short (< 10 characters)');
  }

  // Options validation
  if (!question.options) {
    diagnostic.errors.push('Missing options array');
  } else if (!Array.isArray(question.options)) {
    diagnostic.errors.push('Options must be an array');
  } else {
    if (question.options.length < 2) {
      diagnostic.errors.push(`Insufficient options (${question.options.length}, need at least 2)`);
    } else if (question.options.length > 6) {
      diagnostic.warnings.push(`Many options (${question.options.length}), consider reducing for better UX`);
    }

    // Validate individual options
    question.options.forEach((option: any, index: number) => {
      if (typeof option !== 'string') {
        diagnostic.errors.push(`Option ${index} is not a string`);
      } else if (option.trim().length === 0) {
        diagnostic.errors.push(`Option ${index} is empty`);
      }
    });

    // Check for duplicate options
    const uniqueOptions = new Set(question.options.filter(opt => typeof opt === 'string'));
    if (uniqueOptions.size !== question.options.length) {
      diagnostic.warnings.push('Duplicate options detected');
    }
  }

  // Correct answer validation
  if (question.correctAnswer === undefined || question.correctAnswer === null) {
    diagnostic.errors.push('Missing correctAnswer field');
  } else if (typeof question.correctAnswer !== 'number') {
    diagnostic.errors.push('correctAnswer must be a number');
  } else if (!Number.isInteger(question.correctAnswer)) {
    diagnostic.errors.push('correctAnswer must be an integer');
  } else if (question.correctAnswer < 0) {
    diagnostic.errors.push('correctAnswer cannot be negative');
  } else if (question.options && question.correctAnswer >= question.options.length) {
    diagnostic.errors.push(`correctAnswer (${question.correctAnswer}) is out of range for ${question.options.length} options`);
  }

  // Explanation validation
  if (!question.explanation) {
    diagnostic.errors.push('Missing explanation');
  } else if (typeof question.explanation !== 'string') {
    diagnostic.errors.push('Explanation must be a string');
  } else if (question.explanation.trim().length === 0) {
    diagnostic.errors.push('Explanation is empty');
  } else if (question.explanation.length < 20) {
    diagnostic.warnings.push('Explanation is very short (< 20 characters)');
  }

  // Set validity
  diagnostic.isValid = diagnostic.errors.length === 0;

  // Generate suggestions
  if (!diagnostic.isValid) {
    diagnostic.suggestions.push('Consider using fallback question');
    
    if (diagnostic.errors.some(e => e.includes('Missing'))) {
      diagnostic.suggestions.push('Use question repair function to fill missing fields');
    }
    
    if (diagnostic.errors.some(e => e.includes('options'))) {
      diagnostic.suggestions.push('Ensure options array has 2-4 string elements');
    }
    
    if (diagnostic.errors.some(e => e.includes('correctAnswer'))) {
      diagnostic.suggestions.push('Verify correctAnswer is valid array index');
    }
  }

  return diagnostic;
}

/**
 * Attempt to repair a malformed quiz question
 */
export function repairQuizQuestion(question: any): QuizQuestion | null {
  try {
    const diagnostic = diagnoseQuizQuestion(question);
    
    if (diagnostic.isValid) {
      return question as QuizQuestion;
    }

    // Attempt basic repairs
    const repaired: any = {
      question: question?.question || 'Question non disponible',
      options: [],
      correctAnswer: 0,
      explanation: question?.explanation || 'Explication non disponible'
    };

    // Repair question text
    if (typeof repaired.question !== 'string') {
      repaired.question = String(repaired.question);
    }
    repaired.question = repaired.question.trim();
    if (repaired.question.length === 0) {
      repaired.question = 'Question de démonstration';
    }

    // Repair options
    if (Array.isArray(question?.options)) {
      repaired.options = question.options
        .filter((opt: any) => typeof opt === 'string' && opt.trim().length > 0)
        .map((opt: string) => opt.trim());
    }

    // Ensure minimum options
    while (repaired.options.length < 2) {
      repaired.options.push(`Option ${repaired.options.length + 1}`);
    }

    // Repair correct answer
    if (typeof question?.correctAnswer === 'number' && 
        question.correctAnswer >= 0 && 
        question.correctAnswer < repaired.options.length) {
      repaired.correctAnswer = question.correctAnswer;
    } else {
      repaired.correctAnswer = 0;
    }

    // Repair explanation
    if (typeof repaired.explanation !== 'string') {
      repaired.explanation = String(repaired.explanation);
    }
    repaired.explanation = repaired.explanation.trim();
    if (repaired.explanation.length === 0) {
      repaired.explanation = `La réponse correcte est "${repaired.options[repaired.correctAnswer]}".`;
    }

    // Final validation
    const finalDiagnostic = diagnoseQuizQuestion(repaired);
    return finalDiagnostic.isValid ? repaired : null;

  } catch (error) {
    console.error('Question repair failed:', error);
    return null;
  }
}

/**
 * Generate a detailed report for debugging
 */
export function generateQuestionReport(question: any): string {
  const diagnostic = diagnoseQuizQuestion(question);
  
  const lines = [
    '=== QUIZ QUESTION DIAGNOSTIC REPORT ===',
    `Status: ${diagnostic.isValid ? '✅ VALID' : '❌ INVALID'}`,
    '',
    'Question Data:',
    `  Question: ${JSON.stringify(question?.question)}`,
    `  Options: ${JSON.stringify(question?.options)}`,
    `  Correct Answer: ${JSON.stringify(question?.correctAnswer)}`,
    `  Explanation: ${JSON.stringify(question?.explanation)}`,
    ''
  ];

  if (diagnostic.errors.length > 0) {
    lines.push('❌ ERRORS:');
    diagnostic.errors.forEach(error => lines.push(`  - ${error}`));
    lines.push('');
  }

  if (diagnostic.warnings.length > 0) {
    lines.push('⚠️  WARNINGS:');
    diagnostic.warnings.forEach(warning => lines.push(`  - ${warning}`));
    lines.push('');
  }

  if (diagnostic.suggestions.length > 0) {
    lines.push('💡 SUGGESTIONS:');
    diagnostic.suggestions.forEach(suggestion => lines.push(`  - ${suggestion}`));
    lines.push('');
  }

  lines.push('=== END DIAGNOSTIC ===');
  
  return lines.join('\n');
}