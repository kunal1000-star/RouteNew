// Real-Time Dashboard WebSocket Server
// ======================================

export interface DashboardMessage {
  type: 'analytics_update' | 'system_status' | 'rate_limit_warning' | 'provider_status';
  data: any;
  timestamp: string;
  source: string;
}

export interface WebSocketConfig {
  url: string;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export class RealtimeDashboardWebSocket {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (message: DashboardMessage) => void> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected for real-time dashboard');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.sendSystemStatus('connected');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.stopHeartbeat();
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.stopHeartbeat();
      };

      return true;
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      return false;
    }
  }

  private handleMessage(data: string) {
    try {
      const message: DashboardMessage = JSON.parse(data);
      const handler = this.messageHandlers.get(message.type);
      
      if (handler) {
        handler(message);
      } else {
        console.log('ℹ️ Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
    }
  }

  private handleReconnect() {
    if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.sendPing();
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendPing() {
    this.sendMessage({
      type: 'analytics_update',
      data: { ping: Date.now() },
      timestamp: new Date().toISOString(),
      source: 'dashboard'
    });
  }

  private sendMessage(message: DashboardMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private sendSystemStatus(status: string) {
    this.sendMessage({
      type: 'system_status',
      data: { 
        status, 
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      timestamp: new Date().toISOString(),
      source: 'dashboard'
    });
  }

  // Public methods for dashboard integration
  onMessage(type: string, handler: (message: DashboardMessage) => void) {
    this.messageHandlers.set(type, handler);
  }

  sendAnalyticsUpdate(data: any) {
    this.sendMessage({
      type: 'analytics_update',
      data,
      timestamp: new Date().toISOString(),
      source: 'dashboard'
    });
  }

  sendRateLimitWarning(provider: string, usage: number, limit: number) {
    this.sendMessage({
      type: 'rate_limit_warning',
      data: { provider, usage, limit, percentage: (usage / limit) * 100 },
      timestamp: new Date().toISOString(),
      source: 'dashboard'
    });
  }

  sendProviderStatus(provider: string, status: string) {
    this.sendMessage({
      type: 'provider_status',
      data: { provider, status },
      timestamp: new Date().toISOString(),
      source: 'dashboard'
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Default configuration for production
export const defaultWebSocketConfig: WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  autoReconnect: true,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000 // 30 seconds
};

// Export singleton instance for dashboard usage
export const dashboardWebSocket = new RealtimeDashboardWebSocket(defaultWebSocketConfig);
