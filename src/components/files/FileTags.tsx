"use client";

import React, { useState, useEffect } from 'react';
import { Tags, Search, Plus, X, Edit, Save, Check, AlertCircle, Lightbulb } from 'lucide-react';

interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
  category: string;
}

interface FileTag {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  subject: string;
  currentTags: string[];
  suggestedTags: TagSuggestion[];
  summary: string;
  topics: string[];
  analysisDate: string;
}

interface TagStatistics {
  totalTags: number;
  uniqueTags: number;
  popularTags: { tag: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  recentTags: { tag: string; lastUsed: string }[];
}

const FileTags: React.FC = () => {
  const [files, setFiles] = useState<FileTag[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileTag[]>([]);
  const [stats, setStats] = useState<TagStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileTag | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

  const allTags = [
    // Mathematics
    'Calculus', 'Linear Algebra', 'Statistics', 'Probability', 'Geometry', 'Trigonometry', 'Differential Equations',
    // Physics  
    'Quantum Mechanics', 'Thermodynamics', 'Electromagnetism', 'Mechanics', 'Optics', 'Relativity',
    // Chemistry
    'Organic Chemistry', 'Inorganic Chemistry', 'Analytical Chemistry', 'Physical Chemistry', 'Biochemistry',
    // Biology
    'Cell Biology', 'Genetics', 'Molecular Biology', 'Physiology', 'Anatomy', 'Microbiology',
    // Computer Science
    'Algorithms', 'Data Structures', 'Programming', 'Machine Learning', 'Artificial Intelligence', 'Software Engineering',
    // Engineering
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering',
    // Other Academic
    'Research', 'Laboratory', 'Case Study', 'Theory', 'Application', 'Problem Set', 'Lecture Notes', 'Study Guide'
  ];

  const tagCategories = {
    'Mathematics': ['Calculus', 'Linear Algebra', 'Statistics', 'Probability', 'Geometry', 'Trigonometry', 'Differential Equations'],
    'Physics': ['Quantum Mechanics', 'Thermodynamics', 'Electromagnetism', 'Mechanics', 'Optics', 'Relativity'],
    'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Analytical Chemistry', 'Physical Chemistry', 'Biochemistry'],
    'Biology': ['Cell Biology', 'Genetics', 'Molecular Biology', 'Physiology', 'Anatomy', 'Microbiology'],
    'Computer Science': ['Algorithms', 'Data Structures', 'Programming', 'Machine Learning', 'Artificial Intelligence', 'Software Engineering'],
    'Engineering': ['Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering'],
    'Study Materials': ['Research', 'Laboratory', 'Case Study', 'Theory', 'Application', 'Problem Set', 'Lecture Notes', 'Study Guide']
  };

  useEffect(() => {
    loadFiles();
    loadStats();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, filterCategory]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/tags');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load files');
      }

      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/files/tags');
      const data = await response.json();
      
      if (response.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const filterFiles = () => {
    let filtered = [...files];

    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.currentTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterCategory !== 'all') {
      if (filterCategory === 'untagged') {
        filtered = filtered.filter(file => file.currentTags.length === 0);
      } else {
        filtered = filtered.filter(file => 
          file.currentTags.some(tag => tagCategories[filterCategory as keyof typeof tagCategories]?.includes(tag))
        );
      }
    }

    setFilteredFiles(filtered);
  };

