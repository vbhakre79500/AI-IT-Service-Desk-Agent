import { NextRequest, NextResponse } from 'next/server';
import { resumeAgentAfterApproval } from '@/lib/agent/orchestrator';
import { requireAuth, forbiddenResponse, handleAuthError } from '@/lib/auth/server';
import { canApproveRiskLevel } from '@/lib/auth/rbac';
import { getDatabase } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: approvalId } = await params;
    const user = await requireAuth(req);

    // Check approval record
    const db = getDatabase();
    const appr = db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as any;
    if (!appr) {
      return NextResponse.json({ success: false, error: 'Approval request not found' }, { status: 404 });
    }

    // Role-based authorization for risk level
    if (!canApproveRiskLevel(user.role, appr.risk_level)) {
      return forbiddenResponse(
        `Access denied: Role '${user.role}' is not authorized to approve ${appr.risk_level}-risk actions.`
      );
    }

    const result = await resumeAgentAfterApproval(
      appr.ticket_id,
      approvalId,
      true, // APPROVED
      user.name || user.email
    );

    return NextResponse.json({
      success: true,
      message: `Action '${appr.tool_name}' approved. Agent resumed.`,
      result,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Approval execution failed' },
      { status: 500 }
    );
  }
}

