"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2, FileText, Calendar, Clock, Brain } from 'lucide-react';

interface SearchResult {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  subject: string;
  topics: string[];
  summary: string;
  similarity: number;
  embeddingType: 'content' | 'summary' | 'topics';
  analysisDate: string;
  estimatedStudyTime?: number;
  difficultyLevel?: string;
  keyInsights?: string[];
}

interface SearchFilters {
  fileType?: string;
  subject?: string;
  minSimilarity: number;
  limit: number;
}

const FileSemanticSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minSimilarity: 0.6,
    limit: 10
  });

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          ...filters
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatSimilarity = (similarity: number) => {
    return `${(similarity * 100).toFixed(1)}%`;
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600';
    if (similarity >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          AI-Powered File Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search your Google Drive files using natural language and semantic understanding
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for files using natural language (e.g., 'calculus integration problems' or 'physics mechanics notes')"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            Search
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                File Type
              </label>
              <select
                value={filters.fileType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, fileType: e.target.value || undefined }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="doc">Document</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                value={filters.subject || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value || undefined }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
              >
                <option value="">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Similarity: {formatSimilarity(filters.minSimilarity)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={filters.minSimilarity}
                onChange={(e) => setFilters(prev => ({ ...prev, minSimilarity: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Search Results ({results.length} files found)
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Powered by AI embeddings and semantic search
            </div>
          </div>

          <div className="grid gap-4">
            {results.map((result) => (
              <div key={result.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getFileTypeIcon(result.fileType)}</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.fileName}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {result.subject}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {result.summary || 'No summary available'}
                      </p>
                    </div>

                    {result.topics.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {result.topics.slice(0, 5).map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                            >
                              {topic}
                            </span>
                          ))}
                          {result.topics.length > 5 && (
                            <span className="text-xs text-gray-500">+{result.topics.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(result.analysisDate).toLocaleDateString()}
                      </div>
                      {result.estimatedStudyTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {result.estimatedStudyTime} min
                        </div>
                      )}
                      {result.difficultyLevel && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.difficultyLevel === 'beginner' ? 'bg-green-100 text-green-800' :
                          result.difficultyLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.difficultyLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <div className="mb-2">
                      <div className={`text-lg font-semibold ${getSimilarityColor(result.similarity)}`}>
                        {formatSimilarity(result.similarity)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.embeddingType} match
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {query && results.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No files found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or lowering the similarity threshold
          </p>
        </div>
      )}

      {/* Search Tips */}
      {!query && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Search Tips</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Example Searches:</h4>
              <ul className="space-y-1">
                <li>• "calculus integration problems"</li>
                <li>• "physics mechanics formulas"</li>
                <li>• "organic chemistry reactions"</li>
                <li>• "data structures algorithms"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Search Features:</h4>
              <ul className="space-y-1">
                <li>• Semantic understanding of content</li>
                <li>• Find similar files automatically</li>
                <li>• Filter by subject and type</li>
                <li>• Real-time similarity scoring</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSemanticSearch;