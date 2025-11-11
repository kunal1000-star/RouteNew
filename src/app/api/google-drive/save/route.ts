// Google Drive Save Content API Route
// ===================================
// Handles saving content to Google Drive with AI enhancement

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGoogleDriveService } from '@/lib/services/google-drive-service';
import type { ChatMessage } from '@/types/study-buddy';

interface SaveRequest {
  content: {
    type: 'message' | 'conversation' | 'highlighted_text';
    message?: ChatMessage;
    conversation?: ChatMessage[];
    highlightedText?: string;
    context?: {
      conversationId?: string;
      userId?: string;
      subject?: string;
      timestamp?: Date;
    };
  };
  options: {
    fileName: string;
    format: 'txt' | 'pdf' | 'docx' | 'markdown';
    folder: string;
    aiEnhancement: boolean;
    includeMetadata: boolean;
    createSummary: boolean;
    addTags: boolean;
    includeConversationContext: boolean;
  };
  tags: string[];
  notes: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      content,
      options,
      tags,
      notes,
      userId
    }: SaveRequest = await request.json();

    // Validate required fields
    if (!content || !options || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Get Google Drive service
    const service = getGoogleDriveService();

    // In a real implementation, you would get the user's stored auth tokens
    // For now, we'll assume the auth tokens are passed in the request
    const authTokens = request.headers.get('x-drive-auth');
    if (!authTokens) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Drive authentication required',
        },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authTokens);

    // Create the content to save
    let contentToSave = '';
    let metadata: any = {
      savedAt: new Date().toISOString(),
      userId,
      originalType: content.type,
    };

    // Build content based on type
    switch (content.type) {
      case 'message':
        if (!content.message) {
          throw new Error('Message content is required');
        }
        
        contentToSave = formatMessageContent(content.message, options.includeMetadata, content.context);
        metadata.messageId = content.message.id;
        metadata.conversationId = content.context?.conversationId;
        break;

      case 'conversation':
        if (!content.conversation || content.conversation.length === 0) {
          throw new Error('Conversation content is required');
        }
        
        contentToSave = formatConversationContent(content.conversation, options.includeMetadata);
        metadata.messageCount = content.conversation.length;
        metadata.conversationId = content.context?.conversationId;
        break;

      case 'highlighted_text':
        if (!content.highlightedText) {
          throw new Error('Highlighted text is required');
        }
        
        contentToSave = formatHighlightedText(content.highlightedText, options.includeMetadata, notes);
        break;

      default:
        throw new Error('Invalid content type');
    }

    // AI Enhancement
    let aiAnalysis = null;
    if (options.aiEnhancement) {
      try {
        aiAnalysis = await service.enhanceContent(
          auth,
          contentToSave,
          content.context
        );

        // Add AI analysis to content if requested
        if (options.createSummary && aiAnalysis?.analysis?.summary) {
          contentToSave += `\n\n## AI-Generated Summary\n${aiAnalysis.analysis.summary}`;
        }

        if (options.addTags && aiAnalysis?.analysis?.topics) {
          contentToSave += `\n\n## Topics\n${aiAnalysis.analysis.topics.map(topic => `- ${topic}`).join('\n')}`;
        }

        if (aiAnalysis?.analysis?.studyTips && aiAnalysis.analysis.studyTips.length > 0) {
          contentToSave += `\n\n## Study Tips\n${aiAnalysis.analysis.studyTips.map(tip => `- ${tip}`).join('\n')}`;
        }
      } catch (aiError) {
        console.error('AI enhancement failed:', aiError);
        // Continue without AI enhancement if it fails
      }
    }

    // Add user notes if provided
    if (notes && notes.trim()) {
      contentToSave += `\n\n## Notes\n${notes}`;
    }

    // Determine MIME type based on format
    const mimeType = getMimeType(options.format);

    // Create folder structure if needed
    let folderId = null;
    try {
      const folderStructure = await service.createStudyBuddyFolderStructure(auth);
      const targetFolder = options.folder.split('/').pop() || 'Saved Content';
      folderId = folderStructure[targetFolder];
    } catch (folderError) {
      console.warn('Failed to create folder structure:', folderError);
      // Continue with default location
    }

    // Upload to Google Drive
    const driveFile = await service.uploadFile(
      auth,
      options.fileName,
      contentToSave,
      mimeType,
      folderId || undefined
    );

    // Save metadata to database
    const savedContentData = {
      user_id: userId,
      content_type: content.type,
      conversation_id: content.context?.conversationId || null,
      message_id: content.message?.id || null,
      content_preview: contentToSave.substring(0, 200),
      full_content: contentToSave,
      save_format: options.format,
      file_name: options.fileName,
      drive_file_id: driveFile.id,
      drive_file_url: driveFile.webViewLink || driveFile.webContentLink,
      folder_path: options.folder,
      ai_enhanced: options.aiEnhancement,
      ai_summary: aiAnalysis?.analysis?.summary || null,
      ai_tags: aiAnalysis?.analysis?.topics || tags,
      ai_themes: aiAnalysis?.analysis?.keyConcepts || [],
      metadata: {
        ...metadata,
        notes: notes || null,
        originalTags: tags,
        aiAnalysis: aiAnalysis || null,
        uploadTimestamp: new Date().toISOString(),
        fileSize: contentToSave.length,
        wordCount: contentToSave.split(/\s+/).length,
      },
    };

    const { data: savedContent, error: dbError } = await supabase
      .from('saved_content')
      .insert(savedContentData)
      .select()
      .single();

    if (dbError) {
      console.error('Database save error:', dbError);
      // Continue even if DB save fails - the file is already saved to Drive
    }

    // Log save action
    if (savedContent) {
      await supabase
        .from('save_history')
        .insert({
          user_id: userId,
          saved_content_id: savedContent.id,
          action_type: 'saved',
          action_timestamp: new Date().toISOString(),
          source_device: request.headers.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: driveFile.id,
        fileName: options.fileName,
        fileUrl: driveFile.webViewLink || driveFile.webContentLink,
        savedContentId: savedContent?.id,
        aiAnalysis: aiAnalysis,
        message: 'Content saved successfully',
      },
    });

  } catch (error) {
    console.error('Save failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save content',
      },
      { status: 500 }
    );
  }
}

