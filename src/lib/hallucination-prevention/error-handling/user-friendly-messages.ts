// User-Friendly Error Messages System
// ===================================

import { LayerError } from './enhanced-error-handler';

export interface UserMessageTemplate {
  id: string;
  category: 'input' | 'processing' | 'validation' | 'system' | 'network' | 'auth';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  action: string;
  retryable: boolean;
  supportInfo?: string;
}

export interface UserMessageContext {
  userId?: string;
  sessionId: string;
  conversationId: string;
  layer: number;
  errorType: string;
  userExperience: 'beginner' | 'intermediate' | 'advanced';
  language: 'en' | 'es' | 'fr' | 'de';
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

class UserFriendlyMessageSystem {
  private messageTemplates: Map<string, UserMessageTemplate> = new Map();
  private userPreferences: Map<string, UserMessageContext> = new Map();

  constructor() {
    this.initializeMessageTemplates();
  }

  /**
   * Generate user-friendly message from layer error
   */
  generateUserMessage(
    error: LayerError,
    context: UserMessageContext
  ): {
    title: string;
    message: string;
    action: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    supportCode: string;
    retryAvailable: boolean;
    estimatedResolutionTime?: string;
  } {
    const template = this.findBestTemplate(error, context);
    const supportCode = this.generateSupportCode(error.correlationId);
    
    // Customize message based on user experience level
    const customizedMessage = this.customizeMessageForUser(template, context);
    
    // Add estimated resolution time
    const estimatedTime = this.estimateResolutionTime(error, context);
    
    return {
      title: customizedMessage.title,
      message: customizedMessage.message,
      action: customizedMessage.action,
      severity: this.mapImpactToSeverity(error.impact),
      supportCode,
      retryAvailable: error.recoverable && error.recoveryAttempts < error.maxRecoveryAttempts,
      estimatedResolutionTime: estimatedTime
    };
  }

  /**
   * Get contextual help for error
   */
  getContextualHelp(
    error: LayerError,
    context: UserMessageContext
  ): {
    helpText: string;
    relatedTopics: string[];
    troubleshootingSteps: string[];
    contactSupport: boolean;
  } {
    const layerHelp = this.getLayerSpecificHelp(error.layer, context);
    const generalHelp = this.getGeneralTroubleshooting(error, context);
    
    return {
      helpText: layerHelp.helpText,
      relatedTopics: [...layerHelp.relatedTopics, ...generalHelp.relatedTopics],
      troubleshootingSteps: generalHelp.steps,
      contactSupport: this.shouldContactSupport(error, context)
    };
  }

  /**
   * Update user preferences for message customization
   */
  updateUserPreferences(userId: string, preferences: Partial<UserMessageContext>): void {
    const existing = this.userPreferences.get(userId) || this.getDefaultContext(userId);
    this.userPreferences.set(userId, { ...existing, ...preferences });
  }

  /**
   * Get message statistics for analytics
   */
  getMessageStatistics(): {
    totalMessages: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    retrySuccessRate: number;
    userSatisfactionScore: number;
  } {
    // This would integrate with actual analytics data
    return {
      totalMessages: 0,
      byCategory: {},
      bySeverity: {},
      retrySuccessRate: 0,
      userSatisfactionScore: 0
    };
  }

