import { NextRequest, NextResponse } from 'next/server';
import { listPendingApprovals, getTicketById } from '@/lib/db/queries';
import { requireAuth, checkTicketAccess, forbiddenResponse, handleAuthError } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId') || undefined;

    // If no ticketId is requested, it's the global operational queue -> requires IT_AGENT or IT_ADMIN
    if (!ticketId) {
      if (user.role === 'EMPLOYEE') {
        return forbiddenResponse('Access denied: Viewing global approvals queue requires IT clearance.');
      }
    } else {
      // If a specific ticketId is requested, verify ticket access
      const ticket = getTicketById(ticketId);
      if (ticket && !checkTicketAccess(ticket, user)) {
        return forbiddenResponse('Access denied: You do not have permission to view approvals for this ticket.');
      }
    }

    const approvals = listPendingApprovals(ticketId);

    return NextResponse.json({
      success: true,
      count: approvals.length,
      approvals,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list pending approvals' },
      { status: 500 }
    );
  }
}

