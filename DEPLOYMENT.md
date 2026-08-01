# Deploying Fast-q for free

Stack: **Vercel** (frontend) + **Render** (PHP API + Node realtime, free web services)
+ **Aiven** (free MySQL). No credit card required anywhere.

Known trade-offs of the free tiers:
- Render free web services sleep after 15 min of no traffic. The first request
  after that takes ~30-60s to wake up (cold start). Fine for a demo/portfolio,
  not for something you need instantly responsive 24/7.
- Aiven's free MySQL may get powered off after a long stretch of no activity —
  you get a notice first, and can power it back on from the dashboard in
  seconds. Nothing is deleted.
- These are third-party free-tier policies and can change; re-check each
  provider's current terms if something here seems off.

---

## 0. Apply this patch and push

The files in this kit already fix two real bugs and add deploy config:
- `api/src/Helpers/JWT.php` + `realtime/middleware/auth.js` — no longer fall
  back to a hardcoded signing secret; they now refuse to start without a real
  `JWT_SECRET`.
- `api/src/Middleware/CorsMiddleware.php` + `realtime/server.js` — CORS is now
  locked to `FRONTEND_URL` instead of reflecting any origin.
- `frontend/src/api/client.ts` — API base URL is now configurable via
  `VITE_API_URL` (was hardcoded to a path that only worked behind Vite's dev
  proxy).
- `api/src/Config/Database.php` + `realtime/config/db.js` — optional TLS
  support for managed MySQL via `DB_SSL_CA`.
- New: `.gitignore`, `LICENSE` (MIT — swap it if you want a different one),
  `api/Dockerfile`, `api/.dockerignore`, `render.yaml`.

Copy these files over your local copy of the repo, then:

```bash
# stop tracking things that were committed by mistake (kept on disk, just untracked)
git rm -r --cached api/vendor realtime/node_modules "phpMyAdmin-5.2.3-all-languages" 2>/dev/null

git add -A
git commit -m "Prep for deployment: fix JWT/CORS, add deploy config, stop tracking vendor dirs"
git push
```

Your repo drops from ~90MB to a few MB after this.

---

## 1. Database — Aiven for MySQL (free)

1. Sign up at aiven.io (no card needed), create a **MySQL** service on the
   **Free** plan.
2. On the service's **Overview** page, note: Host, Port, User, Password,
   Default database name.
3. Download the CA certificate from the **Overview** page (usually a "CA
   Certificate" download link).
4. Load your schema:
   ```bash
   mysql --host=<HOST> --port=<PORT> --user=<USER> -p \
     --ssl-ca=/path/to/ca.pem <DEFAULT_DB_NAME> < database/schema.sql
   # optional demo data:
   mysql --host=<HOST> --port=<PORT> --user=<USER> -p \
     --ssl-ca=/path/to/ca.pem <DEFAULT_DB_NAME> < database/seed.sql
   ```
   (Your local `mysql` client needs to exist for this — or run it from
   Aiven's web console / any GUI that supports an SSL CA file, like
   TablePlus or DBeaver.)

Keep the Host/Port/User/Password/DB name and the ca.pem handy — you'll need
them in step 2.

---

## 2. Backend — Render (PHP API + Node realtime)

1. Sign up at render.com (no card needed for the free path) and connect your
   GitHub account.
2. Generate one strong random secret to use as `JWT_SECRET` — e.g. run
   `openssl rand -base64 48` locally. **Use the exact same value on both
   services below.**
3. In Render, click **New → Blueprint**, pick this repo. It reads
   `render.yaml` and proposes two services: `fastq-api` and `fastq-realtime`.
4. For each service, fill in the env vars marked "set manually":
   - `JWT_SECRET` — the value from step 2 (same on both)
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` — from Aiven
   - `FRONTEND_URL` — leave a placeholder like `http://localhost:8080` for
     now, you'll update it in step 4 once you have the Vercel URL
5. For `DB_SSL_CA`: use Render's **Secret Files** feature on each service
   (Environment tab → Secret Files) to upload your Aiven `ca.pem` at, say,
   `/etc/secrets/ca.pem`, then set `DB_SSL_CA=/etc/secrets/ca.pem` as a
   regular env var on both services.
6. Deploy. Once both are live, note their URLs — with the names above they'll
   be something like:
   - `https://fastq-api.onrender.com`
   - `https://fastq-realtime.onrender.com`
   (Render appends a random suffix if those names are taken — check the
   actual URLs in your dashboard.)
7. Sanity check: `https://fastq-realtime.onrender.com/health` should return
   `{"status":"ok","service":"quizcraft-realtime"}`.

---

## 3. Frontend — Vercel

1. Sign up at vercel.com, **Add New → Project**, import this repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite (should auto-detect).
4. Add environment variables:
   - `VITE_API_URL` = your Render API URL from step 2 (no trailing slash),
     e.g. `https://fastq-api.onrender.com`
   - `VITE_REALTIME_URL` = your Render realtime URL from step 2, e.g.
     `https://fastq-realtime.onrender.com`
5. Deploy. Note the resulting URL, e.g. `https://fastq.vercel.app`.

---

## 4. Close the loop on CORS

Go back to both Render services (Environment tab) and set:
```
FRONTEND_URL=https://fastq.vercel.app
```
(If you also want to keep testing locally against the deployed backend, you
can set this to a comma-separated list, e.g.
`https://fastq.vercel.app,http://localhost:8080` — the CORS code in this kit
supports that.)

Redeploy both services so the new value takes effect.

---

## 5. Test

- Visit the Vercel URL, register an account, create a quiz.
- Open it in a second browser/incognito window and take it live — leaderboard
  and notifications should update in real time.
- If the first request feels slow, that's a Render service waking from sleep
  — normal on the free tier.

---

## If something doesn't connect

- Blank/failed API calls → check `VITE_API_URL` on Vercel and `FRONTEND_URL`
  on Render match exactly (protocol + no trailing slash).
- Socket.io not connecting → check `VITE_REALTIME_URL`, and that the realtime
  service's `/health` endpoint responds.
- "Database connection failed" → double check `DB_SSL_CA` path and that the
  Aiven service is powered on.
- 500 error mentioning JWT_SECRET → you forgot to set it (or it's not
  identical) on one of the two Render services.
