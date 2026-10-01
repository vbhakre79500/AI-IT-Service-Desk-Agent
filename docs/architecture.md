# AutoDesk AI — System Architecture

## Overview
**AutoDesk AI** is an autonomous, evidence-driven IT Service Desk Resolution Agent designed for enterprise helpdesks. Unlike traditional rule-based chatbots or static decision trees, AutoDesk AI dynamically reasons over multi-source evidence (internal SOP runbooks, system health APIs, active directory accounts, and device diagnostics) using a ReAct decision loop guarded by a deterministic Policy Engine.

```
                                +-----------------------------------+
                                |     Employee / IT Support User    |
                                +-----------------+-----------------+
                                                  |
                                                  v
                                +-----------------------------------+
                                |      Next.js 16 (App Router)      |
                                |  - Employee Portal (/employee)    |
                                |  - IT Workbench (/it-desk)        |
                                |  - Admin Hub (/admin)             |
                                +-----------------+-----------------+
                                                  |
                                                  v
                                +-----------------------------------+
                                |     Agent Orchestrator Loop       |
                                |  - Step counter (Max 10 steps)    |
                                |  - Hypotheses & Evidence Graph    |
                                |  - Multi-layer Context Memory     |
                                +-----------------+-----------------+
                                                  |
                                                  v
                                +-----------------------------------+
                                |       LLM Reasoning Engine        |
                                |  - Live Gemini / OpenAI API       |
                                |  - Local ReAct Dynamic Fallback   |
                                +-----------------+-----------------+
                                                  |
                                                  v
                                +-----------------------------------+
                                |    Deterministic Policy Engine    |
                                |  - RBAC (EMPLOYEE/AGENT/ADMIN)    |
                                |  - Risk Triage (LOW/MED/HIGH)     |
                                |  - Human Approval Interceptor     |
                                |  - Zod Schema Input Validation    |
                                +--------+------------------+-------+
                                         |                  |
                              Requires Approval     Permitted & Valid
                                         |                  |
                                         v                  v
                              +--------------------+ +--------------------+
                              |  Human-In-The-Loop | |    Tool Registry   |
                              |  Approval Workflow | |  - RAG KB Search   |
                              +--------------------+ |  - System Status   |
                                                     |  - Account / Lock  |
                                                     |  - Device / Net    |
                                                     |  - Remediations    |
                                                     +----------+---------+
                                                                |
                                                                v
                                                     +--------------------+
                                                     | Native SQLite DB   |
                                                     | + Vector Search    |
                                                     +--------------------+
```

---

## Core Components

### 1. ReAct Dynamic Agent Loop
- Located in `src/lib/agent/orchestrator.ts`.
- Evaluates the ticket statement, collected evidence items, and SOP runbooks.
- Decides the optimal next tool based on missing evidence rather than a static sequence.
- Stops when:
  * Issue is verified resolved.
  * Human approval is required for sensitive actions.
  * Information is required from user.
  * Maximum steps (`MAX_AGENT_STEPS = 10`) or unrecoverable infrastructure failure triggers structured escalation.

### 2. Deterministic Policy Engine
- Located in `src/lib/policy/engine.ts`.
- Completely prevents prompt injection or LLM hallucinations from executing unpermitted operations.
- Intercepts every tool call, verifies role hierarchy, validates inputs via Zod schemas, times execution, and writes immutable records to `audit_logs`.

### 3. Vector RAG Engine
- Located in `src/lib/rag/service.ts` and `src/lib/rag/embeddings.ts`.
- Computes 128-dimensional dense vector embeddings.
- Executes exact cosine similarity search thresholded at $\ge 0.60$ with error-code lexical boosting.
- Encapsulates retrieved articles in `<knowledge_context safety="untrusted_reference_only">` to quarantine untrusted instructions.

### 4. Enterprise Storage Engine
- Located in `src/lib/db/index.ts` using Node.js 24 native `node:sqlite`.
- Zero external daemon dependencies, zero Docker requirement.
- Full relational foreign keys, WAL mode, and busy timeout concurrency.
