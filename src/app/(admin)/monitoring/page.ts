"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Server, 
  Zap, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  MoreHorizontal,
  ArrowLeft,
  BarChart3,
  PieChart,
  LineChart,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

interface RealTimeMetrics {
  timestamp: string;
  requestsPerMinute: number;
  averageLatency: number;
  successRate: number;
  activeUsers: number;
  errorRate: number;
  costPerMinute: number;
}

interface ProviderMetrics {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  responseTime: number;
  requests: number;
  errors: number;
  availability: number;
  lastCheck: string;
}

interface AlertMetric {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  provider?: string;
  timestamp: string;
  resolved: boolean;
}

const PROVIDER_COLORS = {
  groq: '#10b981',
  gemini: '#f59e0b', 
  cerebras: '#8b5cf6',
  cohere: '#06b6d4',
  mistral: '#ef4444',
  openrouter: '#84cc16'
};

export default function MonitoringDashboard() {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics[]>([]);
  const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics[]>([]);
  const [alerts, setAlerts] = useState<AlertMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock real-time data generation
  useEffect(() => {
    const generateMockData = () => {
      const now = new Date();
      const metrics: RealTimeMetrics = {
        timestamp: now.toISOString(),
        requestsPerMinute: Math.floor(Math.random() * 50) + 20,
        averageLatency: Math.floor(Math.random() * 500) + 200,
        successRate: 85 + Math.random() * 15,
        activeUsers: Math.floor(Math.random() * 100) + 50,
        errorRate: Math.random() * 5,
        costPerMinute: Math.random() * 2 + 0.5
      };

      const providers: ProviderMetrics[] = [
        {
          name: 'Groq',
          status: 'online',
          responseTime: 200 + Math.random() * 100,
          requests: Math.floor(Math.random() * 1000) + 500,
          errors: Math.floor(Math.random() * 5),
          availability: 98 + Math.random() * 2,
          lastCheck: now.toISOString()
        },
        {
          name: 'Gemini',
          status: Math.random() > 0.9 ? 'degraded' : 'online',
          responseTime: 300 + Math.random() * 200,
          requests: Math.floor(Math.random() * 800) + 400,
          errors: Math.floor(Math.random() * 10),
          availability: 95 + Math.random() * 5,
          lastCheck: now.toISOString()
        },
        {
          name: 'Cerebras',
          status: 'online',
          responseTime: 150 + Math.random() * 100,
          requests: Math.floor(Math.random() * 600) + 300,
          errors: Math.floor(Math.random() * 3),
          availability: 99 + Math.random() * 1,
          lastCheck: now.toISOString()
        },
        {
          name: 'Cohere',
          status: Math.random() > 0.95 ? 'offline' : 'online',
          responseTime: 400 + Math.random() * 300,
          requests: Math.floor(Math.random() * 200) + 100,
          errors: Math.floor(Math.random() * 20),
          availability: 90 + Math.random() * 10,
          lastCheck: now.toISOString()
        },
        {
          name: 'Mistral',
          status: 'online',
          responseTime: 250 + Math.random() * 150,
          requests: Math.floor(Math.random() * 400) + 200,
          errors: Math.floor(Math.random() * 8),
          availability: 97 + Math.random() * 3,
          lastCheck: now.toISOString()
        },
        {
          name: 'OpenRouter',
          status: 'online',
          responseTime: 350 + Math.random() * 200,
          requests: Math.floor(Math.random() * 300) + 150,
          errors: Math.floor(Math.random() * 15),
          availability: 94 + Math.random() * 6,
          lastCheck: now.toISOString()
        }
      ];

      const mockAlerts: AlertMetric[] = [
        {
          id: '1',
          type: 'warning',
          message: 'Cohere response time above threshold',
          provider: 'Cohere',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          type: 'error',
          message: 'High error rate detected',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '3',
          type: 'info',
          message: 'Daily cost limit approaching',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          resolved: true
        }
      ];

      setRealTimeMetrics(prev => [...prev.slice(-59), metrics]);
      setProviderMetrics(providers);
      setAlerts(mockAlerts);
      setLastUpdate(new Date());
    };

    // Initial load
    setIsLoading(true);
    generateMockData();
    setIsLoading(false);

    // Set up real-time updates every 5 seconds
    const interval = setInterval(generateMockData, 5000);

    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const chartData = realTimeMetrics.map(metric => ({
    time: new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    requests: metric.requestsPerMinute,
    latency: metric.averageLatency,
    successRate: metric.successRate,
    errors: metric.errorRate
  }));

  const pieData = providerMetrics.map(provider => ({
    name: provider.name,
    value: provider.requests,
    color: PROVIDER_COLORS[provider.name as keyof typeof PROVIDER_COLORS]
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden border-b p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold">Live Monitoring</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs">LIVE</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Desktop Header */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Real-Time Monitoring</h1>
              <p className="text-muted-foreground mt-2">
                Live system performance and AI provider metrics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Last updated: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Real-time Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {realTimeMetrics.length > 0 ? realTimeMetrics[realTimeMetrics.length - 1]?.requestsPerMinute : 0}
                </p>
                <p className="text-xs text-muted-foreground">Req/Min</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+12%</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {realTimeMetrics.length > 0 ? Math.round(realTimeMetrics[realTimeMetrics.length - 1]?.averageLatency) : 0}ms
                </p>
                <p className="text-xs text-muted-foreground">Avg Latency</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">-8ms</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {realTimeMetrics.length > 0 ? Math.round(realTimeMetrics[realTimeMetrics.length - 1]?.successRate) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+0.2%</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {realTimeMetrics.length > 0 ? realTimeMetrics[realTimeMetrics.length - 1]?.activeUsers : 0}
                </p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
              <Server className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+5</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {realTimeMetrics.length > 0 ? Math.round(realTimeMetrics[realTimeMetrics.length - 1]?.errorRate * 10) / 10 : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">-0.1%</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  ${realTimeMetrics.length > 0 ? (realTimeMetrics[realTimeMetrics.length - 1]?.costPerMinute * 60 * 24).toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-muted-foreground">Daily Cost</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-xs text-red-500">+$0.12</span>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Volume Chart */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Request Volume</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Latency Chart */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Response Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Provider Distribution */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Provider Request Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <div className="grid gap-4">
              {providerMetrics.map((provider) => (
                <Card key={provider.name} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={getStatusColor(provider.status)}>
                        {getStatusIcon(provider.status)}
                      </div>
                      <div>
                        <h4 className="font-medium">{provider.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last check: {new Date(provider.lastCheck).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={provider.status === 'online' ? 'default' : 'destructive'}>
                        {provider.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Response Time</p>
                      <p className="font-semibold">{Math.round(provider.responseTime)}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requests</p>
                      <p className="font-semibold">{provider.requests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Errors</p>
                      <p className="font-semibold">{provider.errors}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Availability</p>
                      <p className="font-semibold">{Math.round(provider.availability)}%</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Availability</span>
                      <span>{Math.round(provider.availability)}%</span>
                    </div>
                    <Progress value={provider.availability} className="h-2" />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`p-4 ${getAlertColor(alert.type)} border-l-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`h-5 w-5 mt-0.5 ${
                        alert.type === 'error' ? 'text-red-500' : 
                        alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.provider && `${alert.provider} • `}
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.resolved ? 'outline' : 'destructive'}>
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Success Rate Chart */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Success Rate Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Error Rate Chart */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Error Rate</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="errors" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}