# BRAIN.MD — AI IT Service Desk Autonomous Resolution Agent
**Persistent Architectural & Engineering Memory**

---

## 1. Project Identity
* **Project Name:** AI IT Service Desk Autonomous Resolution Agent (AutoDesk AI)
* **Hackathon:** Production-Quality Autonomous Agent Hackathon
* **Problem Statement:** Traditional IT service desks either rely on rigid if-else rule bots or slow human triage, leading to high MTTR (Mean Time to Resolution), repetitive manual work for IT admins, and delayed employee productivity.
* **Purpose:** Deliver a truly autonomous, evidence-driven AI IT Service Desk agent that dynamically investigates IT issues (querying knowledge bases, system health checks, user account states, device diagnostics), reasons over gathered evidence, safely requests human approval for sensitive changes, executes permitted remediations, verifies resolution, and escalates intelligently when blocked.

---

## 2. Problem Statement & Operational Context
Modern enterprise IT environments handle thousands of tickets daily ranging from simple password resets and account locks to complex VPN tunnel drops and microservice outages. Existing solutions suffer from two extremes:
1. **Dumb Chatbots / Static Decision Trees:** Rely on keyword matching ("vpn" -> "restart vpn") and cannot evaluate multi-source evidence (e.g., checking if the VPN gateway is down vs. user MFA token out of sync).
2. **Unrestricted / Hallucinating LLM Agents:** Dangerous when given raw infrastructure or shell access without policy guardrails, permission boundaries, or human-in-the-loop approvals.

**AutoDesk AI** solves this with a **ReAct-style Evidence-Driven Orchestrating Agent** backed by a **Deterministic Policy & Permission Engine**.

---

## 3. Objective
* Reduce L1/L2 IT helpdesk load by autonomously diagnosing and remediating >60% of common IT incidents.
* Ensure 100% policy enforcement: no privileged or state-altering command executes without role check and explicit human approval where required.
* Provide complete auditability and observability: every tool invocation, evidence piece, reasoning step (user-safe), and verification result is logged immutably.
* Demonstrate genuine dynamic tool selection: different employee problems trigger distinct, adaptive diagnostic and remediation trajectories based on evolving evidence.

---

## 4. Target Users & Roles
1. **EMPLOYEE:**
   * Enterprise end-user experiencing IT issues.
   * Can create tickets, view investigation progress (simplified timeline), provide additional requested info, approve actions affecting their own account/device when delegated, and confirm resolution.
2. **IT_AGENT (Support Engineer / Helpdesk Specialist):**
   * Manages incoming queue, reviews AI evidence and diagnosis.
   * Reviews and grants approvals for MEDIUM/HIGH risk remediation actions (e.g., account unlock, service restart, cache clearing).
   * Overrides agent decisions, runs manual diagnostics, or escalates to Tier-3 engineering.
3. **IT_ADMIN (IT Operations & Security Admin):**
   * Configures tool registry, sets risk policies, manages knowledge base documents, inspects immutable audit logs, manages system statuses, and reviews system analytics/agent performance.

---

## 5. Agent Goal
> *"Resolve an employee's IT issue safely and efficiently using available evidence and authorized tools, while requesting approval for sensitive actions and escalating when confidence, evidence, permissions, or available tools are insufficient."*

### Agent Optimization Priorities:
1. **Safety & Zero Privilege Escalation:** The LLM never has raw access to infrastructure; tools are executed strictly through the Policy Engine.
2. **Evidence-Based Dynamic Selection:** Each tool selection must be justified by prior evidence, not a static hardcoded script.
3. **Verification Before Closure:** No ticket is marked resolved until automated verification confirms the fix worked.
4. **Graceful Escalation:** Immediate, structured escalation when steps exceed limit (`MAX_AGENT_STEPS = 10`), confidence drops below threshold (`< 0.70`), or necessary tools/permissions are unavailable.

---

## 6. User Inputs
* **Ticket Submission:** Title, description, category (optional/hint), severity (low/medium/high/critical), affected device ID, error message/code, optional simulated screenshot/log snippet.
* **Interactive Investigation Messages:** Employee responses to clarifying questions asked by the agent.
* **Human Approval Responses:** Approval or Rejection of sensitive actions by the employee or IT Agent with optional comments.
* **Resolution Feedback:** Employee confirmation that the issue has indeed been resolved.

---

