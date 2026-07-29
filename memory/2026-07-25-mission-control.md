# Mission Control Architecture Decision

**Date:** 2026-07-25
**Status:** Scaffold complete, awaiting credentials for deployment

## What Was Built

Full-stack Mission Control platform with:

### Backend (`/backend`)
- Node.js + Express + PostgreSQL
- REST API for client CRUD operations
- GitHub API integration (create repos)
- Render API integration (deploy services)
- n8n API integration (workflow folders)
- Automated onboarding pipeline (one-click deploy)

### Frontend (`/frontend`)
- React 18 + Vite + Tailwind CSS
- Dashboard with client status overview
- Onboarding wizard (4-step form)
- Client detail page with tabs
- Dark theme, action-oriented UI

### Database Schema
- `clients` table: stores all client metadata
- `deployments` table: tracks deployment history

## Naming Convention (Temporary)
- Repos: `{slug}-app`
- Render services: `{slug}-web`
- n8n folders: `Client: {Name}`

## What I Need From Jose

To actually create repos and deploy services, I need:

1. **GitHub Personal Access Token** (classic, with `repo` scope)
2. **Render API Key** (from Account Settings → API Keys)
3. **Render Owner ID** (user ID for service creation)
4. **PostgreSQL database** on Render (or reuse existing)

## Next Steps After Credentials

1. Create `mission-control` repo on GitHub
2. Deploy to Render as web service
3. Configure environment variables
4. Test end-to-end onboarding flow

## Key Design Decisions

- **Option B for secrets**: All credentials in `.env` (not shared between clients)
- **Single Render account**: Uses Jose's paid plan for all client services
- **Telegram-free operations**: All actions via Mission Control UI, no conversational commands needed
- **Complete isolation**: Each client gets separate repo, service, DB, and n8n folder
