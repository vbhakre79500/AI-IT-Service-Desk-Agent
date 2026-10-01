import { query, queryOne, queryRows } from './index';
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
export async function getTicketById(id: string): Promise<(Ticket & { messages: TicketMessage[] }) | null> {
  const ticketRow = await queryOne<any>(
    'SELECT * FROM tickets WHERE id = $1 OR ticket_number = $2',
    [id, id]
  );
  if (!ticketRow) return null;

  const messagesRows = await queryRows<any>(
    'SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC',
    [ticketRow.id]
  );

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
    createdAt: ticketRow.created_at instanceof Date ? ticketRow.created_at.toISOString() : String(ticketRow.created_at),
    updatedAt: ticketRow.updated_at instanceof Date ? ticketRow.updated_at.toISOString() : String(ticketRow.updated_at),
  };

  const messages: TicketMessage[] = messagesRows.map((m) => ({
    id: m.id,
    ticketId: m.ticket_id,
    senderType: m.sender_type,
    senderId: m.sender_id,
    senderName: m.sender_name,
    message: m.message,
    createdAt: m.created_at instanceof Date ? m.created_at.toISOString() : String(m.created_at),
  }));

  return { ...ticket, messages };
}

export async function listTickets(filters?: { creatorId?: string; status?: string }): Promise<Ticket[]> {
  let sql = 'SELECT * FROM tickets';
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.creatorId) {
    params.push(filters.creatorId);
    conditions.push(`creator_id = $${params.length}`);
  }
  if (filters?.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY created_at DESC';

  const rows = await queryRows<any>(sql, params);
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
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  }));
}

export async function createTicket(data: {
  creatorId: string;
  title: string;
  description: string;
  category: any;
  priority: any;
  deviceId?: string;
  errorCode?: string;
}): Promise<Ticket> {
  const id = `tkt_${Date.now()}`;
  const countRes = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM tickets');
  const count = parseInt(countRes?.count || '0', 10);
  const ticketNumber = `INC-${1045 + count}`;
  const status: TicketStatus = 'OPEN';

  await query(
    `INSERT INTO tickets (
       id, ticket_number, creator_id, title, description, category, priority, status,
       device_id, error_code, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      id,
      ticketNumber,
      data.creatorId,
      data.title,
      data.description,
      data.category,
      data.priority,
      status,
      data.deviceId || null,
      data.errorCode || null,
    ]
  );

  return {
    id,
    ticketNumber,
    creatorId: data.creatorId,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status,
    deviceId: data.deviceId,
    errorCode: data.errorCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateTicketStatus(
  ticketId: string, 
  status: TicketStatus, 
  details?: { resolutionSummary?: string; escalationReason?: string; assignedTo?: string }
): Promise<void> {
  const updates: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
  const params: any[] = [status];

  if (details?.resolutionSummary) {
    params.push(details.resolutionSummary);
    updates.push(`resolution_summary = $${params.length}`);
  }
  if (details?.escalationReason) {
    params.push(details.escalationReason);
    updates.push(`escalation_reason = $${params.length}`);
  }
  if (details?.assignedTo) {
    params.push(details.assignedTo);
    updates.push(`assigned_to = $${params.length}`);
  }

  params.push(ticketId);
  const sql = `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${params.length}`;
  await query(sql, params);
}

export async function addTicketMessage(
  ticketId: string, 
  senderType: 'USER' | 'AGENT' | 'SYSTEM', 
  message: string, 
  senderId?: string, 
  senderName?: string
): Promise<TicketMessage> {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await query(
    `INSERT INTO ticket_messages (id, ticket_id, sender_type, sender_id, sender_name, message, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [id, ticketId, senderType, senderId || null, senderName || null, message]
  );

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
// Employee Profiles & Accounts
// ==========================================
export async function getEmployeeAccount(userIdOrEmail: string): Promise<EmployeeProfile | null> {
  const row = await queryOne<any>(
    `SELECT e.* FROM employees e
     JOIN users u ON e.user_id = u.id
     WHERE e.user_id = $1 OR u.email = $2`,
    [userIdOrEmail, userIdOrEmail]
  );
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
    lastPasswordChange: row.last_password_change ? new Date(row.last_password_change).toISOString() : '',
    department: row.department,
  };
}

export async function updateAccountStatus(
  userId: string, 
  status: AccountStatus, 
  failedLoginCount?: number
): Promise<void> {
  if (failedLoginCount !== undefined) {
    await query(
      'UPDATE employees SET account_status = $1, failed_login_count = $2 WHERE user_id = $3',
      [status, failedLoginCount, userId]
    );
  } else {
    await query(
      'UPDATE employees SET account_status = $1 WHERE user_id = $2',
      [status, userId]
    );
  }
}

// ==========================================
// Devices
// ==========================================
export async function getDeviceStatus(deviceIdOrUser: string): Promise<Device | null> {
  const row = await queryOne<any>(
    'SELECT * FROM devices WHERE id = $1 OR user_id = $2',
    [deviceIdOrUser, deviceIdOrUser]
  );
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
    lastSeen: row.last_seen ? new Date(row.last_seen).toISOString() : new Date().toISOString(),
  };
}