## 7. AI Model & LLM Responsibilities
* **LLM Engine:** Gemini 2.5/Flash / OpenAI GPT-4o / Compatible OpenAI-compatible endpoint with function calling / structured JSON output capability. Includes a zero-external-dependency local deterministic reasoning engine for offline/fallback mode.
* **LLM Core Responsibilities:**
  * Understand natural language employee problem descriptions and extract structured intents/symptoms.
  * Dynamically evaluate the current state, memory, and collected evidence to select the optimal next tool.
  * Formulate validated tool parameters based on schemas.
  * Synthesize diagnostic findings from raw tool outputs.
  * Formulate human-understandable evidence summaries (without exposing internal chain-of-thought or raw system prompts).
  * Determine when an issue is resolved, needs human approval, requires more user input, or must be escalated.
* **Safety Rules for Model Output:**
  * Model outputs MUST conform to strict Zod JSON schemas.
  * Chain-of-thought is hidden; only user-facing actions, summaries, diagnoses, and evidence explanations are surfaced.

---

## 8. Agent Architecture
We use a **Single Orchestrating Agent with Modular Capability Tools and a Policy Interceptor Engine**:
```
                       +-----------------------------------+
                       |           User / Ticket           |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |      Agent Orchestrator Loop      |
                       |  - Conversation & Ticket Memory   |
                       |  - Dynamic ReAct Next-Action      |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |       LLM Reasoning Engine        |
                       |   (Tool Selection & Arg Synth)    |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |      Policy & Security Guard      |
                       |  - RBAC Permission Check          |
                       |  - Risk Assessment (LOW/MED/HIGH) |
                       |  - Input Schema Validation        |
                       +--------+------------------+-------+
                                |                  |
                     Approval Needed          Approved / Low Risk
                                |                  |
                                v                  v
                     +-------------------+  +-------------------+
                     | Human Approval    |  |   Tool Executor   |
                     | Workflow Pending  |  +---------+---------+
                     +-------------------+            |
                                                      v
                                            +-------------------+
                                            | Enterprise Tools  |
                                            | - KB / RAG        |
                                            | - User / Account  |
                                            | - System Status   |
                                            | - Device / Network|
                                            | - Remediations    |
                                            +---------+---------+
                                                      |
                                                      v
                                            +-------------------+
                                            |  Evidence Capture |
                                            |  & Audit Logger   |
                                            +-------------------+
```

---

## 9. Tool Registry
All tools implement a standard interface:
```typescript
interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  requiredRole: 'EMPLOYEE' | 'IT_AGENT' | 'IT_ADMIN';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval: boolean;
  enabled: boolean;
  execute: (input: TInput, context: ExecutionContext) => Promise<TOutput>;
}
```

### Registered Tools
| Tool Name | Risk Level | Requires Approval | Permitted Roles | Purpose |
|---|---|---|---|---|
| `search_knowledge_base` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Semantic search over vetted IT runbooks and SOPs. |
| `search_previous_tickets`| LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Find similar past resolved incidents & patterns. |
| `check_system_status` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Health check on enterprise services (VPN, HR Portal, SSO, Mail). |
| `check_user_account` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Check account lock status, MFA sync, password expiration, roles. |
| `check_device_status` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Check device enrollment, OS version, compliance, disk space. |
| `check_network_status` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Check VPN gateways, DNS resolution, latency, captive portal status. |
| `run_diagnostics` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Run automated non-invasive diagnostics (e.g. auth handshake ping). |
| `clear_application_cache`| MEDIUM | Yes (Policy) | EMPLOYEE, IT_AGENT, IT_ADMIN | Clear local or server-side app profile session cache. |
| `unlock_account` | MEDIUM | Yes (IT/User) | IT_AGENT, IT_ADMIN | Clear lockout flag on verified user account. |
| `reset_password` | MEDIUM | Yes (IT/MFA) | IT_AGENT, IT_ADMIN | Issue secure temporary password link to verified phone/email. |
| `restart_service` | HIGH | Yes (IT Admin) | IT_ADMIN | Restart a localized container/service instance for the user. |
| `create_ticket` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | System management of ticket lifecycle. |
| `update_ticket` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Record evidence, status change, or comment. |
| `close_ticket` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Finalize resolution with verification evidence. |
| `escalate_ticket` | LOW | No | EMPLOYEE, IT_AGENT, IT_ADMIN | Hand off ticket to human IT queue with comprehensive dossier. |

---

## 10. API Registry
All endpoints are RESTful JSON with strict input validation via Zod schemas.

### Tickets API
* `POST /api/tickets` — Create a new support ticket.
* `GET /api/tickets` — List tickets (filtered by user role and status).
* `GET /api/tickets/:id` — Get ticket details, messages, timeline, evidence, and approvals.
* `POST /api/tickets/:id/escalate` — Manually or automatically escalate a ticket to Tier-2/Tier-3 IT.
* `POST /api/tickets/:id/resolve` — Mark ticket resolved with verification proof.

