import { NextRequest, NextResponse } from 'next/server';
import { getDeviceStatus } from '@/lib/db/queries';
import { requireAuth, forbiddenResponse, handleAuthError } from '@/lib/auth/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const device = getDeviceStatus(id);

    if (!device) {
      return NextResponse.json({ success: false, error: `Device '${id}' not found` }, { status: 404 });
    }

    // Employees can only inspect their own assigned devices; IT staff can inspect any
    if (user.role === 'EMPLOYEE' && device.userId !== user.id) {
      return forbiddenResponse('Access denied: You can only view status for your assigned device.');
    }

    return NextResponse.json({
      success: true,
      device,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get device status' },
      { status: 500 }
    );
  }
}