  /**
   * Private helper methods
   */
  private initializeMessageTemplates(): void {
    const templates: UserMessageTemplate[] = [
      // Input Validation Errors (Layer 1)
      {
        id: 'input_validation_failed',
        category: 'input',
        severity: 'warning',
        title: 'Input Needs Review',
        message: 'I need to review your input to provide the best response.',
        action: 'Please check your message and try again.',
        retryable: true,
        supportInfo: 'Make sure your question is clear and complete.'
      },
      {
        id: 'input_too_long',
        category: 'input',
        severity: 'warning',
        title: 'Message Too Long',
        message: 'Your message is quite detailed. Let me break it down for better processing.',
        action: 'I\'ll process this in smaller parts for better accuracy.',
        retryable: false,
        supportInfo: 'Try breaking long questions into shorter ones.'
      },

      // Context & Memory Errors (Layer 2)
      {
        id: 'context_unavailable',
        category: 'processing',
        severity: 'warning',
        title: 'Memory Refresh',
        message: 'I need to refresh my memory to provide you with the best response.',
        action: 'Please give me a moment to access the information I need.',
        retryable: true,
        supportInfo: 'This usually takes just a few seconds.'
      },
      {
        id: 'conversation_history_lost',
        category: 'processing',
        severity: 'error',
        title: 'Conversation Context Lost',
        message: 'I\'ve lost some context from our conversation. Let me reconnect with you.',
        action: 'Could you briefly remind me what we were discussing?',
        retryable: true,
        supportInfo: 'I\'ll do my best to maintain context throughout our chat.'
      },

      // Response Validation Errors (Layer 3)
      {
        id: 'response_validation_failed',
        category: 'validation',
        severity: 'warning',
        title: 'Quality Check in Progress',
        message: 'I\'m double-checking my response to ensure accuracy.',
        action: 'Please wait while I verify the information.',
        retryable: false,
        supportInfo: 'Quality checks help me provide better responses.'
      },
      {
        id: 'confidence_too_low',
        category: 'validation',
        severity: 'info',
        title: 'Confidence Check',
        message: 'I want to make sure I give you the most accurate information.',
        action: 'Let me provide what I\'m confident about and suggest additional resources.',
        retryable: true,
        supportInfo: 'I\'ll be honest about what I know and don\'t know.'
      },

      // User Feedback & Learning Errors (Layer 4)
      {
        id: 'feedback_processing_failed',
        category: 'processing',
        severity: 'info',
        title: 'Learning Update',
        message: 'I\'m updating my understanding based on our interaction.',
        action: 'This will help me provide better responses in the future.',
        retryable: false,
        supportInfo: 'I continuously learn from our conversations.'
      },

      // Quality Assurance & Monitoring Errors (Layer 5)
      {
        id: 'quality_check_timeout',
        category: 'system',
        severity: 'warning',
        title: 'Quality Assurance',
        message: 'I\'m running additional quality checks to ensure the best response.',
        action: 'This helps me maintain high standards.',
        retryable: false,
        supportInfo: 'Quality checks ensure reliable responses.'
      },
      {
        id: 'performance_optimization',
        category: 'system',
        severity: 'info',
        title: 'Performance Optimization',
        message: 'I\'m optimizing my response for better performance.',
        action: 'This should result in faster, more accurate responses.',
        retryable: false,
        supportInfo: 'I continuously optimize my performance.'
      },

      // Network & System Errors
      {
        id: 'network_timeout',
        category: 'network',
        severity: 'warning',
        title: 'Connection Issue',
        message: 'I\'m experiencing some network delays.',
        action: 'Please try again in a moment.',
        retryable: true,
        supportInfo: 'This is usually resolved quickly.'
      },
      {
        id: 'service_unavailable',
        category: 'system',
        severity: 'critical',
        title: 'Service Temporarily Unavailable',
        message: 'I\'m currently experiencing high demand.',
        action: 'Please try again in a few minutes.',
        retryable: true,
        supportInfo: 'I\'ll be back to full capacity soon.'
      }
    ];

    templates.forEach(template => {
      this.messageTemplates.set(template.id, template);
    });
  }

  private findBestTemplate(error: LayerError, context: UserMessageContext): UserMessageTemplate {
    // Try to find template based on error characteristics
    const errorKey = this.generateErrorKey(error);
    let template = this.messageTemplates.get(errorKey);

    if (!template) {
      // Fallback to layer-specific templates
      template = this.getLayerFallbackTemplate(error.layer);
    }

    if (!template) {
      // Final fallback to generic template
      template = this.messageTemplates.get('input_validation_failed')!;
    }

    return template;
  }

  private generateErrorKey(error: LayerError): string {
    const layerPrefix = `layer_${error.layer}`;
    const messageKeywords = this.extractKeywords(error.message);
    
    // Try exact match first
    const exactKey = `${layerPrefix}_${messageKeywords[0]}`;
    if (this.messageTemplates.has(exactKey)) {
      return exactKey;
    }

    return 'input_validation_failed';
  }

  private extractKeywords(message: string): string[] {
    const keywords: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Common error patterns
    if (lowerMessage.includes('timeout')) keywords.push('timeout');
    if (lowerMessage.includes('validation')) keywords.push('validation');
    if (lowerMessage.includes('auth') || lowerMessage.includes('permission')) keywords.push('auth');
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) keywords.push('network');
    if (lowerMessage.includes('memory') || lowerMessage.includes('context')) keywords.push('memory');
    if (lowerMessage.includes('fact') || lowerMessage.includes('accuracy')) keywords.push('fact');
    if (lowerMessage.includes('quality') || lowerMessage.includes('check')) keywords.push('quality');

    return keywords;
  }

  private getLayerFallbackTemplate(layer: number): UserMessageTemplate | undefined {
    const fallbackKeys = {
      1: 'input_validation_failed',
      2: 'context_unavailable',
      3: 'response_validation_failed',
      4: 'feedback_processing_failed',
      5: 'quality_check_timeout'
    };

    const fallbackKey = fallbackKeys[layer as keyof typeof fallbackKeys];
    return fallbackKey ? this.messageTemplates.get(fallbackKey) || undefined : undefined;
  }

