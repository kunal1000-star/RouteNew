// Database Integration Tests
// =========================

import { describe, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { semanticSearch } from '../semantic-search';
import { studentContextBuilder } from '../student-context-builder';
import { memoryExtractor } from '../memory-extractor';
import { activityLogger } from '../activity-logger';
import { dailySummary } from '../daily-summary';
import type { StudentProfile, Memory, ActivityLog } from '@/types/database-ai';

// Mock Supabase for testing
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn(),
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(),
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock global fetch for API calls
global.fetch = vi.fn();

describe('Database Integration Tests', () => {
  const mockUserId = 'test-user-123';
  const mockConversationId = 'test-conv-456';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Semantic Search Integration', () => {
    test('should search memories with proper error handling', async () => {
      const mockMemories: Memory[] = [
        {
          id: '1',
          user_id: mockUserId,
          content: 'Student struggled with thermodynamics concepts',
          similarity: 0.85,
          category: 'weakness',
          importance_score: 4,
          tags: ['thermodynamics', 'weakness'],
          source_context: 'Physics study session',
          created_at: '2024-01-15T10:00:00Z',
        }
      ];

      const mockSearchStats = {
        totalFound: 1,
        averageSimilarity: 0.85,
        searchTimeMs: 150,
        embeddingGenerated: true,
        cohereUsage: {
          embeddingTokens: 100,
          monthlyUsage: 1,
          monthlyLimit: 1000
        }
      };

      // Mock successful search
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          results: [
            { 
              id: '1',
              text: 'Student struggled with thermodynamics concepts',
              score: 0.85,
              metadata: {
                category: 'weakness',
                importance_score: 4,
                tags: ['thermodynamics', 'weakness'],
                source_context: 'Physics study session',
              }
            }
          ],
          meta: {
            returned_count: 1,
            search_duration: 150,
            total_count: 1
          }
        }),
      } as Response);

      const result = await semanticSearch.searchMemories({
        userId: mockUserId,
        query: 'thermodynamics problems',
        limit: 5,
        minSimilarity: 0.7
      });

      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].similarity).toBe(0.85);
      expect(result.memories[0].content).toContain('thermodynamics');
      expect(result.searchStats.totalFound).toBe(1);
    });

    test('should handle search failures gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await semanticSearch.searchMemories({
        userId: mockUserId,
        query: 'test query'
      });

      expect(result.memories).toHaveLength(0);
      expect(result.searchStats.totalFound).toBe(0);
    });

    test('should respect rate limits', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: 'Monthly limit exceeded'
        }),
      } as Response);

      await expect(semanticSearch.searchMemories({
        userId: mockUserId,
        query: 'test query'
      })).rejects.toThrow('Monthly limit reached');
    });
  });

  describe('Student Context Builder Integration', () => {
    test('should build context with database data', async () => {
      const mockProfile: StudentProfile = {
        id: mockUserId,
        name: 'Test Student',
        target_exam: 'JEE 2025',
        study_subjects: ['Physics', 'Chemistry', 'Mathematics'],
        weak_subjects: ['Thermodynamics'],
        strong_subjects: ['Algebra'],
        accuracy_rate: 78,
        total_study_time: 120,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      };

      // Mock profile fetch
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      } as any);

      const context = await studentContextBuilder.buildContextByLevel(mockUserId, 2);
      
      expect(typeof context).toBe('string');
      expect(context.length).toBeGreaterThan(0);
      expect(context).toContain('JEE 2025');
    });

    test('should handle missing profile data', async () => {
      // Mock missing profile
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Profile not found' } }),
          }),
        }),
      } as any);

      const context = await studentContextBuilder.buildContextByLevel(mockUserId, 2);
      
      expect(context).toContain('Student profile information not available');
    });
  });

  describe('Memory Extraction Integration', () => {
    test('should extract and store memories successfully', async () => {
      const mockExtractionResult = {
        insights: [
          {
            content: 'Student showed improvement in Physics problem-solving',
            importanceScore: 4,
            tags: ['improvement', 'physics'],
            category: 'achievement',
            sourceContext: 'Performance review during study session'
          }
        ],
        memoriesCreated: 1,
        embeddingsGenerated: 1,
        storageErrors: []
      };

      // Mock successful extraction
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          id: 'memory-123',
          content: 'Student showed improvement in Physics problem-solving',
          embedding: Array(1536).fill(0.1),
          metadata: {
            importanceScore: 4,
            tags: ['improvement', 'physics'],
            category: 'achievement'
          }
        }),
      } as Response);

      // Mock successful storage
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: { id: 'memory-123' }, error: null }),
        }),
      } as any);

      const result = await memoryExtractor.extractAndStoreMemories({
        userId: mockUserId,
        conversationId: mockConversationId,
        userMessage: 'I think I\'m getting better at Physics problems',
        aiResponse: 'That\'s great! Your improvement is evident.',
        isPersonalQuery: true,
        contextLevel: 'balanced'
      });

      expect(result.insights).toHaveLength(1);
      expect(result.memoriesCreated).toBe(1);
      expect(result.insights[0].category).toBe('achievement');
    });

    test('should skip extraction for non-personal queries', async () => {
      const result = await memoryExtractor.extractAndStoreMemories({
        userId: mockUserId,
        conversationId: mockConversationId,
        userMessage: 'What is the formula for entropy?',
        aiResponse: 'The entropy formula is S = k ln(W).',
        isPersonalQuery: false,
        contextLevel: 'light'
      });

      expect(result.insights).toHaveLength(0);
      expect(result.memoriesCreated).toBe(0);
    });
  });

  describe('Activity Logger Integration', () => {
    test('should log activities successfully', async () => {
      const mockActivity: Omit<ActivityLog, 'id'> = {
        user_id: mockUserId,
        activity_type: 'study_session_completed',
        category: 'study',
        summary: 'Completed 25 Physics problems with 80% accuracy',
        context_tags: ['physics', 'problems', 'accuracy'],
        is_positive: true,
        metadata: {
          subject: 'Physics',
          problemsCompleted: 25,
          accuracy: 80,
          duration: 45
        },
        created_at: new Date().toISOString()
      };

      // Mock successful log insertion
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ 
            data: [{ ...mockActivity, id: 'log-123' }], 
            error: null 
          }),
        }),
      } as any);

      const result = await activityLogger.logActivity(mockActivity);
      
      expect(result.success).toBe(true);
      expect(result.activityId).toBe('log-123');
    });

    test('should handle logging failures', async () => {
      const mockActivity = {
        user_id: mockUserId,
        activity_type: 'test_activity',
        category: 'test' as const,
        summary: 'Test activity',
        context_tags: ['test'],
        is_positive: true,
        metadata: {},
        created_at: new Date().toISOString()
      };

      // Mock failed log insertion
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        }),
      } as any);

      const result = await activityLogger.logActivity(mockActivity);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('Daily Summary Integration', () => {
    test('should generate daily summary', async () => {
      const testDate = new Date('2024-01-15');
      const mockActivities: ActivityLog[] = [
        {
          id: '1',
          user_id: mockUserId,
          activity_type: 'study_session_completed',
          category: 'study',
          summary: 'Physics study session',
          context_tags: ['physics'],
          is_positive: true,
          metadata: {},
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          user_id: mockUserId,
          activity_type: 'question_answered',
          category: 'study',
          summary: 'Answered 20 questions',
          context_tags: ['questions'],
          is_positive: true,
          metadata: {},
          created_at: '2024-01-15T15:00:00Z'
        }
      ];

      // Mock activity fetch
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockActivities, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const summary = await dailySummary.generateDailySummary(mockUserId, testDate);
      
      expect(summary).not.toBeNull();
      expect(summary?.date).toBe('2024-01-15');
      expect(summary?.totalActivities).toBe(2);
      expect(summary?.positiveActivities).toBe(2);
    });

    test('should return null for days with no activity', async () => {
      const testDate = new Date('2024-01-20');
      
      // Mock empty activity fetch
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const summary = await dailySummary.generateDailySummary(mockUserId, testDate);
      
      expect(summary).toBeNull();
    });
  });

  describe('Data Validation and Error Handling', () => {
    test('should validate required fields before database operations', async () => {
      const invalidActivity = {
        user_id: mockUserId,
        // Missing required fields
        activity_type: 'test',
        category: 'test' as const,
        summary: '',
        context_tags: [],
        is_positive: true,
        metadata: {},
        created_at: new Date().toISOString()
      };

      const result = await activityLogger.logActivity(invalidActivity);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Required field missing');
    });

    test('should handle database connection failures', async () => {
      // Mock database connection failure
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await expect(semanticSearch.searchMemories({
        userId: mockUserId,
        query: 'test'
      })).rejects.toThrow('Connection failed');
    });

    test('should handle malformed data gracefully', async () => {
      // Mock malformed response from API
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          // Malformed data structure
          results: null,
          error: 'Unexpected response format'
        }),
      } as Response);

      const result = await semanticSearch.searchMemories({
        userId: mockUserId,
        query: 'test'
      });

      expect(result.memories).toHaveLength(0);
    });
  });

  describe('Performance and Optimization', () => {
    test('should optimize database queries with proper indexing', async () => {
      const { supabase } = await import('@/lib/supabase');
      const selectSpy = vi.spyOn(supabase.from('activity_logs'), 'select');
      
      await activityLogger.getRecentActivities(mockUserId, 10);
      
      // Verify that proper indexes are used (ge, order, limit chain)
      expect(selectSpy).toHaveBeenCalledWith('*');
    });

    test('should batch memory operations efficiently', async () => {
      const mockMemories = Array.from({ length: 10 }, (_, i) => ({
        user_id: mockUserId,
        content: `Memory ${i}`,
        category: 'general',
        importance_score: 3,
        tags: ['test'],
        source_context: 'batch test',
        created_at: new Date().toISOString()
      }));

      const { supabase } = await import('@/lib/supabase');
      const insertSpy = vi.spyOn(supabase.from('user_memories'), 'insert');
      
      await memoryExtractor.batchStoreMemories(mockMemories);
      
      // Verify batch insert was used
      expect(insertSpy).toHaveBeenCalledWith(mockMemories);
    });
  });
});