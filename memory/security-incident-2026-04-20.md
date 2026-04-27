# Security Incident - 2026-04-20

## CRITICAL LESSON LEARNED

**NEVER hardcode API keys, secrets, or credentials in any file that gets committed to git.**

### What happened
I made a critical security mistake by adding the OpenRouter API key directly to `render.yaml`:
```yaml
- key: OPENROUTER_API_KEY
  value: sk-or-v1-...  # ❌ NEVER DO THIS
```

This caused:
1. The API key was exposed in the git repository (public on GitHub)
2. OpenRouter's security system detected the exposed key and deactivated it automatically
3. User received an email about the compromised key
4. The agents stopped working because the key was revoked

### Correct approach
Use `sync: false` in render.yaml for secrets:
```yaml
- key: OPENROUTER_API_KEY
  sync: false  # ✅ Render prompts for value in dashboard
```

Then set the actual value in the Render Dashboard → Service → Environment Variables.

### General rules for secrets
1. **NEVER** commit `.env` files
2. **NEVER** hardcode API keys in YAML, JSON, or any config files
3. **NEVER** log secrets to console
4. **ALWAYS** use environment variables or secret management services
5. **ALWAYS** use `sync: false` or equivalent for Render/ cloud platforms
6. If a key is exposed: **rotate it immediately** (generate new one, revoke old)

### Impact
- OpenRouter API key revoked
- User had to generate a new key
- Service downtime until new key configured
- Potential security risk if key was scraped from GitHub

### Prevention
- Before committing any file containing "key", "secret", "token", "password": STOP and verify
- Use pre-commit hooks to scan for secrets
- Regularly audit repositories for exposed credentials
