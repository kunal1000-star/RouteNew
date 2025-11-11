'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Sparkles, 
  Brain,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeachingModeIndicatorProps {
  isEnabled: boolean;
  mode: 'general' | 'personalized';
  activationCount?: number;
  className?: string;
  showDetails?: boolean;
}

export function TeachingModeIndicator({
  isEnabled,
  mode,
  activationCount = 0,
  className,
  showDetails = true
}: TeachingModeIndicatorProps) {
  if (!isEnabled) {
    return null;
  }

  const getModeConfig = () => {
    switch (mode) {
      case 'personalized':
        return {
          icon: Users,
          label: 'Personalized',
          color: 'bg-gradient-to-r from-purple-500 to-purple-600',
          tooltip: 'Personalized learning mode - Content is tailored to your specific learning history and preferences',
          emoji: '👤',
          features: ['Adaptive explanations', 'Personal history integration', 'Customized examples']
        };
      case 'general':
      default:
        return {
          icon: BookOpen,
          label: 'General',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
          tooltip: 'General education mode - Standard educational content for broad learning',
          emoji: '📚',
          features: ['Standard explanations', 'General knowledge base', 'Universal examples']
        };
    }
  };

  const config = getModeConfig();
  const IconComponent = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={cn(
              'flex items-center space-x-2 px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:scale-105 cursor-help',
              config.color,
              'text-white border-0 shadow-md',
              className
            )}
          >
            <div className="flex items-center space-x-1.5">
              <div className="relative">
                <IconComponent className="h-3 w-3" />
                {isEnabled && (
                  <Sparkles className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                )}
              </div>
              <span className="font-semibold">{config.label}</span>
              <span className="text-white/80 text-xs">{config.emoji}</span>
              {activationCount > 0 && (
                <span className="ml-1 px-1 py-0.5 bg-white/20 rounded text-white/90">
                  {activationCount}
                </span>
              )}
            </div>
          </Badge>
        </TooltipTrigger>
        
        <TooltipContent 
          side="top" 
          className="max-w-sm p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700 shadow-xl"
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className={cn('p-1 rounded-full', config.color)}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">{config.label} Teaching Mode</h4>
                <p className="text-xs text-gray-300">Currently active</p>
              </div>
              <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse ml-auto" />
            </div>
            
            {showDetails && (
              <>
                <div className="pt-2">
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {config.tooltip}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <Target className="h-3 w-3 text-blue-400" />
                    <span className="text-gray-300">Active Features:</span>
                  </div>
                  <div className="space-y-1">
                    {config.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs text-gray-400">
                        <Zap className="h-2 w-2 text-yellow-400" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 text-xs text-gray-500 border-t border-gray-700">
                  <div className="flex items-center space-x-1">
                    <Brain className="h-3 w-3 text-purple-400" />
                    <span>Enhanced learning experience</span>
                  </div>
                  <div className="text-gray-400">
                    Session #{activationCount}
                  </div>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default TeachingModeIndicator;