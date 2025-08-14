/**
 * Optimized Quiz Question Generation API
 * Handles quiz question generation with caching and performance optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestionAction } from '@/app/actions';
import { logger } from '@/lib/logger';

interface QuizGenerationRequest {
  competenceId: string;
  userId: string;
  userLevel: number;
  learningStyle: string;
  language: string;
  questionIndex: number;
  totalQuestions: number;
  askedQuestions: string[];
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body: QuizGenerationRequest = await request.json();
    
    // Validate request parameters
    if (!body.competenceId || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: competenceId and userId' },
        { status: 400 }
      );
    }

    logger.info('Processing quiz question generation request', {
      action: 'api_quiz_generate_start',
      competenceId: body.competenceId,
      userId: body.userId,
      questionIndex: body.questionIndex
    });

    // Call the existing action - only pass supported properties
    const result = await generateQuizQuestionAction({
      competenceId: body.competenceId,
      userId: body.userId,
      userLevel: body.userLevel,
      learningStyle: body.learningStyle as any,
      language: body.language
    });

    const responseTime = performance.now() - startTime;
    
    logger.info('Quiz question generation completed successfully', {
      action: 'api_quiz_generate_success',
      competenceId: body.competenceId,
      responseTime: Math.round(responseTime * 100) / 100
    });

    // Add cache headers for better performance
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes cache
    response.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    
    return response;

  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    logger.error('Quiz question generation failed', {
      action: 'api_quiz_generate_error',
      error: error instanceof Error ? error.message : String(error),
      responseTime: Math.round(responseTime * 100) / 100
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate quiz question',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}