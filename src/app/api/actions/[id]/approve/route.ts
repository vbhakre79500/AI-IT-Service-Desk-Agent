import { NextRequest, NextResponse } from 'next/server';
import { resumeAgentAfterApproval } from '@/lib/agent/orchestrator';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getDatabase } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: approvalId } = await params;
    const user = await getAuthenticatedUser();

    // Check approval record
    const db = getDatabase();
    const appr = db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as any;
    if (!appr) {
      return NextResponse.json({ success: false, error: 'Approval request not found' }, { status: 404 });
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
    return NextResponse.json(
      { success: false, error: error.message || 'Approval execution failed' },
      { status: 500 }
    );
  }
}
