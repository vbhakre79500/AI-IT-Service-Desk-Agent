import { NextRequest, NextResponse } from 'next/server';
import { setSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

const SwitchSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = SwitchSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await setSessionUser(validated.data.userId);

    return NextResponse.json({
      success: true,
      user,
      message: `Switched active persona to ${user.name} (${user.role})`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to switch user' },
      { status: 500 }
    );
  }
}
