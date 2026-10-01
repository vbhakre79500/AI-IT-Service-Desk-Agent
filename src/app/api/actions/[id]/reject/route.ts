import { NextRequest, NextResponse } from 'next/server';
import { resumeAgentAfterApproval } from '@/lib/agent/orchestrator';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getDatabase } from '@/lib/db';
import { z } from 'zod';

const RejectSchema = z.object({
  reason: z.string().optional().default('Rejected by reviewer'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: approvalId } = await params;
    const user = await getAuthenticatedUser();
    const body = await req.json().catch(() => ({}));
    const validated = RejectSchema.parse(body);

    const db = getDatabase();
    const appr = db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as any;
    if (!appr) {
      return NextResponse.json({ success: false, error: 'Approval request not found' }, { status: 404 });
    }

    const result = await resumeAgentAfterApproval(
      appr.ticket_id,
      approvalId,
      false, // REJECTED
      user.name || user.email,
      validated.reason
    );

    return NextResponse.json({
      success: true,
      message: `Action '${appr.tool_name}' rejected.`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Rejection failed' },
      { status: 500 }
    );
  }
}
