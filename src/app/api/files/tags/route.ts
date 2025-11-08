// Semantic File Tagging API Endpoint
// =================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import { unifiedEmbeddingService } from '@/lib/ai/unified-embedding-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
  category?: string;
}

export interface AutoTagResult {
  suggestedTags: TagSuggestion[];
  currentTags: string[];
  allTags: string[];
  metadata: {
    algorithm: string;
    timestamp: string;
    provider: string;
    dimensions: number;
  };
}

const PREDEFINED_TOPIC_TAGS = [
  // Mathematics
  'algebra', 'calculus', 'geometry', 'trigonometry', 'statistics', 'probability', 'linear-algebra', 'differential-equations',
  'integration', 'derivatives', 'limits', 'series', 'matrices', 'vectors', 'complex-numbers', 'discrete-math',
  
  // Physics
  'mechanics', 'thermodynamics', 'electromagnetism', 'optics', 'quantum-mechanics', 'relativity', 'waves', 'oscillations',
  'fluid-mechanics', 'solid-state-physics', 'nuclear-physics', 'astrophysics', 'classical-mechanics', 'modern-physics',
  
  // Chemistry
  'organic-chemistry', 'inorganic-chemistry', 'physical-chemistry', 'analytical-chemistry', 'biochemistry', 'thermochemistry',
  'kinetics', 'equilibrium', 'acid-base', 'redox', 'electrochemistry', 'periodic-table', 'bonding', 'stoichiometry',
  
  // Biology
  'cell-biology', 'molecular-biology', 'genetics', 'evolution', 'ecology', 'anatomy', 'physiology', 'botany', 'zoology',
  'microbiology', 'immunology', 'biotechnology', 'bioinformatics', 'developmental-biology', 'neuroscience',
  
  // Computer Science
  'algorithms', 'data-structures', 'programming', 'software-engineering', 'databases', 'networks', 'operating-systems',
  'artificial-intelligence', 'machine-learning', 'web-development', 'mobile-development', 'cybersecurity', 'blockchain',
  
  // Engineering
  'mechanical-engineering', 'electrical-engineering', 'civil-engineering', 'chemical-engineering', 'aerospace-engineering',
  'control-systems', 'signal-processing', 'materials-science', 'manufacturing', 'robotics',
  
  // Economics & Business
  'microeconomics', 'macroeconomics', 'finance', 'accounting', 'marketing', 'management', 'entrepreneurship', 'business-analysis',
  'financial-modeling', 'investments', 'corporate-finance', 'international-business',
  
  // Liberal Arts
  'history', 'philosophy', 'psychology', 'sociology', 'political-science', 'literature', 'linguistics', 'anthropology',
  'archaeology', 'cultural-studies', 'media-studies', 'communication',
  
  // Study Skills & Academic
  'note-taking', 'study-techniques', 'time-management', 'research-methods', 'critical-thinking', 'problem-solving',
  'exam-preparation', 'academic-writing', 'presentation-skills', 'collaborative-learning'
];