// ==========================================
// System Status
// ==========================================
export async function getSystemStatus(serviceName: string): Promise<SystemStatus | null> {
  const row = await queryOne<any>(
    'SELECT * FROM system_status WHERE service_name = $1',
    [serviceName]
  );
  if (!row) return null;

  return {
    id: row.id,
    serviceName: row.service_name,
    displayName: row.display_name,
    status: row.status,
    latencyMs: row.latency_ms,
    incidentNotes: row.incident_notes,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function listAllSystemStatuses(): Promise<SystemStatus[]> {
  const rows = await queryRows<any>('SELECT * FROM system_status ORDER BY service_name ASC');
  return rows.map((r) => ({
    id: r.id,
    serviceName: r.service_name,
    displayName: r.display_name,
    status: r.status,
    latencyMs: r.latency_ms,
    incidentNotes: r.incident_notes,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  }));
}

export async function updateSystemStatus(
  serviceName: string, 
  status: ServiceHealth, 
  latencyMs?: number, 
  incidentNotes?: string
): Promise<void> {
  await query(
    `UPDATE system_status
     SET status = $1,
         latency_ms = COALESCE($2, latency_ms),
         incident_notes = COALESCE($3, incident_notes),
         updated_at = CURRENT_TIMESTAMP
     WHERE service_name = $4`,
    [status, latencyMs ?? null, incidentNotes ?? null, serviceName]
  );
}

// ==========================================
// Agent Runs & Actions
// ==========================================
export async function createAgentRun(ticketId: string, maxSteps: number = 10): Promise<AgentRun> {
  const id = `run_${Date.now()}`;
  await query(
    `INSERT INTO agent_runs (
       id, ticket_id, status, step_count, max_steps, confidence, current_diagnosis,
       evidence_json, created_at, updated_at
     ) VALUES ($1, $2, 'RUNNING', 0, $3, 0.0, NULL, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, ticketId, maxSteps]
  );

  return {
    id,
    ticketId,
    status: 'RUNNING',
    stepCount: 0,
    maxSteps,
    confidence: 0.0,
    evidence: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getAgentRun(ticketId: string): Promise<AgentRun | null> {
  const row = await queryOne<any>(
    'SELECT * FROM agent_runs WHERE ticket_id = $1 ORDER BY created_at DESC LIMIT 1',
    [ticketId]
  );
  if (!row) return null;

  let evidence: EvidenceItem[] = [];
  try {
    evidence = JSON.parse(row.evidence_json || '[]');
  } catch {
    evidence = [];
  }

  return {
    id: row.id,
    ticketId: row.ticket_id,
    status: row.status,
    stepCount: row.step_count,
    maxSteps: row.max_steps,
    confidence: row.confidence,
    currentDiagnosis: row.current_diagnosis,
    evidence,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function getOrCreateAgentRun(ticketId: string): Promise<AgentRun> {
  const existing = await getAgentRun(ticketId);
  if (existing) return existing;
  return await createAgentRun(ticketId);
}

export async function updateAgentRun(
  runId: string, 
  updates: {
    status?: any;
    stepCount?: number;
    confidence?: number;
    currentDiagnosis?: string;
    evidence?: EvidenceItem[];
    appendEvidence?: EvidenceItem;
  }
): Promise<void> {
  const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const params: any[] = [];

  if (updates.status) {
    params.push(updates.status);
    fields.push(`status = $${params.length}`);
  }
  if (updates.stepCount !== undefined) {
    params.push(updates.stepCount);
    fields.push(`step_count = $${params.length}`);
  }
  if (updates.confidence !== undefined) {
    params.push(updates.confidence);
    fields.push(`confidence = $${params.length}`);
  }
  if (updates.currentDiagnosis !== undefined) {
    params.push(updates.currentDiagnosis);
    fields.push(`current_diagnosis = $${params.length}`);
  }
  if (updates.appendEvidence) {
    const row = await queryOne<any>('SELECT evidence_json FROM agent_runs WHERE id = $1', [runId]);
    let currentEvidence: EvidenceItem[] = [];
    try {
      currentEvidence = JSON.parse(row?.evidence_json || '[]');
    } catch {
      currentEvidence = [];
    }
    currentEvidence.push(updates.appendEvidence);
    params.push(JSON.stringify(currentEvidence));
    fields.push(`evidence_json = $${params.length}`);
  } else if (updates.evidence) {
    params.push(JSON.stringify(updates.evidence));
    fields.push(`evidence_json = $${params.length}`);
  }

  params.push(runId);
  const sql = `UPDATE agent_runs SET ${fields.join(', ')} WHERE id = $${params.length}`;
  await query(sql, params);
}

export async function recordAgentAction(data: {
  agentRunId: string;
  stepNumber: number;
  actionType: string;
  toolName?: string;
  toolInput?: any;
  reasoningSummary: string;
  evidenceFindings?: string[];
}): Promise<AgentAction> {
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await query(
    `INSERT INTO agent_actions (
       id, agent_run_id, step_number, action_type, tool_name, tool_input,
       reasoning_summary, evidence_findings, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
    [
      id,
      data.agentRunId,
      data.stepNumber,
      data.actionType,
      data.toolName || null,
      data.toolInput ? JSON.stringify(data.toolInput) : null,
      data.reasoningSummary,
      data.evidenceFindings ? JSON.stringify(data.evidenceFindings) : null,
    ]
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

export async function getAgentActions(agentRunId: string): Promise<AgentAction[]> {
  const rows = await queryRows<any>(
    'SELECT * FROM agent_actions WHERE agent_run_id = $1 ORDER BY step_number ASC',
    [agentRunId]
  );

  return rows.map((r) => ({
    id: r.id,
    agentRunId: r.agent_run_id,
    stepNumber: r.step_number,
    actionType: r.action_type,
    toolName: r.tool_name,
    toolInput: r.tool_input ? JSON.parse(r.tool_input) : undefined,
    reasoningSummary: r.reasoning_summary,
    evidenceFindings: r.evidence_findings ? JSON.parse(r.evidence_findings) : undefined,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  }));
}

export async function getAgentRunDetails(ticketId: string): Promise<{
  run: AgentRun | null;
  actions: AgentAction[];
  toolCalls: ToolCallRecord[];
}> {
  const run = await getAgentRun(ticketId);
  if (!run) {
    return { run: null, actions: [], toolCalls: [] };
  }

  const actions = await getAgentActions(run.id);
  const toolCalls = await getToolCallsForTicket(ticketId);

  return { run, actions, toolCalls };
}

// ==========================================
// Tool Calls
// ==========================================
export async function recordToolCall(data: {
  agentActionId?: string;
  ticketId: string;
  toolName: string;
  inputParams: any;
  outputResult?: any;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'DENIED';
  errorMessage?: string;
  durationMs?: number;
}): Promise<ToolCallRecord> {
  const id = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await query(
    `INSERT INTO tool_calls (
       id, agent_action_id, ticket_id, tool_name, input_params, output_result,
       status, error_message, duration_ms, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
    [
      id,
      data.agentActionId || null,
      data.ticketId,
      data.toolName,
      JSON.stringify(data.inputParams),
      data.outputResult ? JSON.stringify(data.outputResult) : null,
      data.status,
      data.errorMessage || null,
      data.durationMs || 0,
    ]
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
    durationMs: data.durationMs || 0,
    createdAt: new Date().toISOString(),
  };
}

export async function getToolCallsForTicket(ticketId: string): Promise<ToolCallRecord[]> {
  const rows = await queryRows<any>(
    'SELECT * FROM tool_calls WHERE ticket_id = $1 ORDER BY created_at ASC',
    [ticketId]
  );

  return rows.map((r) => ({
    id: r.id,
    agentActionId: r.agent_action_id,
    ticketId: r.ticket_id,
    toolName: r.tool_name,
    inputParams: JSON.parse(r.input_params || '{}'),
    outputResult: r.output_result ? JSON.parse(r.output_result) : undefined,
    status: r.status,
    errorMessage: r.error_message,
    durationMs: r.duration_ms,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  }));
}

// ==========================================
// Human Approvals
// ==========================================
export async function createApproval(data: {
  ticketId: string;
  agentRunId: string;
  actionType: string;
  toolName: string;
  toolInput: any;
  riskLevel: RiskLevel;
  requestedBy: string;
}): Promise<ApprovalRequest> {
  const id = `appr_${Date.now()}`;
  await query(
    `INSERT INTO approvals (
       id, ticket_id, agent_run_id, action_type, tool_name, tool_input,
       risk_level, status, requested_by, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      id,
      data.ticketId,
      data.agentRunId,
      data.actionType,
      data.toolName,
      JSON.stringify(data.toolInput),
      data.riskLevel,
      data.requestedBy,
    ]
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

export async function getApprovalById(id: string): Promise<any | null> {
  return await queryOne<any>('SELECT * FROM approvals WHERE id = $1', [id]);
}

export async function getPendingApproval(ticketId: string): Promise<ApprovalRequest | null> {
  const row = await queryOne<any>(
    "SELECT * FROM approvals WHERE ticket_id = $1 AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1",
    [ticketId]
  );
  if (!row) return null;

  return {
    id: row.id,
    ticketId: row.ticket_id,
    agentRunId: row.agent_run_id,
    actionType: row.action_type,
    toolName: row.tool_name,
    toolInput: JSON.parse(row.tool_input || '{}'),
    riskLevel: row.risk_level,
    status: row.status,
    requestedBy: row.requested_by,
    reviewedBy: row.reviewed_by,
    reviewReason: row.review_reason,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function listPendingApprovals(ticketId?: string): Promise<ApprovalRequest[]> {
  let sql = "SELECT * FROM approvals WHERE status = 'PENDING'";
  const params: any[] = [];
  if (ticketId) {
    params.push(ticketId);
    sql += ' AND ticket_id = $1';
  }
  sql += ' ORDER BY created_at DESC';

  const rows = await queryRows<any>(sql, params);
  return rows.map((row) => ({
    id: row.id,
    ticketId: row.ticket_id,
    agentRunId: row.agent_run_id,
    actionType: row.action_type,
    toolName: row.tool_name,
    toolInput: JSON.parse(row.tool_input || '{}'),
    riskLevel: row.risk_level,
    status: row.status,
    requestedBy: row.requested_by,
    reviewedBy: row.reviewed_by,
    reviewReason: row.review_reason,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  }));
}

export async function resolveApproval(
  approvalId: string, 
  statusOrApproved: 'APPROVED' | 'REJECTED' | boolean, 
  reviewedBy?: string, 
  reason?: string
): Promise<ApprovalRequest | null> {
  const status = typeof statusOrApproved === 'boolean' 
    ? (statusOrApproved ? 'APPROVED' : 'REJECTED')
    : statusOrApproved;

  await query(
    `UPDATE approvals 
     SET status = $1, reviewed_by = $2, review_reason = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [status, reviewedBy || null, reason || null, approvalId]
  );

  const row = await queryOne<any>('SELECT * FROM approvals WHERE id = $1', [approvalId]);
  if (!row) return null;

  return {
    id: row.id,
    ticketId: row.ticket_id,
    agentRunId: row.agent_run_id,
    actionType: row.action_type,
    toolName: row.tool_name,
    toolInput: JSON.parse(row.tool_input || '{}'),
    riskLevel: row.risk_level,
    status: row.status,
    requestedBy: row.requested_by,
    reviewedBy: row.reviewed_by,
    reviewReason: row.review_reason,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

// ==========================================
// Audit Logs
// ==========================================
export async function recordAuditLog(data: {
  ticketId?: string;
  userId?: string;
  action: string;
  resource: string;
  riskLevel: RiskLevel;
  details?: any;
  ipAddress?: string;
}): Promise<AuditLog> {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await query(
    `INSERT INTO audit_logs (
       id, ticket_id, user_id, action, resource, risk_level, details, ip_address, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
    [
      id,
      data.ticketId || null,
      data.userId || null,
      data.action,
      data.resource,
      data.riskLevel,
      data.details ? JSON.stringify(data.details) : null,
      data.ipAddress || null,
    ]
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

export async function listAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const rows = await queryRows<any>(
    'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1',
    [limit]
  );

  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    userId: r.user_id,
    action: r.action,
    resource: r.resource,
    riskLevel: r.risk_level,
    details: r.details ? JSON.parse(r.details) : undefined,
    ipAddress: r.ip_address,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  }));
}

// ==========================================
// Knowledge Chunks (for RAG)
// ==========================================
export async function searchKnowledgeBaseChunks(): Promise<any[]> {
  return await queryRows<any>(
    'SELECT id, document_id, document_title, category, chunk_index, content, embedding_json FROM knowledge_chunks'
  );
}

// ==========================================
// Test / Lifecycle Helpers
// ==========================================
export async function clearTicketAgentData(ticketId: string): Promise<void> {
  await query('DELETE FROM agent_runs WHERE ticket_id = $1', [ticketId]);
  await query('DELETE FROM tool_calls WHERE ticket_id = $1', [ticketId]);
  await query('DELETE FROM approvals WHERE ticket_id = $1', [ticketId]);
}
