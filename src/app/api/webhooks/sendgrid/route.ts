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
  // Geo data (when available)
  geo?: {
    city?: string;
    country?: string;
    region?: string;
  };
}

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
      // Handle open events
      if (event.event === 'open' && event.emailId) {
        console.log(`Email opened: ${event.emailId} by ${event.email}`);
        console.log(`IP: ${event.ip}, UserAgent: ${event.useragent}`);
        console.log(`Geo:`, event.geo);

        // Parse the data
        const userAgent = parseUserAgent(event.useragent);
        const geoLocation = formatGeoLocation(event.geo);

        // Update the email record
        await prisma.email.update({
          where: { id: event.emailId },
          data: {
            openedAt: new Date(event.timestamp * 1000),
            openCount: {
              increment: 1,
            },
            ipAddress: event.ip || null,
            userAgent: userAgent,
            geoLocation: geoLocation,
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
