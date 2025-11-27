import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/templates - Get all templates (history)
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to last 20 templates
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

