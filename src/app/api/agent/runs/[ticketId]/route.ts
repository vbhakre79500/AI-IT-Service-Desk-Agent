import { NextRequest, NextResponse } from 'next/server';
import { getAgentRunDetails } from '@/lib/db/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const details = await getAgentRunDetails(ticketId);

    return NextResponse.json({
      success: true,
      ticketId,
      ...details,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch agent run details' },
      { status: 500 }
    );
  }
}
