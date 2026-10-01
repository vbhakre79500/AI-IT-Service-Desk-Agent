import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  getTicketById, 
  listTickets, 
  getSystemStatus, 
  getEmployeeAccount, 
  updateAccountStatus,
  recordAuditLog,
  listAuditLogs 
} from '../src/lib/db/queries';
import { checkDatabaseConnectivity } from '../src/lib/db/index';

describe('PostgreSQL Database & Repository Tests', () => {
  it('should verify database connectivity and health probe', async () => {
    const health = await checkDatabaseConnectivity();
    assert.strictEqual(health.connected, true, 'Database must report connected=true');
    assert.ok(health.latencyMs >= 0, 'Latency must be non-negative');
    assert.ok(health.database, 'Database name/backend should be reported');
  });

  it('should fetch seeded tickets and initial messages', async () => {
    const ticket = await getTicketById('tkt_1042');
    assert.ok(ticket, 'Ticket tkt_1042 should exist');
    assert.strictEqual(ticket.ticketNumber, 'INC-1042');
    assert.strictEqual(ticket.category, 'Authentication');
    assert.ok(ticket.messages.length >= 1, 'Ticket should have at least 1 message');
  });

  it('should retrieve enterprise service statuses', async () => {
    const hr = await getSystemStatus('hr-portal');
    assert.ok(hr, 'HR Portal service should exist');
    assert.strictEqual(hr.status, 'OPERATIONAL');

    const git = await getSystemStatus('internal-git');
    assert.ok(git, 'Git service should exist');
    assert.strictEqual(git.status, 'OUTAGE');
  });

  it('should verify Sarah Connor account is locked for Demo 1, and can be updated', async () => {
    await updateAccountStatus('usr_emp_01', 'LOCKED', 5);
    const emp = await getEmployeeAccount('usr_emp_01');
    assert.ok(emp, 'Employee profile for Sarah Connor should exist');
    assert.strictEqual(emp.accountStatus, 'LOCKED');
    assert.strictEqual(emp.failedLoginCount, 5);

    // Test unlocking
    await updateAccountStatus('usr_emp_01', 'ACTIVE', 0);
    const updated = await getEmployeeAccount('usr_emp_01');
    assert.strictEqual(updated?.accountStatus, 'ACTIVE');
    assert.strictEqual(updated?.failedLoginCount, 0);

    // Reset back to LOCKED for Demo 1
    await updateAccountStatus('usr_emp_01', 'LOCKED', 5);
  });

  it('should record and query audit logs', async () => {
    const log = await recordAuditLog({
      ticketId: 'tkt_1042',
      userId: 'usr_agent_01',
      action: 'TEST_AUDIT_ACTION',
      resource: 'test_resource',
      riskLevel: 'LOW',
      details: { test: true },
    });

    assert.ok(log.id);
    assert.strictEqual(log.action, 'TEST_AUDIT_ACTION');

    const logs = await listAuditLogs(10);
    const found = logs.find((l) => l.action === 'TEST_AUDIT_ACTION');
    assert.ok(found, 'Recorded audit log must be retrievable');
  });
});
