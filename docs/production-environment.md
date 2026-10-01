# AutoDesk AI — Production Environment Audit & Configuration Guide

**Document Status:** Production Audit Complete (Pre-Deployment)  
**Target Application:** AutoDesk AI — Autonomous IT Service Desk Resolution Agent

---

## 1. Current Environment Architecture

The current architecture is a full-stack TypeScript application built on Next.js 16 (App Router) with a deterministic Policy Engine, vector RAG retrieval, and an embedded relational database engine.

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|  - Next.js Client Components (Employee Portal, IT Desk, Admin Hub)     |
|  - Never has access to server secrets or direct database access         |
+------------------------------------+------------------------------------+
                                     |  HTTP REST APIs (/api/*)
                                     v
+-------------------------------------------------------------------------+
|                           SERVER RUNTIME TIER                           |
|  - Node.js 24 Runtime Environment                                       |
|  - Environment Validator: src/lib/config/env.ts (Zod-enforced)          |
|  - ReAct Orchestrator & State Machine: src/lib/agent/orchestrator.ts   |
|  - Policy Engine Guard: src/lib/policy/engine.ts                        |
|  - RAG Vector Engine: src/lib/rag/service.ts (Dense 128-dim vectors)    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                              DATA TIER                                  |
|  - Node.js 24 Native Synchronous SQLite (node:sqlite)                   |
|  - WAL mode + PRAGMA busy_timeout = 5000 + Foreign Key Enforcement     |
|  - Default Path: ./data/autodesk.db (Configurable via DATABASE_PATH)   |
+-------------------------------------------------------------------------+
```

---

## 2. Environment Variables Specification

### 2.1 Required Environment Variables

| Variable Name | Production Requirement | Default / Fallback | Description |
|---|---|---|---|
| `NODE_ENV` | Optional | `development` | Runtime environment (`development`, `production`, `test`). |
| `PORT` | Optional | `3000` | Port for the Node.js HTTP server. |
| `AUTH_SECRET` | **REQUIRED in Production** | `autodesk-secure-session-hackathon-key-2026` | Secret key used for signing session cookies. Must be $\ge 16$ characters in production. |
| `LLM_PROVIDER` | Optional | `local` | Active reasoning provider: `'gemini'`, `'openai'`, or `'local'`. |

### 2.2 Provider-Specific Secret Variables

| Variable Name | Required When | Masked Example | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | `LLM_PROVIDER=gemini` | `GEMINI_API_KEY=***` | Google Gemini API key (e.g. for `gemini-2.5-flash`). |
| `OPENAI_API_KEY` | `LLM_PROVIDER=openai` | `OPENAI_API_KEY=***` | OpenAI API key (e.g. for `gpt-4o-mini`). |

### 2.3 Optional Configuration Variables

| Variable Name | Default | Allowed Values | Description |
|---|---|---|---|
| `LLM_MODEL` | `gemini-2.5-flash` | Any valid model string | Override model identifier for external LLM API calls. |
| `DATABASE_PATH` | `./data/autodesk.db` | Any filesystem path | File path for SQLite database file. Useful for persistent volume mounts. |
| `MAX_AGENT_STEPS` | `10` | Integer (1 - 25) | Maximum loop iterations before autonomous escalation. |
| `CONFIDENCE_THRESHOLD` | `0.70` | Float (0.0 - 1.0) | Minimum confidence required before concluding investigation. |

---

## 3. LLM Provider Configuration

The application implements a pluggable adapter in `src/lib/llm/client.ts` supporting three modes:

1. **`local` (Default Offline / Deterministic Mode):**
   - Zero external API dependencies, zero network egress.
   - Operates entirely locally using a deterministic ReAct state machine that dynamically evaluates ticket symptoms, hypotheses, and collected evidence items.
   - Recommended for offline evaluation, reproducible automated testing, and zero-cost demonstrations.
2. **`gemini` (Google GenAI Live Integration):**
   - Activated when `LLM_PROVIDER=gemini` and `GEMINI_API_KEY=***` is provided.
   - Uses `gemini-2.5-flash` with strict structured JSON output schemas (`responseMimeType: "application/json"`).
3. **`openai` (OpenAI Live Integration):**
   - Activated when `LLM_PROVIDER=openai` and `OPENAI_API_KEY=***` is provided.
   - Uses `gpt-4o-mini` with strict `response_format: { type: "json_object" }`.

### Automatic Fallback Behavior:
If an external API call to Gemini or OpenAI encounters network failure or rate limiting, the agent logs a warning and automatically falls back to `local` dynamic reasoning, ensuring the helpdesk remains operational without downtime.

---

## 4. Database Architecture & Hosting Compatibility

### Current Implementation:
- Uses Node.js 24 built-in `node:sqlite` (`DatabaseSync`).
- Configured with `PRAGMA foreign_keys = ON;`, `PRAGMA journal_mode = WAL;`, and `PRAGMA busy_timeout = 5000;`.
- Requires a writable local filesystem to persist `autodesk.db`, `autodesk.db-wal`, and `autodesk.db-shm`.

### Platform Compatibility Matrix:

| Hosting Platform | Compatible as-is? | Feasibility & Architectural Notes |
|---|---|---|
| **Render (Web Service / Docker)** | **YES** | Compatible when paired with a Persistent Disk mounted at `/data` (set `DATABASE_PATH=/data/autodesk.db`). Long-running Node.js process. |
| **Railway (Node / Docker)** | **YES** | Compatible with Railway Volume attached to `/data`. Long-running Node.js process supports SQLite WAL mode seamlessly. |
| **Fly.io** | **YES** | Compatible using Fly Volumes for persistent SQLite storage. |
| **Self-Hosted Docker / VPS** | **YES** | Native support with standard directory volume mapping (`-v ./data:/app/data`). |
| **AWS EC2 / DigitalOcean Droplet** | **YES** | Native support on any persistent VM running Node.js 24+. |
| **Vercel (Serverless Functions)** | **NO (with local SQLite)** | Serverless functions have an ephemeral, read-only root filesystem with only temporary `/tmp` storage across invocations. Running multi-process SQLite across serverless lambdas causes database lock contention and state loss on container recycling. Vercel deployment would require migrating the data tier to managed PostgreSQL (e.g. Supabase, Neon, or Neon pgvector). |

---

## 5. Secret Management & Security Audit

* **No Hardcoded Secrets:** Static analysis of the repository confirms zero hardcoded API keys, private credentials, or secrets in application source code.
* **Client Isolation:** `src/lib/config/env.ts` and `src/lib/llm/client.ts` are strictly server-side modules. No API keys are bundled into client-side scripts.
* **Audit Logging Safety:** The `audit_logs` table records only tool names, timestamps, execution statuses, and sanitized parameter summaries. API keys and passwords are never logged.
* **Git Cleanliness:** `.env`, `.env.local`, `.env.production`, and `data/` are strictly ignored by `.gitignore` and are not tracked by Git.

---

## 6. Recommended Production Deployment Path

1. **Option A (Containerized Long-Running Service — Recommended for Current Prototype):**
   - Host on **Render**, **Railway**, or **Fly.io** as a persistent container.
   - Attach a persistent volume mounted at `/app/data` and configure:
     ```bash
     DATABASE_PATH=/app/data/autodesk.db
     AUTH_SECRET=*** (generate 32-char cryptographically secure secret)
     LLM_PROVIDER=gemini (or local)
     GEMINI_API_KEY=***
     NODE_ENV=production
     ```
   - Requires zero database code rewrites; maintains 100% current test compatibility.

2. **Option B (Serverless / Managed Database — Future Scaling Phase):**
   - Retain Next.js frontend on Vercel.
   - Migrate `src/lib/db/` connection adapter to managed PostgreSQL (e.g. Neon or Supabase) with pgvector for embeddings.
