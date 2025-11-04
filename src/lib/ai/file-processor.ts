// File processing utilities for different file types
import { google } from 'googleapis';
import { pdfParse } from 'pdf-parse';
import mammoth from 'mammoth';

const DRIVE_API_VERSION = 'v3';

// Get Drive API instance
function getDriveApi() {
  const { google: googleapis } = require('googleapis');
  return googleapis.drive({ version: DRIVE_API_VERSION, auth: require('./google-drive').oauth2Client });
}

// Download file from Google Drive
export async function downloadFileFromDrive(fileId: string, accessToken: string): Promise<Buffer> {
  const drive = getDriveApi();
  
  // Set the access token
  require('./google-drive').setCredentials({ access_token: accessToken });
  
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media'
    },
    { responseType: 'arraybuffer' }
  );
  
  return Buffer.from(response.data as ArrayBuffer);
}

// Extract text from PDF
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Extract text from DOCX
export async function extractTextFromDOCX(docxBuffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

// Get file metadata from Drive
export async function getFileMetadata(fileId: string, accessToken: string) {
  const drive = getDriveApi();
  require('./google-drive').setCredentials({ access_token: accessToken });
  
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink'
  });
  
  return response.data;
}

// List files from Google Drive
export async function listDriveFiles(accessToken: string, pageSize: number = 10) {
  const drive = getDriveApi();
  require('./google-drive').setCredentials({ access_token: accessToken });
  
  const response = await drive.files.list({
    pageSize,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
    q: "mimeType contains 'application/' or mimeType contains 'image/' or mimeType contains 'text/'"
  });
  
  return response.data.files || [];
}

// Detect file type from MIME type
export function getFileTypeFromMimeType(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('docx')) return 'docx';
  if (mimeType.includes('image/')) return 'image';
  if (mimeType.includes('text/')) return 'text';
  return 'unknown';
}

// Main function to extract text from any supported file
export async function extractTextFromFile(
  fileId: string, 
  accessToken: string, 
  mimeType: string
): Promise<{ text: string; fileType: string; fileName: string }> {
  try {
    // Get file metadata
    const metadata = await getFileMetadata(fileId, accessToken);
    const fileType = getFileTypeFromMimeType(mimeType);
    const fileName = metadata.name || 'Unknown';
    
    // Download file
    const fileBuffer = await downloadFileFromDrive(fileId, accessToken);
    
    let extractedText = '';
    
    // Extract text based on file type
    switch (fileType) {
      case 'pdf':
        extractedText = await extractTextFromPDF(fileBuffer);
        break;
      case 'docx':
        extractedText = await extractTextFromDOCX(fileBuffer);
        break;
      case 'image':
        // For images, we'll return a message that multimodal analysis is needed
        extractedText = '[IMAGE_CONTENT]';
        break;
      case 'text':
        extractedText = fileBuffer.toString('utf-8');
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    return {
      text: extractedText,
      fileType,
      fileName
    };
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Failed to process file');
  }
}

// Check if file is supported
export function isFileSupported(mimeType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  return supportedTypes.some(type => mimeType.includes(type.replace('application/', '').replace('image/', '')));
}
