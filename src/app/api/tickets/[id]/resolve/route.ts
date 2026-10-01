import { NextRequest, NextResponse } from 'next/server';
import { updateTicketStatus, addTicketMessage, getTicketById, recordAuditLog } from '@/lib/db/queries';
import { requireAnyRole, handleAuthError } from '@/lib/auth/server';
import { z } from 'zod';

const ResolveSchema = z.object({
  resolutionSummary: z.string().min(3),
  verificationNotes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAnyRole(['IT_AGENT', 'IT_ADMIN'], req);
    const body = await req.json().catch(() => ({}));
    const validated = ResolveSchema.parse(body);

    const ticket = getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const fullSummary = validated.verificationNotes
      ? `${validated.resolutionSummary} (Verified: ${validated.verificationNotes})`
      : validated.resolutionSummary;

    updateTicketStatus(id, 'RESOLVED', {
      resolutionSummary: fullSummary,
    });

    addTicketMessage(
      id,
      'SYSTEM',
      `✅ Ticket manually resolved by ${user.name} (${user.role}).\nResolution: ${fullSummary}`,
      user.id,
      user.name
    );

    recordAuditLog({
      ticketId: id,
      userId: user.id,
      action: 'TICKET_MANUALLY_RESOLVED',
      resource: 'tickets',
      riskLevel: 'LOW',
      details: { resolutionSummary: fullSummary },
    });

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticket.ticketNumber} marked resolved.`,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Resolve failed' },
      { status: 500 }
    );
  }
}

