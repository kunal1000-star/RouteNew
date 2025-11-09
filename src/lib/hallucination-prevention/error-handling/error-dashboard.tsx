// Error Dashboard and Monitoring Interface
// =====================================

import React, { useState, useEffect } from 'react';
import { getErrorMetrics } from './error-monitoring';
import { 
  getSystemHealth, 
  getActiveAlerts, 
  acknowledgeAlert, 
  resolveAlert,
  exportHealthReport
} from './system-health-monitor';
import { getFeedbackAnalytics } from './user-feedback-system';

interface DashboardProps {
  userId?: string;
  refreshInterval?: number; // milliseconds
}

interface DashboardData {
  systemHealth: {
    overall: string;
    score: number;
    layers: Record<number, any>;
    alerts: any[];
    recommendations: string[];
  };
  errorMetrics: {
    totalEvents: number;
    errorsByType: Record<string, number>;
    errorsByLayer: Record<number, number>;
    errorsBySeverity: Record<string, number>;
    averageResolutionTime: number;
    recoverySuccessRate: number;
    cascadingErrorRate: number;
  };
  feedbackAnalytics: {
    totalFeedback: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    userSatisfactionScore: number;
    resolutionRate: number;
  };
  activeAlerts: any[];
}

export function ErrorDashboard({ userId, refreshInterval = 30000 }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data
        const [systemHealth, errorMetrics, feedbackAnalytics, activeAlerts] = await Promise.all([
          getSystemHealth(),
          getErrorMetrics(),
          getFeedbackAnalytics(),
          getActiveAlerts()
        ]);

        setData({
          systemHealth,
          errorMetrics,
          feedbackAnalytics,
          activeAlerts
        });
        
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up periodic refresh
    const interval = setInterval(fetchData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleExportReport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const report = exportHealthReport(format);
      const blob = new Blob([report], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export report:', err);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, 'dashboard-user');
      // Refresh data after acknowledgement
      setData(prev => prev ? {
        ...prev,
        activeAlerts: prev.activeAlerts.filter(alert => alert.id !== alertId)
      } : null);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId, 'dashboard-user', 'Resolved from dashboard');
      // Refresh data after resolution
      setData(prev => prev ? {
        ...prev,
        activeAlerts: prev.activeAlerts.filter(alert => alert.id !== alertId)
      } : null);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Error Handling Dashboard
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Monitor system health, errors, and feedback across all 5 layers
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdate && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as '1h' | '24h' | '7d')}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExportReport('json')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExportReport('csv')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">System Health</h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Overall Health Score */}
            <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white text-opacity-80 truncate">
                      Overall Health Score
                    </dt>
                    <dd className="text-2xl font-semibold">
                      {data.systemHealth.score}/100
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Active Alerts */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white text-opacity-80 truncate">
                      Active Alerts
                    </dt>
                    <dd className="text-2xl font-semibold">
                      {data.activeAlerts.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Recovery Success Rate */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white text-opacity-80 truncate">
                      Recovery Success Rate
                    </dt>
                    <dd className="text-2xl font-semibold">
                      {data.errorMetrics.recoverySuccessRate.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Health Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Layer Health Status</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            {Object.entries(data.systemHealth.layers).map(([layer, status]) => (
              <div key={layer} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-gray-900">Layer {layer}</h5>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    status.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {status.status}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status.status === 'healthy' ? 'bg-green-500' :
                          status.status === 'degraded' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${status.score}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{status.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Metrics */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Error Metrics</h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {data.errorMetrics.totalEvents}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Avg Resolution Time</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {(data.errorMetrics.averageResolutionTime / 1000).toFixed(1)}s
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Cascading Error Rate</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {data.errorMetrics.cascadingErrorRate.toFixed(1)}%
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500 truncate">User Satisfaction</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {data.feedbackAnalytics.userSatisfactionScore.toFixed(1)}/5
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {data.activeAlerts.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Active Alerts</h4>
            <div className="space-y-4">
              {data.activeAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'error' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                      <h5 className="ml-3 text-sm font-medium text-gray-900">{alert.title}</h5>
                    </div>
                    <div className="flex space-x-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="text-sm text-green-600 hover:text-green-800"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{alert.message}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                    {alert.layer && ` • Layer ${alert.layer}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.systemHealth.recommendations.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h4>
            <div className="space-y-2">
              {data.systemHealth.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Alternative simple dashboard component for embedding
export function SimpleErrorDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthData, alertsData] = await Promise.all([
          getSystemHealth(),
          getActiveAlerts()
        ]);
        setHealth(healthData);
        setAlerts(alertsData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!health) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">System Health</h3>
        <div className={`px-2 py-1 rounded text-sm ${
          health.overall === 'healthy' ? 'bg-green-100 text-green-800' :
          health.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {health.overall}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{health.score}</div>
          <div className="text-sm text-gray-500">Health Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
          <div className="text-sm text-gray-500">Active Alerts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {Object.values(health.layers).filter((l: any) => l.status === 'healthy').length}/5
          </div>
          <div className="text-sm text-gray-500">Layers Healthy</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Alerts</h4>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="text-sm">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  alert.severity === 'critical' ? 'bg-red-500' :
                  alert.severity === 'error' ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`} />
                {alert.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ErrorDashboard;