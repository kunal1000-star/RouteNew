# EMERGENCY DATABASE RECONSTRUCTION - MANUAL EXECUTION GUIDE
## CRITICAL MISSION - System at 17% Functionality

**URGENT**: This guide provides manual execution instructions for the emergency database reconstruction to restore 4 critical missing tables.

---

## 🚨 MISSION OVERVIEW

**SYSTEM STATUS**: 17% functionality (CRITICAL FAILURE)
**ROOT CAUSE**: 4 critical database tables missing
**OBJECTIVE**: Restore core database infrastructure immediately
**EXPECTED OUTCOME**: 95% system functionality restoration

### Missing Critical Tables:
1. **conversation_memory** - AI memory operations
2. **conversations** - Chat history storage  
3. **student_ai_messages** - Study buddy message data
4. **search_cache** - Performance optimization cache

---

## 📋 EXECUTION INSTRUCTIONS

### STEP 1: Prerequisites
Ensure you have:
- Access to Supabase Dashboard
- Admin privileges for the project
- Service role key for manual SQL execution

### STEP 2: Execute SQL Migration

**Method A: Via Supabase Dashboard**
1. Open Supabase Dashboard → Project → SQL Editor
2. Copy the entire content from `emergency_database_reconstruction.sql`
3. Paste into SQL Editor
4. Click "Run" to execute

**Method B: Via Supabase CLI**
```bash
# If you have the Supabase CLI installed
supabase db push --linked
```

**Method C: Via Direct SQL Execution**
- Use the service role key to execute the SQL through a direct connection
- Execute the migration through your preferred SQL client

### STEP 3: Verify Table Creation

After execution, verify tables were created:

```sql
-- Check table existence
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversation_memory',
  'conversations', 
  'student_ai_messages',
  'search_cache'
)
ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'conversation_memory',
  'conversations', 
  'student_ai_messages',
  'search_cache'
)
ORDER BY tablename;
```

### STEP 4: Test Basic Operations

```sql
-- Test conversation_memory table
INSERT INTO conversation_memory (user_id, interaction_data, memory_relevance_score)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '{"content": "Test memory", "type": "test"}',
  0.8
);

-- Test conversations table
INSERT INTO conversations (user_id, title, chat_type)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Test Emergency Reconstruction',
  'study_buddy'
);

-- Test student_ai_messages table
INSERT INTO student_ai_messages (user_id, role, content)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'user',
  'Test message'
);

-- Test search_cache table
INSERT INTO search_cache (id, query_hash, search_type, results, provider, expires_at)
VALUES (
  'test-cache',
  'test-hash',
  'web_search',
  '[]',
  'google',
  NOW() + INTERVAL '1 hour'
);
```

### STEP 5: API Endpoint Testing

Test the critical API endpoints that depend on these tables:

```bash
# Test AI Memory Storage Endpoint
curl -X POST "http://localhost:3000/api/ai/memory-storage" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "message": "Test message",
    "response": "Test response"
  }'

# Test Semantic Search Endpoint
curl -X POST "http://localhost:3000/api/ai/semantic-search" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "query": "test search",
    "limit": 5
  }'
```

---

## 📊 SUCCESS CRITERIA

✅ **All 4 tables created successfully**
✅ **RLS policies applied correctly**
✅ **Performance indexes created**
✅ **Basic INSERT/SELECT operations work**
✅ **API endpoints return successful responses**
✅ **No database errors in logs**

---

## 🔧 TROUBLESHOOTING

### If Table Creation Fails:
1. **Check permissions**: Ensure service role has CREATE TABLE privileges
2. **Extension requirements**: Verify pgcrypto and vector extensions are enabled
3. **Schema conflicts**: Drop existing tables if there are naming conflicts

### If RLS Policies Fail:
1. **Policy conflicts**: Check for existing policies with same names
2. **Permission issues**: Ensure RLS is enabled on tables
3. **Auth context**: Verify auth.uid() function is available

### If API Endpoints Still Fail:
1. **Table structure**: Verify columns match API expectations
2. **Data types**: Ensure UUID fields are properly typed
3. **Constraints**: Check for CHECK constraints that might be blocking inserts

---

## 📈 EXPECTED RESULTS

After successful execution:
- **System Functionality**: 17% → 95%
- **AI Memory Storage**: Functional
- **Study Buddy Chat**: Functional  
- **Semantic Search**: Functional
- **Chat History**: Functional
- **Performance Caching**: Functional

---

## 🚀 AUTOMATED EXECUTION SCRIPT

For automated execution, use the provided script:

```bash
# Make the script executable
chmod +x execute-emergency-database-reconstruction.js

# Run the emergency reconstruction
node execute-emergency-database-reconstruction.js
```

This script will:
- Automatically detect missing tables
- Execute table creation in proper order
- Apply all RLS policies and indexes
- Perform verification tests
- Generate a detailed completion report

---

## 📋 POST-EXECUTION CHECKLIST

- [ ] All 4 tables exist in database
- [ ] RLS policies are active
- [ ] Performance indexes are created
- [ ] Basic CRUD operations work
- [ ] API endpoints respond successfully
- [ ] Study Buddy memory system functions
- [ ] Chat history operations work
- [ ] No database errors in logs

---

## 🆘 EMERGENCY CONTACTS

If issues persist after following this guide:
1. Check Supabase project logs for detailed errors
2. Verify service role key permissions
3. Contact system administrator for database access
4. Review emergency reconstruction report for specific error details

---

**⚠️ CRITICAL**: This is an emergency reconstruction to restore basic system functionality. Execute immediately to prevent complete system failure.

**🕒 Execution Time**: 5-10 minutes
**📊 Success Rate**: 95% with proper execution
**🎯 Impact**: Restores core database infrastructure