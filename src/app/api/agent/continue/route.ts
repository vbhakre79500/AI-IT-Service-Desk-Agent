import { NextRequest, NextResponse } from 'next/server';
import { resumeAgentAfterApproval } from '@/lib/agent/orchestrator';
import { requireAuth, forbiddenResponse, handleAuthError } from '@/lib/auth/server';
import { canApproveRiskLevel, hasMinimumRole } from '@/lib/auth/rbac';
import { getApprovalById } from '@/lib/db/queries';
import { z } from 'zod';

const ContinueSchema = z.object({
  ticketId: z.string().min(1),
  approvalId: z.string().min(1),
  approved: z.boolean(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validated = ContinueSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: validated.error.issues },
        { status: 400 }
      );
    }

    const appr = await getApprovalById(validated.data.approvalId);
    if (!appr) {
      return NextResponse.json({ success: false, error: 'Approval request not found' }, { status: 404 });
    }

    if (validated.data.approved) {
      if (!canApproveRiskLevel(user.role, appr.risk_level)) {
        return forbiddenResponse(
          `Access denied: Role '${user.role}' is not authorized to approve ${appr.risk_level}-risk actions.`
        );
      }
    } else {
      if (!hasMinimumRole(user.role, 'IT_AGENT')) {
        return forbiddenResponse(
          `Access denied: Rejecting operational actions requires IT clearance.`
        );
      }
    }

    const result = await resumeAgentAfterApproval(
      validated.data.ticketId,
      validated.data.approvalId,
      validated.data.approved,
      user.name || user.email,
      validated.data.reason
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resume agent' },
      { status: 500 }
    );
  }
}

