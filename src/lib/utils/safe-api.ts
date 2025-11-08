import { supabaseBrowserClient as supabase, getCurrentUser } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

/**
 * Safely insert a row into a Supabase table with proper typing
 */
export async function safeInsert<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Insert']
) {
  try {
    const { data: result, error } = await supabase
      .from(table as string)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data: result, error: null };
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Safely update a row in a Supabase table with proper typing
 */
export async function safeUpdate<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Partial<Database['public']['Tables'][T]['Update']>,
  filter: { column: keyof Database['public']['Tables'][T]['Row']; value: any }
) {
  try {
    const { data: result, error } = await supabase
      .from(table as string)
      .update(data)
      .eq(filter.column as string, filter.value)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data: result, error: null };
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Safely delete a row from a Supabase table
 */
export async function safeDelete<T extends keyof Database['public']['Tables']>(
  table: T,
  filter: { column: keyof Database['public']['Tables'][T]['Row']; value: any }
) {
  try {
    const { data, error } = await supabase
      .from(table as string)
      .delete()
      .eq(filter.column as string, filter.value)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Safely select rows from a Supabase table
 */
export async function safeSelect<T extends keyof Database['public']['Tables']>(
  table: T,
  filter?: { column: keyof Database['public']['Tables'][T]['Row']; value: any }
) {
  try {
    let query = supabase.from(table as string).select('*');

    if (filter) {
      query = query.eq(filter.column as string, filter.value);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Enhanced API call with automatic authentication
 */
export async function safeApiCall(url: string, options?: RequestInit & { requiresAuth?: boolean }) {
  try {
    const { requiresAuth = true, ...requestOptions } = options || {};
    
    // Prepare headers with authentication if required
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(requestOptions.headers as Record<string, string> || {}),
    };

    // Add authentication header if required
    if (requiresAuth) {
      console.log('🔍 Checking authentication for URL:', url);
      
      // Check both NextAuth and Supabase sessions
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📊 Supabase session check:', session ? 'Found' : 'Not found');
      
      if (session && session.access_token) {
        // Use Supabase session if available
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('✅ Added Supabase auth header for API call to:', url);
      } else {
        // Check if user is authenticated via NextAuth (Google OAuth)
        console.log('🔍 Checking NextAuth session...');
        try {
          const nextAuthResponse = await fetch('/api/auth/session');
          console.log('📡 NextAuth session response status:', nextAuthResponse.status);
          
          if (nextAuthResponse.ok) {
            const nextAuthSession = await nextAuthResponse.json();
            console.log('📋 NextAuth session data:', JSON.stringify(nextAuthSession, null, 2));
            
            if (nextAuthSession && nextAuthSession.user) {
              // Use NextAuth session - add custom header that backend can recognize
              headers['X-NextAuth-User'] = nextAuthSession.user.email || nextAuthSession.user.id;
              headers['X-NextAuth-Id'] = nextAuthSession.user.id;
              headers['X-NextAuth-Email'] = nextAuthSession.user.email || '';
              console.log('✅ Added NextAuth header for API call to:', url);
            } else {
              console.warn('⚠️ No NextAuth user found in session');
              console.warn('⚠️ No authenticated session found for API call to:', url);
              return {
                success: false,
                isAuthError: true,
                error: 'User session not available - No NextAuth user found',
                needsAuth: true
              };
            }
          } else {
            console.warn('⚠️ NextAuth session endpoint failed with status:', nextAuthResponse.status);
            const errorText = await nextAuthResponse.text();
            console.warn('⚠️ NextAuth error response:', errorText);
            console.warn('⚠️ No authenticated session found for API call to:', url);
            return {
              success: false,
              isAuthError: true,
              error: 'User session not available - NextAuth check failed',
              needsAuth: true
            };
          }
        } catch (nextAuthError) {
          console.error('❌ Error checking NextAuth session:', nextAuthError);
          console.warn('⚠️ No authenticated session found for API call to:', url);
          return {
            success: false,
            isAuthError: true,
            error: 'User session not available - NextAuth check error',
            needsAuth: true
          };
        }
      }
    }

    // Make the API call with enhanced headers
    const fetchOptions: RequestInit = {
      ...requestOptions,
      headers
    };

    const method = (fetchOptions.method || 'GET').toUpperCase();

    console.log('🔗 Making API call to:', url, 'method:', method);
    const response = await fetch(url, fetchOptions);

    // Check if the response is HTML (e.g., an error page or login redirect)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.warn('⚠️ Received HTML response from:', url, 'Status:', response.status, 'method:', method, 'finalURL:', response.url);
      
      // If we get a 401 or redirect, it likely means auth failed
      if (response.status === 401 || response.status === 302) {
        return {
          success: false,
          isHtmlResponse: true,
          isAuthError: true,
          error: 'Authentication failed - please log in again',
          needsAuth: true
        };
      }
      
      return {
        success: false,
        isHtmlResponse: true,
        error: 'Received HTML response - this usually indicates an authentication or server error'
      };
    }

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      const allow = response.headers.get('allow');
      console.error('❌ API call failed:', response.status, errorText, {
        request: { url, method, headers },
        response: { url: response.url, status: response.status, statusText: response.statusText, allow }
      });
      
      // If it's an auth error, provide specific feedback
      if (response.status === 401) {
        return {
          success: false,
          isAuthError: true,
          error: 'Authentication failed - please log in again',
          needsAuth: true
        };
      }
      
      return {
        success: false,
        error: `HTTP error! status: ${response.status} - ${errorText}`
      };
    }

    // Parse JSON response safely
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const raw = await response.text();
      console.warn('⚠️ Expected JSON but received non-JSON response from:', url);
      const isHtml = raw.trim().startsWith('<!DOCTYPE') || raw.trim().startsWith('<html');
      return {
        success: false,
        isHtmlResponse: isHtml,
        error: isHtml ? 'Received HTML response instead of JSON (possible auth or server error)'
                      : 'Received non-JSON response',
      } as any;
    }
    const data = await response.json();
    console.log('✅ API call successful:', url);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error making API call to', url, ':', error);
    
    // Determine if this is likely an authentication issue
    const isAuthError = error instanceof Error && 
      (error.message.includes('JWT') || 
       error.message.includes('token') || 
       error.message.includes('refresh') ||
       error.message.includes('Unauthorized') ||
       error.message.includes('unauthorized'));
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      isAuthError,
      needsAuth: isAuthError
    };
  }
}

/**
 * Make an authenticated API call with retry logic
 */
export async function safeApiCallWithRetry(
  url: string, 
  options?: RequestInit & { requiresAuth?: boolean; maxRetries?: number }
) {
  const { maxRetries = 1, ...requestOptions } = options || {};
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await safeApiCall(url, requestOptions);
    
    // If successful or non-retryable error, return immediately
    if (result.success || !result.isAuthError) {
      return result;
    }
    
    // If this is an auth error and we have retries left, try once more
    if (result.isAuthError && attempt < maxRetries) {
      console.log('🔄 Retrying API call due to auth error:', url);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      continue;
    }
    
    return result;
  }
  
  return {
    success: false,
    error: 'Max retries exceeded',
    isAuthError: true,
    needsAuth: true
  };
}

/**
 * Make an unauthenticated API call (for public endpoints)
 */
export async function safePublicApiCall(url: string, options?: RequestInit) {
  return safeApiCall(url, { ...options, requiresAuth: false });
}

/**
 * Check if user is authenticated
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}
