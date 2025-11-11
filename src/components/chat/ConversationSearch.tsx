// ConversationSearch - Search Input Component
// ==========================================
// Enhanced search input with debouncing and keyboard shortcuts

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  Search, 
  X, 
  Clock, 
  Hash, 
  Filter, 
  History,
  ArrowLeft,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface ConversationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showKeyboardShortcuts?: boolean;
  recentSearches?: string[];
  onClearRecent?: () => void;
  onSelectRecent?: (query: string) => void;
}

export function ConversationSearch({
  value,
  onChange,
  onSearch,
  placeholder = "Search conversations...",
  className = '',
  showKeyboardShortcuts = true,
  recentSearches = [],
  onClearRecent,
  onSelectRecent
}: ConversationSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search suggestions based on input
  const generateSuggestions = useCallback((query: string): string[] => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const commonSuggestions = [
      'study help',
      'math homework',
      'science questions',
      'chemistry',
      'physics',
      'biology',
      'english literature',
      'history notes',
      'programming',
      'exam preparation'
    ];

    return commonSuggestions
      .filter(suggestion => suggestion.toLowerCase().includes(lowerQuery))
      .slice(0, 5);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Generate suggestions
    const newSuggestions = generateSuggestions(newValue);
    setSuggestions(newSuggestions);
    setShowSuggestions(newValue.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [onChange, generateSuggestions]);

  // Handle search
  const handleSearch = useCallback((query?: string) => {
    const searchQuery = query || value.trim();
    if (searchQuery) {
      onSearch?.(searchQuery);
      setShowSuggestions(false);
      // Save to recent searches
      saveToRecentSearches(searchQuery);
    }
  }, [value, onSearch]);

  // Save query to recent searches (localStorage)
  const saveToRecentSearches = useCallback((query: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const recent = JSON.parse(localStorage.getItem('conversation_searches') || '[]');
      const updated = [query, ...recent.filter((q: string) => q !== query)].slice(0, 10);
      localStorage.setItem('conversation_searches', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  }, []);

  // Load recent searches
  const loadRecentSearches = useCallback((): string[] => {
    if (typeof window === 'undefined') return recentSearches;
    
    try {
      const recent = JSON.parse(localStorage.getItem('conversation_searches') || '[]');
      return recent.length > 0 ? recent : recentSearches;
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
      return recentSearches;
    }
  }, [recentSearches]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || (suggestions.length === 0 && loadRecentSearches().length === 0)) {
      // Handle search shortcuts
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    const allSuggestions = [...suggestions, ...loadRecentSearches().filter(r => 
      !suggestions.includes(r) && r !== value
    )];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = allSuggestions[selectedSuggestionIndex];
          onChange(selectedSuggestion);
          handleSearch(selectedSuggestion);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, suggestions, value, selectedSuggestionIndex, onChange, handleSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    handleSearch(suggestion);
  }, [onChange, handleSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    onChange('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  // Focus and blur handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    const recent = loadRecentSearches();
    if (recent.length > 0 || value.length > 0) {
      setShowSuggestions(true);
    }
  }, [value, loadRecentSearches]);

  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  }, []);

  // Auto-focus when opening
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-20",
            isFocused && "ring-2 ring-primary/20"
          )}
        />
        
        {/* Keyboard shortcuts indicator */}
        {showKeyboardShortcuts && !isFocused && value === '' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
              ⌘K
            </kbd>
          </div>
        )}

        {/* Clear button */}
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search suggestions */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg">
          <div className="p-2">
            {/* Quick filters */}
            <div className="flex flex-wrap gap-1 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch('is:pinned')}
                className="text-xs h-6"
              >
                <Hash className="h-3 w-3 mr-1" />
                Pinned
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch('is:archived')}
                className="text-xs h-6"
              >
                <Clock className="h-3 w-3 mr-1" />
                Archived
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch('has:messages')}
                className="text-xs h-6"
              >
                <Filter className="h-3 w-3 mr-1" />
                With messages
              </Button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-muted-foreground mb-1">Suggestions</div>
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full justify-start text-left h-8",
                      index === selectedSuggestionIndex && "bg-accent"
                    )}
                  >
                    <Search className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span className="truncate">{suggestion}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Recent searches */}
            {loadRecentSearches().length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground">Recent searches</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('conversation_searches');
                      onClearRecent?.();
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
                {loadRecentSearches()
                  .filter((recent, index, arr) => arr.indexOf(recent) === index)
                  .slice(0, 5)
                  .map((recent, index) => (
                    <Button
                      key={recent}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuggestionClick(recent)}
                      className={cn(
                        "w-full justify-start text-left h-8",
                        index === selectedSuggestionIndex && "bg-accent"
                      )}
                    >
                      <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="truncate">{recent}</span>
                    </Button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationSearch;