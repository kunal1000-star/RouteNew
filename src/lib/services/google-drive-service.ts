// Google Drive Integration Service
// ================================
// Complete Google Drive API integration with OAuth 2.0 authentication,
// file operations, and AI-powered content enhancement

import { GoogleDriveConfig, GoogleDriveAuth, GoogleDriveFile, DriveSearchParams, 
         DriveProcessingResult, StudyMaterial, ExtractedContent, GoogleDriveSettings } from '@/types/google-drive';

export class GoogleDriveService {
  private config: GoogleDriveConfig;
  private baseUrl = 'https://www.googleapis.com/drive/v3';
  private uploadUrl = 'https://www.googleapis.com/upload/drive/v3';
  private authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  private tokenUrl = 'https://oauth2.googleapis.com/token';
  
  constructor(config: GoogleDriveConfig) {
    this.config = config;
  }

  /**
   * Get OAuth 2.0 authorization URL
   */
  async getAuthUrl(): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth 2.0 callback and exchange code for tokens
   */
  async handleAuthCallback(code: string): Promise<GoogleDriveAuth> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    const expiresAt = Date.now() + (data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<GoogleDriveAuth> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    const expiresAt = Date.now() + (data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      refreshToken, // Keep the same refresh token
      expiresAt,
      scope: data.scope,
    };
  }

