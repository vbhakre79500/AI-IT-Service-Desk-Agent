import { NextRequest, NextResponse } from 'next/server';
import { listPendingApprovals } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId') || undefined;
    const approvals = listPendingApprovals(ticketId);

    return NextResponse.json({
      success: true,
      count: approvals.length,
      approvals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list pending approvals' },
      { status: 500 }
    );
  }
}
