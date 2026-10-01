import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hasMinimumRole, assertMinimumRole, canApproveRiskLevel, canRoleExecuteTool } from '../src/lib/auth/rbac';

describe('Phase 3: RBAC & Permission Tests', () => {
  it('should verify role hierarchy correctly', () => {
    assert.strictEqual(hasMinimumRole('EMPLOYEE', 'EMPLOYEE'), true);
    assert.strictEqual(hasMinimumRole('EMPLOYEE', 'IT_AGENT'), false);
    assert.strictEqual(hasMinimumRole('EMPLOYEE', 'IT_ADMIN'), false);

    assert.strictEqual(hasMinimumRole('IT_AGENT', 'EMPLOYEE'), true);
    assert.strictEqual(hasMinimumRole('IT_AGENT', 'IT_AGENT'), true);
    assert.strictEqual(hasMinimumRole('IT_AGENT', 'IT_ADMIN'), false);

    assert.strictEqual(hasMinimumRole('IT_ADMIN', 'EMPLOYEE'), true);
    assert.strictEqual(hasMinimumRole('IT_ADMIN', 'IT_AGENT'), true);
    assert.strictEqual(hasMinimumRole('IT_ADMIN', 'IT_ADMIN'), true);
  });

  it('should enforce role approval rights based on risk level', () => {
    // EMPLOYEE cannot approve MEDIUM or HIGH
    assert.strictEqual(canApproveRiskLevel('EMPLOYEE', 'MEDIUM'), false);
    assert.strictEqual(canApproveRiskLevel('EMPLOYEE', 'HIGH'), false);
    assert.strictEqual(canApproveRiskLevel('EMPLOYEE', 'CRITICAL'), false);

    // IT_AGENT can approve MEDIUM but NOT HIGH
    assert.strictEqual(canApproveRiskLevel('IT_AGENT', 'MEDIUM'), true);
    assert.strictEqual(canApproveRiskLevel('IT_AGENT', 'HIGH'), false);

    // IT_ADMIN can approve HIGH
    assert.strictEqual(canApproveRiskLevel('IT_ADMIN', 'HIGH'), true);
    assert.strictEqual(canApproveRiskLevel('IT_ADMIN', 'CRITICAL'), false); // blocked in prototype
  });

  it('should prevent unauthorized tool execution without approval', () => {
    // Unapproved MEDIUM risk action by employee
    const res1 = canRoleExecuteTool('EMPLOYEE', 'EMPLOYEE', 'MEDIUM', false);
    assert.strictEqual(res1.allowed, false);
    assert.match(res1.reason || '', /prior human approval/);

    // Approved MEDIUM risk action by employee
    const res2 = canRoleExecuteTool('EMPLOYEE', 'EMPLOYEE', 'MEDIUM', true);
    assert.strictEqual(res2.allowed, true);

    // Unapproved HIGH risk action by IT_AGENT
    const res3 = canRoleExecuteTool('IT_AGENT', 'IT_AGENT', 'HIGH', false);
    assert.strictEqual(res3.allowed, false);

    // Disallowed role for IT_ADMIN tool
    const res4 = canRoleExecuteTool('EMPLOYEE', 'IT_ADMIN', 'LOW', true);
    assert.strictEqual(res4.allowed, false);
    assert.match(res4.reason || '', /lacks permission/);
  });
});
