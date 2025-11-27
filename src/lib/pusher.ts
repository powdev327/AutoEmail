import Pusher from 'pusher';

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  // Check if Pusher is configured
  if (!process.env.PUSHER_APP_ID || 
      !process.env.PUSHER_KEY || 
      !process.env.PUSHER_SECRET || 
      !process.env.PUSHER_CLUSTER) {
    return null;
  }

  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherServer;
}

// Event types
export interface EmailUpdateEvent {
  emailId: string;
  status: string;
  openedAt?: string;
  openCount?: number;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: string;
}

// Channel and event names
export const PUSHER_CHANNEL = 'email-updates';
export const PUSHER_EVENT_EMAIL_OPENED = 'email-opened';

// Broadcast email opened event
export async function broadcastEmailOpened(data: EmailUpdateEvent): Promise<boolean> {
  const pusher = getPusherServer();
  
  if (!pusher) {
    console.log('Pusher not configured, skipping broadcast');
    return false;
  }

  try {
    await pusher.trigger(PUSHER_CHANNEL, PUSHER_EVENT_EMAIL_OPENED, data);
    console.log(`📡 Pusher: Broadcasted email-opened for ${data.emailId}`);
    return true;
  } catch (error) {
    console.error('Pusher broadcast error:', error);
    return false;
  }
}

