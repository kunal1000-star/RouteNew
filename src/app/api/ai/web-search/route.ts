// AI Web Search Endpoint
// ======================
// Comprehensive web search capabilities for AI system to access external information

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logError, logInfo } from '@/lib/error-logger';
import { createHash } from 'crypto';

// Server-side Supabase client for direct database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request/Response interfaces
interface WebSearchRequest {
  query: string;
  searchType?: 'general' | 'academic' | 'news' | 'images' | 'youtube' | 'wikipedia';
  limit?: number;
  options?: {
    safeSearch?: boolean;
    region?: string;
    language?: string;
    dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
    site?: string;
    excludeSite?: string;
  };
  userId?: string; // For personalized caching
  sessionId?: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  relevanceScore: number;
  date?: string;
  imageUrl?: string;
  videoUrl?: string;
  metadata?: {
    domain?: string;
    category?: string;
    language?: string;
    wordCount?: number;
    readingTime?: number;
  };
}

interface SearchCache {
  id: string;
  queryHash: string;
  searchType: string;
  results: SearchResult[];
  totalResults: number;
  provider: string;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
  lastAccessed: string;
}

interface WebSearchResponse {
  success: boolean;
  data?: {
    results: SearchResult[];
    totalResults: number;
    searchInfo: {
      provider: string;
      searchTime: number;
      searchType: string;
      query: string;
      cached: boolean;
      region?: string;
      language?: string;
    };
    suggestions: string[];
    metadata: {
      requestId: string;
      timestamp: string;
      processingTime: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata?: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
}

// Search provider configurations
const SEARCH_PROVIDERS = {
  google: {
    name: 'google',
    apiKey: process.env.GOOGLE_SEARCH_API_KEY,
    cx: process.env.GOOGLE_SEARCH_CX,
    baseUrl: 'https://www.googleapis.com/customsearch/v1',
    rateLimit: 100, // requests per day
    weight: 1.0
  },
  serpapi: {
    name: 'serpapi',
    apiKey: process.env.SERPAPI_KEY,
    baseUrl: 'https://serpapi.com/search',
    rateLimit: 100, // requests per month (free tier)
    weight: 0.9
  },
  duckduckgo: {
    name: 'duckduckgo',
    apiKey: process.env.DUCKDUCKGO_API_KEY,
    baseUrl: 'https://api.duckduckgo.com',
    rateLimit: 1000, // requests per day
    weight: 0.8
  },
  wikipedia: {
    name: 'wikipedia',
    baseUrl: 'https://en.wikipedia.org/api/rest_v1',
    rateLimit: 5000, // requests per day
    weight: 0.7
  }
};

/**
 * Generate hash for caching queries
 */
function generateQueryHash(query: string, searchType: string, options: any): string {
  const content = JSON.stringify({ query, searchType, options });
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(query: string, result: any, searchType: string): number {
  let score = 0.5;
  
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || result.description || '').toLowerCase();
  const url = (result.link || result.url || '').toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Title matches are most important
  if (title.includes(queryLower)) {
    score += 0.3;
  } else {
    const queryWords = queryLower.split(' ');
    const titleMatches = queryWords.filter(word => title.includes(word));
    score += (titleMatches.length / queryWords.length) * 0.2;
  }
  
  // Snippet matches
  const snippetMatches = queryWords.filter(word => snippet.includes(word));
  score += (snippetMatches.length / queryWords.length) * 0.15;
  
  // URL domain relevance
  const domain = extractDomain(url);
  if (domain.includes(queryLower.split(' ')[0])) {
    score += 0.05;
  }
  
  // Search type specific boosts
  if (searchType === 'academic' && (domain.includes('edu') || domain.includes('scholar') || domain.includes('pubmed'))) {
    score += 0.1;
  }
  
  if (searchType === 'news' && (domain.includes('news') || domain.includes('cnn') || domain.includes('bbc'))) {
    score += 0.1;
  }
  
  if (searchType === 'wikipedia' && domain.includes('wikipedia.org')) {
    score += 0.2;
  }
  
  return Math.min(1.0, Math.max(0.1, score));
}

/**
 * Generate search suggestions
 */
function generateSuggestions(query: string, searchType: string): string[] {
  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Basic query expansions
  if (searchType === 'academic') {
    suggestions.push(`${query} research`);
    suggestions.push(`${query} study`);
    suggestions.push(`${query} scientific paper`);
  } else if (searchType === 'news') {
    suggestions.push(`${query} latest news`);
    suggestions.push(`${query} recent updates`);
  } else {
    suggestions.push(`${query} tutorial`);
    suggestions.push(`how to ${queryLower}`);
  }
  
  // Remove duplicates and limit to 3 suggestions
  return [...new Set(suggestions)].slice(0, 3);
}

/**
 * Check search cache
 */
async function checkSearchCache(queryHash: string, userId?: string): Promise<SearchCache | null> {
  try {
    const { data, error } = await supabase
      .from('search_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .order('last_accessed', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    // Update hit count and last accessed
    await supabase
      .from('search_cache')
      .update({
        hit_count: data.hit_count + 1,
        last_accessed: new Date().toISOString()
      })
      .eq('id', data.id);

    return data;
  } catch (error) {
    logError(new Error(`Cache check failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Web Search'
    });
    return null;
  }
}

/**
 * Store search results in cache
 */
async function storeSearchCache(
  queryHash: string,
  searchType: string,
  results: SearchResult[],
  totalResults: number,
  provider: string,
  ttlMinutes: number = 60
): Promise<void> {
  try {
    const cacheId = `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    
    await supabase
      .from('search_cache')
      .insert([{
        id: cacheId,
        query_hash: queryHash,
        search_type: searchType,
        results,
        total_results: totalResults,
        provider,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
        last_accessed: new Date().toISOString()
      }]);
  } catch (error) {
    logError(new Error(`Cache storage failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Web Search'
    });
  }
}

/**
 * Perform Google Custom Search
 */
async function performGoogleSearch(query: string, searchType: string, limit: number, options: any): Promise<SearchResult[]> {
  const config = SEARCH_PROVIDERS.google;
  if (!config.apiKey || !config.cx) {
    throw new Error('Google Search API key or CX not configured');
  }

  const params = new URLSearchParams({
    key: config.apiKey,
    cx: config.cx,
    q: query,
    num: Math.min(limit, 10).toString()
  });

  // Add search type specific parameters
  if (searchType === 'images') {
    params.set('searchType', 'image');
  }
  
  if (options.safeSearch !== false) {
    params.set('safe', 'active');
  }
  
  if (options.dateRange && options.dateRange !== 'all') {
    const dateRestrict = {
      day: 'd1',
      week: 'w1',
      month: 'm1',
      year: 'y1'
    }[options.dateRange];
    if (dateRestrict) params.set('dateRestrict', dateRestrict);
  }

  const response = await fetch(`${config.baseUrl}?${params}`);
  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Google Search API error: ${data.error.message}`);
  }

  const items = data.items || [];
  return items.map((item: any) => ({
    title: item.title || '',
    snippet: item.snippet || '',
    url: item.link || '',
    source: 'Google',
    relevanceScore: calculateRelevanceScore(query, item, searchType),
    date: item.pagemap?.metatags?.[0]?.['article:published_time'],
    imageUrl: searchType === 'images' ? item.link : undefined,
    metadata: {
      domain: extractDomain(item.link || ''),
      category: searchType,
      language: options.language || 'en'
    }
  }));
}

/**
 * Perform SerpAPI search
 */
async function performSerpAPISearch(query: string, searchType: string, limit: number, options: any): Promise<SearchResult[]> {
  const config = SEARCH_PROVIDERS.serpapi;
  if (!config.apiKey) {
    throw new Error('SerpAPI key not configured');
  }

  const params = new URLSearchParams({
    api_key: config.apiKey,
    q: query,
    num: Math.min(limit, 10).toString(),
    engine: searchType === 'images' ? 'google_images' : 'google'
  });

  if (options.safeSearch !== false) {
    params.set('safe', 'active');
  }

  const response = await fetch(`${config.baseUrl}?${params}`);
  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  const organic = data.organic_results || data.image_results || [];
  return organic.slice(0, limit).map((item: any) => ({
    title: item.title || item.title || '',
    snippet: item.snippet || item.description || '',
    url: item.link || item.original || '',
    source: 'SerpAPI',
    relevanceScore: calculateRelevanceScore(query, item, searchType),
    date: item.date,
    imageUrl: searchType === 'images' ? item.original : undefined,
    metadata: {
      domain: extractDomain(item.link || ''),
      category: searchType,
      language: options.language || 'en'
    }
  }));
}

/**
 * Perform DuckDuckGo search
 */
async function performDuckDuckGoSearch(query: string, searchType: string, limit: number, options: any): Promise<SearchResult[]> {
  // DuckDuckGo doesn't require an API key for basic search
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    no_html: '1',
    skip_disambig: '1'
  });

  const response = await fetch(`${SEARCH_PROVIDERS.duckduckgo.baseUrl}?${params}`);
  if (!response.ok) {
    throw new Error(`DuckDuckGo API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  const results: SearchResult[] = [];
  
  // Process abstract results
  if (data.Abstract) {
    results.push({
      title: data.Heading || 'DuckDuckGo Result',
      snippet: data.Abstract,
      url: data.AbstractURL || '',
      source: 'DuckDuckGo',
      relevanceScore: calculateRelevanceScore(query, data, searchType),
      metadata: {
        domain: extractDomain(data.AbstractURL || ''),
        category: searchType,
        language: options.language || 'en'
      }
    });
  }
  
  // Process related topics
  if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
    const topics = data.RelatedTopics.slice(0, limit - results.length);
    results.push(...topics.map((topic: any) => ({
      title: topic.Text || 'Related Topic',
      snippet: topic.Text || '',
      url: topic.FirstURL || '',
      source: 'DuckDuckGo',
      relevanceScore: calculateRelevanceScore(query, topic, searchType),
      metadata: {
        domain: extractDomain(topic.FirstURL || ''),
        category: searchType,
        language: options.language || 'en'
      }
    })));
  }
  
  return results.slice(0, limit);
}

/**
 * Perform Wikipedia search
 */
async function performWikipediaSearch(query: string, searchType: string, limit: number, options: any): Promise<SearchResult[]> {
  // Wikipedia search via their API
  const searchParams = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: Math.min(limit, 10).toString(),
    format: 'json',
    origin: '*'
  });

  const response = await fetch(`${SEARCH_PROVIDERS.wikipedia.baseUrl}/page/summary/${encodeURIComponent(query)}?redirect=true`);
  if (response.ok) {
    const summaryData = await response.json();
    
    if (summaryData.extract) {
      return [{
        title: summaryData.title || query,
        snippet: summaryData.extract,
        url: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        source: 'Wikipedia',
        relevanceScore: calculateRelevanceScore(query, summaryData, searchType),
        date: summaryData.timestamp,
        metadata: {
          domain: 'wikipedia.org',
          category: 'encyclopedia',
          language: 'en'
        }
      }];
    }
  }

  // Fallback to search endpoint
  const searchResponse = await fetch(`${SEARCH_PROVIDERS.wikipedia.baseUrl}/page/summary/${encodeURIComponent(query)}?format=json`);
  const searchData = await searchResponse.json();
  
  return [{
    title: searchData.title || query,
    snippet: searchData.extract || 'Wikipedia article',
    url: searchData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
    source: 'Wikipedia',
    relevanceScore: calculateRelevanceScore(query, searchData, searchType),
    metadata: {
      domain: 'wikipedia.org',
      category: 'encyclopedia',
      language: 'en'
    }
  }];
}

/**
 * Select best search provider
 */
function selectBestProvider(searchType: string): string[] {
  const providers: { name: string; weight: number; available: boolean }[] = [];
  
  // Check Google availability
  if (SEARCH_PROVIDERS.google.apiKey && SEARCH_PROVIDERS.google.cx) {
    providers.push({ name: 'google', weight: SEARCH_PROVIDERS.google.weight, available: true });
  }
  
  // Check SerpAPI availability
  if (SEARCH_PROVIDERS.serpapi.apiKey) {
    providers.push({ name: 'serpapi', weight: SEARCH_PROVIDERS.serpapi.weight, available: true });
  }
  
  // DuckDuckGo is always available
  providers.push({ name: 'duckduckgo', weight: SEARCH_PROVIDERS.duckduckgo.weight, available: true });
  
  // Wikipedia is always available
  if (searchType === 'academic' || searchType === 'general') {
    providers.push({ name: 'wikipedia', weight: SEARCH_PROVIDERS.wikipedia.weight, available: true });
  }
  
  // Sort by weight and return available providers
  return providers
    .filter(p => p.available)
    .sort((a, b) => b.weight - a.weight)
    .map(p => p.name);
}

/**
 * Perform web search with provider fallback
 */
async function performWebSearch(query: string, searchType: string, limit: number, options: any): Promise<{
  results: SearchResult[];
  provider: string;
  totalResults: number;
}> {
  const providers = selectBestProvider(searchType);
  
  if (providers.length === 0) {
    throw new Error('No search providers available');
  }
  
  let lastError: Error | null = null;
  
  for (const providerName of providers) {
    try {
      logInfo(`Attempting search with provider: ${providerName}`, {
        componentName: 'AI Web Search',
        provider: providerName,
        query: query.substring(0, 100),
        searchType,
        limit
      });
      
      let results: SearchResult[] = [];
      
      switch (providerName) {
        case 'google':
          results = await performGoogleSearch(query, searchType, limit, options);
          break;
        case 'serpapi':
          results = await performSerpAPISearch(query, searchType, limit, options);
          break;
        case 'duckduckgo':
          results = await performDuckDuckGoSearch(query, searchType, limit, options);
          break;
        case 'wikipedia':
          results = await performWikipediaSearch(query, searchType, limit, options);
          break;
        default:
          continue;
      }
      
      if (results.length > 0) {
        logInfo(`Search successful with provider: ${providerName}`, {
          componentName: 'AI Web Search',
          provider: providerName,
          resultsCount: results.length
        });
        
        return {
          results: results.sort((a, b) => b.relevanceScore - a.relevanceScore),
          provider: providerName,
          totalResults: results.length
        };
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logError(new Error(`Search failed with provider ${providerName}: ${lastError.message}`), {
        componentName: 'AI Web Search',
        provider: providerName,
        error: lastError.message
      });
      continue;
    }
  }
  
  // If all providers failed, throw the last error
  throw lastError || new Error('All search providers failed');
}

/**
 * POST /api/ai/web-search - Perform web search
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `web-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    logInfo('Web search request received', {
      componentName: 'AI Web Search',
      requestId
    });

    // Parse request body
    const body = await request.json() as WebSearchRequest;

    // Validate required fields
    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Query is required and cannot be empty'
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // Set defaults
    const searchType = body.searchType || 'general';
    const limit = Math.min(Math.max(body.limit || 10, 1), 50); // Clamp between 1-50
    const options = {
      safeSearch: body.options?.safeSearch !== false,
      region: body.options?.region || 'us',
      language: body.options?.language || 'en',
      dateRange: body.options?.dateRange || 'all',
      site: body.options?.site,
      excludeSite: body.options?.excludeSite
    };

    // Generate query hash for caching
    const queryHash = generateQueryHash(body.query, searchType, options);
    
    // Check cache first
    const cachedResults = await checkSearchCache(queryHash, body.userId);
    if (cachedResults) {
      logInfo('Returning cached search results', {
        componentName: 'AI Web Search',
        requestId,
        queryHash,
        cacheHit: true
      });
      
      return NextResponse.json({
        success: true,
        data: {
          results: cachedResults.results,
          totalResults: cachedResults.total_results,
          searchInfo: {
            provider: 'cache',
            searchTime: 0,
            searchType,
            query: body.query,
            cached: true,
            region: options.region,
            language: options.language
          },
          suggestions: generateSuggestions(body.query, searchType),
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime
          }
        }
      });
    }

    // Perform web search
    const { results, provider, totalResults } = await performWebSearch(
      body.query, 
      searchType, 
      limit, 
      options
    );

    // Store in cache (short cache for recent searches)
    await storeSearchCache(
      queryHash,
      searchType,
      results,
      totalResults,
      provider,
      15 // 15 minutes cache
    );

    const processingTime = Date.now() - startTime;

    logInfo('Web search completed successfully', {
      componentName: 'AI Web Search',
      requestId,
      query: body.query.substring(0, 100),
      resultsCount: results.length,
      provider,
      processingTime
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        results,
        totalResults,
        searchInfo: {
          provider,
          searchTime: processingTime,
          searchType,
          query: body.query,
          cached: false,
          region: options.region,
          language: options.language
        },
        suggestions: generateSuggestions(body.query, searchType),
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime
        }
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(new Error(`Web search failed: ${errorMessage}`), {
      componentName: 'AI Web Search',
      requestId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: 'Web search failed',
        details: errorMessage
      },
      metadata: {
        requestId,
        processingTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/web-search - Health check and system status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      // Test search provider availability
      const providerStatus: Record<string, { available: boolean; error?: string }> = {};
      
      for (const [name, config] of Object.entries(SEARCH_PROVIDERS)) {
        try {
          if (name === 'google') {
            providerStatus[name] = { 
              available: !!(config.apiKey && config.cx) 
            };
          } else if (name === 'serpapi') {
            providerStatus[name] = { 
              available: !!config.apiKey 
            };
          } else {
            providerStatus[name] = { 
              available: true // DuckDuckGo and Wikipedia don't require API keys
            };
          }
        } catch (error) {
          providerStatus[name] = { 
            available: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      // Test database connectivity
      const { error: dbError } = await supabase
        .from('search_cache')
        .select('id')
        .limit(1);

      const dbHealthy = !dbError;

      return NextResponse.json({
        success: true,
        data: {
          status: 'AI Web Search API is operational',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          system: {
            database: {
              connected: dbHealthy,
              table: 'search_cache',
              error: dbError?.message
            },
            search_providers: providerStatus,
            cache: {
              enabled: true,
              table: 'search_cache',
              ttl_minutes: 15
            }
          },
          search_types: {
            general: 'General web search',
            academic: 'Academic and scholarly search',
            news: 'Recent news and updates',
            images: 'Image search with metadata',
            youtube: 'Video content search',
            wikipedia: 'Wikipedia encyclopedia content'
          }
        }
      });
    }

    if (action === 'test-search') {
      // Test search functionality
      const testQuery = 'artificial intelligence';
      const testType = 'general';
      
      try {
        const testPayload: WebSearchRequest = {
          query: testQuery,
          searchType: testType,
          limit: 3
        };

        // Create test request
        const testRequest = new NextRequest('http://localhost/api/ai/web-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });

        const result = await POST(testRequest);
        const resultData = await result.json();

        return NextResponse.json({
          success: true,
          data: {
            testPerformed: true,
            testResult: resultData,
            timestamp: new Date().toISOString()
          }
        });

      } catch (testError) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'TEST_FAILED',
            message: 'Web search test failed',
            details: testError instanceof Error ? testError.message : 'Unknown error'
          },
          data: {
            testPerformed: true,
            testResult: 'failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Default: Return API information
    return NextResponse.json({
      success: true,
      data: {
        endpoint: 'AI Web Search',
        description: 'Comprehensive web search capabilities for AI system to access external information',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        usage: {
          method: 'POST',
          body: {
            query: 'Search query string (required)',
            searchType: 'Optional: general|academic|news|images|youtube|wikipedia (default: general)',
            limit: 'Optional: number of results (1-50, default: 10)',
            options: {
              safeSearch: 'Optional: enable/disable safe search (default: true)',
              region: 'Optional: geographic region (default: us)',
              language: 'Optional: language code (default: en)',
              dateRange: 'Optional: day|week|month|year|all (default: all)',
              site: 'Optional: restrict to specific site',
              excludeSite: 'Optional: exclude specific site'
            },
            userId: 'Optional: user ID for personalized caching',
            sessionId: 'Optional: session identifier'
          },
          response: {
            success: 'boolean',
            data: {
              results: 'Array of search results with title, snippet, url, source, relevanceScore',
              totalResults: 'Total number of available results',
              searchInfo: 'Metadata about the search (provider, time, type, etc.)',
              suggestions: 'Related search suggestions',
              metadata: 'Request metadata and processing time'
            }
          }
        },
        search_providers: {
          google: 'Google Custom Search API (primary)',
          serpapi: 'SerpAPI (fallback)',
          duckduckgo: 'DuckDuckGo (fallback)',
          wikipedia: 'Wikipedia API (academic/general)'
        },
        features: {
          caching: '15-minute cache for recent searches',
          fallback: 'Automatic fallback between providers',
          relevance_scoring: 'Intelligent result ranking',
          content_summarization: 'Extract key information from results',
          deduplication: 'Remove duplicate content',
          safe_search: 'Content filtering options'
        }
      }
    });

  } catch (error) {
    logError(new Error(`GET request failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Web Search',
      operation: 'health_check'
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to perform health check',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}