import { getDatabase } from './index';
import { 
  Ticket, 
  TicketMessage, 
  SystemStatus, 
  EmployeeProfile, 
  Device, 
  AgentRun, 
  AgentAction, 
  ToolCallRecord, 
  ApprovalRequest, 
  AuditLog, 
  EvidenceItem, 
  RiskLevel, 
  TicketStatus, 
  ServiceHealth, 
  AccountStatus 
} from '@/types';

// ==========================================
// Tickets
// ==========================================
export function getTicketById(id: string): (Ticket & { messages: TicketMessage[] }) | null {
  const db = getDatabase();
  const ticketRow = db.prepare('SELECT * FROM tickets WHERE id = ? OR ticket_number = ?').get(id, id) as any;
  if (!ticketRow) return null;

  const messagesRows = db.prepare(`
    SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC
  `).all(ticketRow.id) as any[];

  const ticket: Ticket = {
    id: ticketRow.id,
    ticketNumber: ticketRow.ticket_number,
    creatorId: ticketRow.creator_id,
    title: ticketRow.title,
    description: ticketRow.description,
    category: ticketRow.category,
    priority: ticketRow.priority,
    status: ticketRow.status,
    assignedTo: ticketRow.assigned_to,
    deviceId: ticketRow.device_id,
    errorCode: ticketRow.error_code,
    resolutionSummary: ticketRow.resolution_summary,
    escalationReason: ticketRow.escalation_reason,
    createdAt: ticketRow.created_at,
    updatedAt: ticketRow.updated_at,
  };

  const messages: TicketMessage[] = messagesRows.map((m) => ({
    id: m.id,
    ticketId: m.ticket_id,
    senderType: m.sender_type,
    senderId: m.sender_id,
    senderName: m.sender_name,
    message: m.message,
    createdAt: m.created_at,
  }));

  return { ...ticket, messages };
}

export function listTickets(filters?: { creatorId?: string; status?: string }): Ticket[] {
  const db = getDatabase();
  let sql = 'SELECT * FROM tickets';
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.creatorId) {
    conditions.push('creator_id = ?');
    params.push(filters.creatorId);
  }
  if (filters?.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    ticketNumber: r.ticket_number,
    creatorId: r.creator_id,
    title: r.title,
    description: r.description,
    category: r.category,
    priority: r.priority,
    status: r.status,
    assignedTo: r.assigned_to,
    deviceId: r.device_id,
    errorCode: r.error_code,
    resolutionSummary: r.resolution_summary,
    escalationReason: r.escalation_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function createTicket(data: {
  creatorId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  deviceId?: string;
  errorCode?: string;
}): Ticket {
  const db = getDatabase();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as any;
  let num = 1040 + (countRow?.count || 0) + 1;
  while (db.prepare('SELECT 1 FROM tickets WHERE ticket_number = ?').get(`INC-${num}`)) {
    num += 1;
  }
  const ticketNumber = `INC-${num}`;
  const id = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  db.prepare(`
    INSERT INTO tickets (id, ticket_number, creator_id, title, description, category, priority, status, device_id, error_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
  `).run(
    id,
    ticketNumber,
    data.creatorId,
    data.title,
    data.description,
    data.category,
    data.priority,
    data.deviceId || null,
    data.errorCode || null
  );

  // Add initial message
  db.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, sender_type, sender_id, sender_name, message)
    VALUES (?, ?, 'USER', ?, 'User', ?)
  `).run(`msg_${Date.now()}`, id, data.creatorId, data.description);

  return getTicketById(id)!;
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus,
  details?: { resolutionSummary?: string; escalationReason?: string }
): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE tickets
    SET status = ?,
        resolution_summary = COALESCE(?, resolution_summary),
        escalation_reason = COALESCE(?, escalation_reason),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, details?.resolutionSummary || null, details?.escalationReason || null, id);
}

export function addTicketMessage(
  ticketId: string,
  senderType: 'USER' | 'AGENT' | 'SYSTEM',
  message: string,
  senderId?: string,
  senderName?: string
): TicketMessage {
  const db = getDatabase();
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, sender_type, sender_id, sender_name, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, ticketId, senderType, senderId || null, senderName || null, message);

  return {
    id,
    ticketId,
    senderType,
    senderId,
    senderName,
    message,
    createdAt: new Date().toISOString(),
  };
}

// ==========================================
// System Services Status
// ==========================================
export function getSystemStatus(serviceName: string): SystemStatus | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM system_status WHERE service_name = ? OR id = ?').get(serviceName, serviceName) as any;
  if (!row) return null;
  return {
    id: row.id,
    serviceName: row.service_name,
    displayName: row.display_name,
    status: row.status,
    latencyMs: row.latency_ms,
    incidentNotes: row.incident_notes,
    updatedAt: row.updated_at,
  };
}

export function listAllSystemStatuses(): SystemStatus[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM system_status ORDER BY service_name ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    serviceName: r.service_name,
    displayName: r.display_name,
    status: r.status,
    latencyMs: r.latency_ms,
    incidentNotes: r.incident_notes,
    updatedAt: r.updated_at,
  }));
}

export function updateSystemStatus(
  serviceName: string,
  status: ServiceHealth,
  notes?: string
): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE system_status
    SET status = ?, incident_notes = COALESCE(?, incident_notes), updated_at = datetime('now')
    WHERE service_name = ?
  `).run(status, notes || null, serviceName);
}

