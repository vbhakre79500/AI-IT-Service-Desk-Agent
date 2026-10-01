import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeAccount } from '@/lib/db/queries';
import { requireAuth, forbiddenResponse, handleAuthError } from '@/lib/auth/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Employees can only inspect their own account; IT_AGENT and IT_ADMIN can inspect any
    if (user.role === 'EMPLOYEE' && user.id !== id && user.email !== id) {
      return forbiddenResponse('Access denied: You can only view your own account information.');
    }

    const account = getEmployeeAccount(id);

    if (!account) {
      return NextResponse.json({ success: false, error: `Account '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      account,
    });
  } catch (error: any) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get user account' },
      { status: 500 }
    );
  }
}

