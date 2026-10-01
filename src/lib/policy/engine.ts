import { 
  ExecutionContext, 
  ToolCallRecord, 
  RiskLevel, 
  UserRole 
} from '@/types';
import { getTool } from '../tools';
import { canRoleExecuteTool } from '../auth/rbac';
import { recordToolCall, recordAuditLog } from '../db/queries';

export interface PolicyValidationResult {
  allowed: boolean;
  requiresApproval: boolean;
  riskLevel: RiskLevel;
  reason?: string;
}

export interface ToolExecutionResponse {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'DENIED';
  data?: any;
  error?: string;
  durationMs: number;
  toolCallRecord: ToolCallRecord;
}

/**
 * Validates whether an agent action is permitted to execute
 */
export function validatePolicy(
  toolName: string,
  userRole: UserRole,
  isApproved: boolean = false
): PolicyValidationResult {
  const tool = getTool(toolName);
  if (!tool) {
    return {
      allowed: false,
      requiresApproval: false,
      riskLevel: 'HIGH',
      reason: `Tool '${toolName}' is not registered in system registry.`,
    };
  }

  if (!tool.enabled) {
    return {
      allowed: false,
      requiresApproval: false,
      riskLevel: tool.riskLevel,
      reason: `Tool '${toolName}' is currently disabled by administrator.`,
    };
  }

  // Check RBAC & risk rules
  const check = canRoleExecuteTool(userRole, tool.requiredRole, tool.riskLevel, isApproved);
  if (!check.allowed) {
    return {
      allowed: false,
      requiresApproval: tool.requiresApproval && !isApproved,
      riskLevel: tool.riskLevel,
      reason: check.reason,
    };
  }

  return {
    allowed: true,
    requiresApproval: tool.requiresApproval && !isApproved,
    riskLevel: tool.riskLevel,
  };
}

/**
 * Executes a tool safely through the policy engine guard with schema validation,
 * execution timing, audit logging, and safe error trapping.
 */
export async function executeToolSafely(
  toolName: string,
  inputParams: Record<string, any>,
  context: ExecutionContext,
  isApproved: boolean = false,
  agentActionId?: string
): Promise<ToolExecutionResponse> {
  const startTime = Date.now();
  const tool = getTool(toolName);

  if (!tool) {
    const durationMs = Date.now() - startTime;
    const tc = recordToolCall({
      agentActionId,
      ticketId: context.ticketId,
      toolName,
      inputParams,
      status: 'DENIED',
      errorMessage: `Tool '${toolName}' does not exist.`,
      durationMs,
    });
    return {
      success: false,
      status: 'DENIED',
      error: `Tool '${toolName}' is not recognized.`,
      durationMs,
      toolCallRecord: tc,
    };
  }

  // 1. Policy & Authorization Check
  const policy = validatePolicy(toolName, context.userRole, isApproved);
  if (!policy.allowed) {
    const durationMs = Date.now() - startTime;
    const tc = recordToolCall({
      agentActionId,
      ticketId: context.ticketId,
      toolName,
      inputParams,
      status: 'DENIED',
      errorMessage: policy.reason,
      durationMs,
    });

    recordAuditLog({
      ticketId: context.ticketId,
      userId: context.userId,
      action: `TOOL_EXECUTION_BLOCKED: ${toolName}`,
      resource: toolName,
      riskLevel: tool.riskLevel,
      details: { inputParams, reason: policy.reason },
    });

    return {
      success: false,
      status: 'DENIED',
      error: policy.reason || 'Permission denied by policy engine.',
      durationMs,
      toolCallRecord: tc,
    };
  }

  // 2. Input Schema Validation
  const validation = tool.inputSchema.safeParse(inputParams);
  if (!validation.success) {
    const durationMs = Date.now() - startTime;
    const errorMsg = `Input validation failed: ${validation.error.issues.map((i) => i.message).join(', ')}`;
    const tc = recordToolCall({
      agentActionId,
      ticketId: context.ticketId,
      toolName,
      inputParams,
      status: 'FAILED',
      errorMessage: errorMsg,
      durationMs,
    });

    return {
      success: false,
      status: 'FAILED',
      error: errorMsg,
      durationMs,
      toolCallRecord: tc,
    };
  }

  // 3. Execution with Timeout & Catch
  try {
    const executionPromise = tool.execute(validation.data, context);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Tool '${toolName}' timed out after 10000ms`)), 10000)
    );

    const result = (await Promise.race([executionPromise, timeoutPromise])) as any;
    const durationMs = Date.now() - startTime;

    const tc = recordToolCall({
      agentActionId,
      ticketId: context.ticketId,
      toolName,
      inputParams: validation.data,
      outputResult: result,
      status: 'SUCCESS',
      durationMs,
    });

    recordAuditLog({
      ticketId: context.ticketId,
      userId: context.userId,
      action: `TOOL_EXECUTED: ${toolName}`,
      resource: toolName,
      riskLevel: tool.riskLevel,
      details: { input: validation.data, success: true },
    });

    return {
      success: true,
      status: 'SUCCESS',
      data: result,
      durationMs,
      toolCallRecord: tc,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const isTimeout = err.message?.includes('timed out');
    const status = isTimeout ? 'TIMEOUT' : 'FAILED';
    const errorMsg = err.message || 'Tool execution encountered an unknown error';

    const tc = recordToolCall({
      agentActionId,
      ticketId: context.ticketId,
      toolName,
      inputParams: validation.data,
      status,
      errorMessage: errorMsg,
      durationMs,
    });

    recordAuditLog({
      ticketId: context.ticketId,
      userId: context.userId,
      action: `TOOL_EXECUTION_FAILED: ${toolName}`,
      resource: toolName,
      riskLevel: tool.riskLevel,
      details: { input: validation.data, error: errorMsg },
    });

    return {
      success: false,
      status,
      error: errorMsg,
      durationMs,
      toolCallRecord: tc,
    };
  }
}
