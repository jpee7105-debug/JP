---
name: Admin password sync
description: Startup must always re-hash and update admin password; trust proxy always on
---

## Rule

At startup, always call `storage.updateEmployee(existingAdmin.id, { passwordHash })` with the fresh bcrypt hash of `ADMIN_PASSWORD`, even when the admin account already exists.

**Why:** If ADMIN_PASSWORD is rotated in Replit Secrets after first boot, the stored hash becomes stale and every login returns 401. The fix is to sync unconditionally on every startup (cheap — only one bcrypt hash + one UPDATE).

## Trust proxy

`app.set("trust proxy", 1)` must be set unconditionally (not gated on `isProduction`).

**Why:** Replit's proxy sets X-Forwarded-For in both dev and production. express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR in dev without this setting.
