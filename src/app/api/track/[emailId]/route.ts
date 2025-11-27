import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { broadcastEmailOpened } from '@/lib/pusher';

// 1x1 transparent GIF pixel (base64)
const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

interface GeoData {
  country?: string;
  city?: string;
  region?: string;
}

/**
 * Get geolocation from IP address using free ipapi.co service (HTTPS)
 */
async function getGeoFromIP(ip: string): Promise<GeoData | null> {
  // Skip for localhost/private IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'Unknown') {
    return null;
  }

  try {
    // Using ipapi.co which supports HTTPS and has free tier (1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000),
      headers: {
        'User-Agent': 'EmailTracker/1.0',
      },
    });
    
    if (!response.ok) {
      console.error('Geo lookup failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Geo lookup error:', data.reason);
      return null;
    }
    
    return {
      country: data.country_name,
      city: data.city,
      region: data.region,
    };
  } catch (error) {
    console.error('Geo lookup error:', error);
    return null;
  }
}

/**
 * Parse user agent to readable format
 */
function parseUserAgent(ua: string): string {
  if (!ua) return 'Unknown';
  
  // Detect device type
  let device = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile';
  if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet';
  
  // Detect browser/client
  let client = 'Unknown';
  if (ua.includes('Gmail')) client = 'Gmail';
  else if (ua.includes('Outlook') || ua.includes('Microsoft')) client = 'Outlook';
  else if (ua.includes('Yahoo')) client = 'Yahoo Mail';
  else if (ua.includes('Chrome')) client = 'Chrome';
  else if (ua.includes('Safari')) client = 'Safari';
  else if (ua.includes('Firefox')) client = 'Firefox';
  else if (ua.includes('Edge')) client = 'Edge';
  
  // Detect OS
  let os = '';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'Mac';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  
  return `${client} on ${os} ${device}`.trim();
}

/**
 * Format geo location string
 */
function formatGeoLocation(geo: GeoData | null): string | null {
  if (!geo) return null;
  
  const parts: string[] = [];
  if (geo.city) parts.push(geo.city);
  if (geo.region) parts.push(geo.region);
  if (geo.country) parts.push(geo.country);
  
  return parts.length > 0 ? parts.join(', ') : null;
}

// GET /api/track/[emailId] - Track email open and return pixel
export async function GET(
  request: NextRequest,
  { params }: { params: { emailId: string } }
) {
  const { emailId } = params;
  
  // Debug mode: add ?debug=true to see tracking info as JSON
  const debug = request.nextUrl.searchParams.get('debug') === 'true';
  
  // Get tracking data from request
  // Note: Gmail proxies images through googleusercontent.com, so IP will be Google's, not recipient's
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'Unknown';
  
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const timestamp = new Date();
  
  // Detect if request came through Gmail proxy
  const isGmailProxy = userAgent.includes('GoogleImageProxy') || 
                       userAgent.includes('Google') ||
                       forwardedFor?.includes('googleusercontent');
  
  // If debug mode, return info as JSON instead of pixel
  if (debug) {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      select: { id: true, email: true, status: true, openedAt: true, openCount: true }
    });
    return NextResponse.json({
      emailId,
      emailFound: !!email,
      emailData: email,
      detectedIp: ip,
      detectedUserAgent: userAgent,
      timestamp: timestamp.toISOString(),
    });
  }
  
  console.log(`📧 Email opened: ${emailId}`);
  console.log(`   IP: ${ip}${isGmailProxy ? ' (Gmail Proxy - not recipient IP)' : ''}`);
  console.log(`   User-Agent: ${userAgent}`);

  // Process tracking BEFORE returning response (required for serverless)
  try {
    // Get geo data (with timeout to prevent slow responses)
    const geoPromise = getGeoFromIP(ip);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const geo = await Promise.race([geoPromise, timeoutPromise]);
    
    const geoLocation = formatGeoLocation(geo);
    const parsedUA = parseUserAgent(userAgent);
    
    console.log(`   Location: ${geoLocation || 'Unknown'}`);
    console.log(`   Device: ${parsedUA}`);

    // Check if email exists
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (email) {
      // Update email record
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'OPENED',
          openedAt: email.openedAt || timestamp, // Keep first open time
          openCount: { increment: 1 },
          ipAddress: ip !== 'Unknown' ? ip : email.ipAddress,
          userAgent: parsedUA,
          geoLocation: geoLocation || email.geoLocation,
        },
      });

      // Create event record
      await prisma.emailEvent.create({
        data: {
          emailId: emailId,
          event: 'open',
          status: 'OPENED',
          ipAddress: ip !== 'Unknown' ? ip : null,
          userAgent: parsedUA,
          geoLocation: geoLocation,
          timestamp: timestamp,
        },
      });

      // Broadcast real-time update via Pusher
      await broadcastEmailOpened({
        emailId,
        status: 'OPENED',
        openedAt: timestamp.toISOString(),
        openCount: (email.openCount || 0) + 1,
        ipAddress: ip !== 'Unknown' ? ip : undefined,
        userAgent: parsedUA,
        geoLocation: geoLocation || undefined,
      });

      console.log(`   ✅ Tracked successfully`);
    } else {
      console.log(`   ⚠️ Email not found: ${emailId}`);
    }
  } catch (error) {
    console.error('Tracking error:', error);
    // Don't fail the request - still return the pixel
  }

  // Return transparent pixel after tracking is complete
  return new NextResponse(TRANSPARENT_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_PIXEL.length.toString(),
      // Prevent caching so each open is tracked
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

