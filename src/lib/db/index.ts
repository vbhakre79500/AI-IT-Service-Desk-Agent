import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DB_DIR, 'autodesk.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    // Enable foreign key constraints, WAL mode, and busy timeout for high concurrency
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA busy_timeout = 5000;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('EMPLOYEE', 'IT_AGENT', 'IT_ADMIN')),
      department TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      manager_email TEXT,
      account_status TEXT NOT NULL CHECK(account_status IN ('ACTIVE', 'LOCKED', 'SUSPENDED', 'PASSWORD_EXPIRED')),
      mfa_enabled INTEGER DEFAULT 1,
      mfa_synced INTEGER DEFAULT 1,
      failed_login_count INTEGER DEFAULT 0,
      last_password_change TEXT,
      department TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      device_name TEXT NOT NULL,
      os TEXT NOT NULL,
      os_version TEXT NOT NULL,
      compliance_status TEXT NOT NULL CHECK(compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'PENDING')),
      disk_free_gb REAL,
      ip_address TEXT,
      vpn_client_version TEXT,
      last_seen TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS system_status (
      id TEXT PRIMARY KEY,
      service_name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('OPERATIONAL', 'DEGRADED', 'OUTAGE', 'MAINTENANCE')),
      latency_ms INTEGER,
      incident_notes TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      creator_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      status TEXT NOT NULL CHECK(status IN ('OPEN', 'INVESTIGATING', 'AWAITING_APPROVAL', 'AWAITING_USER', 'RESOLVED', 'ESCALATED', 'CLOSED')),
      assigned_to TEXT REFERENCES users(id),
      device_id TEXT,
      error_code TEXT,
      resolution_summary TEXT,
      escalation_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL CHECK(sender_type IN ('USER', 'AGENT', 'SYSTEM')),
      sender_id TEXT,
      sender_name TEXT,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('RUNNING', 'WAITING_APPROVAL', 'WAITING_INPUT', 'COMPLETED', 'ESCALATED', 'FAILED')),
      step_count INTEGER DEFAULT 0,
      max_steps INTEGER DEFAULT 10,
      confidence REAL DEFAULT 0.0,
      current_diagnosis TEXT,
      evidence_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_actions (
      id TEXT PRIMARY KEY,
      agent_run_id TEXT REFERENCES agent_runs(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      tool_name TEXT,
      tool_input TEXT,
      reasoning_summary TEXT NOT NULL,
      evidence_findings TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tool_calls (
      id TEXT PRIMARY KEY,
      agent_action_id TEXT REFERENCES agent_actions(id) ON DELETE SET NULL,
      ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
      tool_name TEXT NOT NULL,
      input_params TEXT NOT NULL,
      output_result TEXT,
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'DENIED')),
      error_message TEXT,
      duration_ms INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
      agent_run_id TEXT REFERENCES agent_runs(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      tool_input TEXT NOT NULL,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      requested_by TEXT NOT NULL,
      reviewed_by TEXT REFERENCES users(id),
      review_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      ticket_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT REFERENCES knowledge_documents(id) ON DELETE CASCADE,
      document_title TEXT NOT NULL,
      category TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_creator ON tickets(creator_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_ticket ON agent_runs(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_tool_calls_ticket ON tool_calls(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_approvals_ticket ON approvals(ticket_id);
  `);
}
