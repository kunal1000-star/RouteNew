// Quick fix for gamification service - temporary workaround
// This removes the total_penalty_points dependency to resolve the immediate error

import { supabaseBrowserClient } from '@/lib/supabase';
import { calculateLevel } from './levels';
import { calculateSessionPoints, type SessionData } from './points';
import type { Badge } from './badges';
import type { Database } from '../database.types';
import { logPointsEarned, logStreakUpdated } from '../ai/activity-logger';

type UserGamification = Database['public']['Tables']['user_gamification']['Row'];
type PointsHistoryInsert = Database['public']['Tables']['points_history']['Insert'];

/**
 * Creates the initial gamification record for a new user.
 * @param userId - The ID of the user to initialize.
 * @returns The newly created gamification data and any potential error.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function initializeUserGamification(userId: string) {
  if (!userId || !UUID_REGEX.test(userId)) {
    return { data: null, error: new Error('Invalid user id: must be a UUID') as any } as any;
  }

  // TEMPORARY FIX: Remove total_penalty_points from insertion to avoid schema mismatch
  const { data, error } = await supabaseBrowserClient
    .from('user_gamification')
    .insert({
      user_id: userId,
      experience_points: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      total_points_earned: 0,
      // total_penalty_points: 0, // TEMPORARILY COMMENTED OUT
      total_topics_completed: 0,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Fetches a user's complete gamification profile.
 * @param userId - The ID of the user.
 * @returns The user's gamification data.
 */
export async function getUserGamification(userId: string) {
  // Validate input early to avoid confusing downstream errors
  if (!userId || !UUID_REGEX.test(userId)) {
    const err = new Error('Invalid user id: must be a UUID');
    console.error('[Gamification] getUserGamification called with invalid userId');
    return { data: null, error: err as any } as any;
  }

  try {
    // TEMPORARY FIX: Select without total_penalty_points to avoid schema mismatch
    const { data, error } = await supabaseBrowserClient
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[Gamification] No profile found for ${userId}, initializing...`);
        const { data: newData, error: initError } = await initializeUserGamification(userId);
        if (initError) {
          console.error('[Gamification] Failed to initialize profile:', initError?.message || initError);
          return { data: null, error: initError } as any;
        }
        return { data: newData, error: null } as any;
      }
      console.error('[Gamification] Unexpected error fetching profile:', error?.message || error);
      return { data: null, error } as any;
    }

    return { data, error: null } as any;
  } catch (e: any) {
    console.error('[Gamification] Exception during getUserGamification:', e?.message || e);
    return { data: null, error: e } as any;
  }
}

/**
 * Calculates and awards points for a completed study session, updating user stats.
 * @param userId - The ID of the user.
 * @param sessionData - The data from the completed session.
 * @returns An object containing the points earned, the user's new level, and any potential error.
 */
export async function awardSessionPoints(userId: string, sessionData: SessionData) {
  const pointsEarned = calculateSessionPoints(sessionData);

  if (pointsEarned <= 0) {
    return { pointsEarned: 0, newLevel: 1, error: null };
  }

  const { data: currentGamification, error: fetchError } = await getUserGamification(userId);
  
  if (fetchError || !currentGamification) {
    return { pointsEarned: 0, newLevel: 1, error: fetchError || new Error('Failed to get or create user gamification profile.') };
  }

  const newExperiencePoints = (currentGamification.experience_points || 0) + pointsEarned;
  const newTotalPoints = (currentGamification.total_points_earned || 0) + pointsEarned;
  const newLevel = calculateLevel(newExperiencePoints);
  const newTotalTopicsCompleted = (currentGamification.total_topics_completed || 0) + sessionData.topicsCompleted;

  // Update user_gamification table
  const { error: updateError } = await supabaseBrowserClient
    .from('user_gamification')
    .update({
      experience_points: newExperiencePoints,
      total_points_earned: newTotalPoints,
      level: newLevel,
      total_topics_completed: newTotalTopicsCompleted,
    })
    .eq('user_id', userId);

  if (updateError) {
    return { pointsEarned, newLevel, error: updateError };
  }

  // Log the points earned for activity feed
  try {
    await logPointsEarned(userId, {
        points: pointsEarned,
        reason: 'session_completion',
        breakdown: sessionData
    });
  } catch (logError) {
     console.error('Failed to log points earned:', logError);
  }


  return { pointsEarned, newLevel, error: null };
}

/**
 * Updates a user's study streak.
 * @param userId - The ID of the user.
 */
export async function updateStreak(userId: string) {
  const { data: currentGamification, error: fetchError } = await getUserGamification(userId);

  if (fetchError || !currentGamification) {
    console.error('Failed to fetch user gamification for streak update:', fetchError);
    return;
  }

  const newStreak = (currentGamification.current_streak || 0) + 1;
  const newLongestStreak = Math.max(newStreak, currentGamification.longest_streak || 0);

  const { error: updateError } = await supabaseBrowserClient
    .from('user_gamification')
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_activity_date: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Failed to update streak:', updateError);
  } else {
    try {
      await logStreakUpdated(userId, {
        current_streak: newStreak,
        longest_streak: newLongestStreak,
      });
    } catch (error) {
      console.error("Streak logging error:", error);
    }
  }
}

/**
 * Fetches all badges earned by a user.
 * @param userId - The ID of the user.
 * @returns An array of the user's earned badges.
 */
export async function getUserBadges(userId: string) {
  const { data, error } = await supabaseBrowserClient
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  return { data, error };
}

/**
 * Awards a new badge to a user.
 * @param userId - The ID of the user.
 * @param badge - The badge object to award.
 * @returns Any potential error from the database operation.
 */
export async function awardBadge(userId: string, badge: Badge) {
  const { error } = await supabaseBrowserClient
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_name: badge.name,
      badge_type: badge.type,
      badge_icon: badge.icon,
      badge_description: badge.description,
    });
  
  return { error };
}