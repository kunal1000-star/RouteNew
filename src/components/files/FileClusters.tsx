"use client";

import React, { useState, useEffect } from 'react';
import { Network, Folder, Tag, Users, TrendingUp, Eye } from 'lucide-react';

interface Cluster {
  id: string;
  name: string;
  description: string;
  color: string;
  fileCount: number;
  totalSize: number;
  averageSimilarity: number;
  centroid: number[];
  dominantTopics: string[];
  files: ClusterFile[];
  metadata: {
    createdAt: string;
    lastUpdated: string;
    algorithm: string;
  };
}

interface ClusterFile {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  subject: string;
  similarity: number;
  summary: string;
  topics: string[];
  analysisDate: string;
}

interface ClusterStats {
  totalClusters: number;
  totalFiles: number;
  averageClusterSize: number;
  largestCluster: {
    name: string;
    size: number;
  };
  topicDistribution: { topic: string; count: number; percentage: number }[];
}

const FileClusters: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'network'>('grid');
  const [filterBySize, setFilterBySize] = useState<'all' | 'small' | 'medium' | 'large'>('all');

  const colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const clusterTypes = [
    { id: 'all', name: 'All Clusters', icon: <Network className="h-4 w-4" /> },
    { id: 'small', name: 'Small (1-5 files)', icon: <Folder className="h-4 w-4" /> },
    { id: 'medium', name: 'Medium (6-15 files)', icon: <Users className="h-4 w-4" /> },
    { id: 'large', name: 'Large (16+ files)', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  useEffect(() => {
    loadClusters();
    loadStats();
  }, []);

  const loadClusters = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/cluster');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load clusters');
      }

      const clustersWithColors = data.clusters?.map((cluster: any, index: number) => ({
        ...cluster,
        color: colorPalette[index % colorPalette.length]
      })) || [];

      setClusters(clustersWithColors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clusters');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/files/cluster');
      const data = await response.json();
      
      if (response.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/cluster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regenerate: true,
          k: Math.min(10, Math.max(3, Math.floor(clusters.length / 2)))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate clusters');
      }

      await loadClusters();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate clusters');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredClusters = () => {
    let filtered = [...clusters];

    switch (filterBySize) {
      case 'small':
        return filtered.filter(c => c.fileCount <= 5);
      case 'medium':
        return filtered.filter(c => c.fileCount >= 6 && c.fileCount <= 15);
      case 'large':
        return filtered.filter(c => c.fileCount >= 16);
      default:
        return filtered;
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

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderGridView = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {getFilteredClusters().map((cluster) => (
        <div 
          key={cluster.id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4"
          style={{ borderLeftColor: cluster.color }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {cluster.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {cluster.description || 'No description available'}
              </p>
            </div>
            <button
              onClick={() => setSelectedCluster(cluster)}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Files:</span>
              <span className="font-medium text-gray-900 dark:text-white">{cluster.fileCount}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Similarity:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {(cluster.averageSimilarity * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Size:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatFileSize(cluster.totalSize)}
              </span>
            </div>
          </div>

          {cluster.dominantTopics.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-1">
                {cluster.dominantTopics.slice(0, 3).map((topic, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                  >
                    {topic}
                  </span>
                ))}
                {cluster.dominantTopics.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{cluster.dominantTopics.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedCluster(cluster)}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              View Files ({cluster.files.length})
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Cluster
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Files
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Similarity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Topics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {getFilteredClusters().map((cluster) => (
              <tr key={cluster.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: cluster.color }}
                    ></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {cluster.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cluster.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {cluster.fileCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatFileSize(cluster.totalSize)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {(cluster.averageSimilarity * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {cluster.dominantTopics.slice(0, 2).map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                      >
                        {topic}
                      </span>
                    ))}
                    {cluster.dominantTopics.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{cluster.dominantTopics.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedCluster(cluster)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Files
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNetworkView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="text-center py-12">
        <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Network View Coming Soon
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Interactive network visualization will be available in a future update
        </p>
      </div>
    </div>
  );

  const renderClusterDetails = () => {
    if (!selectedCluster) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: selectedCluster.color }}
                ></div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedCluster.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {selectedCluster.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {selectedCluster.description}
              </p>
            )}
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Files</h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {selectedCluster.fileCount}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Size</h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatFileSize(selectedCluster.totalSize)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Similarity</h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {(selectedCluster.averageSimilarity * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {selectedCluster.dominantTopics.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Dominant Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCluster.dominantTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Files in this Cluster ({selectedCluster.files.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedCluster.files.map((file) => (
                  <div key={file.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getFileTypeIcon(file.fileType)}</span>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {file.fileName}
                          </h4>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            {file.subject}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {file.summary || 'No summary available'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {file.topics.slice(0, 3).map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded"
                            >
                              {topic}
                            </span>
                          ))}
                          {file.topics.length > 3 && (
                            <span className="text-xs text-gray-500">+{file.topics.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <div className="font-medium">
                          {(file.similarity * 100).toFixed(1)}% match
                        </div>
                        <div>
                          {new Date(file.analysisDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Network className="h-8 w-8 text-blue-600" />
          File Clusters
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Organize and explore your study materials using AI-powered clustering
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clusters</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalClusters}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Folder className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Files</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalFiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Cluster Size</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.averageClusterSize.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Largest Cluster</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.largestCluster.name} ({stats.largestCluster.size})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {clusterTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setFilterBySize(type.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filterBySize === type.id
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {type.icon}
                {type.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">View:</span>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  } rounded-l-lg`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('network')}
                  className={`px-3 py-1 text-sm ${
                    viewMode === 'network' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  } rounded-r-lg`}
                >
                  Network
                </button>
              </div>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Network className="h-4 w-4" />
              )}
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading clusters...</p>
        </div>
      ) : (
        <div>
          {getFilteredClusters().length > 0 ? (
            <>
              {viewMode === 'grid' && renderGridView()}
              {viewMode === 'list' && renderListView()}
              {viewMode === 'network' && renderNetworkView()}
            </>
          ) : (
            <div className="text-center py-12">
              <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Clusters Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {filterBySize === 'all' 
                  ? 'No clusters have been generated yet. Generate clusters to organize your files.'
                  : `No clusters found with the current filter (${filterBySize}).`
                }
              </p>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate Clusters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cluster Details Modal */}
      {renderClusterDetails()}

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clustering Information</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">How Clustering Works:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• <strong>K-means Algorithm:</strong> Files grouped by semantic similarity</li>
              <li>• <strong>AI-Generated Topics:</strong> Each cluster has dominant themes</li>
              <li>• <strong>Automatic Organization:</strong> Files sorted by content similarity</li>
              <li>• <strong>Dynamic Updates:</strong> Clusters refresh as you add new files</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Using Clusters:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• <strong>Browse by Topic:</strong> Explore files in related subjects</li>
              <li>• <strong>Study Sessions:</strong> Focus on files within specific clusters</li>
              <li>• <strong>Content Discovery:</strong> Find related materials automatically</li>
              <li>• <strong>Organize Study Plan:</strong> Use clusters for structured learning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileClusters;