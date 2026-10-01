import { z } from 'zod';

// ==========================================
// 1. User & Identity
// ==========================================
export type UserRole = 'EMPLOYEE' | 'IT_AGENT' | 'IT_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  createdAt: string;
}

export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'PASSWORD_EXPIRED';

export interface EmployeeProfile {
  id: string;
  userId: string;
  title: string;
  managerEmail: string;
  accountStatus: AccountStatus;
  mfaEnabled: boolean;
  mfaSynced: boolean;
  failedLoginCount: number;
  lastPasswordChange: string;
  department: string;
}

export type DeviceCompliance = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  os: string;
  osVersion: string;
  complianceStatus: DeviceCompliance;
  diskFreeGb: number;
  ipAddress: string;
  vpnClientVersion?: string;
  lastSeen: string;
}

// ==========================================
// 2. System Status & Services
// ==========================================
export type ServiceHealth = 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE' | 'MAINTENANCE';

export interface SystemStatus {
  id: string;
  serviceName: string;
  displayName: string;
  status: ServiceHealth;
  latencyMs: number;
  incidentNotes?: string;
  updatedAt: string;
}

// ==========================================
// 3. Tickets & Messages
// ==========================================
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 
  | 'OPEN'
  | 'INVESTIGATING'
  | 'AWAITING_APPROVAL'
  | 'AWAITING_USER'
  | 'RESOLVED'
  | 'ESCALATED'
  | 'CLOSED';

export type TicketCategory =
  | 'Authentication'
  | 'VPN'
  | 'Network'
  | 'Password'
  | 'Application'
  | 'Device'
  | 'Email'
  | 'Access'
  | 'Software'
  | 'Hardware'
  | 'Other';

export interface Ticket {
  id: string;
  ticketNumber: string;
  creatorId: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  deviceId?: string;
  errorCode?: string;
  resolutionSummary?: string;
  escalationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: 'USER' | 'AGENT' | 'SYSTEM';
  senderId?: string;
  senderName?: string;
  message: string;
  createdAt: string;
}

// ==========================================
// 4. Tools & Policy Engine
// ==========================================
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExecutionContext {
  ticketId: string;
  userId: string;
  userRole: UserRole;
  agentRunId?: string;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  requiredRole: UserRole;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  enabled: boolean;
  execute: (input: TInput, context: ExecutionContext) => Promise<TOutput>;
}

export type ToolCallStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'DENIED';

export interface ToolCallRecord {
  id: string;
  agentActionId?: string;
  ticketId: string;
  toolName: string;
  inputParams: Record<string, any>;
  outputResult?: Record<string, any>;
  status: ToolCallStatus;
  errorMessage?: string;
  durationMs: number;
  createdAt: string;
}

// ==========================================
// 5. Agent Runs & Actions
// ==========================================
export type AgentRunStatus = 
  | 'RUNNING' 
  | 'WAITING_APPROVAL' 
  | 'WAITING_INPUT' 
  | 'COMPLETED' 
  | 'ESCALATED' 
  | 'FAILED';

export interface EvidenceItem {
  id: string;
  source: string; // e.g. "search_knowledge_base", "check_system_status"
  summary: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface AgentRun {
  id: string;
  ticketId: string;
  status: AgentRunStatus;
  stepCount: number;
  maxSteps: number;
  confidence: number;
  currentDiagnosis?: string;
  evidence: EvidenceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentAction {
  id: string;
  agentRunId: string;
  stepNumber: number;
  actionType: 'TOOL_CALL' | 'ASK_USER' | 'REQUEST_APPROVAL' | 'RESOLVE' | 'ESCALATE';
  toolName?: string;
  toolInput?: Record<string, any>;
  reasoningSummary: string;
  evidenceFindings?: string[];
  createdAt: string;
}

// Structured output expected from LLM decision engine
export interface AgentDecision {
  status: 'investigating' | 'awaiting_approval' | 'awaiting_user' | 'resolved' | 'escalated';
  intent: string;
  confidence: number;
  reasoning_summary: string;
  next_action?: string;
  tool_name?: string;
  tool_params?: Record<string, any>;
  requires_approval: boolean;
  risk_level?: RiskLevel;
  diagnosis?: string;
  recommended_remediation?: string;
  verification_procedure?: string;
  question_for_user?: string;
  escalation_reason?: string;
}

// ==========================================
// 6. Human Approvals
// ==========================================
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalRequest {
  id: string;
  ticketId: string;
  agentRunId: string;
  actionType: string;
  toolName: string;
  toolInput: Record<string, any>;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  requestedBy: string;
  reviewedBy?: string;
  reviewReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 7. Knowledge Base & RAG
// ==========================================
export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  category: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  score?: number;
}

// ==========================================
// 8. Audit Log
// ==========================================
export interface AuditLog {
  id: string;
  ticketId?: string;
  userId?: string;
  action: string;
  resource: string;
  riskLevel: RiskLevel;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}
