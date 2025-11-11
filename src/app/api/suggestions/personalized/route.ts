// Personalized Suggestions API Endpoint
// ====================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { personalizedSuggestionsEngine } from '@/lib/ai/personalized-suggestions-engine';
import { generatePersonalizedSuggestions, type StudySuggestion } from '@/lib/ai/personalized-suggestions-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, message: 'Authorization header missing' };
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { authorized: false, message: 'Invalid or expired token' };
  }
  
  return { authorized: true, user };
}

// POST /api/suggestions/personalized - Generate personalized study suggestions
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateUser(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: 401 });
    }

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Parse request options
    const options = await request.json().catch(() => ({}));
    const {
      context,
      timeAvailable,
      preferredSubjects,
      currentMood,
      forceRefresh = false
    } = options;

    console.log('🔄 Generating personalized suggestions for user:', userId);
    console.log('📋 Options:', { context, timeAvailable, preferredSubjects, currentMood });

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: recentSuggestions } = await supabase
        .from('ai_suggestions')
        .select('id, suggestion_type')
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('suggestion_type', ['study_schedule', 'content_review', 'practice_test', 'break_reminder', 'resource_recommendation'])
        .gt('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // 2 hours
        .limit(1);

      if (recentSuggestions && recentSuggestions.length > 0) {
        console.log('📋 Using cached suggestions');
        return NextResponse.json({
          success: true,
          message: 'Recent personalized suggestions already exist',
          suggestionsGenerated: 0,
          cached: true
        });
      }
    }

    // Generate personalized suggestions using new engine
    const suggestions = await generatePersonalizedSuggestions(userId, {
      context,
      timeAvailable,
      preferredSubjects,
      currentMood
    });

    console.log('✅ Generated', suggestions.length, 'personalized suggestions');

    /**
     * Convert string priority to integer for database storage
     * Maps: "low" -> 1, "medium" -> 2, "high" -> 3
     */
    function convertPriorityToInt(priority: string | number): { priority: number, priority_text: string } {
      // If already a number, return it with default text
      if (typeof priority === 'number') {
        return {
          priority,
          priority_text: priority >= 3 ? 'high' : priority === 2 ? 'medium' : 'low'
        };
      }
      
      // Convert string to integer
      const priorityMap: Record<string, number> = {
        'low': 1,
        'medium': 2,
        'high': 3
      };
      
      const intValue = priorityMap[priority.toLowerCase()] || 2; // Default to medium
      return { priority: intValue, priority_text: priority.toLowerCase() };
    }

    // Convert to database format and store
    if (suggestions.length > 0) {
      const suggestionsToInsert = suggestions.map((suggestion: StudySuggestion) => {
        const priorityData = convertPriorityToInt(suggestion.priority);
        return {
          user_id: userId,
          suggestion_type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          priority: priorityData.priority, // Integer value for database
          priority_text: priorityData.priority_text, // String value for readability
          estimated_impact: suggestion.difficulty === 'hard' ? 9 :
                          suggestion.difficulty === 'medium' ? 6 : 3,
          reasoning: suggestion.reasoning,
          actionable_steps: [suggestion.description], // Use description as primary step
          related_topics: suggestion.subjects,
          confidence_score: suggestion.confidence,
          metadata: {
            ...suggestion.metadata,
            difficulty: suggestion.difficulty,
            estimatedDuration: suggestion.estimatedDuration,
            tags: suggestion.tags,
            actions: suggestion.actions || []
          },
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
        };
      });

      // Clear old personalized suggestions first
      await supabase
        .from('ai_suggestions')
        .delete()
        .eq('user_id', userId)
        .in('suggestion_type', ['study_schedule', 'content_review', 'practice_test', 'break_reminder', 'resource_recommendation']);

      // Insert new suggestions
      const { error: insertError } = await supabase
        .from('ai_suggestions')
        .insert(suggestionsToInsert);

      if (insertError) {
        console.error('❌ Error storing personalized suggestions:', insertError);
        return NextResponse.json({ 
          error: 'Failed to store suggestions',
          details: insertError.message 
        }, { status: 500 });
      }

      console.log('💾 Stored suggestions in database');
    }

    return NextResponse.json({
      success: true,
      suggestionsGenerated: suggestions.length,
      message: 'Personalized suggestions generated successfully',
      cached: false
    });

  } catch (error: any) {
    console.error('❌ Error generating personalized suggestions:', error);
    return NextResponse.json({
      error: 'Failed to generate personalized suggestions',
      details: error.message
    }, { status: 500 });
  }
}

// GET /api/suggestions/personalized - Get personalized suggestions
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateUser(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: 401 });
    }

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    console.log('📡 Fetching personalized suggestions for user:', userId);

    // Get personalized suggestions from database
    let query = supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('suggestion_type', ['study_schedule', 'content_review', 'practice_test', 'break_reminder', 'resource_recommendation'])
      .gt('expires_at', new Date().toISOString());

    const { data: suggestions, error } = await query
      .order('priority', { ascending: false })
      .order('confidence_score', { ascending: false })
      .limit(15);

    if (error) {
      console.error('❌ Error fetching personalized suggestions:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch suggestions',
        details: error.message 
      }, { status: 500 });
    }

    // Convert to frontend format
    const formattedSuggestions = suggestions?.map(suggestion => {
      // Handle priority conversion - support both new (priority_text) and legacy (priority) formats
      let priority: 'low' | 'medium' | 'high' = 'medium';
      if (suggestion.priority_text) {
        priority = suggestion.priority_text.toLowerCase() as 'low' | 'medium' | 'high';
      } else if (typeof suggestion.priority === 'string') {
        priority = suggestion.priority.toLowerCase() as 'low' | 'medium' | 'high';
      } else if (typeof suggestion.priority === 'number') {
        // Map 1..3 to low/medium/high
        if (suggestion.priority >= 3) priority = 'high';
        else if (suggestion.priority === 2) priority = 'medium';
        else priority = 'low';
      }
      
      return {
        id: suggestion.id,
        type: mapSuggestionType(suggestion.suggestion_type),
        title: suggestion.title,
        description: suggestion.description,
        priority, // String format for frontend
        estimatedImpact: suggestion.estimated_impact,
        reasoning: suggestion.reasoning,
        actionableSteps: suggestion.actionable_steps || [suggestion.description],
        relatedTopics: suggestion.related_topics || [],
        confidenceScore: suggestion.confidence_score,
        metadata: {
          ...suggestion.metadata,
          difficulty: suggestion.metadata?.difficulty || 'medium',
          estimatedDuration: suggestion.metadata?.estimatedDuration || 30,
          tags: suggestion.metadata?.tags || [],
          actions: suggestion.metadata?.actions || []
        }
      };
    }) || [];

    console.log('✅ Returning', formattedSuggestions.length, 'personalized suggestions');

    return NextResponse.json({
      success: true,
      suggestions: formattedSuggestions,
      cached: !refresh,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in GET /api/suggestions/personalized:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to map suggestion types
function mapSuggestionType(dbType: string): 'topic' | 'weakness' | 'insight' | 'analysis' | 'recommendation' {
  const typeMapping: Record<string, 'topic' | 'weakness' | 'insight' | 'analysis' | 'recommendation'> = {
    'study_schedule': 'recommendation',
    'content_review': 'topic',
    'practice_test': 'analysis',
    'break_reminder': 'insight',
    'resource_recommendation': 'recommendation'
  };

  return typeMapping[dbType] || 'recommendation';
}
