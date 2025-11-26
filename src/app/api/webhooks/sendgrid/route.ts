import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface SendGridEvent {
  event: string;
  email: string;
  timestamp: number;
  emailId?: string;
  sg_event_id?: string;
  sg_message_id?: string;
}

// POST /api/webhooks/sendgrid - Receive SendGrid webhook events
export async function POST(request: NextRequest) {
  try {
    const events: SendGridEvent[] = await request.json();

    console.log('Received SendGrid webhook events:', events.length);

    for (const event of events) {
      // We only care about open events
      if (event.event === 'open' && event.emailId) {
        console.log(`Email opened: ${event.emailId} by ${event.email}`);

        // Update the email record
        await prisma.email.update({
          where: { id: event.emailId },
          data: {
            openedAt: new Date(event.timestamp * 1000),
            openCount: {
              increment: 1,
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to SendGrid to prevent retries
    return NextResponse.json({ success: false, error: 'Processing error' });
  }
}

// GET endpoint for webhook verification (optional)
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}

