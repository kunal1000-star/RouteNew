// AI Suggestions API Endpoints
// Handle generation, retrieval, and management of AI study suggestions
import { NextRequest, NextResponse } from 'next/server';
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

function getDbForToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}

async function authenticateUser(request: NextRequest) {
  console.log('🔐 Authenticating user request...');
  
  // Check for Supabase Bearer token first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    console.log('🔑 Supabase Bearer token found');
    const token = authHeader.substring(7);
    const db = getDbForToken(token);
    const { data: { user }, error } = await db.auth.getUser();
    
    if (error || !user) {
      console.log('❌ Supabase token validation failed:', error?.message);
      return { authorized: false, message: 'Invalid or expired Supabase token' };
    }
    
    console.log('✅ Supabase authentication successful');
    return { authorized: true, user, token };
  }
  
  // Check for NextAuth headers
  const nextAuthUser = request.headers.get('X-NextAuth-User');
  const nextAuthId = request.headers.get('X-NextAuth-Id');
  const nextAuthEmail = request.headers.get('X-NextAuth-Email');
  
  if (nextAuthUser && nextAuthId) {
    console.log('🔑 NextAuth headers found');
    console.log('📋 NextAuth User:', nextAuthUser);
    console.log('📋 NextAuth ID:', nextAuthId);
    console.log('📋 NextAuth Email:', nextAuthEmail);
    
    // For NextAuth users, create a mock user object
    // Note: In production, you might want to verify this user exists in your database
    const user = {
      id: nextAuthId,
      email: nextAuthEmail || nextAuthUser,
      aud: 'authenticated',
      role: 'authenticated',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {
        email_verified: true,
        provider: 'google',
        providers: ['google']
      },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ NextAuth authentication successful');
    return { authorized: true, user };
  }
  
  console.log('❌ No valid authentication found');
  return { authorized: false, message: 'No valid authentication found' };
}

