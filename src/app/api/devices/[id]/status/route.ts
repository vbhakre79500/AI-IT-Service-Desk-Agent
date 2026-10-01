import { NextRequest, NextResponse } from 'next/server';
import { getDeviceStatus } from '@/lib/db/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const device = getDeviceStatus(id);

    if (!device) {
      return NextResponse.json({ success: false, error: `Device '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      device,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get device status' },
      { status: 500 }
    );
  }
}
