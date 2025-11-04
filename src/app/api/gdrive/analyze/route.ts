// File Analysis API Endpoint
// Analyzes files from Google Drive using AI
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { extractTextFromFile, getFileMetadata } from '@/lib/ai/file-processor';
import { analyzeFile } from '@/lib/ai/ai-analysis';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId, accessToken } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Use provided access token or session token
    const token = accessToken || session.accessToken;
    if (!token) {
      return NextResponse.json({ error: 'No Google Drive access token available' }, { status: 401 });
    }

    // Initialize Google Drive API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    const drive = google.drive({ version: 'v3', auth });

    // Get file metadata
    const fileMetadata = await getFileMetadata(fileId, token);
    
    // Update file upload progress
    await supabase
      .from('file_uploads')
      .update({ 
        upload_status: 'processing',
        progress_percentage: 25,
        processing_steps: ['File metadata retrieved', 'Starting content extraction']
      })
      .eq('user_id', session.user.id)
      .eq('file_id', fileId);

    // Extract content from file
    const extractionResult = await extractTextFromFile(
      fileId, 
      token, 
      fileMetadata.mimeType
    );

    // Update progress
    await supabase
      .from('file_uploads')
      .update({ 
        progress_percentage: 50,
        processing_steps: ['File metadata retrieved', 'Content extracted', 'Starting AI analysis']
      })
      .eq('user_id', session.user.id)
      .eq('file_id', fileId);

    // Analyze file content using AI
    const analysisResult = await analyzeFile(
      fileId,
      extractionResult.fileName,
      extractionResult.fileType,
      extractionResult.text,
      token,
      session.user.id,
      fileMetadata.mimeType
    );

    // Update progress
    await supabase
      .from('file_uploads')
      .update({ 
        progress_percentage: 75,
        processing_steps: ['File metadata retrieved', 'Content extracted', 'AI analysis completed', 'Storing results']
      })
      .eq('user_id', session.user.id)
      .eq('file_id', fileId);

    // Generate embedding for semantic search (if Cohere is available)
    let embedding = null;
    try {
      // This would typically use Cohere to generate embeddings
      // For now, we'll skip this step
      console.log('Embedding generation would happen here');
    } catch (error) {
      console.warn('Could not generate embedding:', error);
    }

    // Store analysis result in database
    const { data: storedAnalysis, error: dbError } = await supabase
      .from('file_analyses')
      .insert({
        user_id: session.user.id,
        file_id: fileId,
        file_name: analysisResult.fileName,
        file_type: extractionResult.fileType,
        mime_type: fileMetadata.mimeType,
        file_size: parseInt(fileMetadata.size || '0'),
        analysis_result: analysisResult.analysis,
        topics: analysisResult.analysis.topics,
        concepts: analysisResult.analysis.concepts,
        difficulty_level: analysisResult.analysis.difficultyLevel,
        estimated_study_time: analysisResult.analysis.estimatedStudyTime,
        subject: analysisResult.analysis.subject,
        keywords: analysisResult.analysis.keywords,
        summary: analysisResult.analysis.summary,
        key_insights: analysisResult.analysis.keyInsights,
        ai_recommendations: analysisResult.analysis.aiRecommendations,
        embedding: embedding
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to store analysis results',
        details: dbError.message 
      }, { status: 500 });
    }

    // Update upload status to completed
    await supabase
      .from('file_uploads')
      .update({ 
        upload_status: 'completed',
        progress_percentage: 100,
        processing_steps: ['File metadata retrieved', 'Content extracted', 'AI analysis completed', 'Results stored successfully']
      })
      .eq('user_id', session.user.id)
      .eq('file_id', fileId);

    return NextResponse.json({
      success: true,
      analysisId: storedAnalysis.id,
      fileId: fileId,
      fileName: analysisResult.fileName,
      analysis: analysisResult.analysis,
      message: 'File analysis completed successfully'
    });

  } catch (error: any) {
    console.error('File analysis error:', error);
    
    // Update upload status to failed if possible
    try {
      const sessionForUpdate = await getServerSession();
      const { fileId } = await request.json();
      if (fileId) {
        await supabase
          .from('file_uploads')
          .update({ 
            upload_status: 'failed',
            error_message: error.message
          })
          .eq('user_id', sessionForUpdate?.user?.id)
          .eq('file_id', fileId);
      }
    } catch (updateError) {
      console.error('Failed to update upload status:', updateError);
    }

    return NextResponse.json({
      error: 'File analysis failed',
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
    const analysisId = searchParams.get('analysisId');

    let query = supabase
      .from('file_analyses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    if (fileId) {
      query = query.eq('file_id', fileId);
    } else if (analysisId) {
      query = query.eq('id', analysisId);
    }

    const { data: analyses, error } = await query.order('analysis_date', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch analyses',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      analyses: analyses || []
    });

  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json({
      error: 'Failed to fetch analyses',
      details: error.message
    }, { status: 500 });
  }
}