// GET /api/suggestions - Get AI suggestions for current user
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
    const type = searchParams.get('type'); // Filter by suggestion type

    // Use a per-request client with the user's JWT for RLS
    const db = (auth as any).token ? getDbForToken((auth as any).token) : supabase

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const cached = getCachedSuggestions(userId);
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

    // Get suggestions from database with compatibility for multiple schemas
    // Try modern filter (is_dismissed=false) first, then fallback to legacy (is_active=true)
    let suggestions: any[] | null = null;
    let queryError: any = null;

    // Attempt 1: modern schema (is_dismissed)
    {
      let q = db
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .gt('expires_at', new Date().toISOString());
      if (type) q = q.eq('suggestion_type', type);
      const { data, error } = await q.order('created_at', { ascending: false }).limit(20);
      if (!error) {
        suggestions = data || [];
      } else {
        queryError = error;
      }
    }

    // Attempt 2: legacy schema (is_active)
    if (suggestions === null) {
      let q = db
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());
      if (type) q = q.eq('suggestion_type', type);
      const { data, error } = await q.order('created_at', { ascending: false }).limit(20);
      if (!error) {
        suggestions = data || [];
      } else {
        queryError = error;
      }
    }

    if (suggestions === null) {
      console.error('Error fetching suggestions:', queryError);
      return NextResponse.json({ 
        error: 'Failed to fetch suggestions',
        details: queryError?.message || 'Unknown error' 
      }, { status: 500 });
    }

    // Convert database format to frontend format (supports both schemas)
    const formattedSuggestions = (suggestions || []).map((s: any) => {
      const hasLegacy = 'title' in s || 'description' in s;
      const hasModern = 'suggestion_title' in s || 'suggestion_content' in s;
      // Determine title/description
      const title = hasLegacy ? s.title : (hasModern ? s.suggestion_title : 'Suggestion');
      const description = hasLegacy ? s.description : (hasModern ? s.suggestion_content : '');
      // Determine priority
      let priority: 'low' | 'medium' | 'high' = 'medium';
      if (hasLegacy && typeof s.priority === 'string') {
        priority = (s.priority as any) as 'low' | 'medium' | 'high';
      } else if (typeof s.priority === 'number') {
        // Map 1..5 to low/medium/high
        if (s.priority >= 4) priority = 'high';
        else if (s.priority === 3) priority = 'medium';
        else priority = 'low';
      }
      // Determine estimatedImpact
      const estimatedImpact = typeof s.estimated_impact === 'number' ? s.estimated_impact : (typeof s.priority === 'number' ? s.priority : 5);

      return {
        id: s.id,
        type: s.suggestion_type,
        title,
        description,
        priority,
        estimatedImpact,
        reasoning: s.reasoning || '',
        actionableSteps: s.actionable_steps || [],
        relatedTopics: s.related_topics || [],
        confidenceScore: typeof s.confidence_score === 'number' ? s.confidence_score : 0.5,
        metadata: s.metadata || s.suggestion_data || {}
      };
    });

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
  
  const auth = await authenticateUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const db = (auth as any).token ? getDbForToken((auth as any).token) : supabase;
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
  }
  
  try {

    const { forceRefresh = false } = await request.json().catch(() => ({ forceRefresh: false }));

    // Check if we have recent suggestions (unless force refresh)
    if (!forceRefresh) {
      // Prefer modern schema (not dismissed) but fallback to legacy
      let recentExists = false;
      {
        const { data, error } = await db
          .from('ai_suggestions')
          .select('id')
          .eq('user_id', userId)
          .eq('is_dismissed', false)
          .gt('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
          .limit(1);
        if (!error && data && data.length > 0) recentExists = true;
      }
      if (!recentExists) {
        const { data, error } = await db
          .from('ai_suggestions')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .gt('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
          .limit(1);
        if (!error && data && data.length > 0) recentExists = true;
      }

      if (recentExists) {
        return NextResponse.json({
          success: true,
          message: 'Recent suggestions already exist',
          suggestionsGenerated: 0
        });
      }
    }

    // Get or create student profile
    let { data: profile, error: profileError } = await db
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      // Create a basic profile if it doesn't exist
      const { data: newProfile, error: createError } = await db
        .from('student_profiles')
        .insert({
          user_id: userId,
          performance_data: {},
          historical_data: {}
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
      userId: userId,
      performanceData: profile.performance_data || {},
      historicalData: profile.historical_data || {}
    };

    // Generate AI suggestions
    const suggestions = await generateAllSuggestions(studentProfile);
    
    const generationTime = Date.now() - startTime;

    // Store suggestions in database
    if (suggestions.length > 0) {
      // Insert using legacy schema columns; DB has triggers/views for analytics
      const suggestionsToInsert = suggestions.map((suggestion: Suggestion) => ({
        user_id: userId,
        suggestion_type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        priority: typeof suggestion.priority === 'string' ? suggestion.priority : (suggestion.priority >= 4 ? 'high' : suggestion.priority === 3 ? 'medium' : 'low'),
        estimated_impact: suggestion.estimatedImpact,
        reasoning: suggestion.reasoning,
        actionable_steps: suggestion.actionableSteps,
        related_topics: suggestion.relatedTopics || [],
        confidence_score: suggestion.confidenceScore,
        metadata: suggestion.metadata || {},
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
      }));

      const { error: insertError } = await db
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
    cacheSuggestions(userId, suggestions);

    // Log generation
    await db
      .from('suggestion_generation_logs')
      .insert({
        user_id: userId,
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
      await db
        .from('suggestion_generation_logs')
        .insert({
          user_id: userId,
          generation_type: 'all',
          input_data: {},
          output_count: 0,
          generation_time_ms: Date.now() - startTime,
          success: false,
          error_message: error.message
        });
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
    const auth = await authenticateUser(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: 401 });
    }

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
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
        // Support both schemas
        updateData.is_active = false; // legacy
        updateData.is_dismissed = true; // modern
        interactionType = 'dismissed';
        break;
      case 'feedback':
        interactionType = 'feedback';
        if (feedbackRating !== undefined) {
          // Store feedback in interactions table
          await db
            .from('suggestion_interactions')
            .insert({
              user_id: userId,
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
    const { error } = await db
      .from('ai_suggestions')
      .update(updateData)
      .eq('id', suggestionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating suggestion:', error);
      return NextResponse.json({ 
        error: 'Failed to update suggestion',
        details: error.message 
      }, { status: 500 });
    }

    // Log interaction
    if (interactionType !== 'feedback') {
      await db
        .from('suggestion_interactions')
        .insert({
          user_id: userId,
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
