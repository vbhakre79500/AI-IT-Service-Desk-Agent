import { NextRequest, NextResponse } from 'next/server';
import { runAgentInvestigation } from '@/lib/agent/orchestrator';
import { requireAuth, checkTicketAccess, forbiddenResponse, handleAuthError } from '@/lib/auth/server';
import { getTicketById } from '@/lib/db/queries';
import { z } from 'zod';

const RequestSchema = z.object({
  ticketId: z.string().min(1),
  maxSteps: z.number().optional().default(10),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const body = await req.json();
    const validated = RequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: validated.error.issues },
        { status: 400 }
      );
    }

    // Verify ticket existence and ownership
    const ticket = getTicketById(validated.data.ticketId);
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (!checkTicketAccess(ticket, user)) {
      return forbiddenResponse('Access denied: You do not have permission to trigger investigations for this ticket.');
    }

    const result = await runAgentInvestigation(validated.data.ticketId, validated.data.maxSteps);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Agent investigation failed' },
      { status: 500 }
    );
  }
}