### Agent Investigation API
* `POST /api/agent/investigate` — Trigger/continue the autonomous agent loop for a ticket.
* `POST /api/agent/continue` — Resume agent loop after human approval/rejection or user reply.
* `GET /api/agent/runs/:ticketId` — Get all agent runs, tool invocations, and evidence items for audit.

### Approvals API
* `GET /api/approvals/pending` — List pending approvals for current user role.
* `POST /api/actions/:actionId/approve` — Authorize a pending tool execution.
* `POST /api/actions/:actionId/reject` — Reject a pending action with a mandatory reason.

### Knowledge Base & System Status API
* `GET /api/knowledge/search?q=...` — Hybrid semantic & lexical search over IT knowledge docs.
* `GET /api/knowledge/documents` — List knowledge articles (IT Admin).
* `POST /api/knowledge/documents` — Ingest new knowledge document (chunk + embed).
* `GET /api/system-status` — Get operational status of all enterprise services.
* `GET /api/system-status/:service` — Detailed health metrics for a specific service.
* `GET /api/users/:id/account` — Direct account inspection endpoint.
* `GET /api/devices/:id/status` — Device health inspection endpoint.

---

## 11. RAG Architecture
* **Ingestion:** Markdown and plaintext documents in `data/knowledge/` representing real enterprise IT runbooks (VPN, HR Portal, Password Policy, SSO, Wi-Fi, Outlook/Exchange).
* **Chunking:** Semantic paragraph chunking with headers preserved, chunk size ~400-600 tokens with 80-token overlap.
* **Embedding Model:** Local vector embedding generator (384-dimensional cosine embeddings via fast deterministic local embedding model) with optional API vector embedding when external provider configured.
* **Vector Store & Indexing:** Relational chunk table with embedding vectors stored. Exact cosine similarity search with score thresholding (`threshold >= 0.65`). Lexical BM25/keyword boost added for code errors (e.g. `ERR_AUTH_042`).
* **Prompt Injection Defense:** All retrieved knowledge chunks are wrapped in untrusted data delimiters (`<knowledge_context>` ... `</knowledge_context>`) with explicit system instructions prohibiting instruction overrides.

---

## 12. ML Model
* **Why no specialized custom ML model is required:** A fine-tuned domain LLM or custom classification ML model is not required because:
  1. Standard pre-trained LLMs with structured schemas excel at intent triage and tool parameter extraction.
  2. Embeddings handle semantic retrieval efficiently without custom training.
  3. Hardcoded or fine-tuned ML classifiers are brittle and counter to hackathon goals of dynamic, explainable reasoning.

---

## 13. Database Schema
A unified relational database (SQLite for local zero-config execution; fully compatible with PostgreSQL):

```sql
-- Users & Roles
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('EMPLOYEE', 'IT_AGENT', 'IT_ADMIN')),
  department TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Employee Profiles & Hardware
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  title TEXT NOT NULL,
  manager_email TEXT,
  account_status TEXT NOT NULL CHECK(account_status IN ('ACTIVE', 'LOCKED', 'SUSPENDED', 'PASSWORD_EXPIRED')),
  mfa_enabled BOOLEAN DEFAULT 1,
  mfa_synced BOOLEAN DEFAULT 1,
  failed_login_count INTEGER DEFAULT 0,
  last_password_change DATETIME
);

CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  device_name TEXT NOT NULL,
  os TEXT NOT NULL,
  os_version TEXT NOT NULL,
  compliance_status TEXT NOT NULL CHECK(compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'PENDING')),
  disk_free_gb REAL,
  ip_address TEXT,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- IT Services & Status
CREATE TABLE system_status (
  id TEXT PRIMARY KEY,
  service_name TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('OPERATIONAL', 'DEGRADED', 'OUTAGE', 'MAINTENANCE')),
  latency_ms INTEGER,
  incident_notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tickets & Lifecycle
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  creator_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL CHECK(status IN ('OPEN', 'INVESTIGATING', 'AWAITING_APPROVAL', 'AWAITING_USER', 'RESOLVED', 'ESCALATED', 'CLOSED')),
  assigned_to TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id),
  sender_type TEXT NOT NULL CHECK(sender_type IN ('USER', 'AGENT', 'SYSTEM')),
  sender_id TEXT,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent Execution & Audit
CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id),
  status TEXT NOT NULL CHECK(status IN ('RUNNING', 'WAITING_APPROVAL', 'WAITING_INPUT', 'COMPLETED', 'ESCALATED', 'FAILED')),
  step_count INTEGER DEFAULT 0,
  max_steps INTEGER DEFAULT 10,
  confidence REAL,
  current_diagnosis TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_actions (
  id TEXT PRIMARY KEY,
  agent_run_id TEXT REFERENCES agent_runs(id),
  step_number INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  tool_name TEXT,
  tool_input TEXT,
  reasoning_summary TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tool_calls (
  id TEXT PRIMARY KEY,
  agent_action_id TEXT REFERENCES agent_actions(id),
  tool_name TEXT NOT NULL,
  input_params TEXT NOT NULL,
  output_result TEXT,
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'DENIED')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id),
  agent_run_id TEXT REFERENCES agent_runs(id),
  action_type TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_input TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_by TEXT NOT NULL,
  reviewed_by TEXT REFERENCES users(id),
  review_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  ticket_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Base
CREATE TABLE knowledge_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES knowledge_documents(id),
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding_json TEXT NOT NULL
);
```

