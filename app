// Google Drive OAuth callback handler
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, getUserInfo, setCredentials } from '@/lib/ai/google-drive';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokens = await getAccessToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
    }

    // Set credentials and get user info
    setCredentials(tokens);
    const userInfo = await getUserInfo();
    
    if (!userInfo.email) {
      return NextResponse.json({ error: 'Failed to get user information' }, { status: 400 });
    }

    // Store tokens securely (you might want to encrypt these)
    // For now, we'll redirect with success and let the frontend handle storage
    const successUrl = new URL('/app/study-buddy', request.url);
    successUrl.searchParams.set('gdrive', 'connected');
    successUrl.searchParams.set('email', userInfo.email);
    successUrl.searchParams.set('access_token', tokens.access_token);
    
    // Add refresh token if available
    if (tokens.refresh_token) {
      successUrl.searchParams.set('refresh_token', tokens.refresh_token);
    }

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    const errorUrl = new URL('/app/study-buddy', request.url);
    errorUrl.searchParams.set('gdrive', 'error');
    errorUrl.searchParams.set('error', 'oauth_failed');
    
    return NextResponse.redirect(errorUrl);
  }
}