const TAG_CATEGORIES = {
  'subject': ['mathematics', 'physics', 'chemistry', 'biology', 'computer-science', 'engineering', 'economics', 'psychology', 'history'],
  'difficulty': ['beginner', 'intermediate', 'advanced', 'graduate', 'professional'],
  'type': ['theory', 'practice', 'problems', 'examples', 'reference', 'tutorial', 'lecture-notes', 'assignments'],
  'format': ['pdf', 'document', 'presentation', 'image', 'video', 'code', 'dataset'],
  'academic-level': ['high-school', 'undergraduate', 'graduate', 'phd', 'professional'],
  'study-phase': ['introduction', 'review', 'exam-prep', 'reference', 'supplemental'],
  'pedagogy': ['visual', 'analytical', 'computational', 'experimental', 'theoretical', 'applied']
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const analysisId = searchParams.get('analysisId');

    if (!fileId && !analysisId) {
      return NextResponse.json({ 
        error: 'Either fileId or analysisId parameter is required' 
      }, { status: 400 });
    }

    // Get file analysis
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

    const { data: fileAnalysis, error } = await query.single();

    if (error || !fileAnalysis) {
      return NextResponse.json({ 
        error: 'File analysis not found' 
      }, { status: 404 });
    }

    // Get tag suggestions based on content
    const tagSuggestions = await generateTagSuggestions(fileAnalysis);

    return NextResponse.json({
      success: true,
      fileId: fileAnalysis.file_id,
      analysisId: fileAnalysis.id,
      currentTags: fileAnalysis.topics || [],
      suggestedTags: tagSuggestions,
      metadata: {
        algorithm: 'semantic_embedding',
        timestamp: new Date().toISOString(),
        provider: 'cohere',
        dimensions: 1536
      }
    });

  } catch (error: any) {
    console.error('File tagging GET error:', error);
    
    return NextResponse.json({
      error: 'File tagging failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId, analysisId, newTags, action = 'update' } = await request.json();

    if (!fileId && !analysisId) {
      return NextResponse.json({ 
        error: 'Either fileId or analysisId parameter is required' 
      }, { status: 400 });
    }

    if (!newTags || !Array.isArray(newTags)) {
      return NextResponse.json({ 
        error: 'newTags array is required' 
      }, { status: 400 });
    }

    if (newTags.length > 20) {
      return NextResponse.json({ 
        error: 'Maximum 20 tags allowed' 
      }, { status: 400 });
    }

    // Get file analysis
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

    const { data: fileAnalysis, error } = await query.single();

    if (error || !fileAnalysis) {
      return NextResponse.json({ 
        error: 'File analysis not found' 
      }, { status: 404 });
    }

    // Update tags
    const { error: updateError } = await supabase
      .from('file_analyses')
      .update({
        topics: newTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileAnalysis.id);

    if (updateError) {
      throw new Error(`Failed to update tags: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      fileId: fileAnalysis.file_id,
      analysisId: fileAnalysis.id,
      updatedTags: newTags,
      action: action,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('File tagging POST error:', error);
    
    return NextResponse.json({
      error: 'File tagging failed',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Generate tag suggestions based on file content using embeddings
 */
async function generateTagSuggestions(fileAnalysis: any): Promise<TagSuggestion[]> {
  try {
    // Combine relevant text for tagging
    const textToAnalyze = [
      fileAnalysis.summary || '',
      (fileAnalysis.topics || []).join(' '),
      fileAnalysis.keywords || [],
      fileAnalysis.concepts || [],
      (fileAnalysis.analysis_result?.topics || []).join(' '),
      (fileAnalysis.analysis_result?.concepts || []).join(' ')
    ].filter(text => text && text.length > 0).join(' ');

    if (textToAnalyze.trim().length === 0) {
      return [];
    }

    // Generate embedding for the text
    const embeddingResult = await unifiedEmbeddingService.generateEmbeddings({
      texts: [textToAnalyze],
      provider: 'cohere',
      timeout: 30000
    });

    const textEmbedding = embeddingResult.embeddings[0];

    // Calculate similarities with predefined topic embeddings
    const similarities = await Promise.all(
      PREDEFINED_TOPIC_TAGS.map(async (tag) => {
        const tagEmbedding = await getTagEmbedding(tag);
        const similarity = cosineSimilarity(textEmbedding, tagEmbedding);
        return { tag, similarity };
      })
    );

    // Filter and sort suggestions
    const suggestions = similarities
      .filter(s => s.similarity > 0.6) // Threshold for relevance
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10) // Top 10 suggestions
      .map(s => ({
        tag: s.tag,
        confidence: s.similarity,
        reason: `Content similarity: ${(s.similarity * 100).toFixed(1)}%`,
        category: getTagCategory(s.tag)
      }));

    return suggestions;
  } catch (error) {
    console.error('Error generating tag suggestions:', error);
    return [];
  }
}

/**
 * Get or generate embedding for a predefined tag
 */
async function getTagEmbedding(tag: string): Promise<number[]> {
  // This is a simplified approach - in production, you might want to
  // store all predefined tag embeddings in the database for better performance
  try {
    const result = await unifiedEmbeddingService.generateEmbeddings({
      texts: [tag],
      provider: 'cohere',
      timeout: 10000
    });
    return result.embeddings[0];
  } catch (error) {
    console.warn(`Failed to generate embedding for tag "${tag}"`);
    // Return a random embedding as fallback
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Determine category for a tag
 */
function getTagCategory(tag: string): string {
  const lowerTag = tag.toLowerCase();
  
  for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
    if (tags.some(t => lowerTag.includes(t.toLowerCase()))) {
      return category;
    }
  }
  
  return 'general';
}

/**
 * Get all available tags (for autocomplete)
 */
export async function GET_TAGS(request: NextRequest) {
  try {
    // Return all predefined tags grouped by category
    return NextResponse.json({
      success: true,
      categories: TAG_CATEGORIES,
      allTags: PREDEFINED_TOPIC_TAGS,
      totalTags: PREDEFINED_TOPIC_TAGS.length
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to fetch tags',
      details: error.message
    }, { status: 500 });
  }
}