# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:**
- **What to call them:**
- **Pronouns:** _(optional)_
- **Timezone:**
- **Notes:**

## Context

_(What do they care about? What projects are they working on? What annoys them? What makes them laugh? Build this over time.)_

- **Infraestructura:** Todo (frontend + backend) está en **Render**.
  - ⚠️ **NO es free tier.** Usa plan pago en Render. El servidor no "duerme".
  - Base de datos: **PostgreSQL en Render (producción) — NUNCA SQLite. NUNCA.**
  - Connection string: `postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com/cfo_ai_db`
  - **REGLA ABSOLUTA:** Si veo SQLite (`cfo_ai.db`, `DATABASE_URL=./database/...`, etc.), debo cambiarlo a PostgreSQL INMEDIATAMENTE. No preguntar. No dudar. Solo cambiarlo.

---

The more you know, the better you can help. But remember — you're learning about a person, not building a dossier. Respect the difference.