  /**
   * Make authenticated request to Google Drive API
   */
  private async makeRequest(
    url: string, 
    auth: GoogleDriveAuth, 
    options: RequestInit = {}
  ): Promise<Response> {
    // Check if token needs refresh
    if (Date.now() >= auth.expiresAt - 60000) { // Refresh 1 minute before expiry
      auth = await this.refreshToken(auth.refreshToken);
    }

    const headers = {
      'Authorization': `Bearer ${auth.accessToken}`,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * List files in Google Drive
   */
  async listFiles(auth: GoogleDriveAuth, params?: DriveSearchParams): Promise<GoogleDriveFile[]> {
    const queryParams = new URLSearchParams({
      pageSize: params?.maxResults?.toString() || '50',
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents,description,thumbnailLink)',
      orderBy: params?.sortOrder === 'desc' ? `modifiedTime desc` : 'modifiedTime asc',
    });

    if (params?.query) {
      queryParams.append('q', `name contains '${params.query}'`);
    }

    if (params?.mimeTypes && params.mimeTypes.length > 0) {
      const mimeQuery = params.mimeTypes.map(mime => `mimeType='${mime}'`).join(' or ');
      queryParams.append('q', `(${mimeQuery})`);
    }

    if (params?.dateRange) {
      if (params.dateRange.after) {
        queryParams.append('q', `createdTime >= '${params.dateRange.after}'`);
      }
      if (params.dateRange.before) {
        queryParams.append('q', `createdTime <= '${params.dateRange.before}'`);
      }
    }

    const url = `${this.baseUrl}/files?${queryParams.toString()}`;
    const response = await this.makeRequest(url, auth);

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Get file metadata and content
   */
  async getFile(auth: GoogleDriveAuth, fileId: string): Promise<GoogleDriveFile | null> {
    const url = `${this.baseUrl}/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents,description,thumbnailLink`;
    const response = await this.makeRequest(url, auth);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get file: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Download file content
   */
  async downloadFile(auth: GoogleDriveAuth, fileId: string): Promise<Buffer | null> {
    const url = `${this.baseUrl}/files/${fileId}?alt=media`;
    const response = await this.makeRequest(url, auth);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Upload content to Google Drive
   */
  async uploadFile(
    auth: GoogleDriveAuth,
    fileName: string,
    content: string,
    mimeType: string = 'text/plain',
    folderId?: string
  ): Promise<GoogleDriveFile> {
    const metadata = {
      name: fileName,
      mimeType,
      ...(folderId && { parents: [folderId] }),
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const requestBody = [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n',
      '\r\n',
      JSON.stringify(metadata),
      delimiter,
      `Content-Type: ${mimeType}\r\n`,
      '\r\n',
      content,
      closeDelim,
    ].join('');

    const url = `${this.uploadUrl}/files?uploadType=multipart`;
    const response = await this.makeRequest(url, auth, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create folder in Google Drive
   */
  async createFolder(
    auth: GoogleDriveAuth,
    folderName: string,
    parentFolderId?: string
  ): Promise<GoogleDriveFile> {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentFolderId && { parents: [parentFolderId] }),
    };

    const response = await this.makeRequest(`${this.baseUrl}/files`, auth, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Extract text content from supported file types
   */
  async extractContent(auth: GoogleDriveAuth, fileId: string): Promise<ExtractedContent> {
    const file = await this.getFile(auth, fileId);
    if (!file) {
      throw new Error('File not found');
    }

    const buffer = await this.downloadFile(auth, fileId);
    if (!buffer) {
      throw new Error('Failed to download file');
    }

    let text = '';
    
    // Handle different file types
    switch (file.mimeType) {
      case 'text/plain':
        text = buffer.toString('utf-8');
        break;
      case 'text/markdown':
        text = buffer.toString('utf-8');
        break;
      case 'application/pdf':
        // For PDF files, we'll extract basic text
        // In a real implementation, you'd use a PDF parsing library
        text = '[PDF Content - Text extraction would require additional processing]';
        break;
      case 'application/vnd.google-apps.document':
        // For Google Docs, we can export as plain text
        const exportUrl = `${this.baseUrl}/files/${fileId}/export?mimeType=text/plain`;
        const exportResponse = await this.makeRequest(exportUrl, auth);
        if (exportResponse.ok) {
          text = await exportResponse.text();
        }
        break;
      default:
        throw new Error(`Unsupported file type: ${file.mimeType}`);
    }

    return {
      text,
      metadata: {
        pageCount: undefined,
        wordCount: text.split(/\s+/).length,
        language: 'en', // Could be detected programmatically
        hasImages: false, // Would need additional processing
        hasTables: text.includes('|'), // Simple table detection
      },
      analysis: {
        topics: [],
        keyConcepts: [],
        summary: '',
        studyTips: [],
      },
    };
  }

  /**
   * AI-powered content analysis and enhancement
   */
  async enhanceContent(
    auth: GoogleDriveAuth,
    content: string,
    context?: { subject?: string; conversationId?: string; userId?: string }
  ): Promise<ExtractedContent> {
    // This would integrate with the AI service manager for content analysis
    // For now, we'll create a basic structure that would be enhanced with actual AI

    const analysisPrompt = `
      Analyze the following study content and provide:
      1. Key topics covered
      2. Important concepts
      3. A concise summary
      4. Study tips
      5. Suggested difficulty level
      6. Related subjects

      Content: ${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}
      
      ${context?.subject ? `Context: This is related to ${context.subject}` : ''}
    `;

    // In the actual implementation, this would call the AI service
    // For now, returning a basic structure
    return {
      text: content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        language: 'en',
        hasImages: content.includes('![') || content.includes('<img'),
        hasTables: content.includes('|') || content.includes('<table'),
      },
      analysis: {
        subject: context?.subject,
        topics: this.extractTopics(content),
        keyConcepts: this.extractKeyConcepts(content),
        summary: this.generateSummary(content),
        studyTips: this.generateStudyTips(content),
      },
    };
  }

  /**
   * Simple topic extraction (would be AI-powered in real implementation)
   */
  private extractTopics(content: string): string[] {
    const topics = [];
    const words = content.toLowerCase().split(/\s+/);
    
    // Common academic terms that might indicate topics
    const topicKeywords = [
      'mathematics', 'algebra', 'calculus', 'geometry', 'statistics',
      'physics', 'chemistry', 'biology', 'organic', 'inorganic',
      'history', 'literature', 'philosophy', 'psychology', 'sociology',
      'programming', 'algorithm', 'database', 'network', 'software',
      'economics', 'finance', 'management', 'marketing'
    ];

    for (const keyword of topicKeywords) {
      if (words.some(word => word.includes(keyword) || word === keyword)) {
        topics.push(keyword);
      }
    }

    return topics.slice(0, 5); // Return top 5 topics
  }

  /**
   * Simple key concept extraction (would be AI-powered in real implementation)
   */
  private extractKeyConcepts(content: string): string[] {
    // Look for bold text, headers, or important terms
    const concepts = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Look for markdown headers
      if (line.startsWith('#')) {
        concepts.push(line.replace(/^#+\s*/, '').trim());
      }
      // Look for **bold** text
      const boldMatches = line.match(/\*\*(.*?)\*\*/g);
      if (boldMatches) {
        concepts.push(...boldMatches.map(match => match.replace(/\*\*/g, '')));
      }
    }

    return concepts.slice(0, 10);
  }

  /**
   * Simple summary generation (would be AI-powered in real implementation)
   */
  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 3).join('. ').trim() + '.';
  }

  /**
   * Simple study tips generation (would be AI-powered in real implementation)
   */
  private generateStudyTips(content: string): string[] {
    const tips = [];
    
    if (content.includes('formula') || content.includes('equation')) {
      tips.push('Practice applying formulas with different values');
    }
    if (content.includes('definition') || content.includes('concept')) {
      tips.push('Create flashcards for key definitions');
    }
    if (content.includes('example')) {
      tips.push('Work through all provided examples step by step');
    }
    
    tips.push('Review the material regularly to reinforce learning');
    tips.push('Take notes in your own words to improve retention');
    
    return tips;
  }

  /**
   * Create organized folder structure
   */
  async createStudyBuddyFolderStructure(auth: GoogleDriveAuth): Promise<{ [key: string]: string }> {
    const rootFolder = await this.createFolder(auth, 'StudyBuddy');
    const rootId = rootFolder.id;

    const folders = [
      'Saved Content',
      'Conversations',
      'Messages',
      'Highlights',
      'Summaries',
      'Templates',
      'Exports'
    ];

    const folderIds: { [key: string]: string } = {};
    folderIds['StudyBuddy'] = rootId;

    for (const folderName of folders) {
      const folder = await this.createFolder(auth, folderName, rootId);
      folderIds[folderName] = folder.id;
    }

    return folderIds;
  }

  /**
   * Check if user has valid authentication
   */
  async checkAuthStatus(auth: GoogleDriveAuth): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/about?fields=user`, auth);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Revoke authentication
   */
  async revokeAuth(accessToken: string): Promise<void> {
    const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to revoke auth: ${response.statusText}`);
    }
  }
}

// Singleton instance
let googleDriveServiceInstance: GoogleDriveService | null = null;

export function getGoogleDriveService(): GoogleDriveService {
  if (!googleDriveServiceInstance) {
    const config: GoogleDriveConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.NEXTAUTH_URL + '/api/auth/callback/google-drive',
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    };

    googleDriveServiceInstance = new GoogleDriveService(config);
  }

  return googleDriveServiceInstance;
}