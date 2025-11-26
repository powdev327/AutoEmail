import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

// Map SendGrid events to our status
const eventToStatus: Record<string, string> = {
  delivered: 'DELIVERED',
  open: 'OPENED',
  bounce: 'BOUNCED',
  blocked: 'BLOCKED',
  dropped: 'DROPPED',
  deferred: 'SENT', // Still trying, keep as sent
  spamreport: 'BLOCKED',
};

/**
 * Parse user agent to get a readable format
 */
function parseUserAgent(ua?: string): string | null {
  if (!ua) return null;
  
  // Simplify user agent string
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
  
  // Return truncated version if can't parse
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

      // Build update data based on event type
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      // For delivery failure events, store the reason
      if (['bounce', 'blocked', 'dropped', 'spamreport'].includes(event.event)) {
        const errorReason = event.reason || event.response || `${event.event}: ${event.status || 'Unknown reason'}`;
        updateData.lastError = errorReason;
        console.log(`Delivery failed: ${errorReason}`);
      }

      // For open events, capture tracking data
      if (event.event === 'open') {
        updateData.openedAt = new Date(event.timestamp * 1000);
        updateData.openCount = { increment: 1 };
        updateData.ipAddress = event.ip || null;
        updateData.userAgent = parseUserAgent(event.useragent);
        updateData.geoLocation = formatGeoLocation(event.geo);
        console.log(`Email opened - IP: ${event.ip}, Location: ${formatGeoLocation(event.geo)}`);
      }

      // For delivered events, clear any previous error
      if (event.event === 'delivered') {
        updateData.lastError = null;
        console.log('Email delivered successfully');
      }

      try {
        await prisma.email.update({
          where: { id: event.emailId },
          data: updateData,
        });
        console.log(`Updated email ${event.emailId} to status: ${newStatus}`);
      } catch (dbError) {
        console.error(`Failed to update email ${event.emailId}:`, dbError);
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
