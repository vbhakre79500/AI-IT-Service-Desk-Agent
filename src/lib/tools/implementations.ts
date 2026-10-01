import { z } from 'zod';
import { 
  ToolDefinition, 
  ExecutionContext, 
  RiskLevel, 
  UserRole,
  ServiceHealth 
} from '@/types';
import { searchKnowledgeBase } from '../rag/service';
import { 
  getTicketById, 
  listTickets, 
  getSystemStatus, 
  listAllSystemStatuses,
  getEmployeeAccount, 
  updateAccountStatus, 
  getDeviceStatus,
  updateTicketStatus,
  addTicketMessage,
  createTicket
} from '../db/queries';

// ==========================================
// 1. Knowledge Base Tool
// ==========================================
export const searchKnowledgeBaseTool: ToolDefinition = {
  name: 'search_knowledge_base',
  description: 'Search approved enterprise IT runbooks, standard operating procedures, and troubleshooting documentation.',
  inputSchema: z.object({
    query: z.string().min(2, 'Query must be at least 2 characters'),
    limit: z.number().optional().default(3),
  }),
  outputSchema: z.object({
    results: z.array(z.any()),
    count: z.number(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ query, limit }, _ctx) => {
    const results = await searchKnowledgeBase(query, limit || 3);
    return {
      results: results.map((r) => ({
        title: r.documentTitle,
        category: r.category,
        content: r.content,
        relevanceScore: r.similarityScore,
      })),
      count: results.length,
    };
  },
};

// ==========================================
// 2. Previous Tickets Tool
// ==========================================
export const searchPreviousTicketsTool: ToolDefinition = {
  name: 'search_previous_tickets',
  description: 'Search past resolved IT incidents to discover historical resolutions and recurrence patterns.',
  inputSchema: z.object({
    category: z.string().optional(),
    keyword: z.string().optional(),
  }),
  outputSchema: z.object({
    tickets: z.array(z.any()),
    count: z.number(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ category, keyword }, _ctx) => {
    const all = await listTickets();
    const filtered = all.filter((t) => {
      if (category && t.category.toLowerCase() !== category.toLowerCase()) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        return t.title.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw);
      }
      return true;
    });

    return {
      tickets: filtered.map((t) => ({
        ticketNumber: t.ticketNumber,
        title: t.title,
        category: t.category,
        status: t.status,
        resolutionSummary: t.resolutionSummary,
      })),
      count: filtered.length,
    };
  },
};