---

## 14. Memory Architecture
Five isolated memory layers to prevent context poisoning:
1. **Conversation Memory:** The rolling dialogue history for the active ticket.
2. **User Memory:** Stable, read-only employee metadata (hardware IDs, department, active directory profile).
3. **Ticket Memory:** Structured collection of facts and evidence discovered during the current investigation (e.g. `evidence = { vpn_service: "UP", account_locked: true, client_ip: "10.4.1.22" }`).
4. **Organizational Memory:** Read-only verified IT knowledge base chunks retrieved dynamically via RAG.
5. **Agent Activity Memory:** Log of actions taken, tools invoked, results obtained, and approvals pending/received in the current run.

---

## 15. Agent Workflow & Stop Conditions
```
User Submits Ticket
       ↓
Extract structured intent & symptoms
       ↓
Loop (Step 1 to 10):
  1. Assess Current Evidence & Open Hypotheses
  2. Select Next Tool or Resolution Decision
  3. Validate against Security & RBAC Policy
  4. If Action requires Approval -> Pause & Emit AWAITING_APPROVAL
  5. Execute Tool safely & record execution time
  6. Ingest Output into Ticket Evidence
  7. If Root Cause Identified:
       - Formulate remediation
       - If remediation needs approval -> Request Approval
       - Once approved -> Execute Remediation
       - Run automated verification tool
       - If Verified -> Mark RESOLVED -> Stop
  8. If Step Count >= 10 OR Confidence < 0.70 OR Unrecoverable Tool Failure:
       - Formulate structured handoff dossier
       - Mark ESCALATED -> Stop
```

---

## 16. Security & Policy Model
* **Principle of Least Privilege:** Tools have hardcoded roles and risk levels.
* **Deterministic Policy Engine:** Sits between the LLM and tool execution. Even if an LLM outputs `restart_service`, the Policy Engine checks `current_user.role` and `tool.requiresApproval`.
* **Prompt Injection Defense:** Strict separation of prompt instructions from untrusted data (user messages, KB articles, error codes). The agent instructions state that no content in `<ticket>` or `<evidence>` can modify system behavior or bypass approvals.
* **Input Sanitization & Output Validation:** Every tool parameter is validated using Zod prior to execution.

---

## 17. Project Structure
```
d:/my_AI/
├── brain.md                 # Persistent architectural memory
├── README.md                # Hackathon overview & quickstart
├── .env.example             # Safe environment variable template
├── package.json             # Root Next.js + TypeScript setup
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── public/                  # Static assets & icons
├── docs/
│   ├── architecture.md      # Detailed system architecture
│   ├── agent-workflow.md    # ReAct agent loop specification
│   └── security.md          # RBAC, policy engine, prompt injection guard
├── src/
│   ├── app/                 # Next.js App Router (pages & API routes)
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Enterprise Landing & Demo selector
│   │   ├── employee/        # Employee Portal (tickets, submit, view)
│   │   ├── it-desk/         # IT Agent Workbench (evidence, approvals, triage)
│   │   ├── admin/           # Admin Hub (KB, system status, audit logs)
│   │   └── api/             # RESTful API endpoints
│   ├── components/          # Polished enterprise UI components
│   │   ├── ui/              # Buttons, cards, badges, modal, timeline
│   │   ├── agent/           # Agent run timeline, evidence inspector, why-this-action modal
│   │   └── layout/          # Enterprise header, sidebar, role switcher
│   ├── lib/
│   │   ├── db/              # Database connection & schema queries
│   │   ├── llm/             # LLM provider interface (Gemini/OpenAI/Deterministic Local)
│   │   ├── rag/             # Vector math & semantic chunk search
│   │   ├── agent/           # Autonomous agent loop, state machine & planner
│   │   ├── policy/          # RBAC & approval policy interceptor
│   │   └── tools/           # Real implementations of all 14 tools
│   ├── types/               # TypeScript interfaces & Zod schemas
│   └── data/
│       ├── seed.ts          # Seed data (users, devices, services, tickets)
│       └── knowledge/       # Markdown runbooks for RAG
└── tests/                   # Automated test suites
    ├── agent.test.ts        # Dynamic tool selection tests
    ├── policy.test.ts       # RBAC & approval tests
    └── rag.test.ts          # Retrieval quality tests
```

