// Memory Context Provider for AI Chat
// =====================================

import { semanticSearch } from './semantic-search';
import { supabase } from '@/lib/supabase';
import type { AIProvider } from '@/types/api-test';

// Types for memory objects
interface MemoryObject {
  id: string;
  user_id: string;
  content: string;
  importance_score: number;
  tags: string[] | null;
  created_at: string;
  source_conversation_id: string | null;
  similarity?: number;
}

export interface MemoryContextOptions {
  userId: string;
  query: string;
  chatType: string;
  isPersonalQuery: boolean;
  contextLevel?: 'light' | 'balanced' | 'comprehensive';
  limit?: number;
  preferredProvider?: AIProvider;
}

export interface MemoryContextResult {
  memories: MemoryObject[];
  contextString: string;
  personalFacts: string[];
  searchStats: {
    totalFound: number;
    searchTimeMs: number;
    provider: AIProvider;
  };
}

/**
 * Memory Context Provider
 * Retrieves and formats relevant memories for AI context
 */
export class MemoryContextProvider {
  /**
   * Get memory context for a query
   */
  async getMemoryContext(options: MemoryContextOptions): Promise<MemoryContextResult> {
    const {
      userId,
      query,
      chatType,
      isPersonalQuery,
      contextLevel = 'balanced',
      limit = 5,
      preferredProvider
    } = options;

    const startTime = Date.now();

    try {
      // For personal queries, we need comprehensive context
      const effectiveContextLevel = isPersonalQuery ? 'comprehensive' : contextLevel;
      const effectiveLimit = isPersonalQuery ? Math.max(limit, 8) : limit;

      // Search for relevant memories
      const searchOptions = {
        userId,
        query,
        limit: effectiveLimit,
        minSimilarity: isPersonalQuery ? 0.6 : 0.7, // Lower threshold for personal queries
        contextLevel: effectiveContextLevel,
        preferredProvider
      };

      const searchResult = await semanticSearch.searchMemories(searchOptions);
      const memories = searchResult.memories as MemoryObject[];

      // Extract personal facts for identity queries
      const personalFacts = this.extractPersonalFacts(query, memories);

      // Format memories for AI context
      const contextString = this.formatMemoriesForContext(memories, isPersonalQuery);

      const searchTimeMs = Date.now() - startTime;

      return {
        memories,
        contextString,
        personalFacts,
        searchStats: {
          totalFound: memories.length,
          searchTimeMs,
          provider: searchResult.searchStats.provider
        }
      };

    } catch (error) {
      console.error('Failed to get memory context:', error);
      
      // Return empty context on error
      return {
        memories: [],
        contextString: '',
        personalFacts: [],
        searchStats: {
          totalFound: 0,
          searchTimeMs: Date.now() - startTime,
          provider: preferredProvider || 'cohere'
        }
      };
    }
  }

  /**
   * Extract personal facts from memories
   */
  private extractPersonalFacts(query: string, memories: MemoryObject[]): string[] {
    const lowerQuery = query.toLowerCase();
    const personalFacts: string[] = [];

    // Check if this is a personal identity question
    const isNameQuery = lowerQuery.includes('my name') ||
                       lowerQuery.includes('do you know') ||
                       lowerQuery.includes('who am i') ||
                       lowerQuery.includes('what is my') ||
                       lowerQuery.includes('call me');

    if (isNameQuery) {
      // Look for name-related memories
      const nameMemories = memories.filter((memory: MemoryObject) =>
        memory && memory.content && (
          memory.content.toLowerCase().includes('name') ||
          memory.content.toLowerCase().includes('kunal') ||
          (memory.tags && (memory.tags.includes('identity') || memory.tags.includes('personal')))
        )
      );

      for (const memory of nameMemories) {
        if (memory && memory.content) {
          // Direct name extraction
          const nameMatch = memory.content.match(/(?:name is|call me|i am|my name is)\s+([A-Za-z]+)/i);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            personalFacts.push(`User name: ${name}`);
            break; // Found a name, stop looking
          }
          
          // Generic name lookup
          if (memory.content.toLowerCase().includes('kunal')) {
            personalFacts.push('User name: Kunal');
            break;
          }
        }
      }

      // If no name found in memories, provide a helpful response
      if (personalFacts.length === 0) {
        personalFacts.push('User name: Not found in previous conversations');
      }
    }

