import { describe, it } from 'node:test';
import assert from 'node:assert';
import { executeToolSafely, validatePolicy } from '../src/lib/policy/engine';
import { getTool } from '../src/lib/tools/index';

describe('Phase 6: Tool Registry & Policy Execution Tests', () => {
  const employeeCtx = {
    ticketId: 'tkt_1042',
    userId: 'usr_emp_01',
    userRole: 'EMPLOYEE' as const,
  };

  const agentCtx = {
    ticketId: 'tkt_1042',
    userId: 'usr_agent_01',
    userRole: 'IT_AGENT' as const,
  };

  it('should verify all 15 tools are registered with schemas', () => {
    const requiredTools = [
      'search_knowledge_base',
      'search_previous_tickets',
      'check_system_status',
      'check_user_account',
      'check_device_status',
      'check_network_status',
      'run_diagnostics',
      'clear_application_cache',
      'unlock_account',
      'reset_password',
      'restart_service',
      'create_ticket',
      'update_ticket',
      'close_ticket',
      'escalate_ticket',
    ];

    for (const name of requiredTools) {
      const tool = getTool(name);
      assert.ok(tool, `Tool '${name}' must be registered`);
      assert.ok(tool.riskLevel, `Tool '${name}' must have a risk level`);
      assert.ok(tool.inputSchema, `Tool '${name}' must have an inputSchema`);
    }
  });

  it('should execute check_system_status safely through policy engine', async () => {
    const res = await executeToolSafely(
      'check_system_status',
      { serviceName: 'hr-portal' },
      employeeCtx
    );

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.data?.serviceName, 'hr-portal');
    assert.strictEqual(res.data?.isHealthy, true);
    assert.ok(res.durationMs >= 0);
  });

  it('should reject unapproved sensitive actions per policy', async () => {
    // restart_service is HIGH risk, requires approval
    const res = await executeToolSafely(
      'restart_service',
      { serviceName: 'hr-portal', restartMode: 'GRACEFUL' },
      employeeCtx,
      false // NOT approved
    );

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 'DENIED');
  });

  it('should validate inputs using Zod schema and reject malformed parameters', async () => {
    const res = await executeToolSafely(
      'search_knowledge_base',
      { query: 'x' }, // query min 2 characters
      employeeCtx
    );

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 'FAILED');
    assert.match(res.error || '', /at least 2 characters/);
  });
});
