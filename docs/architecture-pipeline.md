# AutoDesk AI — Architecture Pipeline & Subsystem Stack

This document details the unified 8-layer architecture pipeline of **AutoDesk AI (AI IT Service Desk Autonomous Resolution Agent)**, mapping every subsystem from the foundation model down to production runtime configuration.

```
       +-------------------------------------------------------+
  1    |                     Gemini LLM                        |
       |  Live Gemini API (gemini-3.5-flash-lite) + Fallback   |
       +---------------------------+---------------------------+
                                   | Structured JSON Decision
                                   v
       +-------------------------------------------------------+
  2    |                   Authentication                      |
       |  HMAC-SHA256 Web Crypto Signed Session Tokens         |
       +---------------------------+---------------------------+
                                   | Verified Session User
                                   v
       +-------------------------------------------------------+
  3    |                        RBAC                           |
       |  Server Guards, Edge Middleware, Resource Ownership   |
       +---------------------------+---------------------------+
                                   | Authorized Execution Context
                                   v
       +-------------------------------------------------------+
  4    |                   Agent Loop                          |
       |  Dynamic ReAct Loop, Multi-Step Evidence Synthesis    |
       +---------------------------+---------------------------+
                                   | Tool Action Proposal
                                   v
       +-------------------------------------------------------+
  5    |                   Policy Engine                       |
       |  Risk Classification, Human Approval Interception     |
       +---------------------------+---------------------------+
                                   | Verified & Approved Execution
                                   v
       +-------------------------------------------------------+
  6    |                      SQLite                           |
       |  Node 24 Native Engine, WAL Mode, Native Vector RAG   |
       +---------------------------+---------------------------+
                                   | Persisted State & Trajectories
                                   v
       +-------------------------------------------------------+
  7    |                     Frontend                          |
       |  Cyberpunk/Glitch HUD, Agent Graph, Terminal Logs     |
       +---------------------------+---------------------------+
                                   | User Interaction & Telemetry
                                   v
       +-------------------------------------------------------+
  8    |             Production Configuration                  |
       |  Strict Zod Env Validation, Zero Secret Exposure      |
       +-------------------------------------------------------+
```

---

## Layer 1: Gemini (Model & Reasoning Core)

