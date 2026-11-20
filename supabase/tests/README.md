# Real local Auth/PostgREST regression

Prerequisites: Linux with a local Docker daemon accessible through
`/var/run/docker.sock`, Node compatible with `package.json`, Python 3.12, `npm ci`,
and `python -m pip install -r supabase/tests/requirements.txt` in a virtualenv.

```sh
python supabase/tests/run_local_stack.py
```

The runner starts dedicated PostgreSQL 16, Supabase GoTrue 2.197.0 and PostgREST
14.18 containers on its own network, with dynamically selected loopback ports.
Credentials are generated for that run, stored in private temporary env files,
and removed with the owned containers/network afterward. It never reuses or
resets an application database. Docker's existing proxy configuration is retained.

GoTrue runs its real auth migrations. The runner installs Supabase-compatible
`auth.uid()`/`auth.role()` helpers for PostgREST's JSON JWT claims, then applies
the application's schema, ordered migrations and seed. A small local HTTP router
connects the Supabase JS client's usual `/auth/v1` and `/rest/v1` paths to the
actual services; it does not mock their responses.

The 10 nested HTTP scenarios (11 Node test records including the parent test)
cover signup-trigger profile/progress initialization, login/bad password/token
refresh, anonymous denial, read-only learning content, private owner CRUD,
forged ownership, append-only quiz results, signature tampering and logout.
The runner also executes all 25 existing SQL/RLS regressions in a second UUID
database and deletes only that database. Its exit code propagates either failure.

This verifies an isolated self-hosted test stack. Email autoconfirm is enabled
explicitly for fixtures; SMTP delivery, confirmation links, hosted project
configuration, production TLS and native device behavior are not validated here.
The cloud evidence is under `project-engineering/stage3/logs/`. The corresponding
GitHub Actions job is prepared; no remote Actions run is claimed.
