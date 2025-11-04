// AI Suggestions API Endpoints
// Handle generation, retrieval, and management of AI study suggestions
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import { 
  generateAllSuggestions, 
  getCachedSuggestions, 
  cacheSuggestions,
  type StudentProfile,
  type Suggestion 
} from '../../../lib/ai/ai-suggestions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/suggestions - Get AI suggestions for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const type = searchParams.get('type'); // Filter by suggestion type

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const cached = getCachedSuggestions(session.user.id);
      if (cached) {
        // Filter by type if specified
        const filteredSuggestions = type 
          ? cached.filter((s: Suggestion) => s.type === type)
          : cached;
        
        return NextResponse.json({
          success: true,
          suggestions: filteredSuggestions,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Get active suggestions from database
    let query = supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (type) {
      query = query.eq('suggestion_type', type);
    }

    const { data: suggestions, error } = await query
      .order('priority', { ascending: false })
      .order('estimated_impact', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching suggestions:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch suggestions',
        details: error.message 
      }, { status: 500 });
    }

    // Convert database format to frontend format
    const formattedSuggestions = suggestions?.map(suggestion => ({
      id: suggestion.id,
      type: suggestion.suggestion_type,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      estimatedImpact: suggestion.estimated_impact,
      reasoning: suggestion.reasoning,
      actionableSteps: suggestion.actionable_steps || [],
      relatedTopics: suggestion.related_topics || [],
      confidenceScore: suggestion.confidence_score,
      metadata: suggestion.metadata || {}
    })) || [];

    return NextResponse.json({
      success: true,
      suggestions: formattedSuggestions,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in GET /api/suggestions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/suggestions/generate - Generate new AI suggestions
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { forceRefresh = false } = await request.json().catch(() => ({ forceRefresh: false }));

    // Check if we have recent suggestions (unless force refresh)
    if (!forceRefresh) {
      const { data: recentSuggestions } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .gt('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // 6 hours
        .limit(1);

      if (recentSuggestions && recentSuggestions.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Recent suggestions already exist',
          suggestionsGenerated: 0
        });
      }
    }

    // Get or create student profile
    let { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile) {
      // Create a basic profile if it doesn't exist
      const defaultProfile: StudentProfile = {
        userId: session.user.id,
        performanceData: {
          subjectScores: {},
          weakAreas: [],
          strongAreas: [],
          recentActivities: [],
          studyTime: 120, // 2 hours default
          learningStyle: 'visual',
          examTarget: 'JEE 2025',
          currentProgress: {}
        },
        historicalData: {
          improvementTrends: {},
          struggleTopics: [],
          successPatterns: [],
          timeSpentBySubject: {}
        }
      };

      const { data: newProfile, error: createError } = await supabase
        .from('student_profiles')
        .insert({
          user_id: session.user.id,
          performance_data: defaultProfile.performanceData,
          historical_data: defaultProfile.historicalData
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating student profile:', createError);
        return NextResponse.json({ 
          error: 'Failed to create student profile',
          details: createError.message 
        }, { status: 500 });
      }

      profile = newProfile;
    }

    // Build student profile for AI analysis
    const studentProfile: StudentProfile = {
      userId: session.user.id,
      performanceData: profile.performance_data || {},
      historicalData: profile.historical_data || {}
    };

    // Generate AI suggestions
    const suggestions = await generateAllSuggestions(studentProfile);
    
    const generationTime = Date.now() - startTime;

    // Store suggestions in database
    if (suggestions.length > 0) {
      const suggestionsToInsert = suggestions.map((suggestion: Suggestion) => ({
        user_id: session.user.id,
        suggestion_type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        estimated_impact: suggestion.estimatedImpact,
        reasoning: suggestion.reasoning,
        actionable_steps: suggestion.actionableSteps,
        related_topics: suggestion.relatedTopics || [],
        confidence_score: suggestion.confidenceScore,
        metadata: suggestion.metadata || {},
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
      }));

      const { error: insertError } = await supabase
        .from('ai_suggestions')
        .insert(suggestionsToInsert);

      if (insertError) {
        console.error('Error storing suggestions:', insertError);
        return NextResponse.json({ 
          error: 'Failed to store suggestions',
          details: insertError.message 
        }, { status: 500 });
      }
    }

    // Cache suggestions
    cacheSuggestions(session.user.id, suggestions);

    // Log generation
    await supabase
      .from('suggestion_generation_logs')
      .insert({
        user_id: session.user.id,
        generation_type: 'all',
        input_data: studentProfile,
        output_count: suggestions.length,
        generation_time_ms: generationTime,
        success: true
      });

    return NextResponse.json({
      success: true,
      suggestionsGenerated: suggestions.length,
      generationTime,
      message: 'AI suggestions generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    
    // Log failed generation
    try {
      const session = await getServerSession();
      if (session?.user?.id) {
        await supabase
          .from('suggestion_generation_logs')
          .insert({
            user_id: session.user.id,
            generation_type: 'all',
            input_data: {},
            output_count: 0,
            generation_time_ms: Date.now() - startTime,
            success: false,
            error_message: error.message
          });
      }
    } catch (logError) {
      console.error('Error logging failed generation:', logError);
    }

    return NextResponse.json({
      error: 'Failed to generate suggestions',
      details: error.message
    }, { status: 500 });
  }
}

// PATCH /api/suggestions/:id - Update suggestion (e.g., mark as applied)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const suggestionId = searchParams.get('id');

    if (!suggestionId) {
      return NextResponse.json({ error: 'Suggestion ID is required' }, { status: 400 });
    }

    const { action, feedbackRating, feedbackText } = await request.json();

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    let interactionType = '';

    switch (action) {
      case 'apply':
        updateData.is_applied = true;
        updateData.applied_at = new Date().toISOString();
        interactionType = 'applied';
        break;
      case 'dismiss':
        updateData.is_active = false;
        interactionType = 'dismissed';
        break;
      case 'feedback':
        interactionType = 'feedback';
        if (feedbackRating !== undefined) {
          // Store feedback in interactions table
          await supabase
            .from('suggestion_interactions')
            .insert({
              user_id: session.user.id,
              suggestion_id: suggestionId,
              interaction_type: 'feedback',
              feedback_rating: feedbackRating,
              feedback_text: feedbackText
            });
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update suggestion
    const { error } = await supabase
      .from('ai_suggestions')
      .update(updateData)
      .eq('id', suggestionId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating suggestion:', error);
      return NextResponse.json({ 
        error: 'Failed to update suggestion',
        details: error.message 
      }, { status: 500 });
    }

    // Log interaction
    if (interactionType !== 'feedback') {
      await supabase
        .from('suggestion_interactions')
        .insert({
          user_id: session.user.id,
          suggestion_id: suggestionId,
          interaction_type: interactionType
        });
    }

    return NextResponse.json({
      success: true,
      message: `Suggestion ${action}ed successfully`
    });

  } catch (error: any) {
    console.error('Error in PATCH /api/suggestions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