* **Location:** [`src/lib/llm/client.ts`](file:///d:/my_AI/src/lib/llm/client.ts)
* **Model Configuration:** Configured through `LLM_MODEL` with high-availability default `gemini-3.5-flash-lite` (or `gemini-3.8-flash`).
* **Security & Auth:** Employs standard HTTP header authentication (`x-goog-api-key`) rather than query parameters, preventing credential leakage in logs or URLs.
* **Structured Decision Contract:** The LLM produces a strictly validated JSON contract (`AgentDecision`) containing:
  - `thought`: Natural language situational analysis and reasoning chain.
  - `action`: Proposed tool call (`toolName`, `params`) or `null` if completed.
  - `confidence`: Confidence score (0.0 to 1.0).
  - `evidenceSynthesis`: Synthesis of past observations.
  - `nextHypothesis`: Updated diagnostic hypothesis.
  - `isComplete`: Boolean termination flag.
* **Deterministic Fallback:** Zero-dependency local reasoning engine activates automatically if offline or during upstream API outages, guaranteeing continuous hackathon execution.

---

## Layer 2: Authentication (Cryptographic Session Layer)

* **Location:** [`src/lib/auth/session.ts`](file:///d:/my_AI/src/lib/auth/session.ts)
* **Cryptographic Tokens:** Implements HMAC-SHA256 session tokens generated using the standard Web Crypto API (`crypto.subtle`):
  $$\text{Token} = \text{userId} \parallel \text{"."} \parallel \text{role} \parallel \text{"."} \parallel \text{timestamp} \parallel \text{"."} \parallel \text{HMAC}(\text{data}, \text{AUTH\_SECRET})$$
* **Cookie Enforcement:** Stored in `autodesk_session_token` with strict security attributes:
  - `HttpOnly: true` (prevents JavaScript/XSS extraction)
  - `SameSite: "lax"` (mitigates CSRF)
  - `Secure: process.env.NODE_ENV === "production"`
  - `maxAge: 7 days`
* **Anti-Tampering:** Any client-side manipulation of the payload or role invalidates the cryptographic signature and is rejected server-side.

---

## Layer 3: RBAC (Role-Based & Resource-Level Authorization)

* **Location:** [`src/lib/auth/rbac.ts`](file:///d:/my_AI/src/lib/auth/rbac.ts), [`src/lib/auth/server.ts`](file:///d:/my_AI/src/lib/auth/server.ts), [`src/middleware.ts`](file:///d:/my_AI/src/middleware.ts)
* **Clearance Hierarchy:**
  1. `EMPLOYEE` (Rank 1): Allowed self-service portal, own ticket history, personal device diagnostics. Denied: `/it-desk`, `/admin`, operational ticket modification.
  2. `IT_AGENT` (Rank 2): Allowed IT workbench, operational ticket resolution, Medium-risk action approvals. Denied: `/admin`, High-risk action approvals.
  3. `IT_ADMIN` (Rank 3): Unrestricted access to all hubs, High-risk action approvals, and immutable audit logs.
* **Enforcement Points:**
  - **Edge Middleware:** Intercepts unauthenticated users to `/login?next=...` and unauthorized roles to `/access-denied`.
  - **Server Guards:** Functions `requireAuth()`, `requireRole()`, and `requireAnyRole()` secure all backend API routes.
  - **Resource Authorization:** `checkTicketAccess()` guarantees non-administrative users can only access or post messages to tickets they created.

---

## Layer 4: Agent (Dynamic Orchestration Loop)

* **Location:** [`src/lib/agent/orchestrator.ts`](file:///d:/my_AI/src/lib/agent/orchestrator.ts)
* **Dynamic ReAct Cycle:** Operates on an evidence-driven reasoning loop without hardcoded decision scripts:
  $$\text{Observe Context} \longrightarrow \text{Synthesize Evidence} \longrightarrow \text{Select Tool} \longrightarrow \text{Execute / Intercept} \longrightarrow \text{Verify}$$
* **Investigation Bounds:** Hard cap at 10 autonomous reasoning steps preventing infinite loops.
* **Evidence Synthesis:** Gathers observations from vector RAG, Active Directory account lookups, real-time service health, and device diagnostics.
* **Verification Gate:** Requires explicit post-action state verification before concluding any ticket as resolved.

---

## Layer 5: Policy Engine (Deterministic Safety Interceptor)

* **Location:** [`src/lib/policy/engine.ts`](file:///d:/my_AI/src/lib/policy/engine.ts)
* **Safety Mandate:** Positioned between the Agent and the Tool Registry; tool execution cannot occur without passing the Policy Engine.
* **Risk Classification:**
  - `LOW` (Read-only diagnostics, status checks): Autonomous execution permitted.
  - `MEDIUM` (Account unlocks, cache flushes): Requires human approval (`IT_AGENT` or `IT_ADMIN`).
  - `HIGH` (Service restarts, credential resets): Requires explicit `IT_ADMIN` authorization.
  - `CRITICAL` (Destructive operations): Blocked unconditionally in production policy.
* **Human-in-the-Loop Intercept:** Suspends the agent loop, records an approval record in the database, notifies the user, and waits for a signed resume request.

---

## Layer 6: SQLite (Embedded High-Performance Persistence)

* **Location:** [`src/lib/db/index.ts`](file:///d:/my_AI/src/lib/db/index.ts), [`src/lib/db/queries.ts`](file:///d:/my_AI/src/lib/db/queries.ts)
* **Zero Daemon Architecture:** Uses Node.js 24 native synchronous SQLite (`node:sqlite`), eliminating external database setup.
* **Reliability Features:**
  - WAL Mode (`journal_mode = WAL`) for concurrent read performance.
  - Foreign key constraint enforcement (`foreign_keys = ON`).
  - 5000ms busy timeout preventing lock contention.
* **Native Cosine Vector Search:** Knowledge base chunks are indexed with 384-dimensional normalized vector embeddings and searched via in-memory cosine similarity boosting for fast semantic RAG.

---

## Layer 7: Frontend (Cyberpunk / Glitch Operations HUD)

* **Location:** [`src/app/`](file:///d:/my_AI/src/app), [`src/components/`](file:///d:/my_AI/src/components)
* **Design Philosophy:** Cyberpunk / Glitch high-tech operations interface:
  - Dark matrix palette (`#0a0a0f`, `#12121a`), CRT scanlines overlay, and 50px matrix grid.
  - Chamfered panels (`clip-path`) with multi-color neon glow hierarchy (Green `#00ff88`, Cyan `#00d4ff`, Magenta `#ff00ff`, Red `#ff3366`).
  - Futuristic typography: `Orbitron`, `Share Tech Mono`, `JetBrains Mono`.
* **Interactive Views:**
  - **Incident Trajectory Graph:** Live visualization of agent thoughts, tool execution steps, and verification results.
  - **Human Authorization Intercept:** Prominent terminal banner enabling one-click approval/rejection of gated actions.
  - **Dynamic Navbar:** Navigation links dynamically adapt to the authenticated role clearance.

---

## Layer 8: Production Configuration (Security & Runtime)

* **Location:** [`src/lib/config/env.ts`](file:///d:/my_AI/src/lib/config/env.ts), [`.env.example`](file:///d:/my_AI/.env.example)
* **Zod Environment Schema:** Validates runtime configuration at startup:
  - `AUTH_SECRET`: Required minimum 32 characters in production.
  - `LLM_PROVIDER`: Enum `'local' | 'gemini' | 'openai'`.
  - `GEMINI_API_KEY`: Strictly server-side; excluded from `NEXT_PUBLIC_` prefixes.
* **Zero Secrets in Client:** Sensitive tokens, keys, and internal hashes are never bundled into client-side JavaScript.
* **Continuous Test Validation:** 27 unit and integration tests across 7 test suites validating every layer in this stack.