  const generateTagSuggestions = async (fileId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'suggest',
          fileId,
          options: {
            confidenceThreshold: 0.3,
            maxSuggestions: 10,
            includeCategories: true
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate suggestions');
      }

      // Update the file with new suggestions
      setFiles(prev => prev.map(file => 
        file.fileId === fileId 
          ? { ...file, suggestedTags: data.suggestions || [] }
          : file
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const updateFileTags = async (fileId: string, tags: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          tags
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tags');
      }

      // Update the local state
      setFiles(prev => prev.map(file => 
        file.fileId === fileId 
          ? { ...file, currentTags: tags }
          : file
      ));

      setEditMode(null);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tags');
    } finally {
      setLoading(false);
    }
  };

  const addTag = (file: FileTag, tag: string) => {
    if (!allTags.includes(tag)) {
      setError('Invalid tag. Please select from available tags or create a custom one.');
      return;
    }

    if (file.currentTags.includes(tag)) {
      setError('Tag already exists for this file.');
      return;
    }

    updateFileTags(file.fileId, [...file.currentTags, tag]);
  };

  const removeTag = (file: FileTag, tag: string) => {
    updateFileTags(file.fileId, file.currentTags.filter(t => t !== tag));
  };

  const acceptSuggestion = (file: FileTag, suggestion: TagSuggestion) => {
    addTag(file, suggestion.tag);
    // Remove from suggestions after accepting
    setFiles(prev => prev.map(f => 
      f.fileId === file.fileId 
        ? { ...f, suggestedTags: f.suggestedTags.filter(s => s.tag !== suggestion.tag) }
        : f
    ));
  };

  const rejectSuggestion = (file: FileTag, suggestion: TagSuggestion) => {
    // Just remove from suggestions
    setFiles(prev => prev.map(f => 
      f.fileId === file.fileId 
        ? { ...f, suggestedTags: f.suggestedTags.filter(s => s.tag !== suggestion.tag) }
        : f
    ));
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

  const getCategoryColor = (category: string) => {
    const colors = {
      'Mathematics': 'bg-blue-100 text-blue-800',
      'Physics': 'bg-green-100 text-green-800',
      'Chemistry': 'bg-purple-100 text-purple-800',
      'Biology': 'bg-pink-100 text-pink-800',
      'Computer Science': 'bg-indigo-100 text-indigo-800',
      'Engineering': 'bg-orange-100 text-orange-800',
      'Study Materials': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderTagSuggestion = (file: FileTag, suggestion: TagSuggestion) => (
    <div key={suggestion.tag} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{suggestion.tag}</span>
            <span className={`px-2 py-1 text-xs rounded ${getCategoryColor(suggestion.category)}`}>
              {suggestion.category}
            </span>
            <span className="text-xs text-gray-500">
              {(suggestion.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{suggestion.reason}</p>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => acceptSuggestion(file, suggestion)}
            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
            title="Accept suggestion"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => rejectSuggestion(file, suggestion)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Reject suggestion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Tags className="h-8 w-8 text-indigo-600" />
          Smart File Tags
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered semantic tagging for better file organization and discovery
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Tags className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tags</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalTags}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Search className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Tags</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.uniqueTags}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Most Popular</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.popularTags[0]?.tag || 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Untagged Files</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {files.filter(f => f.currentTags.length === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files, tags, or subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="untagged">Untagged Only</option>
              {Object.keys(tagCategories).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <button
              onClick={loadFiles}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Tags className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4 inline" />
          </button>
        </div>
      )}

      {/* File List */}
      <div className="space-y-4">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <div key={file.fileId} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-2xl">{getFileTypeIcon(file.fileType)}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {file.fileName}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {file.subject}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(file.analysisDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {file.summary || 'No summary available'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSuggestions(showSuggestions === file.fileId ? null : file.fileId)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                      title="View suggestions"
                    >
                      <Lightbulb className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => generateTagSuggestions(file.fileId)}
                      disabled={loading}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                      title="Generate suggestions"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditMode(editMode === file.fileId ? null : file.fileId)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                      title="Edit tags"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Current Tags */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Tags:</span>
                    {file.currentTags.length === 0 && (
                      <span className="text-sm text-gray-500">No tags assigned</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {file.currentTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full"
                      >
                        {tag}
                        {editMode === file.fileId && (
                          <button
                            onClick={() => removeTag(file, tag)}
                            className="text-indigo-600 hover:text-indigo-800 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Edit Mode */}
                {editMode === file.fileId && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Add new tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            addTag(file, newTag.trim());
                            setNewTag('');
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                      />
                      <button
                        onClick={() => {
                          if (newTag.trim()) {
                            addTag(file, newTag.trim());
                            setNewTag('');
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Popular tags: {allTags.slice(0, 10).join(', ')}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {showSuggestions === file.fileId && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      AI Tag Suggestions
                    </h4>
                    {file.suggestedTags.length > 0 ? (
                      <div className="space-y-2">
                        {file.suggestedTags.map((suggestion) => renderTagSuggestion(file, suggestion))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Lightbulb className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No suggestions available. Click "Generate" to create suggestions.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Topics */}
                {file.topics.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Extracted Topics:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {file.topics.slice(0, 5).map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {topic}
                        </span>
                      ))}
                      {file.topics.length > 5 && (
                        <span className="text-xs text-gray-500">+{file.topics.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Tags className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {files.length === 0 ? 'No Files Found' : 'No Files Match Filters'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {files.length === 0 
                ? 'No files are available for tagging.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Tag Categories Guide */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Tag Categories</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(tagCategories).map(([category, tags]) => (
            <div key={category} className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className={`px-2 py-1 text-xs rounded ${getCategoryColor(category)}`}
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 5 && (
                  <span className="text-xs text-gray-500">+{tags.length - 5} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tagging Tips</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">AI-Powered Features:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• <strong>Smart Suggestions:</strong> AI analyzes content for relevant tags</li>
              <li>• <strong>Confidence Scoring:</strong> Tags ranked by relevance</li>
              <li>• <strong>Category Detection:</strong> Automatic subject classification</li>
              <li>• <strong>Batch Operations:</strong> Apply tags to multiple files</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Best Practices:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• <strong>Be Specific:</strong> Use detailed, descriptive tags</li>
              <li>• <strong>Consistent Naming:</strong> Standardize tag formats</li>
              <li>• <strong>Review Suggestions:</strong> Check AI recommendations</li>
              <li>• <strong>Regular Updates:</strong> Keep tags current with content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileTags;