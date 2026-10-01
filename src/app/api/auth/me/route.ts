import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getAllPersonas } from '@/lib/auth/session';

export async function GET() {
  try {
    const currentUser = await getAuthenticatedUser();
    const personas = getAllPersonas();

    return NextResponse.json({
      success: true,
      user: currentUser,
      personas,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get authenticated user' },
      { status: 500 }
    );
  }
}
