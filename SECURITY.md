# 🛡️ Security Checklist — API Keys & Secrets

## Status: ✅ VERIFIED — April 22, 2026

### What was found
- ❌ OLD OpenRouter API key (`sk-or-v1-1e160f...`) was exposed in Git history
- ✅ `.env` is in `.gitignore` — NOT pushed to GitHub
- ✅ `.env.example` uses placeholder only (`sk-or-v1-tu-api-key-aqui`)
- ✅ No API keys in any source code files (.js, .jsx, .ts, .json)
- ✅ No console.log or logs expose the key value
- ✅ Backend reads key from `process.env.OPENROUTER_API_KEY` only

### Remaining risk
- ⚠️ Old key still visible in Git commit history. Full purge requires `git filter-repo` (destructive, requires force-push and coord with team)

### Rules (PERMANENT)
1. **NEVER** commit `.env` or any file with real API keys
2. **NEVER** log API key values — only log their absence/presence
3. **NEVER** return API keys in any API response
4. **NEVER** put keys in `.env.example` — always use placeholders
5. **ALWAYS** use `process.env.VAR_NAME` — never hardcode
6. **ALWAYS** rotate keys immediately if exposed

### Current config
- `OPENROUTER_API_KEY`: Render env var + local `.env` (not in Git)
- `KIMI_API_KEY`: Render env var + local `.env` (not in Git)
- Database: local SQLite file (no cloud credentials)

### How to test a key works
```bash
curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"Hi"}]}'
```

### Action if key is exposed
1. Revoke/rotate key immediately at provider (openrouter.ai/keys)
2. Update in Render Dashboard → Environment variables
3. Update local `.env` (never commit)
4. Force re-deploy on Render
5. Consider `git filter-repo` to purge from history (if repo is private, less urgent)
