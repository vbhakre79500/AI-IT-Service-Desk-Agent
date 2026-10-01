import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeBase } from '@/lib/rag/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        query: '',
        results: [],
      });
    }

    const results = searchKnowledgeBase(query, limit);

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Knowledge search failed' },
      { status: 500 }
    );
  }
}
