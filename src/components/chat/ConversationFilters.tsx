// ConversationFilters - Filter and Sort Component
// ===============================================
// Advanced filtering and sorting for conversation list

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  MessageSquare, 
  Archive, 
  Star,
  X,
  CheckCircle,
  Hash,
  Users,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  User
} from 'lucide-react';
import type { ConversationFilters as FilterType } from '@/hooks/useConversationPersistence';

interface ConversationFiltersProps {
  filters: FilterType;
  onChange: (filters: Partial<FilterType>) => void;
  onToggleSelectionMode: () => void;
  isSelectionMode: boolean;
}

export function ConversationFilters({
  filters,
  onChange,
  onToggleSelectionMode,
  isSelectionMode
}: ConversationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<Partial<FilterType>>(filters);

  // Chat type options
  const chatTypeOptions = [
    { value: 'general', label: 'General', icon: MessageSquare, color: 'text-blue-500' },
    { value: 'study_assistant', label: 'Study Assistant', icon: User, color: 'text-green-500' },
    { value: 'tutoring', label: 'Tutoring', icon: Users, color: 'text-purple-500' },
    { value: 'review', label: 'Review', icon: FileText, color: 'text-orange-500' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'last_activity_at', label: 'Last Activity', icon: Clock },
    { value: 'created_at', label: 'Created Date', icon: Calendar },
    { value: 'title', label: 'Title', icon: Hash },
    { value: 'message_count', label: 'Message Count', icon: MessageSquare }
  ];

  // Status filters
  const statusFilters = [
    { value: 'is_pinned', label: 'Pinned', icon: Star },
    { value: 'is_archived', label: 'Archived', icon: Archive },
    { value: 'has_messages', label: 'Has Messages', icon: MessageSquare }
  ];

  // Apply filters
  const applyFilters = useCallback(() => {
    onChange(localFilters);
    setIsExpanded(false);
  }, [localFilters, onChange]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const resetFilters = {
      limit: 50,
      sort_by: 'last_activity_at',
      sort_order: 'desc'
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  }, [onChange]);

  // Update individual filter
  const updateFilter = useCallback((key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (localFilters.chat_type) count++;
    if (localFilters.is_archived !== undefined) count++;
    if (localFilters.is_pinned !== undefined) count++;
    if (localFilters.search) count++;
    if (localFilters.sort_by && localFilters.sort_by !== 'last_activity_at') count++;
    if (localFilters.sort_order && localFilters.sort_order !== 'desc') count++;
    return count;
  }, [localFilters]);

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-3">
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <Label className="text-sm font-medium">Filters</Label>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Selection mode toggle */}
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            className="h-8"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {isSelectionMode ? 'Exit Select' : 'Select'}
          </Button>

          {/* Filter actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <SortAsc className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => updateFilter('sort_by', option.value)}
                >
                  <option.icon className="h-4 w-4 mr-2" />
                  Sort by {option.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => updateFilter('sort_order', filters.sort_order === 'asc' ? 'desc' : 'asc')}
              >
                {filters.sort_order === 'asc' ? (
                  <SortDesc className="h-4 w-4 mr-2" />
                ) : (
                  <SortAsc className="h-4 w-4 mr-2" />
                )}
                {filters.sort_order === 'asc' ? 'Desc' : 'Asc'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick filter buttons */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = localFilters[filter.value as keyof FilterType] === true;
          
          return (
            <Button
              key={filter.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const currentValue = localFilters[filter.value as keyof FilterType];
                const newValue = currentValue === true ? undefined : true;
                updateFilter(filter.value, newValue);
              }}
              className="h-8"
            >
              <Icon className="h-3 w-3 mr-1" />
              {filter.label}
            </Button>
          );
        })}
      </div>

      {/* Collapsible advanced filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-full justify-between">
            <span className="text-sm">Advanced Filters</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4">
          <Separator />
          
          {/* Chat Type Filter */}
          <div className="space-y-2">
            <Label className="text-sm">Chat Type</Label>
            <Select
              value={localFilters.chat_type || 'all'}
              onValueChange={(value) => updateFilter('chat_type', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {chatTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <option.icon className={cn("h-4 w-4", option.color)} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filters */}
          <div className="space-y-3">
            <Label className="text-sm">Status</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinned"
                  checked={localFilters.is_pinned === true}
                  onCheckedChange={(checked) => 
                    updateFilter('is_pinned', checked ? true : undefined)
                  }
                />
                <Label htmlFor="pinned" className="text-sm cursor-pointer">
                  <Star className="h-4 w-4 inline mr-1 text-yellow-500" />
                  Pinned conversations
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="archived"
                  checked={localFilters.is_archived === true}
                  onCheckedChange={(checked) => 
                    updateFilter('is_archived', checked ? true : undefined)
                  }
                />
                <Label htmlFor="archived" className="text-sm cursor-pointer">
                  <Archive className="h-4 w-4 inline mr-1 text-gray-500" />
                  Archived conversations
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="with-messages"
                  checked={localFilters.has_messages === true}
                  onCheckedChange={(checked) => 
                    updateFilter('has_messages', checked ? true : undefined)
                  }
                />
                <Label htmlFor="with-messages" className="text-sm cursor-pointer">
                  <MessageSquare className="h-4 w-4 inline mr-1 text-blue-500" />
                  Conversations with messages
                </Label>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label className="text-sm">Sort By</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={localFilters.sort_by || 'last_activity_at'}
                onValueChange={(value) => updateFilter('sort_by', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter(
                  'sort_order', 
                  localFilters.sort_order === 'asc' ? 'desc' : 'asc'
                )}
                className="h-10"
              >
                {localFilters.sort_order === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm">Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="from-date" className="text-xs text-muted-foreground">
                  From
                </Label>
                <input
                  id="from-date"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={localFilters.date_from || ''}
                  onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="to-date" className="text-xs text-muted-foreground">
                  To
                </Label>
                <input
                  id="to-date"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={localFilters.date_to || ''}
                  onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <Button size="sm" onClick={applyFilters} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default ConversationFilters;