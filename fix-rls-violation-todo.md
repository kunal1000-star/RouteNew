# RLS Policy Violation Fix - TODO List

## Objective
Fix row-level security policy violation for `student_ai_profile` table that prevents chat messages from being stored.

## Steps
- [ ] Apply the comprehensive RLS fix migration
- [ ] Verify the migration executed successfully
- [ ] Test chat message functionality to trigger profile update
- [ ] Confirm no more RLS policy violations occur
- [ ] Clean up migration files if needed

## Technical Details
- Issue: Trigger function `update_last_ai_interaction()` cannot insert/update due to RLS policies
- Solution: RLS policies that allow both `auth.uid()` and `auth.role() = 'service_role'`
- Migration: `fixed-migration-2025-11-07-student-profile-rls-fix-final.sql`
