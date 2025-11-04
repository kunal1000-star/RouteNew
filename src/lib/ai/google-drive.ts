// Google Drive OAuth configuration
import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// Google Drive OAuth2 client
export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Google Drive API scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Generate Google OAuth URL
export function getGoogleAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

// Exchange authorization code for tokens
export async function getAccessToken(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Set credentials for API calls
export function setCredentials(tokens: any) {
  oauth2Client.setCredentials(tokens);
}

// Get user info from Google
export async function getUserInfo() {
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2'
  });
  
  const { data } = await oauth2.userinfo.get();
  return data;
}
