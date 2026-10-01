import { NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/db/queries';

export async function GET() {
  try {
    const logs = listAuditLogs(100);
    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list audit logs' },
      { status: 500 }
    );
  }
}
