// File Discovery API Endpoint
// ===========================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { fileEmbeddingService } from '@/lib/ai/file-embedding-service';
import { createClient } from '@supabase/supabase-js';

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

    const { discoveryType, preferences, limit = 20 } = await request.json();

    if (!discoveryType || typeof discoveryType !== 'string') {
      return NextResponse.json({ error: 'Discovery type is required' }, { status: 400 });
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Preferences object is required' }, { status: 400 });
    }

    let results: any[] = [];

    switch (discoveryType) {
      case 'by_topic':
        results = await discoverByTopic(session.user.id, preferences.topic, limit);
        break;
        
      case 'by_difficulty':
        results = await discoverByDifficulty(session.user.id, preferences.difficulty, limit);
        break;
        
      case 'by_time_period':
        results = await discoverByTimePeriod(session.user.id, preferences.period, limit);
        break;
        
      case 'by_subject_progression':
        results = await discoverBySubjectProgression(session.user.id, preferences.subject, limit);
        break;
        
      case 'similar_to_recent':
        results = await discoverSimilarToRecent(session.user.id, preferences.recentFileIds, limit);
        break;
        
      case 'random_exploration':
        results = await discoverRandomExploration(session.user.id, preferences.preferences, limit);
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid discovery type. Supported types: by_topic, by_difficulty, by_time_period, by_subject_progression, similar_to_recent, random_exploration' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discoveryType,
      results,
      preferences,
      totalFound: results.length,
      discoveryMetadata: {
        algorithm: discoveryType,
        timestamp: new Date().toISOString(),
        userId: session.user.id
      }
    });

  } catch (error: any) {
    console.error('File discovery error:', error);
    
    return NextResponse.json({
      error: 'File discovery failed',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Discover files by topic using semantic search
 */
async function discoverByTopic(userId: string, topic: string, limit: number) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('Topic is required for discovery by topic');
  }

  // Use semantic search to find files related to the topic
  const similarFiles = await fileEmbeddingService.findSimilarFiles({
    userId,
    query: topic,
    limit,
    minSimilarity: 0.5 // Lower threshold for discovery
  });

  return similarFiles.map(result => ({
    id: result.file.id,
    fileId: result.file.file_id,
    fileName: result.file.file_name,
    fileType: result.file.file_type,
    subject: result.file.subject,
    topics: result.file.topics || [],
    summary: result.file.summary || '',
    similarity: result.similarity,
    discoveryReason: `Matches topic: "${topic}"`,
    analysisDate: result.file.created_at
  }));
}

/**
 * Discover files by difficulty level
 */
async function discoverByDifficulty(userId: string, difficulty: string, limit: number) {
  if (!difficulty || typeof difficulty !== 'string') {
    throw new Error('Difficulty level is required for discovery by difficulty');
  }

  const { data: files, error } = await supabase
    .from('file_analyses')
    .select('*')
    .eq('user_id', userId)
    .eq('difficulty_level', difficulty)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch files by difficulty: ${error.message}`);
  }

  return files?.map(file => ({
    id: file.id,
    fileId: file.file_id,
    fileName: file.file_name,
    fileType: file.file_type,
    subject: file.subject,
    topics: file.topics || [],
    summary: file.summary || '',
    difficultyLevel: file.difficulty_level,
    discoveryReason: `Difficulty level: ${difficulty}`,
    analysisDate: file.created_at
  })) || [];
}

/**
 * Discover files by time period (recent, last month, etc.)
 */
async function discoverByTimePeriod(userId: string, period: string, limit: number) {
  if (!period || typeof period !== 'string') {
    throw new Error('Time period is required for discovery by time period');
  }

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'this_week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'this_month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last_month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = lastMonth;
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      throw new Error('Invalid time period. Supported: this_week, this_month, last_month, this_year');
  }

  const { data: files, error } = await supabase
    .from('file_analyses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch files by time period: ${error.message}`);
  }

  return files?.map(file => ({
    id: file.id,
    fileId: file.file_id,
    fileName: file.file_name,
    fileType: file.file_type,
    subject: file.subject,
    topics: file.topics || [],
    summary: file.summary || '',
    timePeriod: period,
    discoveryReason: `Added during ${period.replace('_', ' ')}`,
    analysisDate: file.created_at
  })) || [];
}

