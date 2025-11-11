// Fixed Embedding Service - Fallback When All Providers Fail
// ============================================================

import { unifiedEmbeddingService } from './unified-embedding-service';

export interface FallbackEmbeddingRequest {
  texts: string[];
  provider?: string;
  model?: string;
  timeout?: number;
}

export class FixedEmbeddingService {
  /**
   * Generate embeddings with proper fallback and graceful degradation
   */
  async generateEmbeddings(request: FallbackEmbeddingRequest) {
    const { texts } = request;
    
    if (!texts || texts.length === 0) {
      return this.createFallbackResponse(texts, 'empty_input');
    }

    try {
      // Try the original service first
      const result = await unifiedEmbeddingService.generateEmbeddings(request);
      return {
        success: true,
        embeddings: result.embeddings,
        provider: result.provider,
        model: result.model,
        fallback: false
      };
    } catch (error) {
      console.warn('All embedding providers failed, using fallback:', error.message);
      
      // Return fallback embeddings - simple hash-based embeddings
      return this.createFallbackResponse(texts, error.message);
    }
  }

  /**
   * Create fallback embeddings when all providers fail
   */
  private createFallbackResponse(texts: string[], reason: string) {
    const fallbackEmbeddings = texts.map(text => this.generateSimpleEmbedding(text));
    
    return {
      success: false,
      embeddings: fallbackEmbeddings,
      provider: 'fallback',
      model: 'simple-hash-embedding',
      fallback: true,
      fallbackReason: reason,
      dimensions: 128
    };
  }

  /**
   * Generate a simple hash-based embedding as fallback
   */
  private generateSimpleEmbedding(text: string): number[] {
    const embedding = new Array(128).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const value = Math.sin(hash + index) * 0.5 + 0.5; // Convert to 0-1 range
      
      const dimension = hash % 128;
      embedding[dimension] = (embedding[dimension] + value) / 2;
    });
    
    return embedding;
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const fixedEmbeddingService = new FixedEmbeddingService();
export const generateFallbackEmbeddings = (request: FallbackEmbeddingRequest) => 
  fixedEmbeddingService.generateEmbeddings(request);