---

## 18. Environment Variables (.env.example)
```env
# Server
PORT=3000
NODE_ENV=development

# LLM Configuration (Optional: built-in deterministic engine works zero-config)
LLM_PROVIDER=gemini # gemini | openai | local
GEMINI_API_KEY=
OPENAI_API_KEY=

# Database
DATABASE_URL=file:./data/autodesk.db

# Security & Sessions
AUTH_SECRET=hackathon-super-secret-key-change-in-prod
```

---

## 19. Development Status
* [x] **Phase 1: Requirements & Architecture** — Completed. Full `brain.md` specification created, architecture approved, database schema designed, tool registry locked.
* [x] **Phase 2: Project Scaffolding** — Completed. Next.js 16 (Turbopack, App Router), TypeScript, Tailwind CSS, Lucide icons, Zod schemas, domain types, and full directory tree initialized and verified with clean production build.
* [x] **Phase 3: Authentication & RBAC** — Completed. Role hierarchy (`EMPLOYEE`, `IT_AGENT`, `IT_ADMIN`), session management, persona switching, server-side permission assertions, and unit tests passing.
* [x] **Phase 4: Database & Seed Data** — Completed. Node.js 24 SQLite relational schema, seed data for users, locked employee accounts, devices, enterprise services, demo tickets, repository queries, and unit tests passing.
* [x] **Phase 5: Knowledge Base & RAG Engine** — Completed. Vector embeddings, cosine similarity search, lexical error code boosting, prompt injection isolation wrapper, and unit tests passing.
* [x] **Phase 6: Tool Registry Implementation** — Completed. All 15 required tools implemented with Zod schemas, risk levels, approval flags, role checks, and safe Policy Engine interceptor.
* [x] **Phase 7: Autonomous Agent Engine & Dynamic Tool Selection** — Completed. ReAct agent loop, structured decision schemas, LLM provider integration (Gemini/OpenAI/local fallback), dynamic evidence evaluation, stop conditions, and verified in automated tests.
* [x] **Phase 8: Human Approval Workflow** — Completed. Sensitive action pausing, risk assessment, approve/reject endpoints, post-approval execution & verification, and verified in automated tests.
* [x] **Phase 9: Ticket Lifecycle & Investigation APIs** — Completed. Full CRUD, message streaming, trigger investigation, resume, escalate, resolve, and audit APIs implemented and verified.
* [x] **Phase 10: Enterprise Frontend UI (Employee, IT Agent, Admin)** — Completed. Dark enterprise glassmorphism aesthetic, interactive demo scenario cards, real-time agent run observability timeline, "Why this action?" explainer, human-in-the-loop approval banner, and verified production build.
* [x] **Phase 11: Security & Policy Enforcement Audit** — Completed. RBAC privilege escalation blocked, prompt injection quarantined with untrusted tags, Zod schema input validation verified, and immutable audit logs confirmed.
* [x] **Phase 12: Automated Test Suites** — Completed. 19 automated unit and integration tests across 6 test suites passing with 100% pass rate (`npm test`).
* [x] **Phase 13: Demo Scenarios & Judge Walkthrough** — Completed. Pristine seed data, interactive demo cards on home page, live agent run timeline, "Why this action?" explainer, and comprehensive documentation (`README.md`, `docs/architecture.md`, `docs/agent-workflow.md`, `docs/security.md`).
* [x] **Phase 14: Production Environment Audit & Configuration** — Completed. Server-only Zod environment validator (`src/lib/config/env.ts`), configurable SQLite path, production environment guide (`docs/production-environment.md`), 22/22 tests passing, and deployment compatibility matrix established.

---

