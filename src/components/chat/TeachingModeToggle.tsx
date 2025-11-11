'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  GraduationCap, 
  Users, 
  Sparkles, 
  BookOpen, 
  Settings, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeachingModeToggleProps {
  isEnabled: boolean;
  mode: 'general' | 'personalized';
  onToggle: () => void;
  onModeChange: (mode: 'general' | 'personalized') => void;
  className?: string;
  disabled?: boolean;
}

export function TeachingModeToggle({
  isEnabled,
  mode,
  onToggle,
  onModeChange,
  className,
  disabled = false
}: TeachingModeToggleProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Toggle Section */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'p-2 rounded-full transition-colors',
            isEnabled 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          )}>
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">Teaching Mode</span>
              {isEnabled && (
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isEnabled 
                ? mode === 'personalized' 
                  ? 'Personalized learning experience' 
                  : 'General educational content'
                : 'Manual activation required'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
            disabled={disabled}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
          />
        </div>
      </div>

      {/* Mode Selection (only when enabled) */}
      {isEnabled && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Mode Type</span>
          </Label>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('general')}
              className={cn(
                'justify-start transition-all duration-200',
                mode === 'general' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white' 
                  : 'border-gray-300 hover:bg-gray-50'
              )}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              General
              <span className="ml-auto text-xs opacity-75">📚</span>
            </Button>
            
            <Button
              variant={mode === 'personalized' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('personalized')}
              className={cn(
                'justify-start transition-all duration-200',
                mode === 'personalized' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white' 
                  : 'border-gray-300 hover:bg-gray-50'
              )}
            >
              <Users className="h-4 w-4 mr-2" />
              Personalized
              <span className="ml-auto text-xs opacity-75">👤</span>
            </Button>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className={cn(
        'flex items-center space-x-2 text-xs transition-all duration-300',
        isEnabled 
          ? 'text-green-600 opacity-100' 
          : 'text-gray-400 opacity-50'
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full',
          isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
        )} />
        <span>
          {isEnabled 
            ? `Active - ${mode === 'general' ? 'Standard education mode' : 'Personalized learning mode'}` 
            : 'Click toggle to activate teaching mode'
          }
        </span>
      </div>
    </div>
  );
}

export default TeachingModeToggle;