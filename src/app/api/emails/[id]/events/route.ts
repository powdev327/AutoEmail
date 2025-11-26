import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/emails/[id]/events - Get all events for an email
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const events = await prisma.emailEvent.findMany({
      where: { emailId: id },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching email events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

