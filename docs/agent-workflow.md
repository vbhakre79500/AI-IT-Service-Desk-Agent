# AutoDesk AI — Agent Workflow & Dynamic Decision Loop

## Core ReAct Agent Loop

The agent loop executes an iterative reasoning and acting cycle:

```
                  +---------------------------+
                  |  Employee Submits Ticket  |
                  +-------------+-------------+
                                |
                                v
                  +---------------------------+
                  |  Semantic Intent Triage   |
                  |  & Runbook RAG Retrieval  |
                  +-------------+-------------+
                                |
                                v
          +-------------------------------------------+
          |           START INVESTIGATION LOOP        |
          +---------------------+---------------------+
                                |
                                v
               +----------------------------------+
               |  Evaluate Hypotheses & Evidence  |
               +----------------+-----------------+
                                |
                                v
               +----------------------------------+
               |      Select Best Next Tool       |
               +----------------+-----------------+
                                |
                                v
               +----------------------------------+
               |     Policy & RBAC Validation     |
               +----------------+-----------------+
                                |
             +------------------+------------------+
             |                                     |
   Requires Approval?                       Low Risk / Permitted
             |                                     |
             v                                     v
+--------------------------+             +--------------------------+
|  PAUSE AGENT RUN         |             |  Execute Tool Safely     |
|  Status: WAITING_APPROVAL|             |  Capture Execution Output|
+------------+-------------+             +-------------+------------+
             |                                         |
     Human Authorizes                                  v
             |                           +--------------------------+
             +-------------------------->|  Ingest Evidence Item    |
                                         +-------------+------------+
                                                       |
                                                       v
                                         +--------------------------+
                                         |    Root Cause Fixed?     |
                                         +-------------+------------+
                                                       |
                                    +------------------+------------------+
                                    |                                     |
                                   YES                                    NO
                                    |                                     |
                                    v                                     v
                     +----------------------------+         +----------------------------+
                     | Run Automated Verification |         | Step Count >= 10?          |
                     +--------------+-------------+         +-------------+--------------+
                                    |                                     |
                                    v                               YES   |   NO
                     +----------------------------+                  |    |    |
                     |  Mark Ticket RESOLVED      |                  v    +----+
                     |  Record Final Diagnosis    |         +----------------------------+
                     +----------------------------+         | Auto-Escalate to Tier-2/3  |
                                                            +----------------------------+
```

---

## Dynamic Behavior Proof Across Demo Scenarios

### Scenario 1: "I can't access the HR portal. It says authentication failed."
1. `search_knowledge_base` &rarr; Retrieves SOP-104 (HR Portal Access & Auth Failure).
2. `check_system_status` &rarr; Checks `hr-portal` service; returns OPERATIONAL (eliminates outage hypothesis).
3. `check_user_account` &rarr; Inspects Sarah Connor's account; returns `account_status = 'LOCKED'` (5 failed logins).
4. `run_diagnostics` &rarr; Corroborates Active Directory lockout flag via HTTP 403 handshake probe.
5. **Decision:** Proposes `unlock_account`. Pauses and triggers human approval.
6. **Human Approves:** IT Agent or Employee authorizes the unlock.
7. `unlock_account` &rarr; Sets status to ACTIVE, clears failed logins.
8. **Automated Verification:** Checks account status is ACTIVE and HR Portal is OPERATIONAL.
9. `close_ticket` &rarr; Marks ticket RESOLVED.

### Scenario 2: "VPN stopped connecting with TLS-handshake-timeout."
Notice that the agent does NOT check the HR portal or unlock the account! Instead:
1. `search_knowledge_base` &rarr; Retrieves SOP-209 (VPN Troubleshooting).
2. `check_system_status` &rarr; Checks `vpn-gateway`; returns OPERATIONAL (24ms latency).
3. `check_network_status` &rarr; Client DNS and connectivity normal.
4. `check_device_status` &rarr; Inspects GlobalProtect version; detects outdated client TLS profile.
5. **Decision:** Proposes `clear_application_cache` for GlobalProtect.
6. **Approval & Verification:** Cache flushed, session re-established, ticket resolved!

### Scenario 3: "Internal Git server returning 502 Bad Gateway."
1. `check_system_status` &rarr; Checks `internal-git`; returns `status = 'OUTAGE'`.
2. SOP-999 policy rule: L1 autonomous agents cannot modify core cluster infrastructure.
3. **Escalation:** Directly compiles system diagnostics and triggers `escalate_ticket` to Tier-3 DevOps SRE.
