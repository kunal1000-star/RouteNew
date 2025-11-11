// Settings Panel React Component - Phase 3 Implementation
// Theme toggle added
// Complete 5-tab settings interface with AI model selection, features, notifications, privacy, and usage monitoring

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { safeApiCall } from '@/lib/utils/safe-api';
import type {
  UserSettings,
  AIModelSettings,
  FeaturePreferences,
  NotificationSettings,
  PrivacyControls,
  UsageMonitoring,
  UsageStatistics,
  StudyBuddySettings
} from '@/types/settings';

// Icons (using Lucide React icons)
import {
  Settings as SettingsIcon,
  Brain,
  Bell,
  Shield,
  BarChart3,
  Download,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Users,
  Clock,
  Target,
  Cpu
} from 'lucide-react';

interface SettingsPanelProps {
  userId: string;
  onClose?: () => void;
}

import ThemeToggle from '@/components/ui/theme-toggle';

import ProviderKeysPanel from './ProviderKeysPanel';
import StudyBuddyTab from './StudyBuddyTab';

export default function SettingsPanel({ userId, onClose }: SettingsPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('aiModel');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const originalSettings = useRef<UserSettings | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const originalSettings = useRef<UserSettings | null>(null);

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStatistics | null>(null);
  const [tempSettings, setTempSettings] = useState<UserSettings | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, [userId]);

  // Track unsaved changes
  useEffect(() => {
    if (settings && tempSettings) {
      const hasChanges = JSON.stringify(settings) !== JSON.stringify(tempSettings);
      setHasUnsavedChanges(hasChanges);
    }
  }, [settings, tempSettings]);

  // Store original settings for comparison
  useEffect(() => {
    if (settings) {
      originalSettings.current = JSON.parse(JSON.stringify(settings));
    }
  }, [settings]);

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadUserSettings = async () => {
    setIsLoading(true);
    try {
      const [settingsResult, statsResult] = await Promise.all([
        safeApiCall(`/api/user/settings?userId=${userId}`),
        safeApiCall(`/api/user/settings/statistics?userId=${userId}`)
      ]);

      if (settingsResult.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for settings:', settingsResult.error);
        toast({
          title: 'Settings Error',
          description: 'Received HTML response - please check authentication',
          variant: 'destructive'
        });
        return;
      }

      if (settingsResult.success && settingsResult.data.success) {
        setSettings(settingsResult.data.data);
        setTempSettings(settingsResult.data.data);
      } else {
        console.error('❌ Failed to load settings:', settingsResult.error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive'
        });
        return;
      }

      if (statsResult.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for statistics:', statsResult.error);
        setUsageStats(null);
        return;
      }

      if (statsResult.success && statsResult.data.success) {
        setUsageStats(statsResult.data.data);
      } else {
        console.error('❌ Failed to load statistics:', statsResult.error);
        setUsageStats(null);
      }

    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!tempSettings) return;

    setIsLoading(true);
    try {
      const result = await safeApiCall(`/api/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          settings: tempSettings
        })
      });

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for save settings:', result.error);
        toast({
          title: 'Save Failed',
          description: 'Received HTML response - please check authentication',
          variant: 'destructive'
        });
        return;
      }

      if (!result.success) {
        console.error('❌ Failed to save settings:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to save settings',
          variant: 'destructive'
        });
        return;
      }

      if (result.data.success) {
        setSettings(tempSettings);
        setHasUnsavedChanges(false);
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
          variant: 'default'
        });
      } else {
        throw new Error(result.data.error || 'Failed to save settings');
      }

    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await safeApiCall(`/api/user/settings/reset?userId=${userId}`, {
        method: 'POST'
      });

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for reset settings:', result.error);
        toast({
          title: 'Reset Failed',
          description: 'Received HTML response - please check authentication',
          variant: 'destructive'
        });
        return;
      }

      if (!result.success) {
        console.error('❌ Failed to reset settings:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to reset settings',
          variant: 'destructive'
        });
        return;
      }

      if (result.data.success) {
        setSettings(result.data.data);
        setTempSettings(result.data.data);
        setHasUnsavedChanges(false);
        toast({
          title: 'Success',
          description: 'Settings reset to defaults',
          variant: 'default'
        });
      } else {
        console.error('❌ Reset failed:', result.data.error);
        toast({
          title: 'Error',
          description: result.data.error || 'Failed to reset settings',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportSettings = async () => {
    try {
      const result = await safeApiCall(`/api/user/settings/export?userId=${userId}`);

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for export settings:', result.error);
        toast({
          title: 'Export Failed',
          description: 'Received HTML response - please check authentication',
          variant: 'destructive'
        });
        return;
      }

      if (!result.success) {
        console.error('❌ Failed to export settings:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to export settings',
          variant: 'destructive'
        });
        return;
      }

      if (result.data.success) {
        const dataStr = JSON.stringify(result.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `study-assistant-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Settings exported successfully',
          variant: 'default'
        });
      } else {
        console.error('❌ Export failed:', result.data.error);
        toast({
          title: 'Error',
          description: result.data.error || 'Failed to export settings',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Failed to export settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to export settings',
        variant: 'destructive'
      });
    }
  };

  const updateTempSettings = (updates: Partial<UserSettings>) => {
    if (!tempSettings) return;
    
    const updated = { ...tempSettings, ...updates };
    setTempSettings(updated);
    setHasUnsavedChanges(true);
  };

  // Enhanced save function with validation
  const saveSettings = async () => {
    if (!tempSettings) return;

    // Validate Study Buddy settings if present
    if (tempSettings.studyBuddy) {
      let hasErrors = false;
      Object.entries(tempSettings.studyBuddy.endpoints).forEach(([endpointKey, config]) => {
        if (config.enabled && (!config.provider || !config.model)) {
          hasErrors = true;
        }
      });

      if (hasErrors) {
        toast({
          title: 'Validation Error',
          description: 'Please ensure all enabled endpoints have provider and model configured',
          variant: 'destructive'
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await safeApiCall(`/api/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          settings: tempSettings
        })
      });

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for save settings:', result.error);
        toast({
          title: 'Save Failed',
          description: 'Received HTML response - please check authentication',
          variant: 'destructive'
        });
        return;
      }

      if (!result.success) {
        console.error('❌ Failed to save settings:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to save settings',
          variant: 'destructive'
        });
        return;
      }

      if (result.data.success) {
        setSettings(tempSettings);
        setHasUnsavedChanges(false);
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
          variant: 'default'
        });
      } else {
        throw new Error(result.data.error || 'Failed to save settings');
      }

    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced reset function with confirmation dialog
  const resetSettings = async () => {
    setShowResetDialog(true);
  };

  const confirmResetSettings = async () => {
    setShowResetDialog(false);
    setIsLoading(true);
    try {
      const result = await safeApiCall(`/api/user/settings/reset?userId=${userId}`, {
        method: 'POST'
      });

      if (result.isHtmlResponse) {
        console.warn('⚠️ HTML response detected for reset settings:', result.error);
        toast({
          title: 'Reset Failed',
          description: 'Received HTML response - please check authentication',
          variant: 'destructive'
        });
        return;
      }

      if (!result.success) {
        console.error('❌ Failed to reset settings:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to reset settings',
          variant: 'destructive'
        });
        return;
      }

      if (result.data.success) {
        setSettings(result.data.data);
        setTempSettings(result.data.data);
        setHasUnsavedChanges(false);
        toast({
          title: 'Success',
          description: 'Settings reset to defaults',
          variant: 'default'
        });
      } else {
        console.error('❌ Reset failed:', result.data.error);
        toast({
          title: 'Error',
          description: result.data.error || 'Failed to reset settings',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced close function with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseDialog(true);
    } else {
      onClose?.();
    }
  };

  // Handle tab changes with unsaved changes check
  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges) {
      setPendingTabChange(newTab);
      setShowUnsavedDialog(true);
    } else {
      setActiveTab(newTab);
    }
  };

  // Confirm navigation away from current tab
  const confirmTabChange = () => {
    if (pendingTabChange) {
      setActiveTab(pendingTabChange);
      setPendingTabChange(null);
    }
    setShowUnsavedDialog(false);
  };

  // Discard changes and navigate
  const discardChangesAndNavigate = () => {
    if (originalSettings.current) {
      setTempSettings(originalSettings.current);
      setHasUnsavedChanges(false);
    }
    confirmTabChange();
  };

  // Confirm close without saving
  const confirmClose = () => {
    setShowCloseDialog(false);
    onClose?.();
  };

  // Discard changes and close
  const discardChangesAndClose = () => {
    if (originalSettings.current) {
      setTempSettings(originalSettings.current);
      setHasUnsavedChanges(false);
    }
    confirmClose();
  };

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings || !tempSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Failed to load settings</p>
          <Button onClick={loadUserSettings} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  console.log('🔧 SettingsPanel: Rendering with activeTab:', activeTab);
  console.log('🔧 SettingsPanel: Settings state:', settings);
  console.log('🔧 SettingsPanel: TempSettings state:', tempSettings);
  console.log('🔧 SettingsPanel: Has StudyBuddy settings:', !!tempSettings?.studyBuddy);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Settings
              </CardTitle>
              <CardDescription>
                Customize your AI study assistant preferences and monitor usage
              </CardDescription>
              <div className="mt-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Theme</div>
                    <div className="text-sm text-muted-foreground">Toggle between light and dark mode</div>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="animate-pulse text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            if (originalSettings.current) {
                              setTempSettings(originalSettings.current);
                              setHasUnsavedChanges(false);
                            }
                          }}
                          aria-label="Discard all unsaved changes"
                        >
                          <Undo2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Discard all unsaved changes
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportSettings}
                disabled={isLoading}
                className="transition-all hover:scale-105"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetSettings}
                disabled={isLoading}
                className="transition-all hover:scale-105"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={saveSettings}
                disabled={!hasUnsavedChanges || isLoading}
                className="bg-primary hover:bg-primary/90 transition-all hover:scale-105"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 transition-all hover:scale-105 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close settings</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="aiModel" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Models
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Features
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Usage
              </TabsTrigger>
              <TabsTrigger value="studyBuddy" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Study Buddy
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: AI Model Selection & Rate Limits */}
            <TabsContent value="aiModel" className="space-y-6">
              <AIModelTab
                settings={tempSettings.aiModel}
                onChange={(updates) => updateTempSettings({ aiModel: { ...tempSettings.aiModel, ...updates } })}
              />
            </TabsContent>

            {/* Tab 2: Feature Preferences & Overrides */}
            <TabsContent value="features" className="space-y-6">
              <FeaturesTab
                settings={tempSettings.features}
                onChange={(updates) => updateTempSettings({ features: { ...tempSettings.features, ...updates } })}
              />
            </TabsContent>

            {/* Tab 3: Notification & Alert Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <NotificationsTab
                settings={tempSettings.notifications}
                onChange={(updates) => updateTempSettings({ notifications: { ...tempSettings.notifications, ...updates } })}
              />
            </TabsContent>

            {/* Tab 4: Privacy & Data Controls */}
            <TabsContent value="privacy" className="space-y-6">
              <PrivacyTab
                settings={tempSettings.privacy}
                onChange={(updates) => updateTempSettings({ privacy: { ...tempSettings.privacy, ...updates } })}
              />
            </TabsContent>

            {/* Tab 5: Usage Monitoring & Statistics */}
            <TabsContent value="usage" className="space-y-6">
              <UsageTab
                settings={tempSettings.usage}
                usageStats={usageStats}
                onChange={(updates) => updateTempSettings({ usage: { ...tempSettings.usage, ...updates } })}
              />
            </TabsContent>

            {/* Tab 6: Study Buddy AI Endpoint Configuration */}
            <TabsContent value="studyBuddy" className="space-y-6">
              {tempSettings?.studyBuddy ? (
                <StudyBuddyTab
                  settings={tempSettings.studyBuddy}
                  onChange={(updates) => updateTempSettings({ studyBuddy: { ...tempSettings.studyBuddy, ...updates } })}
                  onRequestSave={saveSettings}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
                    <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                  <p className="text-muted-foreground mt-4">Loading Study Buddy settings...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

<section className="mt-6">
  <ProviderKeysPanel />
</section>
        </CardContent>
      </Card>
    </div>
  );

  // Unsaved Changes Dialog
  const UnsavedChangesDialog = () => (
    <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes. What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setShowUnsavedDialog(false)}
            className="flex-1"
          >
            Continue Editing
          </Button>
          <Button
            variant="secondary"
            onClick={discardChangesAndNavigate}
            className="flex-1"
          >
            Discard Changes
          </Button>
          <Button
            onClick={confirmTabChange}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Reset Confirmation Dialog
  const ResetConfirmationDialog = () => (
    <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-destructive" />
            Reset Settings
          </DialogTitle>
          <DialogDescription>
            This will reset all your settings to their default values. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmResetSettings}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset to Defaults'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Close Confirmation Dialog
  const CloseConfirmationDialog = () => (
    <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-destructive" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes. Are you sure you want to close without saving?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setShowCloseDialog(false)}
            className="flex-1"
          >
            Continue Editing
          </Button>
          <Button
            variant="secondary"
            onClick={discardChangesAndClose}
            className="flex-1"
          >
            Discard & Close
          </Button>
          <Button
            onClick={saveSettings}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Close'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {SettingsPanelContent}
      <UnsavedChangesDialog />
      <ResetConfirmationDialog />
      <CloseConfirmationDialog />
    </>
  );

  // Unsaved Changes Dialog
  const UnsavedChangesDialog = () => (
    <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes. What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setShowUnsavedDialog(false)}
            className="flex-1"
          >
            Continue Editing
          </Button>
          <Button
            variant="secondary"
            onClick={discardChangesAndNavigate}
            className="flex-1"
          >
            Discard Changes
          </Button>
          <Button
            onClick={confirmTabChange}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Reset Confirmation Dialog
  const ResetConfirmationDialog = () => (
    <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-destructive" />
            Reset Settings
          </DialogTitle>
          <DialogDescription>
            This will reset all your settings to their default values. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmResetSettings}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset to Defaults'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Close Confirmation Dialog
  const CloseConfirmationDialog = () => (
    <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-destructive" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes. Are you sure you want to close without saving?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setShowCloseDialog(false)}
            className="flex-1"
          >
            Continue Editing
          </Button>
          <Button
            variant="secondary"
            onClick={discardChangesAndClose}
            className="flex-1"
          >
            Discard & Close
          </Button>
          <Button
            onClick={saveSettings}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Close'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {SettingsPanelContent}
      <UnsavedChangesDialog />
      <ResetConfirmationDialog />
      <CloseConfirmationDialog />
    </>
  );
}

// Individual Tab Components

function AIModelTab({ settings, onChange }: { 
  settings: AIModelSettings; 
  onChange: (updates: Partial<AIModelSettings>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Model Selection
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure your preferred AI models and quality settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preferred Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Primary Provider</Label>
              <Select
                value={settings.preferredProviders[0]}
                onValueChange={(value) => {
                  const newProviders = [value, ...settings.preferredProviders.filter(p => p !== value)];
                  onChange({ preferredProviders: newProviders });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="cerebras">Cerebras</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quality Setting</Label>
              <Select
                value={settings.qualitySettings.responseQuality}
                onValueChange={(value: 'fast' | 'balanced' | 'high') =>
                  onChange({ 
                    qualitySettings: { 
                      ...settings.qualitySettings, 
                      responseQuality: value 
                    }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast (Lower Cost)</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Temperature: {settings.qualitySettings.temperature}</Label>
              <Slider
                value={[settings.qualitySettings.temperature]}
                onValueChange={([value]) =>
                  onChange({ 
                    qualitySettings: { 
                      ...settings.qualitySettings, 
                      temperature: value 
                    }
                  })
                }
                min={0}
                max={1}
                step={0.1}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rate Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="daily-requests">Daily Requests</Label>
              <Input
                id="daily-requests"
                type="number"
                value={settings.rateLimits.dailyRequests}
                onChange={(e) =>
                  onChange({
                    rateLimits: {
                      ...settings.rateLimits,
                      dailyRequests: parseInt(e.target.value)
                    }
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="hourly-requests">Hourly Requests</Label>
              <Input
                id="hourly-requests"
                type="number"
                value={settings.rateLimits.hourlyRequests}
                onChange={(e) =>
                  onChange({
                    rateLimits: {
                      ...settings.rateLimits,
                      hourlyRequests: parseInt(e.target.value)
                    }
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="concurrent-requests">Concurrent Requests</Label>
              <Input
                id="concurrent-requests"
                type="number"
                value={settings.rateLimits.concurrentRequests}
                onChange={(e) =>
                  onChange({
                    rateLimits: {
                      ...settings.rateLimits,
                      concurrentRequests: parseInt(e.target.value)
                    }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeaturesTab({ settings, onChange }: { 
  settings: FeaturePreferences; 
  onChange: (updates: Partial<FeaturePreferences>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Feature Preferences
        </h3>
        <p className="text-sm text-muted-foreground">
          Customize how AI suggestions and features work for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-suggestions-enabled">Enable AI Suggestions</Label>
              <Switch
                id="ai-suggestions-enabled"
                checked={settings.aiSuggestions.enabled}
                onCheckedChange={(checked) =>
                  onChange({
                    aiSuggestions: {
                      ...settings.aiSuggestions,
                      enabled: checked
                    }
                  })
                }
              />
            </div>

            <div>
              <Label>Frequency</Label>
              <Select
                value={settings.aiSuggestions.frequency}
                onValueChange={(value: 'real-time' | 'hourly' | 'daily' | 'manual') =>
                  onChange({
                    aiSuggestions: {
                      ...settings.aiSuggestions,
                      frequency: value
                    }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real-time">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categories</Label>
              {Object.entries(settings.aiSuggestions.categories).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`category-${key}`} className="capitalize">
                    {key}
                  </Label>
                  <Switch
                    id={`category-${key}`}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      onChange({
                        aiSuggestions: {
                          ...settings.aiSuggestions,
                          categories: {
                            ...settings.aiSuggestions.categories,
                            [key]: checked
                          }
                        }
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Study Modes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Primary Mode</Label>
              <Select
                value={settings.studyModes.primaryMode}
                onValueChange={(value: 'test-prep' | 'concept-learning' | 'revision' | 'problem-solving') =>
                  onChange({
                    studyModes: {
                      ...settings.studyModes,
                      primaryMode: value
                    }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test-prep">Test Preparation</SelectItem>
                  <SelectItem value="concept-learning">Concept Learning</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                  <SelectItem value="problem-solving">Problem Solving</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Session Length (minutes)</Label>
              <Input
                type="number"
                value={settings.studyModes.sessionLength}
                onChange={(e) =>
                  onChange({
                    studyModes: {
                      ...settings.studyModes,
                      sessionLength: parseInt(e.target.value)
                    }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="difficulty-adaptation">Difficulty Adaptation</Label>
              <Switch
                id="difficulty-adaptation"
                checked={settings.studyModes.difficultyAdaptation}
                onCheckedChange={(checked) =>
                  onChange({
                    studyModes: {
                      ...settings.studyModes,
                      difficultyAdaptation: checked
                    }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NotificationsTab({ settings, onChange }: { 
  settings: NotificationSettings; 
  onChange: (updates: Partial<NotificationSettings>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose how and when you want to be notified
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Push Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-enabled">Enable Push Notifications</Label>
              <Switch
                id="push-enabled"
                checked={settings.pushNotifications.enabled}
                onCheckedChange={(checked) =>
                  onChange({
                    pushNotifications: {
                      ...settings.pushNotifications,
                      enabled: checked
                    }
                  })
                }
              />
            </div>

            {Object.entries(settings.pushNotifications).map(([key, enabled]) => {
              if (key === 'enabled') return null;
              return (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`push-${key}`} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Label>
                  <Switch
                    id={`push-${key}`}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      onChange({
                        pushNotifications: {
                          ...settings.pushNotifications,
                          [key]: checked
                        }
                      })
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Email Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled">Enable Email Notifications</Label>
              <Switch
                id="email-enabled"
                checked={settings.emailNotifications.enabled}
                onCheckedChange={(checked) =>
                  onChange({
                    emailNotifications: {
                      ...settings.emailNotifications,
                      enabled: checked
                    }
                  })
                }
              />
            </div>

            {Object.entries(settings.emailNotifications).map(([key, enabled]) => {
              if (key === 'enabled') return null;
              return (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`email-${key}`} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Label>
                  <Switch
                    id={`email-${key}`}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      onChange({
                        emailNotifications: {
                          ...settings.emailNotifications,
                          [key]: checked
                        }
                      })
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PrivacyTab({ settings, onChange }: { 
  settings: PrivacyControls; 
  onChange: (updates: Partial<PrivacyControls>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Data Controls
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage your data collection and privacy preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.dataCollection).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`data-${key}`} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Label>
                <Switch
                  id={`data-${key}`}
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    onChange({
                      dataCollection: {
                        ...settings.dataCollection,
                        [key]: checked
                      }
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI Data Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.aiDataProcessing).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`ai-${key}`} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Label>
                <Switch
                  id={`ai-${key}`}
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    onChange({
                      aiDataProcessing: {
                        ...settings.aiDataProcessing,
                        [key]: checked
                      }
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="delete-days">Delete Data After (days)</Label>
              <Input
                id="delete-days"
                type="number"
                value={settings.dataRetention.deleteAfterDays}
                onChange={(e) =>
                  onChange({
                    dataRetention: {
                      ...settings.dataRetention,
                      deleteAfterDays: parseInt(e.target.value)
                    }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-cleanup">Automatic Cleanup</Label>
              <Switch
                id="auto-cleanup"
                checked={settings.dataRetention.automaticCleanup}
                onCheckedChange={(checked) =>
                  onChange({
                    dataRetention: {
                      ...settings.dataRetention,
                      automaticCleanup: checked
                    }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sharing Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.sharingControls).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`share-${key}`} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Label>
                <Switch
                  id={`share-${key}`}
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    onChange({
                      sharingControls: {
                        ...settings.sharingControls,
                        [key]: checked
                      }
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsageTab({ settings, usageStats, onChange }: { 
  settings: UsageMonitoring; 
  usageStats: UsageStatistics | null;
  onChange: (updates: Partial<UsageMonitoring>) => void;
}) {
  if (!usageStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading usage statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Monitoring & Statistics
        </h3>
        <p className="text-sm text-muted-foreground">
          Track your study progress and AI usage
        </p>
      </div>

      {/* Usage Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{usageStats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{Math.round(usageStats.totalStudyTime / 60)}h</p>
                <p className="text-xs text-muted-foreground">Study Time</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{usageStats.aiRequestsMade}</p>
                <p className="text-xs text-muted-foreground">AI Requests</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{usageStats.studyStreak.current}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Token Usage by Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(usageStats.tokenUsage.byProvider).map(([provider, tokens]) => (
              <div key={provider} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{provider}</span>
                  <span>{tokens.toLocaleString()} tokens</span>
                </div>
                <Progress 
                  value={(tokens / usageStats.tokenUsage.total) * 100} 
                  className="h-2"
                />
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm font-medium">
              <span>Total Cost</span>
              <span>${usageStats.tokenUsage.cost.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Feature Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(usageStats.featureUsage).map(([feature, usage]) => (
              <div key={feature} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{feature}</span>
                  <span>{usage}%</span>
                </div>
                <Progress value={usage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Display Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.displayOptions).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`display-${key}`} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Label>
                <Switch
                  id={`display-${key}`}
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    onChange({
                      displayOptions: {
                        ...settings.displayOptions,
                        [key]: checked
                      }
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Visualization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preferred Chart Type</Label>
              <Select
                value={settings.dataVisualization.preferredChartType}
                onValueChange={(value: 'bar' | 'line' | 'pie' | 'area') =>
                  onChange({
                    dataVisualization: {
                      ...settings.dataVisualization,
                      preferredChartType: value
                    }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Range</Label>
              <Select
                value={settings.dataVisualization.timeRange}
                onValueChange={(value: 'day' | 'week' | 'month' | 'year') =>
                  onChange({
                    dataVisualization: {
                      ...settings.dataVisualization,
                      timeRange: value
                    }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {Object.entries(settings.dataVisualization).map(([key, enabled]) => {
                if (key === 'preferredChartType' || key === 'timeRange') return null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`viz-${key}`} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                    <Switch
                      id={`viz-${key}`}
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        onChange({
                          dataVisualization: {
                            ...settings.dataVisualization,
                            [key]: checked
                          }
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