## 20. Important Architectural Decisions & Rationale
1. **Full-Stack Next.js with TypeScript:** Provides unified type safety between frontend, backend API routes, tool definitions, and agent schemas without microservice complexity.
2. **SQLite with Native Cosine Vector Storage:** Avoids external daemon dependencies (Docker/PostgreSQL not installed on host) while strictly preserving relational foreign keys and high-speed vector retrieval.
3. **Deterministic Policy Interceptor:** Placed directly in the tool execution pipeline to make privilege escalation mathematically impossible regardless of LLM hallucinations.
4. **Dual LLM Provider Support + Zero-Dependency Deterministic Fallback:** Ensures the hackathon demo never fails due to network dropouts or exhausted rate limits, while supporting real Gemini/OpenAI live API keys.
5. **No Fake AI / No Hardcoded Scripts:** Tool selection uses actual state evaluations and evidence scores.

---

## 21. Testing Status
* **100% Test Pass Rate (22/22 Tests Passing Across 7 Suites):**
  1. `tests/agent_loop.test.ts` (2 tests): End-to-end dynamic investigation, human approval pausing, post-approval execution & automated verification.
  2. `tests/auth_rbac.test.ts` (3 tests): Role hierarchy, approval limits per risk level, role execution permissions.
  3. `tests/database.test.ts` (4 tests): Relational queries, ticket messages, foreign keys, audit logging.
  4. `tests/env.test.ts` (3 tests): Environment validation, secret length enforcement, safe defaults.
  5. `tests/rag.test.ts` (3 tests): Vector cosine similarity retrieval, error-code boosting, prompt injection isolation wrapper.
  6. `tests/security.test.ts` (3 tests): Privilege escalation blocking, prompt injection defense, Zod schema validation.
  7. `tests/tools.test.ts` (4 tests): 15 tools registered with schemas, safe policy engine execution, input validation.

---

## 22. Demo Scenarios for Judges
1. **Scenario 1 (HR Portal Authentication Failure):**
   * Problem: "I can't access the HR portal. It says authentication failed."
   * Agent Path: `search_knowledge_base` -> `check_system_status` (HR portal is UP) -> `check_user_account` (Account is LOCKED) -> identifies root cause -> requests approval to `unlock_account` -> human approves -> executes `unlock_account` -> runs verification -> resolves ticket.
2. **Scenario 2 (VPN Connection Dropping):**
   * Problem: "VPN stopped connecting with error TLS-handshake-timeout."
   * Agent Path: `search_knowledge_base` -> `check_network_status` (Gateway is UP, client latency high / MTU misconfigured) -> `check_device_status` (VPN client version outdated) -> recommends client config update or cache flush -> executes verified remediation.
3. **Scenario 3 (Password Reset Request):**
   * Problem: "I forgot my password after returning from vacation."
   * Agent Path: `check_user_account` -> verifies identity policy -> requests MFA / approval -> triggers secure reset link.
4. **Scenario 4 (Unhandled Infrastructure Outage - Escalation):**
   * Problem: "Internal Git server returning 502 Bad Gateway."
   * Agent Path: `check_system_status` (Git server OUTAGE) -> attempts diagnostics -> recognizes core infrastructure failure beyond L1 scope -> generates escalation dossier -> assigns to DevOps Tier-3.

---

## 23. Phase 14 — Production Environment
* **Current LLM Provider Status:** Supports 'local' (active deterministic fallback), 'gemini' (requires `GEMINI_API_KEY`), and 'openai' (requires `OPENAI_API_KEY`). Currently running on zero-dependency `local` fallback.
* **Current Database Status:** Local synchronous SQLite via Node.js 24 native `node:sqlite` (`./data/autodesk.db`). Features WAL mode, foreign key enforcement, and busy timeout.
* **Required Environment Variables:** `AUTH_SECRET` (production session security), `GEMINI_API_KEY` (if `LLM_PROVIDER=gemini`), `OPENAI_API_KEY` (if `LLM_PROVIDER=openai`).
* **Production Limitations:** Serverless edge runtimes (e.g. Vercel Serverless Functions) have ephemeral/read-only filesystems incompatible with multi-process local SQLite WAL writes. Persistent container environments (Render, Railway, Fly.io, Docker) with mounted volumes are required unless migrating to managed PostgreSQL.
* **Deployment Decision:** Pending. Production environment audit completed; database migration and external deployment deferred per instructions.
* **Tests & Build Status:** 100% pass rate (22/22 tests passing across 7 test suites), production Next.js build clean with 0 errors.

---

## 24. Phase 16 — Real Gemini API Verification
* **Verification Objective:** Confirm whether the agent is actually sending live Gemini API requests or silently falling back to the local reasoning engine when `LLM_PROVIDER=gemini`.
* **Execution Path & Root Cause Findings:**
  1. `LLM_PROVIDER=gemini` and `GEMINI_API_KEY` were successfully detected from `.env.local`.
  2. Previously, `src/lib/llm/client.ts` had no diagnostic logs on successful Gemini calls, only on errors.
  3. Furthermore, Google's API retired `gemini-2.5-flash` for new users (`HTTP 404: This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash`). When calling the legacy model, Google returned 404, triggering the silent `catch` block that activated the local fallback.
  4. Google's newly promoted `gemini-3.8-flash` model periodically returned `HTTP 503: This model is currently experiencing high demand`.
  5. The high-availability, low-latency model `gemini-3.5-flash-lite` was validated and returns `HTTP 200 OK` reliably.
