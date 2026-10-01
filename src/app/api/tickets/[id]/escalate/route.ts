import { NextRequest, NextResponse } from 'next/server';
import { updateTicketStatus, addTicketMessage, getTicketById, recordAuditLog } from '@/lib/db/queries';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { z } from 'zod';

const EscalateSchema = z.object({
  reason: z.string().min(3),
  targetTier: z.string().default('TIER_2_HELPDESK'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    const body = await req.json().catch(() => ({}));
    const validated = EscalateSchema.parse(body);

    const ticket = getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    updateTicketStatus(id, 'ESCALATED', {
      escalationReason: `[${validated.targetTier}] Manual escalation by ${user.name}: ${validated.reason}`,
    });

    addTicketMessage(
      id,
      'SYSTEM',
      `⚠️ Ticket manually escalated to ${validated.targetTier} by ${user.name} (${user.role}).\nReason: ${validated.reason}`,
      user.id,
      user.name
    );

    recordAuditLog({
      ticketId: id,
      userId: user.id,
      action: 'TICKET_MANUALLY_ESCALATED',
      resource: 'tickets',
      riskLevel: 'MEDIUM',
      details: { reason: validated.reason, targetTier: validated.targetTier },
    });

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticket.ticketNumber} escalated to ${validated.targetTier}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Escalation failed' },
      { status: 500 }
    );
  }
}
