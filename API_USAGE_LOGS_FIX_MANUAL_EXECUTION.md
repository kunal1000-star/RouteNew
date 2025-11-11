# API Usage Logs UUID Schema Fix - Manual Execution Guide

## Overview
This fix resolves the continuous API usage log errors caused by:
1. **Missing 'endpoint' column** in api_usage_logs table
2. **UUID Format Errors** - "test-user" and "anonymous-user" not being valid UUIDs  
3. **User ID Validation** - System trying to insert string user IDs into UUID column

## Files Created
- `fix-api-usage-logs-uuid-schema.sql` - Database schema fix
- `src/lib/ai/api-logger.ts` - Updated API logger with UUID conversion
- `src/types/ai-service-manager.ts` - Updated type definitions

## Manual Execution Steps

### Step 1: Execute Database Schema Fix
1. **Open Supabase Dashboard**: https://app.supabase.com/project/mrhpsmyhquvygenyhygf
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content** of `fix-api-usage-logs-uuid-schema.sql`
4. **Click "Run"** to execute all statements

### Step 2: Verify Database Changes
The SQL file includes verification queries that will show:
- API usage logs table structure
- User ID mappings created
- Functions updated
- Test results

### Step 3: Test API Logger (After SQL Execution)
```bash
# Run the API logger test
node test-api-usage-logs-uuid-fix.js
```

## What the Fix Does

### 1. Database Schema Updates
- **Adds missing 'endpoint' column** to api_usage_logs table
- **Creates user_id_mappings table** for non-UUID user ID tracking
- **Updates existing problematic records** to use proper UUIDs
- **Adds performance indexes** for better query performance

### 2. UUID Mapping System
- **Converts non-UUID user IDs** to valid UUIDs using `get_user_uuid()` function
- **Maintains consistent mapping** for same user IDs across the system
- **Supports all user types**: real UUIDs, test users, system users, etc.

### 3. Enhanced API Logger
- **Automatic user ID conversion** before database insertion
- **Endpoint inference** based on feature names
- **Fallback UUID mapping** for system users
- **Batch and individual logging** with error handling

### 4. Updated Type Definitions
- **Adds 'endpoint' property** to ApiUsageLog interface
- **Changes 'tier_used' type** from number to string (matches database)
- **Adds missing properties** like 'cost_estimate' and 'created_at'

## Expected Results After Fix
- ✅ No more "invalid input syntax for type uuid" errors
- ✅ Clean system logs without API usage log flooding
- ✅ Proper endpoint tracking for all API calls
- ✅ Consistent user ID handling across the system
- ✅ All existing functionality preserved

## Verification Steps
1. **Check system logs** - should show no more UUID format errors
2. **Test API endpoints** - functionality should work normally
3. **Verify data integrity** - all existing API usage logs preserved
4. **Monitor performance** - new indexes should improve query speed

## Rollback Plan (If Needed)
If issues arise, the fix can be safely rolled back:
```sql
-- Remove the new column
ALTER TABLE api_usage_logs DROP COLUMN IF EXISTS endpoint;

-- Remove the mappings table
DROP TABLE IF EXISTS user_id_mappings;

-- Restore original functions (if modified)
```

## Support
If you encounter any issues during manual execution:
1. Check the verification queries output in Step 2
2. Review the error messages carefully
3. Contact the development team with specific error details

---
**Priority**: HIGH - These errors are flooding system logs and affecting performance
**Impact**: Resolves continuous API usage log errors and improves system stability
**Time Required**: ~5 minutes for SQL execution + 2 minutes for testing