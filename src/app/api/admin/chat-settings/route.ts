import { NextRequest, NextResponse } from 'next/server';

// ChatSettings interface structure that matches the frontend component
const DEFAULT_CHAT_SETTINGS = {
  // General Chat Settings
  maxConversationLength: 50,
  maxMessagesPerConversation: 100,
  enableConversationHistory: true,
  enableContextRetention: true,
  contextRetentionDays: 30,
  
  // Response Settings
  defaultResponseStyle: 'balanced' as const,
  enableStreaming: true,
  responseTimeout: 30000,
  maxRetries: 3,
  
  // Context Management
  maxContextTokens: 8192,
  contextWindowStrategy: 'sliding' as const,
  enableContextCompression: false,
  contextCompressionRatio: 0.8,
  
  // Message Handling
  enableMessageFiltering: true,
  enableAutoModeration: true,
  maxMessageLength: 4000,
  enableMessageEncryption: false,
  
  // Rate Limiting
  enableRateLimiting: true,
  messagesPerMinute: 10,
  messagesPerHour: 100,
  messagesPerDay: 500,
  
  // Advanced Settings
  enableMemoryPersistence: true,
  memoryPersistenceType: 'user' as const,
  enableConversationAnalytics: true,
  enableExportFunctionality: true,
  
  // Custom Prompts
  systemPrompt: 'You are a helpful AI assistant focused on providing accurate and helpful responses.',
  welcomeMessage: 'Hello! How can I help you today?',
  fallbackMessage: 'I apologize, but I\'m having trouble processing your request. Please try rephrasing your question.',
  errorMessage: 'An error occurred while processing your request. Please try again.',
  
  // Integration Settings
  enableWebSearch: false,
  enableFileUpload: true,
  maxFileSize: 10485760, // 10MB
  enableImageProcessing: true
};

let currentSettings = { ...DEFAULT_CHAT_SETTINGS };

export async function GET(request: NextRequest) {
  console.log('🔍 Admin Chat Settings API: GET request received');
  
  return NextResponse.json({
    success: true,
    data: currentSettings
  });
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Admin Chat Settings API: PUT request received');
    const body = await request.json();
    console.log('📝 Admin Chat Settings API: Received body:', body);
    
    // Validate that body contains ChatSettings structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body format'
      }, { status: 400 });
    }
    
    // Merge with existing settings, preserving structure
    currentSettings = { ...currentSettings, ...body };
    
    console.log('✅ Admin Chat Settings API: Settings updated successfully');
    return NextResponse.json({
      success: true,
      data: currentSettings
    });
  } catch (error) {
    console.error('❌ Admin Chat Settings API: Error processing request:', error);
    return NextResponse.json({
      success: false,
      error: 'Invalid JSON or processing error'
    }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  // Support POST for backward compatibility
  return PUT(request);
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