// Helper functions
function formatMessageContent(
  message: ChatMessage, 
  includeMetadata: boolean, 
  context?: any
): string {
  let content = message.content;

  if (includeMetadata) {
    content = `**Message Content:**\n\n${content}\n\n**Metadata:**\n- Role: ${message.role}\n- Timestamp: ${new Date(message.timestamp).toLocaleString()}\n- Model: ${message.model || 'N/A'}\n- Provider: ${message.provider || 'N/A'}`;
    
    if (context?.subject) {
      content += `\n- Subject: ${context.subject}`;
    }
    
    if (message.tokensUsed) {
      content += `\n- Tokens Used: ${message.tokensUsed}`;
    }
  }

  return content;
}

function formatConversationContent(
  messages: ChatMessage[], 
  includeMetadata: boolean
): string {
  let content = '';

  if (includeMetadata) {
    content += `**Conversation Summary:**\n\n`;
    content += `- Total Messages: ${messages.length}\n`;
    content += `- Started: ${new Date(messages[0]?.timestamp || Date.now()).toLocaleString()}\n`;
    content += `- Last Updated: ${new Date(messages[messages.length - 1]?.timestamp || Date.now()).toLocaleString()}\n\n`;
  }

  content += '**Conversation Messages:**\n\n';

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    content += `### Message ${index + 1} (${role})\n`;
    content += `**Time:** ${new Date(message.timestamp).toLocaleString()}\n\n`;
    content += `${message.content}\n\n`;
    
    if (message.model) {
      content += `_Model: ${message.model}_\n\n`;
    }
    
    content += '---\n\n';
  });

  return content;
}

function formatHighlightedText(
  highlightedText: string, 
  includeMetadata: boolean, 
  notes?: string
): string {
  let content = '**Highlighted Content:**\n\n';
  content += highlightedText;

  if (notes && notes.trim()) {
    content += `\n\n**Additional Notes:**\n${notes}`;
  }

  if (includeMetadata) {
    content += `\n\n**Metadata:**\n- Highlighted at: ${new Date().toLocaleString()}\n- Character count: ${highlightedText.length}\n- Word count: ${highlightedText.split(/\s+/).length}`;
  }

  return content;
}

function getMimeType(format: string): string {
  switch (format) {
    case 'txt':
      return 'text/plain';
    case 'markdown':
      return 'text/markdown';
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'text/plain';
  }
}