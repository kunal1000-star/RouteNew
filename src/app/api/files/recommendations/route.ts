// File Recommendations API Endpoint
// ================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { fileEmbeddingService } from '@/lib/ai/file-embedding-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      currentFileId, 
      currentSubject, 
      studyGoal, 
      recentFiles,
      limit = 10 
    } = await request.json();

    if (!currentFileId && !currentSubject && !recentFiles) {
      return NextResponse.json({ 
        error: 'At least one context parameter is required (currentFileId, currentSubject, or recentFiles)' 
      }, { status: 400 });
    }

    // Generate file recommendations based on context
    const recommendations = await fileEmbeddingService.generateFileRecommendations(
      session.user.id,
      {
        currentFileId,
        currentSubject,
        studyGoal,
        recentFiles
      }
    );

    // Limit the number of recommendations
    const limitedRecommendations = recommendations.slice(0, limit);

    // Format recommendations for frontend
    const formattedRecommendations = limitedRecommendations.map(rec => ({
      id: rec.file.id,
      fileId: rec.file.file_id,
      fileName: rec.file.file_name,
      fileType: rec.file.file_type,
      subject: rec.file.subject,
      topics: rec.file.topics || [],
      summary: rec.file.summary || '',
      recommendationType: rec.type,
      reason: rec.reason,
      confidence: rec.confidence,
      analysisDate: rec.file.created_at,
      estimatedStudyTime: rec.file.estimated_study_time,
      difficultyLevel: rec.file.difficulty_level
    }));

    return NextResponse.json({
      success: true,
      recommendations: formattedRecommendations,
      context: {
        currentFileId,
        currentSubject,
        studyGoal,
        recentFiles
      },
      totalFound: formattedRecommendations.length,
      recommendationMetadata: {
        algorithm: 'semantic_similarity',
        embeddingProvider: 'cohere',
        timestamp: new Date().toISOString(),
        recommendationTypes: {
          similar: formattedRecommendations.filter(r => r.recommendationType === 'similar').length,
          complementary: formattedRecommendations.filter(r => r.recommendationType === 'complementary').length,
          related: formattedRecommendations.filter(r => r.recommendationType === 'related').length,
          prerequisite: formattedRecommendations.filter(r => r.recommendationType === 'prerequisite').length
        }
      }
    });

  } catch (error: any) {
    console.error('File recommendations error:', error);
    
    return NextResponse.json({
      error: 'File recommendations failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const currentFileId = searchParams.get('currentFileId');
    const currentSubject = searchParams.get('currentSubject');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!currentFileId && !currentSubject) {
      return NextResponse.json({ 
        error: 'currentFileId or currentSubject parameter is required' 
      }, { status: 400 });
    }

    // Generate recommendations for GET request (simpler)
    const recommendations = await fileEmbeddingService.generateFileRecommendations(
      session.user.id,
      {
        currentFileId: currentFileId || undefined,
        currentSubject: currentSubject || undefined
      }
    );

    const limitedRecommendations = recommendations.slice(0, limit);

    const formattedRecommendations = limitedRecommendations.map(rec => ({
      id: rec.file.id,
      fileId: rec.file.file_id,
      fileName: rec.file.file_name,
      fileType: rec.file.file_type,
      subject: rec.file.subject,
      recommendationType: rec.type,
      reason: rec.reason,
      confidence: rec.confidence
    }));

    return NextResponse.json({
      success: true,
      recommendations: formattedRecommendations,
      query: {
        currentFileId,
        currentSubject,
        limit
      },
      totalFound: formattedRecommendations.length
    });

  } catch (error: any) {
    console.error('File recommendations GET error:', error);
    
    return NextResponse.json({
      error: 'File recommendations failed',
      details: error.message
    }, { status: 500 });
  }
}