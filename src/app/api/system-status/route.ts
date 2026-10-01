import { NextResponse } from 'next/server';
import { listAllSystemStatuses } from '@/lib/db/queries';

export async function GET() {
  try {
    const services = listAllSystemStatuses();
    return NextResponse.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get system statuses' },
      { status: 500 }
    );
  }
}