* **Security & Implementation Hardening:**
  1. Upgraded API authentication from query parameter (`?key=...`) to standard request header (`x-goog-api-key`), ensuring secrets never appear in error URLs or stack traces.
  2. Implemented dynamic model selection via `process.env.LLM_MODEL || 'gemini-3.5-flash-lite'`.
  3. Added safe diagnostic logging without exposing keys, prompts, or sensitive ticket data:
     - `[LLM] Provider selected: gemini`
     - `[LLM] Model: <model>`
     - `[LLM] Gemini request started`
     - `[LLM] Gemini request succeeded`
     - `[LLM] Gemini request failed/fallback activated: <sanitized error>`
  4. Robust JSON parsing handles both raw JSON and Markdown code fence wrappers.
* **End-to-End Smoke Test Verification:**
  - Ran `scripts/smoke_gemini.ts` through the authentic application agent pipeline (`runAgentInvestigation`).
  - Trace verified:
    `[LLM] Provider selected: gemini`
    &rarr; `[LLM] Model: gemini-3.5-flash-lite`
    &rarr; `[LLM] Gemini request started`
    &rarr; `[LLM] Gemini request succeeded` (Live Google API HTTP 200)
    &rarr; Structured `AgentDecision` parsed with tool selection (`check_system_status`, `check_network_status`)
    &rarr; Policy engine (`executeToolSafely`) verified permissions and risk
    &rarr; Tool execution executed strictly outside the LLM and persisted into SQLite database
  - Local fallback remains 100% operational as safety net.
* **Verification Status:**
  - `npm test`: 22/22 tests passing across 7 suites.
  - `npm run build`: Production build succeeded with 0 errors.

---

## 25. Phase 17 — Frontend UI/UX Redesign (Cyberpunk / Glitch Design System)
* **Goal & Scope:** Complete frontend visual transformation into a high-tech "Cyberpunk / Glitch" IT command operations HUD without modifying any backend logic, database models, policy guardrails, or LLM integrations.
* **Aesthetic Language ("High-Tech, Low-Life"):**
  - Dark matrix background (`#0a0a0f`) with subtle 50px green grid lines and CRT scanline overlay (`pointer-events: none`).
  - Chamfered corners on cards, panels, and buttons (`clip-path: polygon(...)`).
  - Layered neon glow hierarchy: Primary electric green (`#00ff88`), secondary magenta (`#ff00ff`), tertiary cyan (`#00d4ff`), and alert rose (`#ff3366`).
  - Typography: Futuristic headings (`Orbitron`, `Share Tech Mono`), technical monospaced body & code (`JetBrains Mono`, `Fira Code`).
  - Reusable Cyberpunk UI primitives in `src/components/ui/cyber.tsx`: `CyberButton`, `CyberBadge`, `CyberPanel`, `CyberInput`, `CyberTerminal`, `CyberStatus`.
* **Screen-by-Screen Implementation:**
  1. `src/components/layout/Navbar.tsx`: Cyber operations console navigation bar with live service health HUD pill and persona switcher.
  2. `src/components/agent/AgentRunView.tsx`: Live incident trajectory graph, high-priority human authorization intercept panel with prominent approval buttons, and terminal reasoning stream.
  3. `src/app/page.tsx`: AI operations center dashboard showcasing verified demo scenarios, live metrics, and trajectory previews.
  4. `src/app/tickets/[id]/page.tsx`: Cyber incident investigation console pairing live agent trajectory with terminal conversation audit stream.
  5. `src/app/employee/page.tsx`: Self-service incident logging HUD, Active Directory identity diagnostics, and incident queue.
  6. `src/app/it-desk/page.tsx`: Tier-2 workbench with elevated privilege authorization queue and global ticket triage grid.
  7. `src/app/admin/page.tsx`: Infrastructure & security operations hub featuring tool definition matrices, system telemetry, and immutable audit logs.
* **Validation & Zero-Regression Check:**
  - `npm test`: 22/22 tests passing across all 7 suites.
  - `npm run build`: Production build succeeded with 0 errors.
  - Route verification: All 7 routes (`/`, `/employee`, `/it-desk`, `/admin`, `/tickets/tkt_1042`, `/tickets/tkt_1043`, `/tickets/tkt_1044`) verified returning `HTTP 200 OK`.
  - Autonomous triage flow on `tkt_1043` verified working end-to-end with dynamic tool execution and resolution.

