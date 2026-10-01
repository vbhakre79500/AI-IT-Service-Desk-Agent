import { NextRequest, NextResponse } from 'next/server';
import { listTickets, createTicket } from '@/lib/db/queries';
import { requireAuth, handleAuthError } from '@/lib/auth/server';
import { z } from 'zod';

const CreateTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.string().default('Other'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  deviceId: z.string().optional(),
  errorCode: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const filterUser = searchParams.get('all') === 'true' && user.role !== 'EMPLOYEE' ? undefined : user.role === 'EMPLOYEE' ? user.id : undefined;
    const status = searchParams.get('status') || undefined;

    const tickets = listTickets({ creatorId: filterUser, status });

    return NextResponse.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list tickets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validated = CreateTicketSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const ticket = createTicket({
      creatorId: user.id,
      title: validated.data.title,
      description: validated.data.description,
      category: validated.data.category,
      priority: validated.data.priority,
      deviceId: validated.data.deviceId,
      errorCode: validated.data.errorCode,
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: `Ticket ${ticket.ticketNumber} created successfully.`,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