  private customizeMessageForUser(template: UserMessageTemplate, context: UserMessageContext): UserMessageTemplate {
    let customized = { ...template };

    // Adjust complexity based on user experience
    if (context.userExperience === 'beginner') {
      customized.message = this.simplifyMessage(customized.message);
      customized.action = this.simplifyAction(customized.action);
    } else if (context.userExperience === 'advanced') {
      customized.message = this.addTechnicalDetails(customized.message, context);
    }

    return customized;
  }

  private simplifyMessage(message: string): string {
    // Simplify technical jargon for beginners
    return message
      .replace(/validation/gi, 'checking')
      .replace(/authentication/gi, 'login')
      .replace(/authorization/gi, 'permission')
      .replace(/timeout/gi, 'taking too long')
      .replace(/optimization/gi, 'improvement');
  }

  private simplifyAction(action: string): string {
    // Simplify action instructions for beginners
    return action
      .replace(/Please try again/gi, 'Try again')
      .replace(/Please wait/gi, 'Wait a moment')
      .replace(/Please check/gi, 'Check');
  }

  private addTechnicalDetails(message: string, context: UserMessageContext): string {
    // Add relevant technical context for advanced users
    return `${message} [Layer ${context.layer} processing]`;
  }

  private mapImpactToSeverity(impact: LayerError['impact']): 'info' | 'warning' | 'error' | 'critical' {
    const mapping: Record<LayerError['impact'], 'info' | 'warning' | 'error' | 'critical'> = {
      'low': 'info',
      'medium': 'warning',
      'high': 'error',
      'critical': 'critical'
    };
    return mapping[impact];
  }

  private generateSupportCode(correlationId: string): string {
    // Generate a short, user-friendly support code
    const shortId = correlationId.split('-').pop() || correlationId.substring(0, 8);
    return `ERR-${shortId.toUpperCase()}`;
  }

  private estimateResolutionTime(error: LayerError, context: UserMessageContext): string | undefined {
    if (!error.recoverable) return undefined;

    const baseTime = {
      1: '30 seconds', // Input validation
      2: '1 minute',   // Context & memory
      3: '2 minutes',  // Response validation
      4: '30 seconds', // User feedback
      5: '1 minute'    // Quality assurance
    };

    return baseTime[error.layer as keyof typeof baseTime] || '1 minute';
  }

  private getLayerSpecificHelp(layer: number, context: UserMessageContext): {
    helpText: string;
    relatedTopics: string[];
  } {
    const helpData = {
      1: {
        helpText: 'Input validation helps me understand your question better.',
        relatedTopics: ['question-asking', 'clear-communication']
      },
      2: {
        helpText: 'Context management helps me remember our conversation.',
        relatedTopics: ['conversation-memory', 'context-awareness']
      },
      3: {
        helpText: 'Response validation ensures I give you accurate information.',
        relatedTopics: ['fact-checking', 'accuracy']
      },
      4: {
        helpText: 'Learning from feedback helps me improve over time.',
        relatedTopics: ['feedback', 'personalization']
      },
      5: {
        helpText: 'Quality monitoring ensures consistent, reliable responses.',
        relatedTopics: ['quality-assurance', 'performance']
      }
    };

    return helpData[layer as keyof typeof helpData] || {
      helpText: 'I\'m working to provide you with the best possible assistance.',
      relatedTopics: ['general-help']
    };
  }

  private getGeneralTroubleshooting(error: LayerError, context: UserMessageContext): {
    relatedTopics: string[];
    steps: string[];
  } {
    const steps = [
      'Wait a moment and try again',
      'Check your internet connection',
      'Refresh the page if the problem persists',
      'Contact support if issues continue'
    ];

    const relatedTopics = [
      'troubleshooting',
      'common-issues',
      'getting-help'
    ];

    return { relatedTopics, steps };
  }

  private shouldContactSupport(error: LayerError, context: UserMessageContext): boolean {
    // Suggest support for critical errors or repeated failures
    return error.impact === 'critical' || error.recoveryAttempts >= error.maxRecoveryAttempts;
  }

  private getDefaultContext(userId: string): UserMessageContext {
    return {
      userId,
      sessionId: `session-${Date.now()}`,
      conversationId: `conv-${Date.now()}`,
      layer: 1,
      errorType: 'unknown',
      userExperience: 'intermediate',
      language: 'en',
      accessibility: {
        screenReader: false,
        highContrast: false,
        reducedMotion: false
      }
    };
  }
}

// Export singleton instance
export const userFriendlyMessageSystem = new UserFriendlyMessageSystem();

// Export helper function
export function generateUserFriendlyMessage(
  error: LayerError,
  context: UserMessageContext
) {
  return userFriendlyMessageSystem.generateUserMessage(error, context);
}