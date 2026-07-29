# 🔧 DATABASE ISOLATION FIX — ACTION REQUIRED

## Problem Found

**abaco-demo-lavanderia was sharing the same PostgreSQL database as the main abaco app.**
Both pointed to `cfo_ai_db` on Render. Any data created in the demo was polluting the main app's database.

---

## What I Built

### 1. Master Agent Database (`agent-master/`)

A new schema and module for tracking ALL clients, their configs, repos, and skills.

**Files created:**
- `agent-master/schema/001-master-schema.sql` — Full PostgreSQL schema
- `agent-master/connection.js` — Master DB connection module
- `agent-master/seed.js` — Script to register existing clients
- `agent-master/README.md` — Full documentation

**Tables:**
| Table | Purpose |
|-------|---------|
| `clients` | All clients, their DB URLs, repos, context |
| `projects` | Projects per client |
| `skills` | Catalog of skills I can use |
| `client_skills` | What skills each client needs |
| `context_logs` | History of actions/insights per client |
| `agent_sessions` | Track my work sessions |
| `deployments` | Deploy history |

### 2. Fixed the Collision

**Updated:** `abaco-demo-lavanderia/backend/.env`
- **Removed:** `DATABASE_URL` pointing to `cfo_ai_db` (shared)
- **Added:** Commented placeholder for a NEW database

---

## What YOU Need to Do

### Step 1: Create the Master DB on Render

Go to [Render Dashboard](https://dashboard.render.com) → New → PostgreSQL:
- **Name:** `abaco-master`
- **Plan:** Starter ($7/month) minimum
- **Region:** Ohio (same as your other services)
- Copy the **Internal Database URL**

Set this in OpenClaw's environment:
```bash
MASTER_DATABASE_URL=postgresql://abaco_master_user:PASSWORD@dpg-XXXX.ohio-postgres.render.com/abaco_master
```

### Step 2: Run the Schema

```bash
cd /root/.openclaw/workspace/agent-master
psql $MASTER_DATABASE_URL -f schema/001-master-schema.sql
```

### Step 3: Create a Separate DB for Lavanderia Demo

Go to Render → New → PostgreSQL:
- **Name:** `lavanderia-demo-db`
- **Region:** Ohio
- Copy the connection URL

Update the demo's `.env`:
```bash
# /root/.openclaw/workspace/abaco-demo-lavanderia/backend/.env
DATABASE_URL=postgresql://lavanderia_demo_user:PASSWORD@dpg-YYYY.ohio-postgres.render.com/lavanderia_demo_db
```

### Step 4: Register Clients in Master DB

```bash
cd /root/.openclaw/workspace/agent-master
node seed.js
```

Then manually update the lavanderia-demo client's database_url in the master DB once you create it.

---

## Architecture After Fix

```
┌──────────────────────┐
│   abaco-master DB    │  ← Master agent database (skills, clients, context)
│   (NEW on Render)    │
└──────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌─────────┐  ┌──────────────┐
│ cfo_ai  │  │ lavanderia   │  ← Each client has their own isolated DB
│   _db   │  │  _demo_db    │
│(Render) │  │  (NEW Render)│
└─────────┘  └──────────────┘
```

---

## Immediate Risks if Not Fixed

1. **Data pollution:** Demo transactions appearing in main app reports
2. **User collision:** Demo users can log into main app (same auth tables)
3. **Backup/restore issues:** Can't restore one without affecting the other
4. **Security:** Demo has access to production financial data

---

## Current Client Inventory

| Client | Database | Status | Action |
|--------|----------|--------|--------|
| abaco (main) | `cfo_ai_db` | ✅ OK | Register in master DB |
| lavanderia-demo | ~~`cfo_ai_db`~~ | ❌ COLLISION | **Create new DB** |
| mission-control | `mission_control` | ✅ OK | Register in master DB |

---

## Next

Tell me when you've created the Render DBs and I'll run the migrations and seed scripts.
