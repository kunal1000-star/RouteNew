"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, Database, Brain, Activity, Clock, TrendingUp, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface SystemStats {
  totalFiles: number;
  filesWithEmbeddings: number;
  embeddingCoverage: number;
  totalSize: number;
  averageSimilarity: number;
  lastUpdated: string;
  processingTime: number;
}

interface ProviderStats {
  provider: string;
  status: 'active' | 'fallback' | 'error';
  totalCalls: number;
  successRate: number;
  averageLatency: number;
  lastUsed: string;
  errors: number;
}

interface EmbeddingQuality {
  avgContentLength: number;
  avgSummaryLength: number;
  avgTopicsCount: number;
  duplicateFiles: number;
  lowQualityFiles: number;
  recentlyProcessed: number;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error';
  components: {
    database: 'healthy' | 'warning' | 'error';
    embeddings: 'healthy' | 'warning' | 'error';
    apis: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
  };
  issues: string[];
  recommendations: string[];
}

const EmbeddingDashboard: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<EmbeddingQuality | null>(null);
  const [healthStatus, setHealthStatus] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadDashboardData();
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadDashboardData();
        setLastRefresh(new Date());
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load system statistics
      const statsResponse = await fetch('/api/files/search?action=stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSystemStats(statsData.stats);
      }

      // Load provider statistics
      const providerResponse = await fetch('/api/files/tags?action=providers');
      if (providerResponse.ok) {
        const providerData = await providerResponse.json();
        setProviderStats(providerData.providers || []);
      }

      // Load quality metrics
      const qualityResponse = await fetch('/api/files/tags?action=quality');
      if (qualityResponse.ok) {
        const qualityData = await qualityResponse.json();
        setQualityMetrics(qualityData.quality);
      }

      // Load system health
      const healthResponse = await fetch('/api/files/cluster?action=health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthStatus(healthData.health);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const runSystemCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files/cluster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'system_check',
          fullScan: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'System check failed');
      }

      await loadDashboardData();
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'System check failed');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'error': return <XCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'cohere': return '🧠';
      case 'mistral': return '🌪️';
      case 'google': return '🔍';
      case 'groq': return '⚡';
      default: return '🤖';
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderSystemStats = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Files</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {systemStats?.totalFiles || 0}
            </p>
            <p className="text-xs text-gray-500">
              {systemStats?.filesWithEmbeddings || 0} with embeddings
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Coverage</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {((systemStats?.embeddingCoverage || 0) * 100).toFixed(1)}%
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(systemStats?.embeddingCoverage || 0) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Similarity</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {((systemStats?.averageSimilarity || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Cross-file coherence</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Processing Time</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {((systemStats?.processingTime || 0) / 1000).toFixed(1)}s
            </p>
            <p className="text-xs text-gray-500">Average per file</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProviderStats = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Provider Status</h2>
      <div className="space-y-4">
        {providerStats.map((provider) => (
          <div key={provider.provider} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getProviderIcon(provider.provider)}</span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{provider.provider}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last used: {formatTime(provider.lastUsed)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{provider.totalCalls}</p>
                <p className="text-xs text-gray-500">Total Calls</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {provider.successRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">Success Rate</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {provider.averageLatency.toFixed(0)}ms
                </p>
                <p className="text-xs text-gray-500">Avg Latency</p>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(provider.status)}`}>
                {provider.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQualityMetrics = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Embedding Quality</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Content Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Content Length</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {qualityMetrics?.avgContentLength || 0} chars
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Summary Length</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {qualityMetrics?.avgSummaryLength || 0} chars
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Topics Count</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {qualityMetrics?.avgTopicsCount || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Quality Issues</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Duplicate Files</span>
              <span className="text-sm font-medium text-red-600">
                {qualityMetrics?.duplicateFiles || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Low Quality</span>
              <span className="text-sm font-medium text-yellow-600">
                {qualityMetrics?.lowQualityFiles || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Recently Processed</span>
              <span className="text-sm font-medium text-green-600">
                {qualityMetrics?.recentlyProcessed || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Storage Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Size</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatFileSize(systemStats?.totalSize || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTime(systemStats?.lastUpdated || '')}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-gray-500">65% storage capacity used</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemHealth = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h2>
        <div className={`px-4 py-2 rounded-lg font-medium ${getHealthColor(healthStatus?.overall || 'unknown')}`}>
          {healthStatus?.overall || 'Unknown'}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Component Status</h3>
          <div className="space-y-3">
            {healthStatus?.components && Object.entries(healthStatus.components).map(([component, status]) => (
              <div key={component} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getHealthIcon(status)}
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {component.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getHealthColor(status)}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Issues & Recommendations</h3>
          <div className="space-y-3">
            {healthStatus?.issues && healthStatus.issues.length > 0 ? (
              healthStatus.issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">No issues detected</span>
              </div>
            )}
            
            {healthStatus?.recommendations && healthStatus.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          Embedding System Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and manage your AI-powered file embedding system
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Data
            </button>
            
            <button
              onClick={runSystemCheck}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              System Check
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh (30s)</span>
            </label>
            
            {lastRefresh && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
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
            ✕
          </button>
        </div>
      )}

      {/* System Statistics */}
      {systemStats && renderSystemStats()}

      {/* Health Status */}
      {healthStatus && renderSystemHealth()}

      {/* Provider Statistics */}
      {providerStats.length > 0 && renderProviderStats()}

      {/* Quality Metrics */}
      {qualityMetrics && renderQualityMetrics()}

      {/* System Architecture Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Architecture</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Embedding Pipeline:</h4>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Google Drive Analysis → Content Extraction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>AI Embedding Generation (Multi-Provider)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Vector Storage in PostgreSQL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Semantic Search & Discovery</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Key Features:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• <strong>Multi-Provider Fallback:</strong> Cohere → Mistral → Google</li>
              <li>• <strong>Vector Similarity Search:</strong> 1536-dimension embeddings</li>
              <li>• <strong>K-means Clustering:</strong> Automatic file organization</li>
              <li>• <strong>Smart Recommendations:</strong> AI-powered content discovery</li>
              <li>• <strong>Semantic Tagging:</strong> 200+ academic tag library</li>
              <li>• <strong>Real-time Analytics:</strong> System health monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddingDashboard;