// Load .env.local before any imports that read process.env (e.g. DATABASE_URL).
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getPool, initPostgresSchema } from './index';
import { SEED_USERS, SEED_EMPLOYEES, SEED_DEVICES } from '../auth/users';
import { generateEmbedding } from '../rag/embeddings';

export async function seedDatabase(pool?: any): Promise<void> {
  const p = pool || getPool();

  console.log('🌱 Starting enterprise PostgreSQL database seeding...');

  // Ensure schema is created first
  await initPostgresSchema(p);

  // 1. Seed Users
  for (const u of SEED_USERS) {
    await p.query(
      `INSERT INTO users (id, name, email, role, department, avatar_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         department = EXCLUDED.department,
         avatar_url = EXCLUDED.avatar_url`,
      [u.id, u.name, u.email, u.role, u.department, u.avatarUrl || null, u.createdAt]
    );
  }
  console.log(`✅ Seeded ${SEED_USERS.length} users.`);

  // 2. Seed Employee Profiles
  for (const emp of SEED_EMPLOYEES) {
    await p.query(
      `INSERT INTO employees (
         id, user_id, title, manager_email, account_status, mfa_enabled, mfa_synced,
         failed_login_count, last_password_change, department
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         account_status = EXCLUDED.account_status,
         mfa_enabled = EXCLUDED.mfa_enabled,
         mfa_synced = EXCLUDED.mfa_synced,
         failed_login_count = EXCLUDED.failed_login_count,
         last_password_change = EXCLUDED.last_password_change`,
      [
        emp.id,
        emp.userId,
        emp.title,
        emp.managerEmail,
        emp.accountStatus,
        Boolean(emp.mfaEnabled),
        Boolean(emp.mfaSynced),
        emp.failedLoginCount,
        emp.lastPasswordChange,
        emp.department,
      ]
    );
  }
  console.log(`✅ Seeded ${SEED_EMPLOYEES.length} employee profiles.`);

  // 3. Seed Devices
  for (const d of SEED_DEVICES) {
    await p.query(
      `INSERT INTO devices (
         id, user_id, device_name, os, os_version, compliance_status, disk_free_gb,
         ip_address, vpn_client_version, last_seen
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         compliance_status = EXCLUDED.compliance_status,
         disk_free_gb = EXCLUDED.disk_free_gb,
         ip_address = EXCLUDED.ip_address,
         last_seen = EXCLUDED.last_seen`,
      [
        d.id,
        d.userId,
        d.deviceName,
        d.os,
        d.osVersion,
        d.complianceStatus,
        d.diskFreeGb,
        d.ipAddress,
        d.vpnClientVersion || null,
        d.lastSeen,
      ]
    );
  }
  console.log(`✅ Seeded ${SEED_DEVICES.length} devices.`);

  // 4. Seed Enterprise IT System Status
  const SERVICES = [
    {
      id: 'srv_hr_portal',
      serviceName: 'hr-portal',
      displayName: 'Workday HR Employee Portal',
      status: 'OPERATIONAL',
      latencyMs: 42,
      incidentNotes: 'All cluster pods healthy. Authentication endpoint responding normally.',
    },
    {
      id: 'srv_vpn_useast',
      serviceName: 'vpn-gateway',
      displayName: 'GlobalProtect VPN Gateway (US-East)',
      status: 'OPERATIONAL',
      latencyMs: 18,
      incidentNotes: 'Tunnel concentration capacity at 48%. Normal operation.',
    },
    {
      id: 'srv_sso_okta',
      serviceName: 'sso-okta',
      displayName: 'Okta Enterprise Identity & SSO',
      status: 'OPERATIONAL',
      latencyMs: 31,
      incidentNotes: 'SAML 2.0 and OIDC identity providers operational.',
    },
    {
      id: 'srv_corp_email',
      serviceName: 'corp-email',
      displayName: 'Microsoft Exchange Online / Outlook',
      status: 'OPERATIONAL',
      latencyMs: 55,
      incidentNotes: 'Mailbox ingress and autodiscover normal.',
    },
    {
      id: 'srv_internal_git',
      serviceName: 'internal-git',
      displayName: 'Enterprise GitLab / VCS Cluster',
      status: 'OUTAGE', // Simulated outage for Escalation Demo Scenario
      latencyMs: 0,
      incidentNotes: 'Storage pool volume /dev/vg_git offline. Core infrastructure ticket INC-9901 open.',
    },
  ];

  for (const s of SERVICES) {
    await p.query(
      `INSERT INTO system_status (
         id, service_name, display_name, status, latency_ms, incident_notes, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         latency_ms = EXCLUDED.latency_ms,
         incident_notes = EXCLUDED.incident_notes,
         updated_at = CURRENT_TIMESTAMP`,
      [s.id, s.serviceName, s.displayName, s.status, s.latencyMs, s.incidentNotes]
    );
  }
  console.log(`✅ Seeded ${SERVICES.length} enterprise system status indicators.`);

  // 5. Seed Real IT Runbooks for RAG
  const RUNBOOKS = [
    {
      id: 'doc_hr_auth_01',
      title: 'SOP-104: HR Portal Access & Authentication Failure Resolution',
      category: 'Authentication',
      content: `Standard Operating Procedure: HR Portal Access & Authentication Failures.
Summary: Troubleshoot employee authentication failures when accessing Workday / HR Portal.
Root Causes:
1. Active Directory Account Lockout: Caused by 5 or more consecutive bad password attempts within 15 minutes. The HR portal returns generic "Authentication failed" or error code ERR_AUTH_042.
2. Service Outage: If the HR Portal or SSO gateway is down or degraded, users cannot sign in. Check system status of 'hr-portal' and 'sso-okta'.
3. Expired Credentials: Password past 90-day maximum age.
Diagnostic Procedure:
Step 1: Check system status of 'hr-portal'. If service is down, report outage to Tier-2 Infrastructure.
Step 2: Check employee account status using check_user_account. If account_status is 'LOCKED', this is the direct cause.
Step 3: Verification of identity and policy. To unlock an account, obtain employee confirmation or IT agent approval.
Remediation Procedure:
Execute unlock_account with approval. After unlocking, verify that account_status becomes ACTIVE and failed_login_count resets to 0. Advise employee to retry login in a clean browser window or clear application cache if cookies are stale.`,
    },
    {
      id: 'doc_vpn_troubleshoot_02',
      title: 'SOP-209: GlobalProtect VPN Connection Failure & Gateway Timeout',
      category: 'VPN',
      content: `Standard Operating Procedure: Enterprise VPN Connection Troubleshooting.
Summary: Triage and resolve remote worker VPN connection issues, handshake failures, and drops.
Common Symptoms:
- Error message: "TLS-handshake-timeout", "Gateway not reachable", or client stuck in "Connecting..." loop.
Investigation Workflow:
Step 1: Verify VPN Gateway health via check_system_status for 'vpn-gateway'. If gateway has outage, escalate to Network NOC.
Step 2: Check network status via check_network_status. Verify user client IP, DNS resolution, and local latency. If user is on a captive portal (e.g. hotel Wi-Fi), VPN cannot establish tunnel until portal agreement is accepted.
Step 3: Check device compliance and client version using check_device_status. VPN client versions below 5.2.0 have known TLS cipher compatibility issues.
Remediation Procedure:
1. If client cache is corrupt, run clear_application_cache for application 'GlobalProtect'.
2. If account MFA token is out of sync, trigger MFA resync or prompt user.
3. Verification: Verify tunnel handshake and route metrics with check_network_status.`,
    },
    {
      id: 'doc_password_reset_03',
      title: 'SOP-301: Enterprise Password Reset & Account Lockout Policy',
      category: 'Password',
      content: `Standard Operating Procedure: Password Reset and Identity Verification.
Policy Rules:
- Employees are permitted to request self-service password resets if MFA is enabled and synced.
- If MFA is unsynced or device is non-compliant, password reset requires IT_AGENT approval to prevent social engineering.
- Password Complexity: Minimum 14 characters, uppercase, lowercase, numbers, and symbols. Cannot reuse last 5 passwords.
Resolution Procedure:
Verify user status with check_user_account. If account is locked or password expired, request IT Agent approval to execute reset_password. Provide one-time temporary access code via verified SMS or secondary contact. Verify account reactivation.`,
    },
    {
      id: 'doc_infrastructure_escalation_04',
      title: 'SOP-999: Infrastructure Outages and Tier-3 Escalation Protocol',
      category: 'Other',
      content: `Standard Operating Procedure: Core Infrastructure Outage Escalation.
Scope: GitLab, Production DB clusters, AWS/GCP VPC interconnects.
Rule: Autonomous Helpdesk agents CANNOT restart or alter core cluster infrastructure without L3 Site Reliability Engineering involvement.
Action: When an infrastructure service status reports 'OUTAGE' or 'CRITICAL_DEGRADED', gather all diagnostic logs, affected users, and cluster status. Generate a structured handoff dossier and execute escalate_ticket to assign incident to the on-call DevOps/NOC team.`,
    },
  ];

  for (const doc of RUNBOOKS) {
    await p.query(
      `INSERT INTO knowledge_documents (id, title, category, content, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         category = EXCLUDED.category,
         content = EXCLUDED.content`,
      [doc.id, doc.title, doc.category, doc.content]
    );

    const paragraphs = doc.content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    for (let idx = 0; idx < paragraphs.length; idx++) {
      const pText = paragraphs[idx];
      const chunkId = `chk_${doc.id}_${idx}`;
      const embedding = generateEmbedding(pText);
      await p.query(
        `INSERT INTO knowledge_chunks (
           id, document_id, document_title, category, chunk_index, content, embedding_json
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           content = EXCLUDED.content,
           embedding_json = EXCLUDED.embedding_json`,
        [chunkId, doc.id, doc.title, doc.category, idx, pText, JSON.stringify(embedding)]
      );
    }
  }
  console.log(`✅ Seeded ${RUNBOOKS.length} knowledge documents and parsed chunks.`);

  // 6. Seed Demo Scenario Tickets
  const DEMO_TICKETS = [
    {
      id: 'tkt_1042',
      ticketNumber: 'INC-1042',
      creatorId: 'usr_emp_01', // Sarah Connor
      title: "I can't access the HR portal. It says authentication failed.",
      description: 'Whenever I try to log into Workday / HR portal from my MacBook, it gives me an authentication failure error code ERR_AUTH_042. I need to submit my timecard today before 5 PM!',
      category: 'Authentication',
      priority: 'HIGH',
      status: 'OPEN',
      deviceId: 'dev_sarah_mbp',
      errorCode: 'ERR_AUTH_042',
    },
    {
      id: 'tkt_1043',
      ticketNumber: 'INC-1043',
      creatorId: 'usr_emp_02', // David Lightman
      title: 'VPN stopped connecting with TLS-handshake-timeout',
      description: 'My GlobalProtect VPN client refuses to establish connection to the corporate gateway. It times out after 30 seconds with error TLS-handshake-timeout. I cannot reach internal servers.',
      category: 'VPN',
      priority: 'HIGH',
      status: 'OPEN',
      deviceId: 'dev_david_win',
      errorCode: 'TLS_TIMEOUT',
    },
    {
      id: 'tkt_1044',
      ticketNumber: 'INC-1044',
      creatorId: 'usr_emp_02', // David Lightman
      title: 'Internal Git server returning 502 Bad Gateway',
      description: 'Trying to push critical financial report code to internal gitlab cluster. Server returns HTTP 502 Bad Gateway on git push and web UI is inaccessible.',
      category: 'Other',
      priority: 'CRITICAL',
      status: 'OPEN',
      deviceId: 'dev_david_win',
      errorCode: 'HTTP_502',
    },
  ];

  for (const t of DEMO_TICKETS) {
    await p.query(
      `INSERT INTO tickets (
         id, ticket_number, creator_id, title, description, category, priority, status,
         device_id, error_code, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         title = EXCLUDED.title,
         description = EXCLUDED.description`,
      [
        t.id,
        t.ticketNumber,
        t.creatorId,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.status,
        t.deviceId || null,
        t.errorCode || null,
      ]
    );

    // Initial message from user
    await p.query(
      `INSERT INTO ticket_messages (
         id, ticket_id, sender_type, sender_id, sender_name, message, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO NOTHING`,
      [
        `msg_init_${t.id}`,
        t.id,
        'USER',
        t.creatorId,
        t.creatorId === 'usr_emp_01' ? 'Sarah Connor' : 'David Lightman',
        t.description,
      ]
    );
  }
  console.log(`✅ Seeded ${DEMO_TICKETS.length} realistic demo scenario tickets.`);
  console.log('🎉 PostgreSQL database seeding complete!');
}

// Allow direct CLI execution: npx tsx src/lib/db/seed.ts
if (require.main === module || process.argv[1]?.includes('seed')) {
  seedDatabase().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
