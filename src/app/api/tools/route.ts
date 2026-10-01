import { NextResponse } from 'next/server';
import { ALL_TOOLS } from '@/lib/tools';

export async function GET() {
  try {
    const tools = ALL_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      riskLevel: t.riskLevel,
      requiresApproval: t.requiresApproval,
      requiredRole: t.requiredRole,
      enabled: t.enabled,
    }));

    return NextResponse.json({
      success: true,
      count: tools.length,
      tools,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list tools' },
      { status: 500 }
    );
  }
}