---

## 26. Phase 18 — Real Authentication & Server-Side Role-Based Access Control (RBAC)
* **Goal & Scope:** Enforce genuine, cryptographic authentication and server-side role-based access control across all frontend routes, backend API endpoints, and ticket/approval resources, eliminating client-side trust while preserving the cyberpunk UI, policy engine, and Gemini agent reasoning.
* **Authentication Architecture:**
  1. **HMAC-SHA256 Cryptographic Session Tokens:**
     - Replaced plaintext unverified cookies with cryptographically signed tokens (`userId.role.timestamp.signature`) using Web Crypto API (`crypto.subtle`).
     - Session tokens are stored in `autodesk_session_token` HTTP cookies (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
     - Token tampering or forged payload roles are mathematically detected and rejected server-side.
  2. **Server-Side Authorization Utilities (`src/lib/auth/server.ts`):**
     - `requireAuth(req)`: Asserts valid active session token, throws `AuthError(401)`.
     - `requireRole(role, req)`: Enforces role hierarchy rank, returns 401 (unauthenticated) or 403 (insufficient permissions).
     - `requireAnyRole([roles], req)`: Enforces membership in specified clearance roles.
     - `checkTicketAccess(ticket, user)`: Resource-level policy:
       - `EMPLOYEE`: Access restricted strictly to tickets where `creatorId === user.id`.
       - `IT_AGENT` & `IT_ADMIN`: Operational clearance to access all tickets.
     - `handleAuthError(error)`: Standardized JSON error response handler returning 401/403.
  3. **Next.js Route Middleware (`src/middleware.ts`):**
     - Early edge protection verifying session signature before rendering.
     - Unauthenticated requests to `/admin`, `/it-desk`, `/employee`, or `/tickets/*` redirect to `/login?next=...`.
     - Unauthorized roles attempting restricted paths redirect to `/access-denied` with informative clearance diagnostics:
       - `/admin` &rarr; Requires `IT_ADMIN`
       - `/it-desk` &rarr; Requires `IT_AGENT` or `IT_ADMIN`
       - `/employee` &rarr; Accessible to all authenticated personas
* **Secured API Endpoints:**
  - `GET /api/admin/audit-logs`: Requires `IT_ADMIN` clearance (returns 403 for `EMPLOYEE` and `IT_AGENT`).
  - `POST /api/actions/[id]/approve`: Requires valid authentication + `canApproveRiskLevel(user.role, appr.risk_level)`. Blocks `EMPLOYEE` from approving privileged operations (returns 403).
  - `POST /api/actions/[id]/reject`: Requires `IT_AGENT` or `IT_ADMIN` clearance.
  - `POST /api/agent/investigate`: Requires authentication + ticket ownership verification (returns 403 if employee calls on another user's ticket).
  - `GET & POST /api/tickets/[id]`: Requires authentication + ticket access check (`checkTicketAccess`).
  - `POST /api/tickets/[id]/resolve` & `POST /api/tickets/[id]/escalate`: Requires `IT_AGENT` or `IT_ADMIN` operational clearance.
  - `GET /api/approvals/pending`: Global queue requires IT clearance; ticket-scoped view verified against ticket ownership.
  - `GET /api/users/[id]/account`: Scoped to self for `EMPLOYEE`; unrestricted for IT personnel.
  - `GET /api/devices/[id]/status`: Scoped to assigned device for `EMPLOYEE`; unrestricted for IT personnel.
* **Security & Clearance UI Components:**
  - `src/app/login/page.tsx`: Cyberpunk terminal authentication interface with one-click cryptographic persona activation for seed identities (`Sarah Connor`, `David Lightman`, `Alex Mercer`, `Jordan Hayes`).
  - `src/app/access-denied/page.tsx`: High-tech 403 Forbidden intercept screen displaying required vs active clearance and fast-switch actions.
  - `src/components/layout/Navbar.tsx`: Dynamic role-tailored navigation tabs matching active clearance.
* **Validation & Test Results:**
  - `npm test`: **27/27 tests passing across all 7 test suites** (0 failures).
  - `npm run build`: Production Next.js Turbopack build succeeded with 0 TypeScript/Turbopack errors.
  - Live probe test (`scripts/probe_rbac.ts`): **18/18 live HTTP route and API RBAC checks passed** against running server.
  - Agent orchestrator, Gemini integration, and Cyberpunk design system remain 100% intact.




