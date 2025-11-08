// File Embedding Service for Google Drive Files
// =============================================

import { unifiedEmbeddingService } from './unified-embedding-service';
import { createClient } from '@supabase/supabase-js';
import type { AIProvider } from '@/types/api-test';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface FileAnalysisWithEmbeddings {
  id: string;
  user_id: string;
  file_id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  content_embedding: number[] | null;
  summary_embedding: number[] | null;
  topics_embedding: number[] | null;
  subject: string;
  topics: string[];
  summary: string;
  analysis_result: any;
  created_at: string;
  estimated_study_time?: number;
  difficulty_level?: string;
  key_insights?: string[];
  keywords?: string[];
  concepts?: string[];
}

export interface FileSearchOptions {
  userId: string;
  query: string;
  fileType?: string;
  subject?: string;
  limit?: number;
  minSimilarity?: number;
  preferredProvider?: AIProvider;
}

export interface FileSimilarityResult {
  file: FileAnalysisWithEmbeddings;
  similarity: number;
  embeddingType: 'content' | 'summary' | 'topics';
}

export interface DocumentCluster {
  id: string;
  name: string;
  files: FileAnalysisWithEmbeddings[];
  centroidEmbedding: number[];
  topic: string;
  description: string;
  fileCount: number;
}

export interface FileRecommendation {
  type: 'similar' | 'complementary' | 'prerequisite' | 'related';
  file: FileAnalysisWithEmbeddings;
  reason: string;
  confidence: number;
}

/**
 * File Embedding Service for managing Google Drive file embeddings
 * and performing semantic search across file content
 */