// ==========================================
// User Account & Device
// ==========================================
export function getEmployeeAccount(userId: string): (EmployeeProfile & { user: any }) | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT e.*, u.name, u.email, u.role
    FROM employees e
    JOIN users u ON e.user_id = u.id
    WHERE e.user_id = ? OR e.id = ? OR u.email = ?
  `).get(userId, userId, userId) as any;

  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    managerEmail: row.manager_email,
    accountStatus: row.account_status,
    mfaEnabled: Boolean(row.mfa_enabled),
    mfaSynced: Boolean(row.mfa_synced),
    failedLoginCount: row.failed_login_count,
    lastPasswordChange: row.last_password_change,
    department: row.department,
    user: {
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
    },
  };
}

export function updateAccountStatus(
  userId: string,
  status: AccountStatus,
  failedLogins: number = 0
): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE employees
    SET account_status = ?, failed_login_count = ?
    WHERE user_id = ? OR id = ?
  `).run(status, failedLogins, userId, userId);
}

export function getDeviceStatus(deviceIdOrUserId: string): Device | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM devices WHERE id = ? OR user_id = ?
  `).get(deviceIdOrUserId, deviceIdOrUserId) as any;

  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    deviceName: row.device_name,
    os: row.os,
    osVersion: row.os_version,
    complianceStatus: row.compliance_status,
    diskFreeGb: row.disk_free_gb,
    ipAddress: row.ip_address,
    vpnClientVersion: row.vpn_client_version,
    lastSeen: row.last_seen,
  };
}

// ==========================================
// Agent Runs, Actions & Tool Calls
// ==========================================
export function getOrCreateAgentRun(ticketId: string): AgentRun {
  const db = getDatabase();
  const existing = db.prepare(`
    SELECT * FROM agent_runs WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(ticketId) as any;

  if (existing) {
    let evidence: EvidenceItem[] = [];
    try {
      evidence = JSON.parse(existing.evidence_json || '[]');
    } catch {}
    return {
      id: existing.id,
      ticketId: existing.ticket_id,
      status: existing.status,
      stepCount: existing.step_count,
      maxSteps: existing.max_steps,
      confidence: existing.confidence,
      currentDiagnosis: existing.current_diagnosis,
      evidence,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at,
    };
  }

  const id = `run_${Date.now()}`;
  db.prepare(`
    INSERT INTO agent_runs (id, ticket_id, status, step_count, max_steps, confidence, evidence_json)
    VALUES (?, ?, 'RUNNING', 0, 10, 0.0, '[]')
  `).run(id, ticketId);

  return {
    id,
    ticketId,
    status: 'RUNNING',
    stepCount: 0,
    maxSteps: 10,
    confidence: 0.0,
    evidence: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateAgentRun(
  id: string,
  updates: Partial<AgentRun> & { appendEvidence?: EvidenceItem }
): void {
  const db = getDatabase();
  const current = db.prepare('SELECT * FROM agent_runs WHERE id = ?').get(id) as any;
  if (!current) return;

  let evidence: EvidenceItem[] = [];
  try {
    evidence = JSON.parse(current.evidence_json || '[]');
  } catch {}

  if (updates.appendEvidence) {
    evidence.push(updates.appendEvidence);
  } else if (updates.evidence) {
    evidence = updates.evidence;
  }

  const newStatus = updates.status || current.status;
  const newSteps = updates.stepCount !== undefined ? updates.stepCount : current.step_count;
  const newConfidence = updates.confidence !== undefined ? updates.confidence : current.confidence;
  const newDiagnosis = updates.currentDiagnosis !== undefined ? updates.currentDiagnosis : current.current_diagnosis;

  db.prepare(`
    UPDATE agent_runs
    SET status = ?,
        step_count = ?,
        confidence = ?,
        current_diagnosis = ?,
        evidence_json = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(newStatus, newSteps, newConfidence, newDiagnosis, JSON.stringify(evidence), id);
}

export function recordAgentAction(data: {
  agentRunId: string;
  stepNumber: number;
  actionType: string;
  toolName?: string;
  toolInput?: Record<string, any>;
  reasoningSummary: string;
  evidenceFindings?: string[];
}): AgentAction {
  const db = getDatabase();
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO agent_actions (id, agent_run_id, step_number, action_type, tool_name, tool_input, reasoning_summary, evidence_findings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.agentRunId,
    data.stepNumber,
    data.actionType,
    data.toolName || null,
    data.toolInput ? JSON.stringify(data.toolInput) : null,
    data.reasoningSummary,
    data.evidenceFindings ? JSON.stringify(data.evidenceFindings) : null
  );

  return {
    id,
    agentRunId: data.agentRunId,
    stepNumber: data.stepNumber,
    actionType: data.actionType as any,
    toolName: data.toolName,
    toolInput: data.toolInput,
    reasoningSummary: data.reasoningSummary,
    evidenceFindings: data.evidenceFindings,
    createdAt: new Date().toISOString(),
  };
}

export function recordToolCall(data: {
  agentActionId?: string;
  ticketId: string;
  toolName: string;
  inputParams: Record<string, any>;
  outputResult?: Record<string, any>;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'DENIED' | 'PENDING';
  errorMessage?: string;
  durationMs: number;
}): ToolCallRecord {
  const db = getDatabase();
  const id = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO tool_calls (id, agent_action_id, ticket_id, tool_name, input_params, output_result, status, error_message, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.agentActionId || null,
    data.ticketId,
    data.toolName,
    JSON.stringify(data.inputParams),
    data.outputResult ? JSON.stringify(data.outputResult) : null,
    data.status,
    data.errorMessage || null,
    data.durationMs
  );

  return {
    id,
    agentActionId: data.agentActionId,
    ticketId: data.ticketId,
    toolName: data.toolName,
    inputParams: data.inputParams,
    outputResult: data.outputResult,
    status: data.status,
    errorMessage: data.errorMessage,
    durationMs: data.durationMs,
    createdAt: new Date().toISOString(),
  };
}

export function getAgentRunDetails(ticketId: string) {
  const db = getDatabase();
  const run = getOrCreateAgentRun(ticketId);
  const actions = db.prepare(`
    SELECT * FROM agent_actions WHERE agent_run_id = ? ORDER BY step_number ASC
  `).all(run.id) as any[];

  const toolCalls = db.prepare(`
    SELECT * FROM tool_calls WHERE ticket_id = ? ORDER BY created_at ASC
  `).all(ticketId) as any[];

  return {
    run,
    actions: actions.map((a) => ({
      id: a.id,
      agentRunId: a.agent_run_id,
      stepNumber: a.step_number,
      actionType: a.action_type,
      toolName: a.tool_name,
      toolInput: a.tool_input ? JSON.parse(a.tool_input) : null,
      reasoningSummary: a.reasoning_summary,
      evidenceFindings: a.evidence_findings ? JSON.parse(a.evidence_findings) : [],
      createdAt: a.created_at,
    })),
    toolCalls: toolCalls.map((tc) => ({
      id: tc.id,
      agentActionId: tc.agent_action_id,
      ticketId: tc.ticket_id,
      toolName: tc.tool_name,
      inputParams: JSON.parse(tc.input_params),
      outputResult: tc.output_result ? JSON.parse(tc.output_result) : null,
      status: tc.status,
      errorMessage: tc.error_message,
      durationMs: tc.duration_ms,
      createdAt: tc.created_at,
    })),
  };
}

// ==========================================
// Approvals
// ==========================================
export function createApproval(data: {
  ticketId: string;
  agentRunId: string;
  actionType: string;
  toolName: string;
  toolInput: Record<string, any>;
  riskLevel: RiskLevel;
  requestedBy: string;
}): ApprovalRequest {
  const db = getDatabase();
  const id = `appr_${Date.now()}`;
  db.prepare(`
    INSERT INTO approvals (id, ticket_id, agent_run_id, action_type, tool_name, tool_input, risk_level, status, requested_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
  `).run(
    id,
    data.ticketId,
    data.agentRunId,
    data.actionType,
    data.toolName,
    JSON.stringify(data.toolInput),
    data.riskLevel,
    data.requestedBy
  );

  return {
    id,
    ticketId: data.ticketId,
    agentRunId: data.agentRunId,
    actionType: data.actionType,
    toolName: data.toolName,
    toolInput: data.toolInput,
    riskLevel: data.riskLevel,
    status: 'PENDING',
    requestedBy: data.requestedBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function resolveApproval(
  approvalId: string,
  status: 'APPROVED' | 'REJECTED',
  reviewedBy: string,
  reviewReason?: string
): ApprovalRequest | null {
  const db = getDatabase();

  // Resolve reviewedBy to valid user ID to satisfy foreign key constraint
  let reviewerUserId: string | null = null;
  const userRow = db.prepare('SELECT id FROM users WHERE id = ? OR name = ?').get(reviewedBy, reviewedBy) as any;
  if (userRow) {
    reviewerUserId = userRow.id;
  } else {
    const fallback = db.prepare("SELECT id FROM users WHERE role IN ('IT_AGENT', 'IT_ADMIN') LIMIT 1").get() as any;
    reviewerUserId = fallback?.id || null;
  }

  db.prepare(`
    UPDATE approvals
    SET status = ?, reviewed_by = ?, review_reason = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, reviewerUserId, reviewReason || null, approvalId);

  const row = db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as any;
  if (!row) return null;

  return {
    id: row.id,
    ticketId: row.ticket_id,
    agentRunId: row.agent_run_id,
    actionType: row.action_type,
    toolName: row.tool_name,
    toolInput: JSON.parse(row.tool_input),
    riskLevel: row.risk_level,
    status: row.status,
    requestedBy: row.requested_by,
    reviewedBy: row.reviewed_by,
    reviewReason: row.review_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listPendingApprovals(ticketId?: string): ApprovalRequest[] {
  const db = getDatabase();
  let sql = "SELECT * FROM approvals WHERE status = 'PENDING'";
  const params: any[] = [];
  if (ticketId) {
    sql += ' AND ticket_id = ?';
    params.push(ticketId);
  }
  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    agentRunId: r.agent_run_id,
    actionType: r.action_type,
    toolName: r.tool_name,
    toolInput: JSON.parse(r.tool_input),
    riskLevel: r.risk_level,
    status: r.status,
    requestedBy: r.requested_by,
    reviewedBy: r.reviewed_by,
    reviewReason: r.review_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

// ==========================================
// Audit Logs
// ==========================================
export function recordAuditLog(data: {
  ticketId?: string;
  userId?: string;
  action: string;
  resource: string;
  riskLevel: RiskLevel;
  details: Record<string, any>;
  ipAddress?: string;
}): AuditLog {
  const db = getDatabase();
  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO audit_logs (id, ticket_id, user_id, action, resource, risk_level, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.ticketId || null,
    data.userId || null,
    data.action,
    data.resource,
    data.riskLevel,
    JSON.stringify(data.details),
    data.ipAddress || null
  );

  return {
    id,
    ticketId: data.ticketId,
    userId: data.userId,
    action: data.action,
    resource: data.resource,
    riskLevel: data.riskLevel,
    details: data.details,
    ipAddress: data.ipAddress,
    createdAt: new Date().toISOString(),
  };
}

export function listAuditLogs(limit: number = 50): AuditLog[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?
  `).all(limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    userId: r.user_id,
    action: r.action,
    resource: r.resource,
    riskLevel: r.risk_level,
    details: JSON.parse(r.details || '{}'),
    ipAddress: r.ip_address,
    createdAt: r.created_at,
  }));
}
