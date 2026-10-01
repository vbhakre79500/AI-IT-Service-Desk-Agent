import { NextRequest, NextResponse } from 'next/server';
import { runAgentInvestigation } from '@/lib/agent/orchestrator';
import { z } from 'zod';

const RequestSchema = z.object({
  ticketId: z.string().min(1),
  maxSteps: z.number().optional().default(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: validated.error.issues },
        { status: 400 }
      );
    }

    const result = await runAgentInvestigation(validated.data.ticketId, validated.data.maxSteps);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Agent investigation failed' },
      { status: 500 }
    );
  }
}
