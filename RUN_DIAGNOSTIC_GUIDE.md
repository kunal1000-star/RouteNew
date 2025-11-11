# Database Diagnostic Script Execution Guide

## 🎯 Objective
Run the diagnostic script to identify what's missing in your database setup for the Markdown rendering fix.

## 📋 What You Need
1. **Database connection string** from Supabase
2. **psql client** installed (PostgreSQL command line tool)
3. **Diagnostic script** (`database-connection-diagnostic.sql`)

## 🔧 Step-by-Step Instructions

### Step 1: Get Your Database Connection String

1. Go to your **Supabase Dashboard**
2. Navigate to **Settings** → **Database**
3. Copy the **Connection string** (should look like):
   ```
   postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

### Step 2: Set Up Environment

#### Option A: Temporary Environment Variable (Recommended)
```bash
# Replace with your actual connection string
export DATABASE_URL="postgresql://postgres:your_password@db.project_ref.supabase.co:5432/postgres"
```

#### Option B: Direct Connection
```bash
# You'll need to specify the full connection string each time
psql "postgresql://postgres:your_password@db.project_ref.supabase.co:5432/postgres"
```

### Step 3: Test Database Connection

```bash
# Test if you can connect
psql $DATABASE_URL -c "SELECT version();"
```

**Expected Output:**
```
                                                 version                                                 
---------------------------------------------------------------------------------------------------------
 PostgreSQL 15.something on x86_64-pc-linux-gnu, compiled by gcc (GCC) 9.5.0, 64-bit
(1 row)
```

### Step 4: Run the Diagnostic Script

```bash
# Run the diagnostic script
psql $DATABASE_URL -f database-connection-diagnostic.sql
```

### Step 5: Interpret Results

The diagnostic will output results like this:

```
      test_name       | status 
----------------------+--------
 system_logs table    | FAIL
 conversation_memory  | PASS
 student_ai_profile   | PASS
 column checks        | PASS
 uuid-ossp extension  | PASS
 gen_random_uuid      | PASS
 Available tables     | conversation_memory, student_ai_profile, profiles, users
```

## 📊 What to Look For

### ✅ Expected Results (Good)
- `conversation_memory table exists`: **PASS**
- `student_ai_profile table exists`: **PASS** 
- `conversation_memory columns check`: **PASS**
- `uuid-ossp extension`: **PASS**
- `gen_random_uuid function`: **PASS**

### ❌ Issues to Fix (Bad)
- `system_logs table exists`: **FAIL** (expected - this is what we'll fix)
- Any other **FAIL** results need attention

## 🚨 Common Issues & Solutions

### Issue 1: Connection Failed
```
psql: error: connection to server failed: 
FATAL: password authentication failed for user "postgres"
```

**Solution:**
- Verify your password is correct
- Check if you're using the right connection string
- Make sure your Supabase project is running

### Issue 2: psql Command Not Found
```
bash: psql: command not found
```

**Solution:**
- Install PostgreSQL client:
  ```bash
  # macOS
  brew install postgresql
  
  # Ubuntu/Debian
  sudo apt-get install postgresql-client
  
  # Windows: Download from postgresql.org
  ```

### Issue 3: Permission Denied
```
ERROR: permission denied for schema information_schema
```

**Solution:**
- Make sure you're connecting as a database owner
- Check your Supabase project roles and permissions

## 📝 Next Steps Based on Results

### If Most Tests PASS (Expected):
1. Run the fixed SQL script: `markdown-rendering-fix-fixed.sql`
2. The main issue is just the missing `system_logs` table

### If Multiple Tests FAIL:
1. Check database migrations are complete
2. Verify Supabase project setup
3. Check table permissions

### If Connection Fails:
1. Verify Supabase project is active
2. Check connection string format
3. Test with Supabase SQL Editor instead

## 🔗 Alternative: Use Supabase SQL Editor

If command line doesn't work, use the web interface:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New query**
3. Copy the contents of `database-connection-diagnostic.sql`
4. Click **Run** to execute
5. Review the results in the output panel

## 📋 Diagnostic Script Contents

The diagnostic script checks:
- ✅ Required tables exist (`conversation_memory`, `student_ai_profile`, `system_logs`)
- ✅ Required columns are present
- ✅ PostgreSQL extensions are available
- ✅ Utility functions work
- ✅ Lists all available tables

This will give us a clear picture of what needs to be fixed in your database setup.

---

**Ready to run the diagnostic?** Execute the commands above and share the results so I can help you fix any issues found.