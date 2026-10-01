import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/db/queries';
import { requireRole, handleAuthError } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireRole('IT_ADMIN', req);

    const logs = listAuditLogs(100);
    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list audit logs' },
      { status: 500 }
    );
  }
}