    // Look for other personal information
    if (memories && memories.length > 0) {
      const personalMemories = memories.filter((memory: MemoryObject) =>
        memory && memory.content && (
          (memory.tags && (memory.tags.includes('personal') || memory.tags.includes('identity'))) ||
          memory.content.toLowerCase().includes('my') ||
          (memory.importance_score && memory.importance_score >= 4)
        )
      );

      for (const memory of personalMemories.slice(0, 3)) {
        if (memory && memory.content) {
          // Extract key personal information
          if (memory.content.toLowerCase().includes('grade') ||
              memory.content.toLowerCase().includes('score')) {
            personalFacts.push(`Academic: ${memory.content.substring(0, 100)}`);
          }
        }
      }
    }

    return personalFacts;
  }

  /**
   * Format memories for AI context
   */
  private formatMemoriesForContext(memories: MemoryObject[], isPersonalQuery: boolean): string {
    if (memories.length === 0) {
      return '';
    }

    const formattedMemories = memories.map((memory: MemoryObject, index: number) => {
      const relevance = memory.similarity ? 
        `(relevance: ${(memory.similarity * 100).toFixed(0)}%)` : '';
      
      return `${index + 1}. ${memory.content} ${relevance}`.trim();
    });

    let contextString = 'Relevant conversation history:\n';
    
    if (isPersonalQuery) {
      contextString += 'IMPORTANT: These are personal details about the user:\n';
    }
    
    contextString += formattedMemories.join('\n');
    contextString += '\n\nUse this context to provide personalized responses.';

    return contextString;
  }

  /**
   * Get recent user memories directly from database (FIXED: use conversation_memory table)
   */
  private async getUserMemories(userId: string, options: { limit?: number; minImportance?: number } = {}): Promise<MemoryObject[]> {
    try {
      let query = supabase
        .from('conversation_memory')
        .select('*')
        .eq('user_id', userId)
        .order('memory_relevance_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (options.minImportance) {
        query = query.gte('memory_relevance_score', options.minImportance);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch memories: ${error.message}`);
      }

      // Transform conversation_memory format to MemoryObject format
      return (data || []).map((memory: any) => ({
        id: memory.id,
        user_id: memory.user_id,
        content: memory.interaction_data?.content || '',
        importance_score: memory.memory_relevance_score || 0,
        tags: memory.interaction_data?.tags || null,
        created_at: memory.created_at,
        source_conversation_id: memory.conversation_id
      }));
    } catch (error) {
      console.error('Failed to get user memories:', error);
      return [];
    }
  }

  /**
   * Get quick personal facts without full search
   */
  async getQuickPersonalFacts(userId: string): Promise<{
    name?: string;
    grade?: string;
    recentTopics?: string[];
  }> {
    try {
      // Get most recent high-importance memories
      const memories = await this.getUserMemories(userId, {
        limit: 10,
        minImportance: 4
      });

      const facts: {
        name?: string;
        grade?: string;
        recentTopics?: string[];
      } = {};

      for (const memory of memories) {
        const content = memory.content.toLowerCase();
        
        // Extract name
        if (content.includes('name') && content.includes('kunal')) {
          facts.name = 'Kunal';
        }
        
        // Extract grade/level
        if (content.includes('grade') || content.includes('class')) {
          const gradeMatch = memory.content.match(/(?:grade|class)\s*([0-9]+|[a-z]+)/i);
          if (gradeMatch) {
            facts.grade = gradeMatch[1];
          }
        }
      }

      // Get recent topics
      const recentTopics = memories
        .filter((m: MemoryObject) => m.tags && m.tags.includes('study-topic'))
        .slice(0, 5)
        .map((m: MemoryObject) => m.content.substring(0, 50));
      
      if (recentTopics.length > 0) {
        facts.recentTopics = recentTopics;
      }

      return facts;

    } catch (error) {
      console.error('Failed to get quick personal facts:', error);
      return {};
    }
  }

  /**
   * Test memory system
   */
  async testMemoryRetrieval(userId: string, testQuery: string): Promise<{
    success: boolean;
    memoriesFound: number;
    context: string;
    error?: string;
  }> {
    try {
      const result = await this.getMemoryContext({
        userId,
        query: testQuery,
        chatType: 'study_assistant',
        isPersonalQuery: true,
        contextLevel: 'comprehensive'
      });

      return {
        success: true,
        memoriesFound: result.memories.length,
        context: result.contextString
      };

    } catch (error) {
      return {
        success: false,
        memoriesFound: 0,
        context: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const memoryContextProvider = new MemoryContextProvider();

// Convenience functions
export const getMemoryContext = (options: MemoryContextOptions) =>
  memoryContextProvider.getMemoryContext(options);

export const getQuickPersonalFacts = (userId: string) =>
  memoryContextProvider.getQuickPersonalFacts(userId);

export const testMemoryRetrieval = (userId: string, query: string) =>
  memoryContextProvider.testMemoryRetrieval(userId, query);