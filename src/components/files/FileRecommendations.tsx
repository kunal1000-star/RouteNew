"use client";

import React, { useState, useEffect } from 'react';
import { Star, FileText, Lightbulb, TrendingUp, Users, Brain } from 'lucide-react';

interface Recommendation {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  subject: string;
  topics: string[];
  summary: string;
  recommendationType: 'similar' | 'complementary' | 'related' | 'prerequisite';
  reason: string;
  confidence: number;
  analysisDate: string;
  estimatedStudyTime?: number;
  difficultyLevel?: string;
}

interface RecommendationContext {
  currentFileId?: string;
  currentSubject?: string;
  studyGoal?: string;
  recentFiles?: string[];
}

const FileRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<RecommendationContext>({});
  const [showContextForm, setShowContextForm] = useState(false);

  const fetchRecommendations = async (contextData?: RecommendationContext) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contextData,
          limit: 10
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial recommendations without context
    fetchRecommendations();
  }, []);

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowContextForm(false);
    fetchRecommendations(context);
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'similar': return <FileText className="h-5 w-5 text-blue-600" />;
      case 'complementary': return <Users className="h-5 w-5 text-green-600" />;
      case 'related': return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case 'prerequisite': return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'similar': return 'border-blue-200 bg-blue-50';
      case 'complementary': return 'border-green-200 bg-green-50';
      case 'related': return 'border-purple-200 bg-purple-50';
      case 'prerequisite': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'image': case 'jpg': case 'png': return '🖼️';
      case 'video': return '🎥';
      default: return '📁';
    }
  };

  const getConfidenceStars = (confidence: number) => {
    const stars = Math.floor(confidence * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    if (!acc[rec.recommendationType]) {
      acc[rec.recommendationType] = [];
    }
    acc[rec.recommendationType].push(rec);
    return acc;
  }, {} as Record<string, Recommendation[]>);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-green-600" />
          Smart File Recommendations
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered recommendations based on your current study materials and learning goals
        </p>
      </div>

      {/* Context Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Personalized Recommendations
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get recommendations based on your current context
            </p>
          </div>
          <button
            onClick={() => setShowContextForm(!showContextForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {showContextForm ? 'Hide Context' : 'Set Context'}
          </button>
        </div>

        {/* Context Form */}
        {showContextForm && (
          <form onSubmit={handleContextSubmit} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current File ID (optional)
                </label>
                <input
                  type="text"
                  value={context.currentFileId || ''}
                  onChange={(e) => setContext(prev => ({ ...prev, currentFileId: e.target.value || undefined }))}
                  placeholder="Enter file ID for similar recommendations"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Subject (optional)
                </label>
                <select
                  value={context.currentSubject || ''}
                  onChange={(e) => setContext(prev => ({ ...prev, currentSubject: e.target.value || undefined }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                >
                  <option value="">Select a subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Study Goal (optional)
              </label>
              <input
                type="text"
                value={context.studyGoal || ''}
                onChange={(e) => setContext(prev => ({ ...prev, studyGoal: e.target.value || undefined }))}
                placeholder="e.g., 'Prepare for calculus exam', 'Learn quantum mechanics'"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Get Recommendations
              </button>
              <button
                type="button"
                onClick={() => {
                  setContext({});
                  fetchRecommendations();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Reset Context
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Finding the best recommendations for you...</p>
        </div>
      )}

      {/* Recommendations by Type */}
      {!loading && recommendations.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedRecommendations).map(([type, recs]) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                {getRecommendationIcon(type)}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                  {type} Files ({recs.length})
                </h3>
              </div>
              
              <div className="grid gap-4">
                {recs.map((rec) => (
                  <div
                    key={rec.id}
                    className={`border rounded-lg p-4 ${getRecommendationColor(rec.recommendationType)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getFileTypeIcon(rec.fileType)}</span>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {rec.fileName}
                          </h4>
                          <span className="px-2 py-1 bg-white bg-opacity-70 text-gray-700 text-xs rounded-full">
                            {rec.subject}
                          </span>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                          {rec.summary || 'No summary available'}
                        </p>

                        {rec.topics.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {rec.topics.slice(0, 3).map((topic, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-white bg-opacity-70 text-gray-700 text-xs rounded"
                                >
                                  {topic}
                                </span>
                              ))}
                              {rec.topics.length > 3 && (
                                <span className="text-xs text-gray-600">+{rec.topics.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            {getConfidenceStars(rec.confidence)}
                            <span className="ml-1">{(rec.confidence * 100).toFixed(0)}% match</span>
                          </div>
                          {rec.estimatedStudyTime && (
                            <span>{rec.estimatedStudyTime} min read</span>
                          )}
                          {rec.difficultyLevel && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              rec.difficultyLevel === 'beginner' ? 'bg-green-200 text-green-800' :
                              rec.difficultyLevel === 'intermediate' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {rec.difficultyLevel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {rec.reason}
                        </div>
                        <button className="px-3 py-1 bg-white bg-opacity-70 text-gray-700 rounded-md hover:bg-opacity-100 transition-all text-sm font-medium">
                          View File
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Recommendations */}
      {!loading && recommendations.length === 0 && !error && (
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No recommendations available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Upload or analyze some files to get personalized recommendations
          </p>
          <button
            onClick={() => fetchRecommendations()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Get General Recommendations
          </button>
        </div>
      )}

      {/* Recommendation Types Info */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Types</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Similar Files</div>
                <div className="text-gray-600">Content similar to current</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Complementary</div>
                <div className="text-gray-600">Related to same subject</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Related</div>
                <div className="text-gray-600">Connected topics</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="font-medium text-gray-900">Prerequisites</div>
                <div className="text-gray-600">Foundation concepts</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileRecommendations;