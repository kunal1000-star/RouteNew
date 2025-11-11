'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  GraduationCap, 
  Settings, 
  BookOpen, 
  Users, 
  Zap, 
  Target,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeachingModePreferences {
  explanationDepth: 'basic' | 'detailed' | 'comprehensive';
  exampleDensity: 'low' | 'medium' | 'high';
  interactiveMode: boolean;
  focusAreas: string[];
  customInstructions: string;
}

interface TeachingModePanelProps {
  isEnabled: boolean;
  mode: 'general' | 'personalized';
  preferences: TeachingModePreferences;
  onPreferencesChange: (preferences: Partial<TeachingModePreferences>) => void;
  onModeChange: (mode: 'general' | 'personalized') => void;
  onToggle: () => void;
  className?: string;
}

export function TeachingModePanel({
  isEnabled,
  mode,
  preferences,
  onPreferencesChange,
  onModeChange,
  onToggle,
  className
}: TeachingModePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newFocusArea, setNewFocusArea] = useState('');

  const handleAddFocusArea = () => {
    if (newFocusArea.trim() && !preferences.focusAreas.includes(newFocusArea.trim())) {
      onPreferencesChange({
        focusAreas: [...preferences.focusAreas, newFocusArea.trim()]
      });
      setNewFocusArea('');
    }
  };

  const handleRemoveFocusArea = (areaToRemove: string) => {
    onPreferencesChange({
      focusAreas: preferences.focusAreas.filter(area => area !== areaToRemove)
    });
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'personalized':
        return {
          title: 'Personalized Learning Mode',
          description: 'Tailored educational experience based on your learning history, preferences, and performance.',
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      case 'general':
      default:
        return {
          title: 'General Education Mode',
          description: 'Standard educational content designed for broad learning across all topics.',
          icon: BookOpen,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
    }
  };

  const modeConfig = getModeDescription();
  const IconComponent = modeConfig.icon;

  return (
    <Card className={cn('border-0 shadow-lg', className)}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              'p-2 rounded-full',
              modeConfig.bgColor,
              modeConfig.color
            )}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg font-semibold">
                  {modeConfig.title}
                </CardTitle>
                {isEnabled && (
                  <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                )}
              </div>
              <CardDescription className="text-sm">
                {modeConfig.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2 mb-3">
              <Settings className="h-4 w-4" />
              <span>Mode Type</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={mode === 'general' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('general')}
                className={cn(
                  'transition-all duration-200',
                  mode === 'general' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white' 
                    : 'border-gray-300 hover:bg-gray-50'
                )}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                General
              </Button>
              <Button
                variant={mode === 'personalized' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('personalized')}
                className={cn(
                  'transition-all duration-200',
                  mode === 'personalized' 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white' 
                    : 'border-gray-300 hover:bg-gray-50'
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                Personalized
              </Button>
            </div>
          </div>

          {/* Explanation Depth */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2 mb-2">
              <Brain className="h-4 w-4" />
              <span>Explanation Depth</span>
            </Label>
            <Select
              value={preferences.explanationDepth}
              onValueChange={(value: TeachingModePreferences['explanationDepth']) =>
                onPreferencesChange({ explanationDepth: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - Simple explanations</SelectItem>
                <SelectItem value="detailed">Detailed - In-depth coverage</SelectItem>
                <SelectItem value="comprehensive">Comprehensive - Complete mastery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Example Density */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4" />
              <span>Example Density</span>
            </Label>
            <Slider
              value={[preferences.exampleDensity === 'low' ? 1 : preferences.exampleDensity === 'medium' ? 2 : 3]}
              min={1}
              max={3}
              step={1}
              onValueChange={(value) => {
                const density = value[0] === 1 ? 'low' : value[0] === 2 ? 'medium' : 'high';
                onPreferencesChange({ exampleDensity: density });
              }}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low examples</span>
              <span>Medium examples</span>
              <span>High examples</span>
            </div>
          </div>

          {/* Interactive Mode */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4" />
              <span>Interactive Mode</span>
            </Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Enable interactive questioning and quizzes
              </span>
              <Switch
                checked={preferences.interactiveMode}
                onCheckedChange={(checked) => onPreferencesChange({ interactiveMode: checked })}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-blue-500"
              />
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2 mb-2">
              <GraduationCap className="h-4 w-4" />
              <span>Focus Areas</span>
            </Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFocusArea}
                  onChange={(e) => setNewFocusArea(e.target.value)}
                  placeholder="Add a focus area..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFocusArea()}
                />
                <Button
                  size="sm"
                  onClick={handleAddFocusArea}
                  disabled={!newFocusArea.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {preferences.focusAreas.map((area) => (
                  <div
                    key={area}
                    className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{area}</span>
                    <button
                      onClick={() => handleRemoveFocusArea(area)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Custom Instructions</span>
            </Label>
            <Textarea
              value={preferences.customInstructions}
              onChange={(e) => onPreferencesChange({ customInstructions: e.target.value })}
              placeholder="Any specific instructions for the teaching mode..."
              className="min-h-[80px] text-sm"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2 mb-2">
              <Settings className="h-4 w-4" />
              <span>Quick Presets</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreferencesChange({
                  explanationDepth: 'detailed',
                  exampleDensity: 'medium',
                  interactiveMode: true,
                  focusAreas: ['key concepts'],
                  customInstructions: 'Focus on understanding core principles with practical examples.'
                })}
                className="text-xs"
              >
                Study Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreferencesChange({
                  explanationDepth: 'basic',
                  exampleDensity: 'high',
                  interactiveMode: false,
                  focusAreas: ['overview'],
                  customInstructions: 'Provide a broad overview with many examples.'
                })}
                className="text-xs"
              >
                Overview
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default TeachingModePanel;