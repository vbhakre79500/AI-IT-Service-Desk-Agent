import { NextRequest, NextResponse } from 'next/server';
import { resumeAgentAfterApproval } from '@/lib/agent/orchestrator';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { z } from 'zod';

const ContinueSchema = z.object({
  ticketId: z.string().min(1),
  approvalId: z.string().min(1),
  approved: z.boolean(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();
    const validated = ContinueSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: validated.error.issues },
        { status: 400 }
      );
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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resume agent' },
      { status: 500 }
    );
  }
}
