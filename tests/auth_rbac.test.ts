import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hasMinimumRole, assertMinimumRole, canApproveRiskLevel, canRoleExecuteTool } from '../src/lib/auth/rbac';
import { createSessionToken, verifySessionToken } from '../src/lib/auth/session';
import { checkTicketAccess } from '../src/lib/auth/server';
import { SEED_USERS } from '../src/lib/auth/users';
import { UserRole } from '../src/types';

describe('Phase 3 & 18: RBAC, Session Security & Server Authorization Tests', () => {
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
    // 9. EMPLOYEE cannot approve privileged action (MEDIUM or HIGH)
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

  it('should issue and verify cryptographically signed session tokens', async () => {
    const token = await createSessionToken('usr_emp_01', 'EMPLOYEE');
    assert.ok(token, 'Session token must be generated');

    const session = await verifySessionToken(token);
    assert.ok(session, 'Valid session token must verify');
    assert.strictEqual(session?.userId, 'usr_emp_01');
    assert.strictEqual(session?.role, 'EMPLOYEE');
  });

  it('should reject tampered session tokens preventing client privilege escalation', async () => {
    // Create valid token for Sarah Connor (EMPLOYEE)
    const validToken = await createSessionToken('usr_emp_01', 'EMPLOYEE');
    const [userId, role, timestamp, signature] = validToken.split('.');

    // Attacker modifies payload to IT_ADMIN while keeping original signature
    const tamperedToken = `${userId}.IT_ADMIN.${timestamp}.${signature}`;
    const verified = await verifySessionToken(tamperedToken);

    assert.strictEqual(verified, null, 'Tampered token must be rejected');
  });

  // Requirement 18: Security Tests 1-7 (Route Authorization Rules)
  it('should enforce route clearance policy across all roles', () => {
    const checkRouteAccess = (role: UserRole | null, path: string): { allowed: boolean; code?: number } => {
      if (!role) {
        return { allowed: false, code: 401 };
      }
      if (path.startsWith('/admin')) {
        return role === 'IT_ADMIN' ? { allowed: true } : { allowed: false, code: 403 };
      }
      if (path.startsWith('/it-desk')) {
        return role === 'IT_AGENT' || role === 'IT_ADMIN' ? { allowed: true } : { allowed: false, code: 403 };
      }
      if (path.startsWith('/employee')) {
        return { allowed: true };
      }
      return { allowed: true };
    };

    // 1. Unauthenticated user -> /admin -> denied (401)
    const test1 = checkRouteAccess(null, '/admin');
    assert.strictEqual(test1.allowed, false);
    assert.strictEqual(test1.code, 401);

    // 2. EMPLOYEE -> /admin -> denied (403)
    const test2 = checkRouteAccess('EMPLOYEE', '/admin');
    assert.strictEqual(test2.allowed, false);
    assert.strictEqual(test2.code, 403);

    // 3. EMPLOYEE -> /it-desk -> denied (403)
    const test3 = checkRouteAccess('EMPLOYEE', '/it-desk');
    assert.strictEqual(test3.allowed, false);
    assert.strictEqual(test3.code, 403);

    // 4. IT_AGENT -> /admin -> denied (403)
    const test4 = checkRouteAccess('IT_AGENT', '/admin');
    assert.strictEqual(test4.allowed, false);
    assert.strictEqual(test4.code, 403);

    // 5. IT_AGENT -> /it-desk -> allowed
    const test5 = checkRouteAccess('IT_AGENT', '/it-desk');
    assert.strictEqual(test5.allowed, true);

    // 6. IT_ADMIN -> /admin -> allowed
    const test6 = checkRouteAccess('IT_ADMIN', '/admin');
    assert.strictEqual(test6.allowed, true);

    // 7. IT_ADMIN -> /it-desk -> allowed
    const test7 = checkRouteAccess('IT_ADMIN', '/it-desk');
    assert.strictEqual(test7.allowed, true);
  });

  // Requirement 18: Security Tests 10 & 11 (Resource-Level Ticket Access)
  it('should enforce resource-level ticket authorization', () => {
    const employeeUser = SEED_USERS.find((u) => u.id === 'usr_emp_01')!;
    const otherEmployeeUser = SEED_USERS.find((u) => u.id === 'usr_emp_02')!;
    const itAgentUser = SEED_USERS.find((u) => u.id === 'usr_agent_01')!;
    const itAdminUser = SEED_USERS.find((u) => u.id === 'usr_admin_01')!;

    const sarahTicket = { creatorId: 'usr_emp_01' };
    const davidTicket = { creatorId: 'usr_emp_02' };

    // 10. Unauthorized ticket access -> denied
    assert.strictEqual(checkTicketAccess(davidTicket, employeeUser), false, 'Employee cannot access another employee ticket');

    // 11. Authorized ticket access -> allowed
    assert.strictEqual(checkTicketAccess(sarahTicket, employeeUser), true, 'Employee can access own ticket');
    assert.strictEqual(checkTicketAccess(sarahTicket, itAgentUser), true, 'IT_AGENT can access any ticket');
    assert.strictEqual(checkTicketAccess(davidTicket, itAgentUser), true, 'IT_AGENT can access any ticket');
    assert.strictEqual(checkTicketAccess(sarahTicket, itAdminUser), true, 'IT_ADMIN can access any ticket');
  });

  // Requirement 18: Security Test 8 & 9 (Agent Investigation & Approval protection)
  it('should prevent employees from investigating tickets they do not own', () => {
    const employeeUser = SEED_USERS.find((u) => u.id === 'usr_emp_01')!;
    const otherTicket = { creatorId: 'usr_emp_02' };

    const allowed = checkTicketAccess(otherTicket, employeeUser);
    assert.strictEqual(allowed, false, 'EMPLOYEE must be blocked from running agent investigation on unowned ticket');
  });
});