/**
 * Discover files for subject progression
 */
async function discoverBySubjectProgression(userId: string, subject: string, limit: number) {
  if (!subject || typeof subject !== 'string') {
    throw new Error('Subject is required for discovery by subject progression');
  }

  // Find files in the same subject, ordered by complexity (difficulty level)
  const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
  
  const { data: files, error } = await supabase
    .from('file_analyses')
    .select('*')
    .eq('user_id', userId)
    .eq('subject', subject)
    .eq('is_active', true)
    .order('difficulty_level', { 
      ascending: true,
      nullsFirst: false 
    })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch files for subject progression: ${error.message}`);
  }

  return files?.map(file => ({
    id: file.id,
    fileId: file.file_id,
    fileName: file.file_name,
    fileType: file.file_type,
    subject: file.subject,
    topics: file.topics || [],
    summary: file.summary || '',
    difficultyLevel: file.difficulty_level,
    discoveryReason: `Subject progression: ${subject}`,
    analysisDate: file.created_at
  })) || [];
}

/**
 * Discover files similar to recently accessed files
 */
async function discoverSimilarToRecent(userId: string, recentFileIds: string[], limit: number) {
  if (!recentFileIds || !Array.isArray(recentFileIds) || recentFileIds.length === 0) {
    throw new Error('Recent file IDs array is required for discovery similar to recent');
  }

  const allSimilarFiles: any[] = [];

  // Get similar files for each recent file
  for (const fileId of recentFileIds.slice(0, 5)) { // Limit to 5 recent files
    try {
      const similarFiles = await fileEmbeddingService.findSimilarFilesToFile(userId, fileId, 3);
      allSimilarFiles.push(...similarFiles);
    } catch (error) {
      console.warn(`Failed to find similar files for ${fileId}:`, error);
    }
  }

  // Remove duplicates and sort by similarity
  const uniqueFiles = allSimilarFiles
    .filter((file, index, arr) => arr.findIndex(f => f.file.id === file.file.id) === index)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return uniqueFiles.map(result => ({
    id: result.file.id,
    fileId: result.file.file_id,
    fileName: result.file.file_name,
    fileType: result.file.file_type,
    subject: result.file.subject,
    topics: result.file.topics || [],
    summary: result.file.summary || '',
    similarity: result.similarity,
    discoveryReason: 'Similar to your recent files',
    analysisDate: result.file.created_at
  }));
}

/**
 * Random exploration - discover files based on user preferences
 */
async function discoverRandomExploration(userId: string, preferences: any, limit: number) {
  if (!preferences || typeof preferences !== 'object') {
    throw new Error('Preferences object is required for random exploration');
  }

  // Build a random query based on preferences
  const subjects = preferences.subjects || ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
  const difficulties = preferences.difficulties || ['beginner', 'intermediate', 'advanced'];
  const fileTypes = preferences.fileTypes || ['pdf', 'doc', 'image'];

  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
  const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  const randomFileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];

  // Query files with random criteria
  let query = supabase
    .from('file_analyses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (Math.random() > 0.5) {
    query = query.eq('subject', randomSubject);
  }

  if (Math.random() > 0.7) {
    query = query.eq('difficulty_level', randomDifficulty);
  }

  if (Math.random() > 0.6) {
    query = query.eq('file_type', randomFileType);
  }

  const { data: files, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch files for random exploration: ${error.message}`);
  }

  return files?.map(file => ({
    id: file.id,
    fileId: file.file_id,
    fileName: file.file_name,
    fileType: file.file_type,
    subject: file.subject,
    topics: file.topics || [],
    summary: file.summary || '',
    difficultyLevel: file.difficulty_level,
    discoveryReason: 'Random exploration',
    analysisDate: file.created_at
  })) || [];
}