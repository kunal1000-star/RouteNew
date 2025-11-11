'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { 
  Monitor, 
  Smartphone, 
  Moon, 
  Sun, 
  Palette, 
  Battery,
  Wifi,
  Signal,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AndroidThemeContextType {
  isAndroidTheme: boolean;
  androidTheme: 'light' | 'dark' | 'battery_saver' | 'auto';
  systemBrightness: number;
  batteryLevel: number;
  isCharging: boolean;
  networkStatus: 'wifi' | 'cellular' | 'offline';
  setAndroidTheme: (theme: 'light' | 'dark' | 'battery_saver' | 'auto') => void;
  adjustBrightness: (level: number) => void;
}

const AndroidThemeContext = createContext<AndroidThemeContextType | undefined>(undefined);

export function useAndroidTheme() {
  const context = useContext(AndroidThemeContext);
  if (!context) {
    throw new Error('useAndroidTheme must be used within AndroidThemeProvider');
  }
  return context;
}

interface AndroidThemeProviderProps {
  children: React.ReactNode;
}

export function AndroidThemeProvider({ children }: AndroidThemeProviderProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [androidTheme, setAndroidThemeState] = useState<'light' | 'dark' | 'battery_saver' | 'auto'>('auto');
  const [systemBrightness, setSystemBrightness] = useState(1);
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [isCharging, setIsCharging] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'wifi' | 'cellular' | 'offline'>('wifi');

  useEffect(() => {
    if (!isMobile) return;

    // Check for Android-specific APIs
    const checkAndroidFeatures = async () => {
      // Check for Battery Status API
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          const updateBattery = () => {
            setBatteryLevel(battery.level);
            setIsCharging(battery.charging);
          };

          updateBattery();
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);

          return () => {
            battery.removeEventListener('levelchange', updateBattery);
            battery.removeEventListener('chargingchange', updateBattery);
          };
        } catch (error) {
          console.log('Battery API not available');
        }
      }

      // Check for Network Information API
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
        const updateNetworkStatus = () => {
          if (!connection) {
            setNetworkStatus('offline');
            return;
          }

          if (connection.type === 'wifi') {
            setNetworkStatus('wifi');
          } else if (connection.type === 'cellular') {
            setNetworkStatus('cellular');
          } else {
            setNetworkStatus('offline');
          }
        };

        updateNetworkStatus();
        connection.addEventListener('change', updateNetworkStatus);

        return () => {
          connection.removeEventListener('change', updateNetworkStatus);
        };
      }

      // Listen for theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e: MediaQueryListEvent) => {
        if (androidTheme === 'auto') {
          document.body.className = e.matches ? 'dark' : 'light';
        }
      };

      mediaQuery.addEventListener('change', handleThemeChange);

      return () => {
        mediaQuery.removeEventListener('change', handleThemeChange);
      };
    };

    checkAndroidFeatures();

    // Simulate brightness changes for demo
    const brightnessInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        setSystemBrightness(Math.random() * 0.5 + 0.5);
      }
    }, 10000);

    return () => clearInterval(brightnessInterval);
  }, [androidTheme, isMobile]);

  const setAndroidTheme = (theme: 'light' | 'dark' | 'battery_saver' | 'auto') => {
    setAndroidThemeState(theme);
    
    switch (theme) {
      case 'light':
        document.body.className = 'light';
        break;
      case 'dark':
        document.body.className = 'dark';
        break;
      case 'battery_saver':
        document.body.className = 'dark'; // Use dark theme to save battery
        break;
      case 'auto':
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.className = prefersDark ? 'dark' : 'light';
        break;
    }
  };

  const adjustBrightness = (level: number) => {
    setSystemBrightness(Math.max(0.1, Math.min(1, level)));
    // In a real app, this would use the Screen Wake Lock API
  };

  const isAndroidTheme = isMobile;
  const contextValue: AndroidThemeContextType = {
    isAndroidTheme,
    androidTheme,
    systemBrightness,
    batteryLevel,
    isCharging,
    networkStatus,
    setAndroidTheme,
    adjustBrightness
  };

  return (
    <AndroidThemeContext.Provider value={contextValue}>
      {children}
      
      {/* Android Status Bar (only on mobile) */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-muted/20">
          <div className="flex items-center justify-between px-4 py-2">
            {/* Left: Time and Status */}
            <div className="flex items-center gap-2 text-sm">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              
              {/* Battery Indicator */}
              <div className="flex items-center gap-1">
                <Battery className={`h-4 w-4 ${batteryLevel < 0.2 ? 'text-red-500' : 'text-green-500'}`} />
                <span className="text-xs">{Math.round(batteryLevel * 100)}%</span>
                {isCharging && <span className="text-xs text-blue-500">⚡</span>}
              </div>
              
              {/* Network Status */}
              {networkStatus === 'wifi' && <Wifi className="h-3 w-3 text-green-500" />}
              {networkStatus === 'cellular' && <Signal className="h-3 w-3 text-yellow-500" />}
              {networkStatus === 'offline' && <AlertTriangle className="h-3 w-3 text-red-500" />}
            </div>
            
            {/* Center: Theme Indicator */}
            <div className="flex items-center gap-1 text-xs">
              <Palette className="h-3 w-3 text-primary" />
              <span>
                {androidTheme === 'battery_saver' ? '🔋' : ''}
                {androidTheme === 'dark' ? '🌙' : ''}
                {androidTheme === 'light' ? '☀️' : ''}
                {androidTheme === 'auto' ? '🔄' : ''}
              </span>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustBrightness(systemBrightness > 0.5 ? 0.3 : 1)}
                className="p-1 hover:bg-muted rounded"
              >
                <span className="text-xs">
                  {systemBrightness > 0.7 ? '☀️' : '🌙'}
                </span>
              </button>
              <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
            </div>
          </div>
        </div>
      )}
    </AndroidThemeContext.Provider>
  );
}

// Android System Bar Component
export function AndroidSystemBar() {
  const { androidTheme, batteryLevel, isCharging, networkStatus } = useAndroidTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <div className="bg-background/95 backdrop-blur-md border border-muted/20 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Battery className={`h-4 w-4 ${batteryLevel < 0.2 ? 'text-red-500' : 'text-green-500'}`} />
              <span>{Math.round(batteryLevel * 100)}%</span>
              {isCharging && <span className="text-blue-500">⚡</span>}
            </div>
            
            {networkStatus === 'wifi' && (
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-500" />
                <span>WiFi</span>
              </div>
            )}
            
            {networkStatus === 'cellular' && (
              <div className="flex items-center gap-1">
                <Signal className="h-3 w-3 text-yellow-500" />
                <span>Cellular</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="text-xs hover:text-primary">
              Theme: {androidTheme}
            </button>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
}