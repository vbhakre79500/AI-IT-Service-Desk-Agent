import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, addTicketMessage } from '@/lib/db/queries';
import { requireAuth, checkTicketAccess, forbiddenResponse, handleAuthError } from '@/lib/auth/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const ticket = await getTicketById(id);

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (!checkTicketAccess(ticket, user)) {
      return forbiddenResponse('Access denied: You do not have permission to view this ticket.');
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (!checkTicketAccess(ticket, user)) {
      return forbiddenResponse('Access denied: You do not have permission to post messages to this ticket.');
    }

    const body = await req.json();

    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty' }, { status: 400 });
    }

    const newMsg = await addTicketMessage(id, 'USER', body.message, user.id, user.name);

    return NextResponse.json({
      success: true,
      message: newMsg,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post message' },
      { status: 500 }
    );
  }
}

