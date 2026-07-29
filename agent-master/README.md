# Agent Master Database

This is the **master database** for the AI agent. It does NOT store client business data — it stores metadata about all clients, their configurations, repositories, skills, and context.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT MASTER DB                           │
│  (abaco_master on Render)                                   │
│                                                              │
│  • clients        ← Who are my clients?                     │
│  • projects       ← What projects does each have?           │
│  • skills         ← What skills do I have?                  │
│  • client_skills  ← What skills does each client need?      │
│  • context_logs   ← What have I done/discussed per client?  │
│  • agent_sessions ← Session tracking                        │
│  • deployments    ← Deploy history                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │ Client A │         │ Client B │         │ Client C │
  │   DB     │         │   DB     │         │   DB     │
  │(cfo_ai_db)│        │(lavanderia│        │(mission_)│
  └──────────┘         │   _db)   │         │ control) │
                       └──────────┘         └──────────┘
```

## Setup

### 1. Create the Master DB on Render

Go to Render Dashboard → New PostgreSQL:
- **Name:** `abaco-master` (or `agent-master`)
- **Plan:** Starter ($7/month) or higher
- **Region:** Same as your other services (Ohio)

Copy the **Internal Database URL** (or External if agent runs elsewhere).

### 2. Set Environment Variable

In your agent's environment (OpenClaw, local, or wherever the agent runs):

```bash
MASTER_DATABASE_URL=postgresql://abaco_master_user:PASSWORD@dpg-XXXX.ohio-postgres.render.com/abaco_master
```

**IMPORTANT:** This is DIFFERENT from any client's `DATABASE_URL`.

### 3. Run the Schema

```bash
# Connect to the master DB and run the schema
psql $MASTER_DATABASE_URL -f schema/001-master-schema.sql
```

Or from the agent:
```bash
cd agent-master
node seed.js
```

### 4. Register Your Clients

After running the schema, register each client:

```sql
INSERT INTO clients (name, slug, database_url, database_name, repository, local_path, n8n_id, business_context)
VALUES (
  'CFO AI Main',
  'cfo-ai',
  'postgresql://cfo_ai_db_user:PASS@dpg-XXX.ohio-postgres.render.com/cfo_ai_db',
  'cfo_ai_db',
  'https://github.com/josearias/cfo-ai',
  '/workspace/cfo-ai-project',
  'n8n-workflow-123',
  '{"industry": "fintech", "size": "startup", "model": "saas"}'
);

INSERT INTO clients (name, slug, database_url, database_name, repository, local_path)
VALUES (
  'Lavanderia Demo',
  'lavanderia-demo',
  'postgresql://lavanderia_user:PASS@dpg-XXX.ohio-postgres.render.com/lavanderia_db',
  'lavanderia_db',
  'https://github.com/josearias/lavanderia-demo',
  '/workspace/abaco-demo-lavanderia'
);

INSERT INTO clients (name, slug, database_url, database_name, repository, local_path)
VALUES (
  'Mission Control',
  'mission-control',
  'postgresql://mc_user:PASS@dpg-XXX.ohio-postgres.render.com/mission_control',
  'mission_control',
  'https://github.com/josearias/mission-control',
  '/workspace/mission-control'
);
```

## Client Isolation Rule

**NEVER** point two different clients to the same database. Each client gets their own PostgreSQL instance.

## Files

| File | Purpose |
|------|---------|
| `schema/001-master-schema.sql` | Full schema definition |
| `connection.js` | Master DB connection module (use this from the agent) |
| `seed.js` | Seed script to populate initial data |

## Using from the Agent

```javascript
const masterDb = require('./agent-master/connection');

// Get all active clients
const clients = await masterDb.getAllClients('active');

// Get a specific client
const client = await masterDb.getClientBySlug('cfo-ai');

// Access their business database (NOT the master DB!)
const clientPool = new Pool({ connectionString: client.database_url });

// Log context about what you're doing
await masterDb.logContext(
  client.id,
  'action',
  'Fixed runway calculator bug',
  { commit: 'abc123', files: ['dashboard.jsx'] },
  'Runway fix deployed',
  'high'
);
```