// ==========================================
// 3. System Status Tool
// ==========================================
export const checkSystemStatusTool: ToolDefinition = {
  name: 'check_system_status',
  description: 'Check whether an IT service or application (e.g. hr-portal, vpn-gateway, sso-okta, corp-email, internal-git) is operational.',
  inputSchema: z.object({
    serviceName: z.string().min(1, 'Service name is required'),
  }),
  outputSchema: z.object({
    serviceName: z.string(),
    displayName: z.string(),
    status: z.string(),
    latencyMs: z.number(),
    incidentNotes: z.string().optional(),
    isHealthy: z.boolean(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ serviceName }, _ctx) => {
    const cleanName = serviceName.toLowerCase().trim();
    let service = await getSystemStatus(cleanName);

    // Flexible fallback match if user asks for "hr portal" or "workday"
    if (!service) {
      const all = await listAllSystemStatuses();
      service = all.find((s) => 
        s.serviceName.includes(cleanName) || 
        s.displayName.toLowerCase().includes(cleanName)
      ) || null;
    }

    if (!service) {
      return {
        serviceName,
        displayName: serviceName,
        status: 'UNKNOWN',
        latencyMs: -1,
        incidentNotes: `Service '${serviceName}' not found in registry.`,
        isHealthy: false,
      };
    }

    return {
      serviceName: service.serviceName,
      displayName: service.displayName,
      status: service.status,
      latencyMs: service.latencyMs,
      incidentNotes: service.incidentNotes || 'All health checks passing.',
      isHealthy: service.status === 'OPERATIONAL',
    };
  },
};

// ==========================================
// 4. User Account Tool
// ==========================================
export const checkUserAccountTool: ToolDefinition = {
  name: 'check_user_account',
  description: 'Check employee Active Directory account status, lock state, failed login attempts, MFA sync, and password age.',
  inputSchema: z.object({
    userId: z.string().optional(),
  }),
  outputSchema: z.object({
    userId: z.string(),
    accountStatus: z.string(),
    isLocked: z.boolean(),
    failedLoginCount: z.number(),
    mfaEnabled: z.boolean(),
    mfaSynced: z.boolean(),
    lastPasswordChange: z.string(),
    department: z.string(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ userId }, ctx) => {
    // If no userId specified, inspect the ticket creator's account
    const targetUserId = userId || ctx.userId;
    const account = await getEmployeeAccount(targetUserId);

    if (!account) {
      throw new Error(`Account for user '${targetUserId}' not found in enterprise directory.`);
    }

    return {
      userId: account.userId,
      accountStatus: account.accountStatus,
      isLocked: account.accountStatus === 'LOCKED',
      failedLoginCount: account.failedLoginCount,
      mfaEnabled: account.mfaEnabled,
      mfaSynced: account.mfaSynced,
      lastPasswordChange: account.lastPasswordChange,
      department: account.department,
    };
  },
};

// ==========================================
// 5. Device Status Tool
// ==========================================
export const checkDeviceStatusTool: ToolDefinition = {
  name: 'check_device_status',
  description: 'Check simulated employee device status, OS version, MDM compliance, disk space, and installed VPN client version.',
  inputSchema: z.object({
    deviceId: z.string().optional(),
  }),
  outputSchema: z.object({
    deviceId: z.string(),
    deviceName: z.string(),
    os: z.string(),
    complianceStatus: z.string(),
    diskFreeGb: z.number(),
    vpnClientVersion: z.string().optional(),
    isCompliant: z.boolean(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ deviceId }, ctx) => {
    const targetId = deviceId || ctx.userId;
    const device = await getDeviceStatus(targetId);

    if (!device) {
      throw new Error(`Device '${targetId}' not found in endpoint management.`);
    }

    return {
      deviceId: device.id,
      deviceName: device.deviceName,
      os: `${device.os} (${device.osVersion})`,
      complianceStatus: device.complianceStatus,
      diskFreeGb: device.diskFreeGb,
      vpnClientVersion: device.vpnClientVersion,
      isCompliant: device.complianceStatus === 'COMPLIANT',
    };
  },
};

// ==========================================
// 6. Network Status Tool
// ==========================================
export const checkNetworkStatusTool: ToolDefinition = {
  name: 'check_network_status',
  description: 'Check simulated client network connectivity, DNS resolution, latency, and captive portal state.',
  inputSchema: z.object({
    targetHost: z.string().optional().default('vpn.cyberdyne.corp'),
  }),
  outputSchema: z.object({
    targetHost: z.string(),
    dnsResolved: z.boolean(),
    resolvedIp: z.string(),
    rttLatencyMs: z.number(),
    packetLossPct: z.number(),
    captivePortalDetected: z.boolean(),
    status: z.string(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ targetHost }, _ctx) => {
    // Realistic simulated network diagnostics
    return {
      targetHost,
      dnsResolved: true,
      resolvedIp: '198.51.100.24',
      rttLatencyMs: 24,
      packetLossPct: 0.0,
      captivePortalDetected: false,
      status: 'HEALTHY',
    };
  },
};

// ==========================================
// 7. Diagnostics Procedure Tool
// ==========================================
export const runDiagnosticsTool: ToolDefinition = {
  name: 'run_diagnostics',
  description: 'Run approved non-invasive IT diagnostics (e.g. auth handshake ping, token validity check, SSL cipher verification).',
  inputSchema: z.object({
    diagnosticType: z.enum(['AUTH_HANDSHAKE', 'VPN_TUNNEL_TEST', 'DNS_INTEGRITY', 'MFA_SYNC_CHECK']),
    targetResource: z.string(),
  }),
  outputSchema: z.object({
    diagnosticType: z.string(),
    passed: z.boolean(),
    details: z.string(),
    recommendedAction: z.string().optional(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ diagnosticType, targetResource }, ctx) => {
    if (diagnosticType === 'AUTH_HANDSHAKE') {
      const account = await getEmployeeAccount(ctx.userId);
      if (account?.accountStatus === 'LOCKED') {
        return {
          diagnosticType,
          passed: false,
          details: 'Authentication handshake failed: HTTP 403 Forbidden. AD account lockout flag detected.',
          recommendedAction: 'unlock_account',
        };
      }
      return {
        diagnosticType,
        passed: true,
        details: 'Authentication handshake successful: Identity provider accepted credentials.',
      };
    }

    if (diagnosticType === 'VPN_TUNNEL_TEST') {
      const device = await getDeviceStatus(ctx.userId);
      if (device?.vpnClientVersion?.includes('outdated')) {
        return {
          diagnosticType,
          passed: false,
          details: `VPN handshake rejected: client version ${device.vpnClientVersion} incompatible with gateway TLS 1.3 requirement.`,
          recommendedAction: 'clear_application_cache',
        };
      }
      return {
        diagnosticType,
        passed: true,
        details: 'VPN tunnel negotiation successful.',
      };
    }

    return {
      diagnosticType,
      passed: true,
      details: `Diagnostic test on ${targetResource} passed with 0 anomalies.`,
    };
  },
};

// ==========================================
// 8. Unlock Account (MEDIUM - Requires Approval)
// ==========================================
export const unlockAccountTool: ToolDefinition = {
  name: 'unlock_account',
  description: 'Unlock an employee Active Directory account that was locked due to excessive failed attempts.',
  inputSchema: z.object({
    userId: z.string().min(1, 'Target user ID is required'),
    reason: z.string().min(5, 'Reason for unlocking is required'),
  }),
  outputSchema: z.object({
    userId: z.string(),
    previousStatus: z.string(),
    newStatus: z.string(),
    unlockedAt: string(),
    success: z.boolean(),
  }),
  requiredRole: 'IT_AGENT',
  riskLevel: 'MEDIUM',
  requiresApproval: true,
  enabled: true,
  execute: async ({ userId, reason }, _ctx) => {
    const account = await getEmployeeAccount(userId);
    if (!account) {
      throw new Error(`Cannot unlock: user '${userId}' does not exist.`);
    }

    const previousStatus = account.accountStatus;
    // Perform state transition
    await updateAccountStatus(userId, 'ACTIVE', 0);

    return {
      userId,
      previousStatus,
      newStatus: 'ACTIVE',
      unlockedAt: new Date().toISOString(),
      success: true,
    };
  },
};

// ==========================================
// 9. Clear Application Cache (MEDIUM - Requires Approval)
// ==========================================
export const clearApplicationCacheTool: ToolDefinition = {
  name: 'clear_application_cache',
  description: 'Clear local or server-side cached state, session tokens, or corrupt cookies for a supported application (e.g. GlobalProtect, Workday, Outlook).',
  inputSchema: z.object({
    applicationName: z.string().min(1),
    userId: z.string().optional(),
  }),
  outputSchema: z.object({
    applicationName: z.string(),
    clearedBytes: z.number(),
    status: z.string(),
    success: z.boolean(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'MEDIUM',
  requiresApproval: true,
  enabled: true,
  execute: async ({ applicationName, userId }, ctx) => {
    return {
      applicationName,
      clearedBytes: 428000,
      status: `Successfully flushed cache and session storage for application '${applicationName}' on user ${userId || ctx.userId}.`,
      success: true,
    };
  },
};

// ==========================================
// 10. Reset Password (MEDIUM - Requires Approval)
// ==========================================
export const resetPasswordTool: ToolDefinition = {
  name: 'reset_password',
  description: 'Issue a secure temporary password and trigger password reset procedure for an authorized user.',
  inputSchema: z.object({
    userId: z.string().min(1),
    deliveryMethod: z.enum(['SMS_OTP', 'MANAGER_ESCROW', 'TEMPORARY_EMAIL']),
  }),
  outputSchema: z.object({
    userId: z.string(),
    deliveryMethod: z.string(),
    expiresInMinutes: z.number(),
    status: z.string(),
    success: z.boolean(),
  }),
  requiredRole: 'IT_AGENT',
  riskLevel: 'MEDIUM',
  requiresApproval: true,
  enabled: true,
  execute: async ({ userId, deliveryMethod }, _ctx) => {
    await updateAccountStatus(userId, 'ACTIVE', 0);
    return {
      userId,
      deliveryMethod,
      expiresInMinutes: 30,
      status: `Secure temporary credential token dispatched via ${deliveryMethod}. User prompted to create new 14-char passphrase upon next sign-in.`,
      success: true,
    };
  },
};

// ==========================================
// 11. Restart Service (HIGH - Requires IT_ADMIN Approval)
// ==========================================
export const restartServiceTool: ToolDefinition = {
  name: 'restart_service',
  description: 'Restart an approved localized enterprise IT service instance or application gateway.',
  inputSchema: z.object({
    serviceName: z.string().min(1),
    restartMode: z.enum(['GRACEFUL', 'FORCE']),
  }),
  outputSchema: z.object({
    serviceName: z.string(),
    status: z.string(),
    restartedAt: z.string(),
    uptimeSeconds: z.number(),
    success: z.boolean(),
  }),
  requiredRole: 'IT_ADMIN',
  riskLevel: 'HIGH',
  requiresApproval: true,
  enabled: true,
  execute: async ({ serviceName, restartMode }, _ctx) => {
    return {
      serviceName,
      status: `Service '${serviceName}' restarted successfully in ${restartMode} mode. Health checks returned HTTP 200.`,
      restartedAt: new Date().toISOString(),
      uptimeSeconds: 1,
      success: true,
    };
  },
};

// ==========================================
// 12. Create Ticket Tool
// ==========================================
export const createTicketTool: ToolDefinition = {
  name: 'create_ticket',
  description: 'System management: Create an IT ticket record.',
  inputSchema: z.object({
    title: z.string().min(3),
    description: z.string().min(5),
    category: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  }),
  outputSchema: z.object({
    ticketId: z.string(),
    ticketNumber: z.string(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async (data, ctx) => {
    const t = await createTicket({
      creatorId: ctx.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
    });
    return { ticketId: t.id, ticketNumber: t.ticketNumber };
  },
};

// ==========================================
// 13. Update Ticket Tool
// ==========================================
export const updateTicketTool: ToolDefinition = {
  name: 'update_ticket',
  description: 'Append progress, diagnosis notes, or comments to the ticket history.',
  inputSchema: z.object({
    ticketId: z.string(),
    message: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ ticketId, message }, _ctx) => {
    await addTicketMessage(ticketId, 'AGENT', message, 'agent_ai', 'AutoDesk AI Agent');
    return { success: true };
  },
};

// ==========================================
// 14. Close Ticket Tool
// ==========================================
export const closeTicketTool: ToolDefinition = {
  name: 'close_ticket',
  description: 'Mark ticket as RESOLVED after verifying that the remediation succeeded and service is confirmed operational.',
  inputSchema: z.object({
    ticketId: z.string(),
    resolutionSummary: z.string().min(5),
    verificationProof: z.string().min(5),
  }),
  outputSchema: z.object({
    ticketId: z.string(),
    status: z.string(),
    success: z.boolean(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ ticketId, resolutionSummary, verificationProof }, _ctx) => {
    await updateTicketStatus(ticketId, 'RESOLVED', {
      resolutionSummary: `${resolutionSummary} [Verification: ${verificationProof}]`,
    });
    await addTicketMessage(
      ticketId,
      'SYSTEM',
      `✅ Issue successfully resolved by AutoDesk AI.\nSummary: ${resolutionSummary}\nVerification: ${verificationProof}`,
      'system',
      'System Resolution'
    );
    return { ticketId, status: 'RESOLVED', success: true };
  },
};

// ==========================================
// 15. Escalate Ticket Tool
// ==========================================
export const escalateTicketTool: ToolDefinition = {
  name: 'escalate_ticket',
  description: 'Escalate ticket to human IT Tier-2 / Tier-3 support when automated resolution is blocked, confidence is low, or infrastructure outages require SRE.',
  inputSchema: z.object({
    ticketId: z.string(),
    escalationReason: z.string().min(5),
    targetTier: z.enum(['TIER_2_HELPDESK', 'TIER_3_DEVOPS_SRE', 'SECURITY_NOC']),
    evidenceSummary: z.string(),
  }),
  outputSchema: z.object({
    ticketId: z.string(),
    status: z.string(),
    success: z.boolean(),
  }),
  requiredRole: 'EMPLOYEE',
  riskLevel: 'LOW',
  requiresApproval: false,
  enabled: true,
  execute: async ({ ticketId, escalationReason, targetTier, evidenceSummary }, _ctx) => {
    await updateTicketStatus(ticketId, 'ESCALATED', {
      escalationReason: `[${targetTier}] ${escalationReason} (Evidence: ${evidenceSummary})`,
    });
    await addTicketMessage(
      ticketId,
      'SYSTEM',
      `⚠️ Ticket escalated to ${targetTier}.\nReason: ${escalationReason}\nEvidence Dossier: ${evidenceSummary}`,
      'system',
      'Human IT Escalation'
    );
    return { ticketId, status: 'ESCALATED', success: true };
  },
};

function string(): z.ZodString {
  return z.string();
}
