// File Semantic Search API Endpoint
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

    const { query, fileType, subject, limit = 10, minSimilarity = 0.6 } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (query.trim().length === 0) {
      return NextResponse.json({ error: 'Query cannot be empty' }, { status: 400 });
    }

    // Perform semantic search using file embeddings
    const results = await fileEmbeddingService.findSimilarFiles({
      userId: session.user.id,
      query: query.trim(),
      fileType,
      subject,
      limit,
      minSimilarity
    });

    // Format results for frontend consumption
    const formattedResults = results.map(result => ({
      id: result.file.id,
      fileId: result.file.file_id,
      fileName: result.file.file_name,
      fileType: result.file.file_type,
      subject: result.file.subject,
      topics: result.file.topics || [],
      summary: result.file.summary || '',
      similarity: result.similarity,
      embeddingType: result.embeddingType,
      analysisDate: result.file.created_at,
      estimatedStudyTime: result.file.estimated_study_time,
      difficultyLevel: result.file.difficulty_level,
      keyInsights: result.file.key_insights || []
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      query,
      totalFound: formattedResults.length,
      searchMetadata: {
        searchType: 'semantic',
        embeddingProvider: 'cohere',
        timestamp: new Date().toISOString(),
        filters: {
          fileType,
          subject,
          minSimilarity
        }
      }
    });

  } catch (error: any) {
    console.error('File semantic search error:', error);
    
    return NextResponse.json({
      error: 'File search failed',
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
    const fileId = searchParams.get('fileId');
    const userId = session.user.id;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Find files similar to the specified file
    const similarFiles = await fileEmbeddingService.findSimilarFilesToFile(userId, fileId, 5);

    const formattedResults = similarFiles.map(result => ({
      id: result.file.id,
      fileId: result.file.file_id,
      fileName: result.file.file_name,
      fileType: result.file.file_type,
      subject: result.file.subject,
      topics: result.file.topics || [],
      summary: result.file.summary || '',
      similarity: result.similarity,
      analysisDate: result.file.created_at
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      sourceFileId: fileId,
      totalFound: formattedResults.length
    });

  } catch (error: any) {
    console.error('Find similar files error:', error);
    
    return NextResponse.json({
      error: 'Similar files search failed',
      details: error.message
    }, { status: 500 });
  }
}