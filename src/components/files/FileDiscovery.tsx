"use client";

import React, { useState } from 'react';
import { Compass, Search, Filter, Calendar, BookOpen, Shuffle, TrendingUp } from 'lucide-react';

interface DiscoveryResult {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  subject: string;
  topics: string[];
  summary: string;
  discoveryReason: string;
  analysisDate: string;
  similarity?: number;
  difficultyLevel?: string;
  timePeriod?: string;
}

interface DiscoveryPreferences {
  topic?: string;
  difficulty?: string;
  period?: string;
  subject?: string;
  recentFileIds?: string[];
  preferences?: {
    subjects?: string[];
    difficulties?: string[];
    fileTypes?: string[];
  };
}

const FileDiscovery: React.FC = () => {
  const [discoveryType, setDiscoveryType] = useState<string>('by_topic');
  const [preferences, setPreferences] = useState<DiscoveryPreferences>({});
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discoveryTypes = [
    {
      id: 'by_topic',
      name: 'By Topic',
      description: 'Discover files related to specific topics',
      icon: <Search className="h-5 w-5" />,
      color: 'blue'
    },
    {
      id: 'by_difficulty',
      name: 'By Difficulty',
      description: 'Find files by difficulty level',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'green'
    },
    {
      id: 'by_time_period',
      name: 'By Time Period',
      description: 'Browse files from specific time periods',
      icon: <Calendar className="h-5 w-5" />,
      color: 'purple'
    },
    {
      id: 'by_subject_progression',
      name: 'Subject Progression',
      description: 'Files for learning progression in a subject',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'orange'
    },
    {
      id: 'similar_to_recent',
      name: 'Similar to Recent',
      description: 'Files similar to your recent activity',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'indigo'
    },
    {
      id: 'random_exploration',
      name: 'Random Discovery',
      description: 'Explore files randomly based on preferences',
      icon: <Shuffle className="h-5 w-5" />,
      color: 'pink'
    }
  ];

  const handleDiscovery = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discoveryType,
          preferences,
          limit: 20
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Discovery failed');
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentType = () => {
    return discoveryTypes.find(t => t.id === discoveryType) || discoveryTypes[0];
  };

  const renderPreferencesForm = () => {
    const currentType = getCurrentType();

    switch (discoveryType) {
      case 'by_topic':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Topic
            </label>
            <input
              type="text"
              value={preferences.topic || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., calculus, quantum mechanics, organic chemistry"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
            />
          </div>
        );

      case 'by_difficulty':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty Level
            </label>
            <select
              value={preferences.difficulty || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
            >
              <option value="">Select difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        );

      case 'by_time_period':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Period
            </label>
            <select
              value={preferences.period || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, period: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
            >
              <option value="">Select time period</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
        );

      case 'by_subject_progression':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <select
              value={preferences.subject || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
            >
              <option value="">Select subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          </div>
        );

      case 'similar_to_recent':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recent File IDs (comma-separated)
            </label>
            <input
              type="text"
              value={preferences.recentFileIds?.join(', ') || ''}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                recentFileIds: e.target.value.split(',').map(id => id.trim()).filter(id => id) 
              }))}
              placeholder="file_id_1, file_id_2, file_id_3"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
            />
          </div>
        );

      case 'random_exploration':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Subjects
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].map(subject => (
                  <label key={subject} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.preferences?.subjects?.includes(subject) || false}
                      onChange={(e) => {
                        const current = preferences.preferences?.subjects || [];
                        const updated = e.target.checked 
                          ? [...current, subject]
                          : current.filter(s => s !== subject);
                        setPreferences(prev => ({ 
                          ...prev, 
                          preferences: { ...prev.preferences, subjects: updated }
                        }));
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{subject}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Difficulties
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['beginner', 'intermediate', 'advanced'].map(difficulty => (
                  <label key={difficulty} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.preferences?.difficulties?.includes(difficulty) || false}
                      onChange={(e) => {
                        const current = preferences.preferences?.difficulties || [];
                        const updated = e.target.checked 
                          ? [...current, difficulty]
                          : current.filter(d => d !== difficulty);
                        setPreferences(prev => ({ 
                          ...prev, 
                          preferences: { ...prev.preferences, difficulties: updated }
                        }));
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{difficulty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Compass className="h-8 w-8 text-purple-600" />
          File Discovery
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore and discover your study materials using intelligent algorithms
        </p>
      </div>

      {/* Discovery Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose Discovery Method
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discoveryTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setDiscoveryType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                discoveryType === type.id
                  ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                  : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${discoveryType === type.id ? `bg-${type.color}-100` : 'bg-gray-100'}`}>
                  {type.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{type.name}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getCurrentType().name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getCurrentType().description}
            </p>
          </div>
          <button
            onClick={handleDiscovery}
            disabled={loading}
            className={`px-6 py-2 bg-${getCurrentType().color}-600 text-white rounded-lg hover:bg-${getCurrentType().color}-700 disabled:opacity-50 flex items-center gap-2`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Compass className="h-4 w-4" />
            )}
            Discover
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderPreferencesForm()}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Discovery Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Discovered Files ({results.length})
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Discovery method: {getCurrentType().name}
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
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {result.discoveryReason}
                      </span>
                      <span>{new Date(result.analysisDate).toLocaleDateString()}</span>
                      {result.difficultyLevel && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.difficultyLevel === 'beginner' ? 'bg-green-100 text-green-800' :
                          result.difficultyLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.difficultyLevel}
                        </span>
                      )}
                      {result.similarity && (
                        <span className="text-purple-600 font-medium">
                          {(result.similarity * 100).toFixed(1)}% match
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
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
      {results.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <Compass className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Ready to Discover
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select a discovery method and configure preferences to find new files
          </p>
        </div>
      )}

      {/* Discovery Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Discovery Tips</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Discovery Methods:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• <strong>By Topic:</strong> Find files related to specific subjects or concepts</li>
              <li>• <strong>By Difficulty:</strong> Browse files by complexity level</li>
              <li>• <strong>By Time Period:</strong> Explore files from recent or specific periods</li>
              <li>• <strong>Subject Progression:</strong> Files organized by learning sequence</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Advanced Features:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• <strong>Similar to Recent:</strong> Find files matching your recent activity</li>
              <li>• <strong>Random Discovery:</strong> Explore files based on your preferences</li>
              <li>• <strong>AI-Powered:</strong> Uses embeddings for intelligent matching</li>
              <li>• <strong>Real-time:</strong> Results update based on your library</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDiscovery;