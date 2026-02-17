# Nineteen58 Internal Ops Portal — Claude Project Notes

## Repo
- GitHub: https://github.com/Damon-N58/internal-management.git
- Default branch: `main` — push all work here
- Commit and push frequently as features are completed
- Ask before force-pushing or destructive git operations

---

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database/Auth:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Styling:** Tailwind CSS + Shadcn UI
- **Components:** Radix UI primitives

---

## Core Architecture Rules

1. **Source of Truth:** All client and product data must reside in the Prisma-defined relational schema. Never use flat JSON files for client data.

2. **Security:** Use Supabase Row Level Security (RLS). Encrypt sensitive fields in the `TechnicalVault` table using `pg_crypto` or a dedicated encryption utility.

3. **Data Fetching:** Use Server Components for initial data fetching. Use Server Actions for all mutations (creating tickets, updating health scores, etc.).

4. **AI Integration:** The `/api/ingest/activity` endpoint is the designated receiver for n8n AI summaries. It must handle POST requests and map `companyName` to the correct `CompanyID`.

5. **UI Consistency:** Follow the 'Taxonomy' (shadcn/taxonomy) layout structure. Use sidebar-first navigation. Dark mode by default.

---

## Feature Logic

- **Handoff Reports:** Must aggregate data from `ActivityLog`, `TechnicalVault`, and `Ticket` models into a single Markdown-formatted string.

- **Sales Tracking:** Highlight clients in the UI if `contractEndDate` is within 60 days.

- **PCR Module:** All Product Change Requests must have a priority scale of 1–5 and be linked to an internal assignee.

---

## Workflow Preferences
- Ask before running destructive git operations (force push, reset --hard, etc.)
- Prefer editing existing files over creating new ones unless a new file is clearly required
- Keep solutions simple — avoid over-engineering
- No docstrings, comments, or type annotations added to code that wasn't changed
