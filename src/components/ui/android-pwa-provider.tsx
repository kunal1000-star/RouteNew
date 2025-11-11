'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { useMediaQuery } from '@/hooks/use-media-query';
import { 
  Download, 
  Smartphone, 
  Star, 
  Share2, 
  Settings, 
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AndroidPWAFeatures {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  canShare: boolean;
  canAddToHomescreen: boolean;
}

export function AndroidPWAProvider({ children }: { children: React.ReactNode }) {
  const [pwaState, setPwaState] = useState<AndroidPWAFeatures>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    canShare: false,
    canAddToHomescreen: false
  });
  
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    // Check PWA installation status
    const checkPWAStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = 'getInstalledRelatedApps' in navigator;
      
      setPwaState(prev => ({
        ...prev,
        isStandalone,
        isInstalled
      }));
    };

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setPwaState(prev => ({ ...prev, isInstallable: true }));
      
      // Show install prompt after a delay
      setTimeout(() => {
        if (isMobile) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    // Check for Web Share API
    const canShare = 'share' in navigator;
    setPwaState(prev => ({ ...prev, canShare }));

    // Listen for PWA events
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setPwaState(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
      setShowInstallPrompt(false);
    });

    checkPWAStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isMobile]);

  const handleInstall = async () => {
    if (!installPromptEvent) return;

    try {
      await installPromptEvent.prompt();
      const result = await installPromptEvent.userChoice;
      
      if (result.outcome === 'accepted') {
        setPwaState(prev => ({ ...prev, isInstalled: true }));
      }
      
      setShowInstallPrompt(false);
      setInstallPromptEvent(null);
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleShare = async () => {
    if (!('share' in navigator)) return;

    try {
      await navigator.share({
        title: 'ROUTE Study Buddy',
        text: 'Amazing study companion with AI-powered assistance',
        url: window.location.href
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Don't show PWA features on desktop
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* PWA Installation Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Card className="p-4 bg-background/95 backdrop-blur-md shadow-lg border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Install ROUTE App</h3>
                  <p className="text-sm text-muted-foreground">
                    Get the full app experience on your device
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInstallPrompt(false)}
                  className="h-8"
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Android Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-muted/20 p-2">
        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-10 w-10 flex flex-col items-center gap-1 text-xs"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          
          {pwaState.canShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-10 w-10 flex flex-col items-center gap-1 text-xs"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 flex flex-col items-center gap-1 text-xs"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
          
          <div className="flex flex-col items-center gap-1 text-xs">
            <div className="h-4 w-4">
              {pwaState.isInstalled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <span className="text-xs">
              {pwaState.isInstalled ? 'Installed' : 'Web App'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}