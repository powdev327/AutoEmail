import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status } from '@prisma/client';

interface SendGridEvent {
  event: string;
  email: string;
  timestamp: number;
  emailId?: string;
  ip?: string;
  useragent?: string;
  sg_event_id?: string;
  sg_message_id?: string;
  reason?: string;
  status?: string;
  response?: string;
  // Geo data (when available)
  geo?: {
    city?: string;
    country?: string;
    region?: string;
  };
}

// Map SendGrid events to our status enum
const eventToStatus: Record<string, Status> = {
  processed: 'SENT',
  delivered: 'DELIVERED',
  open: 'OPENED',
  click: 'OPENED', // Click implies opened
  bounce: 'BOUNCED',
  blocked: 'BLOCKED',
  dropped: 'DROPPED',
  deferred: 'SENT',
  spamreport: 'BLOCKED',
  unsubscribe: 'BLOCKED',
};

/**
 * Parse user agent to get a readable format
 */
function parseUserAgent(ua?: string): string | null {
  if (!ua) return null;
  
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
  if (ua.includes('Android')) return 'Android Device';
  if (ua.includes('Windows')) {
    if (ua.includes('Edge')) return 'Edge on Windows';
    if (ua.includes('Chrome')) return 'Chrome on Windows';
    if (ua.includes('Firefox')) return 'Firefox on Windows';
    return 'Windows';
  }
  if (ua.includes('Mac')) {
    if (ua.includes('Chrome')) return 'Chrome on Mac';
    if (ua.includes('Safari')) return 'Safari on Mac';
    if (ua.includes('Firefox')) return 'Firefox on Mac';
    return 'Mac';
  }
  if (ua.includes('Linux')) return 'Linux';
  
  return ua.length > 50 ? ua.substring(0, 50) + '...' : ua;
}

/**
 * Format geo location from SendGrid data
 */
function formatGeoLocation(geo?: { city?: string; country?: string; region?: string }): string | null {
  if (!geo) return null;
  
  const parts: string[] = [];
  if (geo.city) parts.push(geo.city);
  if (geo.region) parts.push(geo.region);
  if (geo.country) parts.push(geo.country);
  
  return parts.length > 0 ? parts.join(', ') : null;
}

// POST /api/webhooks/sendgrid - Receive SendGrid webhook events
export async function POST(request: NextRequest) {
  try {
    const events: SendGridEvent[] = await request.json();

    console.log('Received SendGrid webhook events:', events.length);

    for (const event of events) {
      console.log(`Event: ${event.event}, Email: ${event.email}, EmailId: ${event.emailId}`);
      
      if (!event.emailId) {
        console.log('No emailId in event, skipping');
        continue;
      }

      const newStatus = eventToStatus[event.event];
      
      if (!newStatus) {
        console.log(`Unknown event type: ${event.event}, skipping`);
        continue;
      }

      const timestamp = new Date(event.timestamp * 1000);
      const userAgent = parseUserAgent(event.useragent);
      const geoLocation = formatGeoLocation(event.geo);
      const errorReason = ['bounce', 'blocked', 'dropped', 'spamreport'].includes(event.event)
        ? event.reason || event.response || `${event.event}: ${event.status || 'Unknown reason'}`
        : null;

      console.log(`Processing event: ${event.event} -> Status: ${newStatus}`);

      try {
        // 1. Always create an event record for history
        await prisma.emailEvent.create({
          data: {
            emailId: event.emailId,
            event: event.event,
            status: newStatus,
            ipAddress: event.ip || null,
            userAgent: userAgent,
            geoLocation: geoLocation,
            errorReason: errorReason,
            rawData: JSON.stringify(event),
            timestamp: timestamp,
          },
        });
        console.log(`Created event record for ${event.event}`);

        // 2. Update the email's current status
        if (event.event === 'open') {
          await prisma.email.update({
            where: { id: event.emailId },
            data: {
              status: newStatus,
              openedAt: timestamp,
              openCount: { increment: 1 },
              ipAddress: event.ip || null,
              userAgent: userAgent,
              geoLocation: geoLocation,
            },
          });
        } else if (['bounce', 'blocked', 'dropped', 'spamreport'].includes(event.event)) {
          await prisma.email.update({
            where: { id: event.emailId },
            data: {
              status: newStatus,
              lastError: errorReason,
            },
          });
        } else if (event.event === 'delivered') {
          await prisma.email.update({
            where: { id: event.emailId },
            data: {
              status: newStatus,
              lastError: null,
            },
          });
        } else {
          await prisma.email.update({
            where: { id: event.emailId },
            data: {
              status: newStatus,
            },
          });
        }
        
        console.log(`Updated email ${event.emailId} to status: ${newStatus}`);
      } catch (dbError) {
        console.error(`Failed to process event for email ${event.emailId}:`, dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: 'Processing error' });
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}
