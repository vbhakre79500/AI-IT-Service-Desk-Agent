import { NextRequest, NextResponse } from 'next/server';
import { getSystemStatus } from '@/lib/db/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;
    const status = getSystemStatus(service);

    if (!status) {
      return NextResponse.json({ success: false, error: `Service '${service}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      service: status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get service status' },
      { status: 500 }
    );
  }
}