export class FileEmbeddingService {
  /**
   * Process and store embeddings for a file
   */
  async processFileEmbeddings(
    fileId: string,
    content: string,
    summary: string,
    topics: string[],
    userId: string,
    provider: AIProvider = 'cohere'
  ): Promise<void> {
    try {
      // Generate embeddings for different aspects of the file
      const textsToEmbed = [content, summary, topics.join(' ')];
      
      const embeddingResult = await unifiedEmbeddingService.generateEmbeddings({
        texts: textsToEmbed,
        provider,
        timeout: 30000
      });

      // Update the file analysis with embeddings
      const { error } = await supabase
        .from('file_analyses')
        .update({
          content_embedding: embeddingResult.embeddings[0],
          summary_embedding: embeddingResult.embeddings[1],
          topics_embedding: embeddingResult.embeddings[2],
          updated_at: new Date().toISOString()
        })
        .eq('file_id', fileId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update file embeddings: ${error.message}`);
      }

      console.log(`Processed embeddings for file ${fileId} using ${provider}`);
    } catch (error) {
      console.error(`Error processing embeddings for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Find similar files using semantic search
   */
  async findSimilarFiles(options: FileSearchOptions): Promise<FileSimilarityResult[]> {
    const { userId, query, fileType, subject, limit = 10, minSimilarity = 0.6, preferredProvider } = options;

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query, preferredProvider);
      
      // Get user's files
      let fileQuery = supabase
        .from('file_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (fileType) {
        fileQuery = fileQuery.eq('file_type', fileType);
      }

      if (subject) {
        fileQuery = fileQuery.eq('subject', subject);
      }

      const { data: files, error } = await fileQuery;

      if (error) {
        throw new Error(`Failed to fetch files: ${error.message}`);
      }

      if (!files || files.length === 0) {
        return [];
      }

      // Calculate similarities
      const similarities: FileSimilarityResult[] = [];
      
      for (const file of files) {
        const contentEmbedding = file.content_embedding;
        const summaryEmbedding = file.summary_embedding;
        const topicsEmbedding = file.topics_embedding;

        let bestSimilarity = 0;
        let bestEmbeddingType: 'content' | 'summary' | 'topics' = 'content';

        // Check content embedding
        if (contentEmbedding) {
          const contentSim = this.cosineSimilarity(queryEmbedding, contentEmbedding);
          if (contentSim > bestSimilarity) {
            bestSimilarity = contentSim;
            bestEmbeddingType = 'content';
          }
        }

        // Check summary embedding
        if (summaryEmbedding) {
          const summarySim = this.cosineSimilarity(queryEmbedding, summaryEmbedding);
          if (summarySim > bestSimilarity) {
            bestSimilarity = summarySim;
            bestEmbeddingType = 'summary';
          }
        }

        // Check topics embedding
        if (topicsEmbedding) {
          const topicsSim = this.cosineSimilarity(queryEmbedding, topicsEmbedding);
          if (topicsSim > bestSimilarity) {
            bestSimilarity = topicsSim;
            bestEmbeddingType = 'topics';
          }
        }

        if (bestSimilarity >= minSimilarity) {
          similarities.push({
            file,
            similarity: bestSimilarity,
            embeddingType: bestEmbeddingType
          });
        }
      }

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding similar files:', error);
      throw error;
    }
  }

  /**
   * Find files similar to a specific file
   */
  async findSimilarFilesToFile(
    userId: string,
    fileId: string,
    limit: number = 5
  ): Promise<FileSimilarityResult[]> {
    try {
      // Get the target file
      const { data: targetFile, error: targetError } = await supabase
        .from('file_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('file_id', fileId)
        .eq('is_active', true)
        .single();

      if (targetError || !targetFile) {
        throw new Error('Target file not found');
      }

      // Use content embedding for similarity
      const targetEmbedding = targetFile.content_embedding;
      if (!targetEmbedding) {
        return [];
      }

      // Get all other user files
      const { data: otherFiles, error: filesError } = await supabase
        .from('file_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('file_id', fileId);

      if (filesError || !otherFiles) {
        throw new Error('Failed to fetch other files');
      }

      // Calculate similarities
      const similarities: FileSimilarityResult[] = [];
      
      for (const file of otherFiles) {
        const fileEmbedding = file.content_embedding;
        if (fileEmbedding) {
          const similarity = this.cosineSimilarity(targetEmbedding, fileEmbedding);
          similarities.push({
            file,
            similarity,
            embeddingType: 'content'
          });
        }
      }

      // Sort and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding similar files to file:', error);
      throw error;
    }
  }

  /**
   * Cluster files by topics using K-means clustering
   */
  async clusterFilesByTopics(userId: string, numberOfClusters: number = 5): Promise<DocumentCluster[]> {
    try {
      // Get all user files with content embeddings
      const { data: files, error } = await supabase
        .from('file_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active = true', 'file_analyses')
        .not('content_embedding', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch files for clustering: ${error.message}`);
      }

      if (!files || files.length === 0) {
        return [];
      }

      // Perform K-means clustering
      const clusters = await this.performKMeansClustering(files, numberOfClusters);

      // Convert to DocumentCluster format
      return clusters.map((cluster, index) => ({
        id: `cluster_${userId}_${index}`,
        name: this.generateClusterName(cluster.files),
        files: cluster.files,
        centroidEmbedding: cluster.centroid,
        topic: this.inferClusterTopic(cluster.files),
        description: this.generateClusterDescription(cluster.files),
        fileCount: cluster.files.length
      }));

    } catch (error) {
      console.error('Error clustering files:', error);
      throw error;
    }
  }

  /**
   * Generate file recommendations based on current file and user context
   */
  async generateFileRecommendations(
    userId: string,
    context: {
      currentFileId?: string;
      currentSubject?: string;
      studyGoal?: string;
      recentFiles?: string[];
    }
  ): Promise<FileRecommendation[]> {
    const recommendations: FileRecommendation[] = [];

    try {
      // 1. Similar files to current file
      if (context.currentFileId) {
        const similarFiles = await this.findSimilarFilesToFile(userId, context.currentFileId, 3);
        recommendations.push(...similarFiles.map(result => ({
          type: 'similar' as const,
          file: result.file,
          reason: 'Similar content to your current file',
          confidence: result.similarity
        })));
      }

      // 2. Complementary files (same subject, different topics)
      if (context.currentSubject) {
        const { data: complementaryFiles } = await supabase
          .from('file_analyses')
          .select('*')
          .eq('user_id', userId)
          .eq('subject', context.currentSubject)
          .eq('is_active', true)
          .limit(3);

        if (complementaryFiles) {
          recommendations.push(...complementaryFiles.map(file => ({
            type: 'complementary' as const,
            file,
            reason: 'Complements your current subject studies',
            confidence: 0.7
          })));
        }
      }

      // 3. Recent activity-based recommendations
      if (context.recentFiles && context.recentFiles.length > 0) {
        const { data: relatedFiles } = await supabase
          .from('file_analyses')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .in('file_id', context.recentFiles)
          .limit(3);

        if (relatedFiles) {
          recommendations.push(...relatedFiles.map(file => ({
            type: 'related' as const,
            file,
            reason: 'Related to your recent study materials',
            confidence: 0.6
          })));
        }
      }

      // Remove duplicates and rank by confidence
      const uniqueRecommendations = this.removeDuplicateRecommendations(recommendations);
      return uniqueRecommendations.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Error generating file recommendations:', error);
      return [];
    }
  }

  /**
   * Generate query embedding for semantic search
   */
  private async generateQueryEmbedding(query: string, preferredProvider?: AIProvider): Promise<number[]> {
    const result = await unifiedEmbeddingService.generateEmbeddings({
      texts: [query],
      provider: preferredProvider,
      timeout: 30000
    });
    return result.embeddings[0];
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
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
   * Perform K-means clustering on file embeddings
   */
  private async performKMeansClustering(files: any[], k: number): Promise<any[]> {
    // This is a simplified K-means implementation
    // In production, you might want to use a more sophisticated clustering library
    
    const validFiles = files.filter(f => f.content_embedding);
    const embeddings = validFiles.map(f => f.content_embedding);
    if (embeddings.length === 0) return [];

    // Initialize centroids randomly
    const centroids = this.initializeCentroids(embeddings, k);
    
    // Iterate until convergence
    for (let iter = 0; iter < 50; iter++) {
      // Assign points to nearest centroid
      const clusters: Array<{embedding: number[], file: any}[]> = Array.from({ length: k }, () => []);
      
      embeddings.forEach((embedding, index) => {
        let nearestCentroid = 0;
        let nearestDistance = -Infinity;
        
        centroids.forEach((centroid, centroidIndex) => {
          const distance = this.cosineSimilarity(embedding, centroid);
          if (distance > nearestDistance) { // Note: using similarity, so higher is better
            nearestDistance = distance;
            nearestCentroid = centroidIndex;
          }
        });
        
        clusters[nearestCentroid].push({ embedding, file: validFiles[index] });
      });
      
      // Update centroids
      let hasChanged = false;
      for (let i = 0; i < k; i++) {
        if (clusters[i].length > 0) {
          const newCentroid = this.calculateCentroid(clusters[i].map(c => c.embedding));
          if (!this.centroidsEqual(centroids[i], newCentroid)) {
            hasChanged = true;
          }
          centroids[i] = newCentroid;
        }
      }
      
      if (!hasChanged) break;
    }
    
    // Format results - need to reconstruct clusters for the final result
    const finalClusters: Array<{embedding: number[], file: any}[]> = Array.from({ length: k }, () => []);
    
    // Recalculate final clusters
    embeddings.forEach((embedding, index) => {
      let nearestCentroid = 0;
      let nearestDistance = -Infinity;
      
      centroids.forEach((centroid, centroidIndex) => {
        const distance = this.cosineSimilarity(embedding, centroid);
        if (distance > nearestDistance) {
          nearestDistance = distance;
          nearestCentroid = centroidIndex;
        }
      });
      
      finalClusters[nearestCentroid].push({ embedding, file: validFiles[index] });
    });
    
    return centroids.map((centroid, index) => ({
      centroid,
      files: finalClusters[index].map(c => c.file)
    }));
  }

  private initializeCentroids(embeddings: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    const usedIndices = new Set<number>();
    
    // Randomly select k initial centroids
    while (centroids.length < k && usedIndices.size < embeddings.length) {
      const randomIndex = Math.floor(Math.random() * embeddings.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        centroids.push([...embeddings[randomIndex]]);
      }
    }
    
    return centroids;
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];
    
    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    embeddings.forEach(embedding => {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    });
    
    return centroid.map(sum => sum / embeddings.length);
  }

  private centroidsEqual(centroidA: number[], centroidB: number[]): boolean {
    if (centroidA.length !== centroidB.length) return false;
    
    const threshold = 0.001;
    for (let i = 0; i < centroidA.length; i++) {
      if (Math.abs(centroidA[i] - centroidB[i]) > threshold) {
        return false;
      }
    }
    return true;
  }

  private generateClusterName(files: any[]): string {
    // Extract common topics or subjects
    const subjects = files.map(f => f.subject).filter(s => s);
    const topics = files.flatMap(f => f.topics || []).filter(t => t);
    
    // Find most common subject
    const subjectCounts = subjects.reduce((acc, subject) => {
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonSubject = Object.entries(subjectCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0];
    
    if (mostCommonSubject) {
      return `${mostCommonSubject} Files`;
    }
    
    return 'Study Materials';
  }

  private inferClusterTopic(files: any[]): string {
    // Simple topic inference based on most common subject
    const subjects = files.map(f => f.subject).filter(s => s);
    if (subjects.length === 0) return 'General';
    
    const subjectCounts = subjects.reduce((acc, subject) => {
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(subjectCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
  }

  private generateClusterDescription(files: any[]): string {
    const subjects = [...new Set(files.map(f => f.subject).filter(s => s))];
    const fileTypes = [...new Set(files.map(f => f.file_type).filter(t => t))];
    
    let description = 'A collection of study materials';
    
    if (subjects.length === 1) {
      description += ` focused on ${subjects[0]}`;
    } else if (subjects.length > 1) {
      description += ` covering multiple subjects: ${subjects.join(', ')}`;
    }
    
    if (fileTypes.length === 1) {
      description += ` in ${fileTypes[0]} format`;
    }
    
    return description;
  }

  private removeDuplicateRecommendations(recommendations: FileRecommendation[]): FileRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = `${rec.file.id}_${rec.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Export singleton instance
export const fileEmbeddingService = new FileEmbeddingService();