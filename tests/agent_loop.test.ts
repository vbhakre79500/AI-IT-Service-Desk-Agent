import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runAgentInvestigation, resumeAgentAfterApproval } from '../src/lib/agent/orchestrator';
import { getTicketById, getEmployeeAccount, updateAccountStatus, updateTicketStatus } from '../src/lib/db/queries';
import { getDatabase } from '../src/lib/db';

describe('Phase 7 & 8: Dynamic Agent Loop & Human Approval Tests', () => {
  it('Scenario 1: HR Portal Auth Failure should dynamically investigate, request approval, and resolve upon approval', async () => {
    // Reset test ticket state
    const db = getDatabase();
    db.prepare('DELETE FROM agent_runs WHERE ticket_id = ?').run('tkt_1042');
    db.prepare('DELETE FROM tool_calls WHERE ticket_id = ?').run('tkt_1042');
    db.prepare('DELETE FROM approvals WHERE ticket_id = ?').run('tkt_1042');
    updateTicketStatus('tkt_1042', 'OPEN');
    updateAccountStatus('usr_emp_01', 'LOCKED', 5);

    // 1. Initial autonomous investigation run
    const result1 = await runAgentInvestigation('tkt_1042', 10);

    // Agent must have stopped at approval
    assert.strictEqual(result1.status, 'WAITING_APPROVAL');
    assert.ok(result1.pendingApprovalId, 'Must have a pending approval ID');
    assert.ok(result1.evidence.length >= 3, 'Must have gathered evidence from multiple tools');

    // Verify tools used in trajectory
    const toolSources = result1.evidence.map((e) => e.source);
    assert.ok(toolSources.includes('search_knowledge_base'), 'Should have used search_knowledge_base');
    assert.ok(toolSources.includes('check_system_status'), 'Should have used check_system_status');
    assert.ok(toolSources.includes('check_user_account'), 'Should have used check_user_account');

    // 2. Human Approves Action
    const result2 = await resumeAgentAfterApproval(
      'tkt_1042',
      result1.pendingApprovalId!,
      true, // APPROVED
      'Alex Mercer (IT_AGENT)'
    );

    assert.strictEqual(result2.status, 'COMPLETED');

    // Verify account is actually unlocked in the database
    const emp = getEmployeeAccount('usr_emp_01');
    assert.strictEqual(emp?.accountStatus, 'ACTIVE');
    assert.strictEqual(emp?.failedLoginCount, 0);

    // Verify ticket is marked RESOLVED
    const ticket = getTicketById('tkt_1042');
    assert.strictEqual(ticket?.status, 'RESOLVED');
    assert.ok(ticket?.resolutionSummary?.includes('unlocked'));
  });

  it('Scenario 2: Git Server 502 Outage should dynamically select system status and escalate immediately', async () => {
    const db = getDatabase();
    db.prepare('DELETE FROM agent_runs WHERE ticket_id = ?').run('tkt_1044');
    db.prepare('DELETE FROM tool_calls WHERE ticket_id = ?').run('tkt_1044');
    db.prepare('DELETE FROM approvals WHERE ticket_id = ?').run('tkt_1044');
    updateTicketStatus('tkt_1044', 'OPEN');

    const res = await runAgentInvestigation('tkt_1044', 10);

    assert.strictEqual(res.status, 'ESCALATED');
    const toolSources = res.evidence.map((e) => e.source);
    assert.ok(toolSources.includes('check_system_status'), 'Should have checked system status for git');

    const ticket = getTicketById('tkt_1044');
    assert.strictEqual(ticket?.status, 'ESCALATED');
    assert.match(ticket?.escalationReason || '', /infrastructure outage/i);
  });
});
