/**
 * Optimized Quiz Explanation Generation API
 * Handles explanation generation with caching and performance optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateExplanationAction } from '@/app/actions';
import { logger } from '@/lib/logger';

interface ExplanationRequest {
  topic: string;
  question: string;
  answer: string;
  correctAnswer: string;
  language?: string;
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body: ExplanationRequest = await request.json();
    
    // Validate request parameters
    if (!body.topic || !body.question || !body.correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required parameters: topic, question, and correctAnswer' },
        { status: 400 }
      );
    }

    logger.info('Processing explanation generation request', {
      action: 'api_explanation_generate_start',
      topic: body.topic,
      questionLength: body.question.length
    });

    // Call the existing action
    const result = await generateExplanationAction({
      topic: body.topic,
      question: body.question,
      answer: body.answer,
      correctAnswer: body.correctAnswer
    });

    const responseTime = performance.now() - startTime;
    
    logger.info('Explanation generation completed successfully', {
      action: 'api_explanation_generate_success',
      topic: body.topic,
      responseTime: Math.round(responseTime * 100) / 100 // Round to 2 decimal places as number
    });

    // Add cache headers for better performance (longer cache for explanations)
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=600'); // 10 minutes cache
    response.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    
    return response;

  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    logger.error('Explanation generation failed', {
      action: 'api_explanation_generate_error',
      error: error instanceof Error ? error.message : String(error),
      responseTime: Math.round(responseTime * 100) / 100 // Round to 2 decimal places as number
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate explanation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}