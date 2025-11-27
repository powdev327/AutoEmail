import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/events/latest - Get timestamp of the most recent event
// Used for smart polling - only refresh UI when new events occur
export async function GET() {
  try {
    const latestEvent = await prisma.emailEvent.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, emailId: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        lastEventTime: latestEvent?.createdAt?.toISOString() || null,
        lastEmailId: latestEvent?.emailId || null,
      },
    });
  } catch (error) {
    console.error('Error fetching latest event:', error);
    return NextResponse.json({
      success: true,
      data: { lastEventTime: null, lastEmailId: null },
    });
  }
}

