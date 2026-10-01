# AutoDesk AI — AI IT Service Desk Autonomous Resolution Agent
**Production-Quality Hackathon Prototype**

> **Core Requirement:** *The agent dynamically selects the appropriate tool based on the employee's problem, available evidence, tool results, permissions, and current state — rather than executing a hardcoded sequence of steps.*

---

## 🚀 Live Demo & Quickstart

### 1. Prerequisites
- **Node.js:** v20+ or v24+ (uses Node.js built-in `node:sqlite` — zero external database daemon required)
- **NPM:** v10+

### 2. Installation
```bash
# Clone or navigate to project root
cd d:/my_AI

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(By default, `LLM_PROVIDER=local` is active for zero-external-dependency deterministic evaluation. You can optionally add `GEMINI_API_KEY=your_key` or `OPENAI_API_KEY=your_key` to connect live frontier models).*

### 4. Seed Enterprise Database
```bash
npm run seed
```
Seeds users (Sarah Connor, David Lightman, Alex Mercer, Jordan Hayes), locked Active Directory accounts, enterprise service health metrics, knowledge SOPs with vector embeddings, and initial demo tickets.

### 5. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 6. Run Automated Test Suites
```bash
npm test
```
Runs 19 automated tests across 6 suites (RBAC, Database, RAG, Tool Registry, Dynamic Agent Loop, and Security Policy).

---

## 🎯 Judge Walkthrough & Demo Scenarios

### Scenario 1: Primary Demo — HR Portal Authentication Failure
* **Persona:** Sarah Connor (`EMPLOYEE`)
* **Problem:** *"I can't access the HR portal. It says authentication failed."*
* **Observed Trajectory:**
  1. `search_knowledge_base` &rarr; Retrieves SOP-104 (HR Portal Access SOP).
  2. `check_system_status` &rarr; Verifies Workday HR Portal is `OPERATIONAL` (rules out outage).
  3. `check_user_account` &rarr; Discovers Active Directory account status is `LOCKED` (5 failed logins).
  4. `run_diagnostics` &rarr; Probes auth handshake; confirms HTTP 403 account lockout.
  5. **Human Approval:** Pauses execution with `AWAITING_APPROVAL`. Explains *"Why this action?"* based on gathered evidence.
  6. **Authorization:** Click **[Authorize & Execute]** (as Employee or switch to IT Agent Alex Mercer).
  7. `unlock_account` &rarr; Unlocks account and resets failed login count.
  8. **Automated Verification:** Checks account status is `ACTIVE` and service is healthy.
  9. `close_ticket` &rarr; Marks ticket `RESOLVED` with verification proof!

---

### Scenario 2: Alternative Path — VPN Connection Failure
* **Persona:** David Lightman (`EMPLOYEE`)
* **Problem:** *"VPN stopped connecting with TLS-handshake-timeout."*
* **Observed Trajectory:**
  1. `search_knowledge_base` &rarr; Retrieves SOP-209 (VPN Troubleshooting).
  2. `check_system_status` &rarr; Checks `vpn-gateway` (operational, 18ms latency).
  3. `check_network_status` &rarr; Tests client DNS and captive portal (healthy).
  4. `check_device_status` &rarr; Discovers outdated VPN client TLS cipher profile.
  5. **Remediation:** Proposes `clear_application_cache` for GlobalProtect.
  6. **Verification & Resolution:** Verifies tunnel negotiation and resolves ticket!
* **Key Differentiator:** Proves the agent did *not* blindly check the HR portal or unlock an account; it evaluated network/device evidence adaptively.

---

### Scenario 3: Infrastructure Outage Escalation
* **Problem:** *"Internal Git server returning 502 Bad Gateway."*
* **Observed Trajectory:**
  1. `check_system_status` &rarr; Checks `internal-git`; detects `OUTAGE` (storage pool failure).
  2. **Policy Evaluation:** SOP-999 states L1 agents cannot restart cluster infrastructure.
  3. **Escalation:** Compiles structured system diagnostics and executes `escalate_ticket` to Tier-3 DevOps SRE.

---

## 🛠️ System Architecture & Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (Turbopack, App Router) | Unified type safety across UI, API, and agent reasoning. |
| **Language** | TypeScript | End-to-end typechecked schemas and interfaces. |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Tokens | Dark enterprise glassmorphism aesthetic. |
| **Database** | Node.js 24 Native `node:sqlite` | Zero-dependency, portable SQLite with foreign keys and WAL mode. |
| **Vector RAG** | 128-dim Dense Embeddings + Cosine Similarity | Exact mathematical retrieval thresholded at $\ge 0.60$ with error-code boosting. |
| **Policy Engine** | Deterministic RBAC & Risk Interceptor | Mathematical barrier preventing LLM privilege escalation. |
| **Validation** | Zod | Runtime schema validation for all tool inputs and outputs. |
| **Icons** | Lucide React | Clean enterprise iconography. |

---

## 🛡️ Security & Safe Agent Activity

1. **No Raw Shell Access:** The LLM cannot execute arbitrary bash or terminal commands.
2. **Deterministic RBAC:** Role boundaries (`EMPLOYEE`, `IT_AGENT`, `IT_ADMIN`) are enforced on the backend.
3. **Approval Gates:** High/Medium-risk operations (`unlock_account`, `clear_application_cache`, `restart_service`, `reset_password`) require explicit human authorization.
4. **Prompt Injection Quarantine:** Retrieved runbooks are enclosed in `<knowledge_context safety="untrusted_reference_only">` to prevent prompt overrides.
5. **No Chain-of-Thought Leaks:** The UI presents only user-safe evidence rationales and "Why this action?" explanations.

---

## 📁 Project Structure

```
d:/my_AI/
├── brain.md                 # Persistent engineering & architectural memory
├── README.md                # System documentation & quickstart
├── .env.example             # Safe environment variable template
├── docs/
│   ├── architecture.md      # Detailed system architecture
│   ├── agent-workflow.md    # ReAct agent loop specification
│   └── security.md          # RBAC, policy engine, prompt injection guard
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Overview & Interactive Demo Navigator
│   │   ├── employee/        # Employee Portal & Ticket Submission
│   │   ├── it-desk/         # IT Agent Workbench & Triage Queue
│   │   ├── admin/           # Admin Operations Hub (Tools, Services, Audit)
│   │   ├── tickets/[id]/    # Interactive Ticket Details & Agent Run View
│   │   └── api/             # 15 RESTful API endpoints
│   ├── components/
│   │   ├── agent/           # AgentRunView observability timeline
│   │   └── layout/          # Navbar & AuthProvider with persona switcher
│   ├── lib/
│   │   ├── agent/           # Autonomous ReAct orchestrator loop
│   │   ├── auth/            # RBAC hierarchy & session management
│   │   ├── db/              # SQLite connection, schema & queries
│   │   ├── llm/             # Gemini/OpenAI live API client & dynamic fallback
│   │   ├── policy/          # Deterministic policy & risk interceptor
│   │   ├── rag/             # Dense vector embeddings & runbook search
│   │   └── tools/           # 15 real tool implementations
│   └── types/               # TypeScript interfaces & Zod schemas
└── tests/                   # 6 automated test suites (19 unit/integration tests)
```

---

## 🧪 Running Tests
```bash
npm test
```
All 22 tests across all 7 test suites pass with 0 failures:
- `auth_rbac.test.ts` (3 tests)
- `database.test.ts` (4 tests)
- `env.test.ts` (3 tests)
- `rag.test.ts` (3 tests)
- `tools.test.ts` (4 tests)
- `agent_loop.test.ts` (2 tests)
- `security.test.ts` (3 tests)
