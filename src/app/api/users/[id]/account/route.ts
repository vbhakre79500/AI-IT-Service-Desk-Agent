import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeAccount } from '@/lib/db/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = getEmployeeAccount(id);

    if (!account) {
      return NextResponse.json({ success: false, error: `Account '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      account,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get user account' },
      { status: 500 }
    );
  }
}
