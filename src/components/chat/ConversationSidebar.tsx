// ConversationSidebar - Main Component
// ====================================
// Comprehensive sidebar for conversation history management

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConversationPersistence, type DatabaseConversation, type ConversationFilters } from '@/hooks/useConversationPersistence';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  History, 
  Search, 
  Filter, 
  Plus, 
  MessageSquare, 
  Archive, 
  Trash2, 
  Pin, 
  Edit, 
  Star,
  MoreHorizontal,
  X,
  Calendar,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Share2,
  Download,
  Loader2,
  Check,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ConversationList } from './ConversationList';
import { ConversationFilters } from './ConversationFilters';
import { ConversationSearch } from './ConversationSearch';
import { BulkActions } from './BulkActions';
import './ConversationSidebar.styles.css';

interface ConversationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onConversationSelect?: (conversation: DatabaseConversation) => void;
  currentConversationId?: string;
  className?: string;
}

export function ConversationSidebar({
  isOpen,
  onToggle,
  onConversationSelect,
  currentConversationId,
  className = ''
}: ConversationSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    conversations,
    currentConversation,
    isLoading,
    error,
    loadConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
    pinConversation,
    unpinConversation,
    searchConversations,
    batchDelete,
    batchArchive,
    batchUnpin
  } = useConversationPersistence();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ConversationFilters>({
    limit: 50,
    sort_by: 'last_activity_at',
    sort_order: 'desc'
  });
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConversation, setEditingConversation] = useState<DatabaseConversation | null>(null);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load conversations when filters change
  useEffect(() => {
    const currentFilters = { ...filters };
    if (debouncedSearchQuery) {
      currentFilters.search = debouncedSearchQuery;
    }
    loadConversations(currentFilters);
  }, [filters, debouncedSearchQuery, loadConversations]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when sidebar is open
      if (!isOpen) return;

      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('conversation-search')?.focus();
      }

      // Cmd/Ctrl + N for new conversation
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        handleCreateConversation();
      }

      // Escape to close selection mode
      if (event.key === 'Escape') {
        setIsSelectionMode(false);
        setSelectedConversations(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversation: DatabaseConversation) => {
    if (isSelectionMode) {
      // Selection mode: toggle selection
      setSelectedConversations(prev => {
        const newSet = new Set(prev);
        if (newSet.has(conversation.id)) {
          newSet.delete(conversation.id);
        } else {
          newSet.add(conversation.id);
        }
        return newSet;
      });
    } else {
      // Normal mode: select and notify parent
      onConversationSelect?.(conversation);
    }
  }, [isSelectionMode, onConversationSelect]);

  // Handle create conversation
  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) return;

    try {
      const newConversation = await createConversation({
        title: newConversationTitle.trim(),
        chat_type: 'general',
        metadata: {}
      });

      if (newConversation) {
        setIsCreateDialogOpen(false);
        setNewConversationTitle('');
        onConversationSelect?.(newConversation);
        toast({
          title: 'Success',
          description: 'New conversation created'
        });
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Handle edit conversation
  const handleEditConversation = async () => {
    if (!editingConversation || !newConversationTitle.trim()) return;

    try {
      const updated = await updateConversation(editingConversation.id, {
        title: newConversationTitle.trim()
      });

      if (updated) {
        setIsEditDialogOpen(false);
        setEditingConversation(null);
        setNewConversationTitle('');
        toast({
          title: 'Success',
          description: 'Conversation title updated'
        });
      }
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  };

  // Handle single conversation actions
  const handleConversationAction = async (
    action: 'archive' | 'unarchive' | 'pin' | 'unpin' | 'delete',
    conversation: DatabaseConversation
  ) => {
    try {
      let success = false;

      switch (action) {
        case 'archive':
          success = await archiveConversation(conversation.id);
          break;
        case 'unarchive':
          success = await unarchiveConversation(conversation.id);
          break;
        case 'pin':
          success = await pinConversation(conversation.id);
          break;
        case 'unpin':
          success = await unpinConversation(conversation.id);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
            success = await deleteConversation(conversation.id);
          }
          break;
      }

      if (success) {
        const actionText = action === 'delete' ? 'deleted' : `${action}d`;
        toast({
          title: 'Success',
          description: `Conversation ${actionText} successfully`
        });
      }
    } catch (error) {
      console.error(`Failed to ${action} conversation:`, error);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'archive' | 'delete' | 'unpin') => {
    const selectedIds = Array.from(selectedConversations);
    if (selectedIds.length === 0) return;

    try {
      let success = false;

      switch (action) {
        case 'archive':
          success = await batchArchive(selectedIds);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedIds.length} conversations? This action cannot be undone.`)) {
            success = await batchDelete(selectedIds);
          }
          break;
        case 'unpin':
          success = await batchUnpin(selectedIds);
          break;
      }

      if (success) {
        setIsSelectionMode(false);
        setSelectedConversations(new Set());
        toast({
          title: 'Success',
          description: `Batch ${action} completed successfully`
        });
      }
    } catch (error) {
      console.error(`Failed to batch ${action}:`, error);
    }
  };

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ConversationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedConversations(new Set());
  };

  // Select all visible conversations
  const selectAllConversations = () => {
    const allIds = conversations.map(conv => conv.id);
    setSelectedConversations(new Set(allIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedConversations(new Set());
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed top-4 left-4 z-50 transition-all duration-300",
          isOpen && "left-80"
        )}
        title="Toggle Conversation History (Ctrl+K)"
      >
        <History className="h-4 w-4" />
      </Button>

      {/* Sidebar Sheet */}
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent 
          side="left" 
          className="w-80 p-0 flex flex-col"
          onInteractOutside={(e) => {
            // Don't close on outside click in selection mode
            if (!isSelectionMode) {
              onToggle();
            }
          }}
        >
          <SheetHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Conversations</span>
                {conversations.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {conversations.length}
                  </Badge>
                )}
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search and Actions Bar */}
            <div className="space-y-3">
              <ConversationSearch
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search conversations..."
                className="w-full"
              />

              <div className="flex items-center space-x-2">
                {/* New Conversation Button */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex-1">
                      <Plus className="h-4 w-4 mr-1" />
                      New Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Conversation</DialogTitle>
                      <DialogDescription>
                        Give your new conversation a title to get started.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newConversationTitle}
                          onChange={(e) => setNewConversationTitle(e.target.value)}
                          placeholder="Enter conversation title..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCreateConversation();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateConversation}
                        disabled={!newConversationTitle.trim()}
                      >
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(showFilters && "bg-accent")}
                >
                  <Filter className="h-4 w-4" />
                </Button>

                {/* View Mode Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {viewMode === 'list' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setViewMode('list')}>
                      <List className="h-4 w-4 mr-2" />
                      List View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewMode('grid')}>
                      <Grid className="h-4 w-4 mr-2" />
                      Grid View
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Selection Mode Controls */}
              {isSelectionMode && (
                <BulkActions
                  selectedCount={selectedConversations.size}
                  onSelectAll={selectAllConversations}
                  onClearSelection={clearSelection}
                  onArchive={() => handleBulkAction('archive')}
                  onDelete={() => handleBulkAction('delete')}
                  onUnpin={() => handleBulkAction('unpin')}
                />
              )}
            </div>
          </SheetHeader>

          {/* Filters */}
          {showFilters && (
            <div className="px-4 pb-2">
              <ConversationFilters
                filters={filters}
                onChange={handleFilterChange}
                onToggleSelectionMode={toggleSelectionMode}
                isSelectionMode={isSelectionMode}
              />
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading conversations...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive text-sm">Error loading conversations</p>
                  <p className="text-muted-foreground text-xs mt-1">{error}</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create your first conversation
                    </Button>
                  )}
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  selectedConversations={selectedConversations}
                  currentConversationId={currentConversationId}
                  isSelectionMode={isSelectionMode}
                  viewMode={viewMode}
                  onConversationSelect={handleConversationSelect}
                  onConversationAction={handleConversationAction}
                  onEditConversation={(conversation) => {
                    setEditingConversation(conversation);
                    setNewConversationTitle(conversation.title);
                    setIsEditDialogOpen(true);
                  }}
                />
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Conversation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Conversation</DialogTitle>
            <DialogDescription>
              Update the conversation title.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                placeholder="Enter conversation title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEditConversation();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditConversation}
              disabled={!newConversationTitle.trim()}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ConversationSidebar;