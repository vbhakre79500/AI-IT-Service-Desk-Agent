import { User, UserRole, RiskLevel } from '@/types';

// Role hierarchy rank for comparison
const ROLE_HIERARCHY: Record<UserRole, number> = {
  EMPLOYEE: 1,
  IT_AGENT: 2,
  IT_ADMIN: 3,
};

/**
 * Validates if the user has at least the required role
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Asserts that the user has at least the required role, throwing an error otherwise
 */
export function assertMinimumRole(userRole: UserRole, requiredRole: UserRole): void {
  if (!hasMinimumRole(userRole, requiredRole)) {
    throw new Error(
      `Access Denied: Required role '${requiredRole}', but current user has '${userRole}'`
    );
  }
}

/**
 * Determines whether a user with a given role can approve an action of a specific risk level
 */
export function canApproveRiskLevel(userRole: UserRole, riskLevel: RiskLevel): boolean {
  switch (riskLevel) {
    case 'LOW':
      return true; // No approval usually needed, but anyone can approve
    case 'MEDIUM':
      // Medium actions (e.g. account unlock) can be approved by IT_AGENT or IT_ADMIN
      return userRole === 'IT_AGENT' || userRole === 'IT_ADMIN';
    case 'HIGH':
      // High actions (e.g. service restart) can ONLY be approved by IT_ADMIN
      return userRole === 'IT_ADMIN';
    case 'CRITICAL':
      // Critical destructive actions are blocked in this prototype
      return false;
    default:
      return false;
  }
}

/**
 * Determines if a tool can be executed by the given role
 */
export function canRoleExecuteTool(
  userRole: UserRole, 
  toolRequiredRole: UserRole,
  toolRiskLevel: RiskLevel,
  isApproved: boolean
): { allowed: boolean; reason?: string } {
  // 1. Role hierarchy check
  if (!hasMinimumRole(userRole, toolRequiredRole)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' lacks permission for this tool (requires '${toolRequiredRole}').`,
    };
  }

  // 2. Risk level and approval enforcement
  if (toolRiskLevel === 'CRITICAL') {
    return {
      allowed: false,
      reason: 'CRITICAL risk actions are disabled in this environment by policy.',
    };
  }

  if (toolRiskLevel === 'HIGH' && !isApproved && userRole !== 'IT_ADMIN') {
    return {
      allowed: false,
      reason: 'HIGH risk action requires explicit IT_ADMIN authorization.',
    };
  }

  if (toolRiskLevel === 'MEDIUM' && !isApproved) {
    return {
      allowed: false,
      reason: 'MEDIUM risk action requires prior human approval.',
    };
  }

  return { allowed: true };
}
