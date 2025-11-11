# API Error Debugging Guide

## 🚨 Error Analysis

**Error**: `HTTP error! status: 500` in `handleSendMessage` at line 807

**Location**: `src/hooks/use-study-buddy.ts:807` - This occurs when the frontend tries to call the study-buddy API endpoint

**Root Cause**: The API endpoint `/api/study-buddy` is returning a 500 Internal Server Error

## 🔍 Possible Sources

### 1. **Missing API Keys** ⭐ Most Likely
- AI provider API keys not set in environment variables
- Required keys: `GROQ_API_KEY`, `GEMINI_API_KEY`, etc.

### 2. **Database Connection Issues** ⭐ Second Most Likely
- Supabase connection string issues
- Missing or invalid database credentials
- Database migration issues

### 3. **Environment Variable Issues**
- Missing required environment variables
- Incorrect variable names or values
- CORS or authentication issues

### 4. **Server-Side Dependencies**
- Missing server-side packages
- Import errors in API routes
- Module resolution issues

## 🛠️ Diagnostic Steps

### Step 1: Check Environment Variables
Verify all required environment variables are set:

```bash
# Check if API keys are set
echo $GROQ_API_KEY
echo $GEMINI_API_KEY
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Should show actual values, not empty
```

### Step 2: Test Supabase Connection
Check if the database connection is working:

```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT version();"
```

### Step 3: Check API Endpoint Directly
Test the study-buddy API endpoint:

1. **Visit the health check**: `/api/study-buddy?action=health`
2. **Check console logs** for detailed error messages
3. **Look at Network tab** in browser dev tools for exact error response

### Step 4: Verify Dependencies
Ensure all dependencies are installed:

```bash
npm install
npm run build
```

## 🔧 Quick Fixes

### Fix 1: Verify API Keys
Check your `.env` file has all required keys:
```env
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Fix 2: Check Supabase Setup
Ensure your Supabase project:
- Is active and running
- Has proper database schema
- Has correct permissions set

### Fix 3: Test with Simple Request
Try making a simple request to test the API:

```bash
curl -X POST http://localhost:3000/api/study-buddy \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","message":"hello","conversationId":"test"}'
```

## 📋 Error Investigation

To get more details about the 500 error:

1. **Check browser console** for full error stack trace
2. **Check server logs** for detailed error information
3. **Look at Network tab** for exact API response
4. **Check Supabase logs** for database issues

## 🎯 Most Likely Solution

Based on the error pattern, the most likely issue is **missing or invalid API keys**. Please:

1. Verify all AI provider API keys are correctly set in `.env`
2. Check that Supabase connection strings are valid
3. Ensure the Supabase project is active and accessible

## 🚀 Next Steps

1. **Check environment variables** - Most common issue
2. **Test Supabase connection** - Database connectivity
3. **Review server logs** - Get detailed error information
4. **Verify API keys** - Ensure all required keys are present

The Markdown rendering components are working correctly - this is an API connectivity issue that needs environment variable or server configuration fixes.