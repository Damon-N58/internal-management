# Plan: Migrate from Prisma to Supabase JS SDK (snake_case)

## Overview
Remove Prisma entirely and use the Supabase JS client (`@supabase/supabase-js`, already installed) as the data layer. At the same time, rename all tables and columns in Supabase from PascalCase/camelCase to snake_case.

---

## Step 1 — Rename tables & columns in Supabase (SQL migration)

Generate a single SQL migration script that:
- Renames all 10 tables from PascalCase → snake_case (e.g. `"Company"` → `company`, `"ActivityLog"` → `activity_log`)
- Renames all camelCase columns → snake_case (e.g. `"healthScore"` → `health_score`, `"companyId"` → `company_id`)
- This must be run manually by the user in the Supabase SQL Editor

### Table name mapping:
| Current (PascalCase) | New (snake_case) |
|---|---|
| Company | company |
| TechnicalVault | technical_vault |
| ProductChangeRequest | product_change_request |
| ActivityLog | activity_log |
| Ticket | ticket |
| Deadline | deadline |
| Blocker | blocker |
| KnowledgeBaseEntry | knowledge_base_entry |
| Notification | notification |
| HealthScoreLog | health_score_log |

---

## Step 2 — Generate TypeScript types for Supabase

Create `src/types/database.ts` with hand-written types matching the new snake_case schema. This replaces the Prisma-generated types. The structure will be a `Database` type that the Supabase client can use for type safety:

```ts
export type Database = {
  public: {
    Tables: {
      company: { Row: {...}; Insert: {...}; Update: {...} }
      // ... etc for all 10 tables
    }
  }
}
```

---

## Step 3 — Replace the data layer

### 3a. Replace `src/lib/prisma.ts` → `src/lib/supabase.ts`
- Update the existing `src/lib/supabase.ts` to export a typed `supabase` admin client (using the service role key for server-side operations)
- The admin client will be the primary data access layer (replaces `prisma`)
- Delete `src/lib/prisma.ts`

### 3b. Update `src/types/index.ts`
- Remove all `@prisma/client` re-exports
- Re-export the row types from `database.ts` instead (e.g. `export type Company = Database['public']['Tables']['company']['Row']`)
- Keep the union types (CompanyStatus, TicketStatus, etc.) as-is

---

## Step 4 — Migrate all Server Actions (7 files)

Each file imports `prisma` — replace with `supabase` calls using snake_case column names.

| File | Key changes |
|---|---|
| `actions/activity-logs.ts` | `prisma.$transaction` → two sequential supabase calls (insert activity_log + update company.last_activity_at) |
| `actions/companies.ts` | `prisma.company.findUnique/update` → `supabase.from('company').select().eq().single()` / `.update().eq()` |
| `actions/tickets.ts` | `prisma.ticket.create/update` → supabase insert/update |
| `actions/blockers.ts` | `prisma.blocker.create/update/updateMany` → supabase insert/update with filters |
| `actions/pcr.ts` | `prisma.productChangeRequest.create/update` → supabase insert/update |
| `actions/knowledge-base.ts` | `prisma.knowledgeBaseEntry.create/delete` → supabase insert/delete |
| `actions/notifications.ts` | Most complex — bulk create, findMany with filters, update/updateMany → equivalent supabase queries |

**Transaction handling:** Prisma `$transaction` is used in 2 places (activity-logs, apply-health-score). Supabase JS doesn't have client-side transactions, so we'll use sequential calls. For the health score update (which conditionally adds an activity log), we'll use a Supabase RPC function OR just sequential calls since the data is not critically transactional.

---

## Step 5 — Migrate Business Logic (2 files)

| File | Key changes |
|---|---|
| `src/lib/apply-health-score.ts` | Replace prisma queries with supabase. The `_count` aggregation becomes a `.select('id', { count: 'exact' })` call. The `$transaction` becomes sequential inserts/updates. |
| `src/lib/health-score.ts` | **No changes** — this is a pure function with no DB access |

---

## Step 6 — Migrate Server Components (4 page files)

| File | Key changes |
|---|---|
| `src/app/page.tsx` | Replace `prisma.company.findMany({ include: {...} })` with multiple supabase queries (company + joined data), or use supabase's `select('*, blocker(*), ticket(*)')` syntax for joins |
| `src/app/clients/page.tsx` | Simple `supabase.from('company').select().order('name')` |
| `src/app/clients/[id]/page.tsx` | Replace `prisma.company.findUnique({ include: {...} })` with `supabase.from('company').select('*, technical_vault(*), ticket(*), activity_log(*), deadline(*), blocker(*), knowledge_base_entry(*)').eq('id', id).single()` |
| `src/app/product/page.tsx` | Simple `supabase.from('product_change_request').select().order(...)` |

---

## Step 7 — Migrate API Routes (2 files)

| File | Key changes |
|---|---|
| `src/app/api/ingest/activity/route.ts` | `prisma.company.findUnique` → supabase select by name |
| `src/app/api/ingest/usage/route.ts` | supabase update + activity log insert |

---

## Step 8 — Migrate Layout Component (1 file)

| File | Key changes |
|---|---|
| `src/components/layout/notification-bell-wrapper.tsx` | `prisma.notification.findMany` → `supabase.from('notification').select().order(...)` |

---

## Step 9 — Clean up Prisma

- Delete `prisma/` directory (schema.prisma)
- Delete `prisma.config.ts`
- Remove `serverExternalPackages: ["@prisma/client", "prisma"]` from `next.config.ts`
- Run `npm uninstall prisma @prisma/client`
- Delete `src/lib/prisma.ts`

---

## Step 10 — Test

Run the SQL migration (user does this in Supabase SQL Editor), then `npm run dev` and verify all pages load.

---

## Files to CREATE:
1. `src/types/database.ts` — Supabase Database type definitions
2. `docs/migration-rename-tables.sql` — SQL migration script for table/column renames

## Files to EDIT (17):
1. `src/lib/supabase.ts` — Add typed client export
2. `src/types/index.ts` — Swap Prisma type re-exports for Supabase ones
3. `src/actions/activity-logs.ts`
4. `src/actions/companies.ts`
5. `src/actions/tickets.ts`
6. `src/actions/blockers.ts`
7. `src/actions/pcr.ts`
8. `src/actions/knowledge-base.ts`
9. `src/actions/notifications.ts`
10. `src/lib/apply-health-score.ts`
11. `src/app/page.tsx`
12. `src/app/clients/page.tsx`
13. `src/app/clients/[id]/page.tsx`
14. `src/app/product/page.tsx`
15. `src/app/api/ingest/activity/route.ts`
16. `src/app/api/ingest/usage/route.ts`
17. `src/components/layout/notification-bell-wrapper.tsx`
18. `next.config.ts` — Remove serverExternalPackages
19. `package.json` — Remove prisma deps

## Files to DELETE (3):
1. `src/lib/prisma.ts`
2. `prisma/schema.prisma`
3. `prisma.config.ts`
