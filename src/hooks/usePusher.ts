'use client';

import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';

const PUSHER_CHANNEL = 'email-updates';
const PUSHER_EVENT_EMAIL_OPENED = 'email-opened';

interface EmailUpdateEvent {
  emailId: string;
  status: string;
  openedAt?: string;
  openCount?: number;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: string;
}

interface UsePusherOptions {
  onEmailOpened?: (data: EmailUpdateEvent) => void;
  enabled?: boolean;
}

export function usePusher({ onEmailOpened, enabled = true }: UsePusherOptions) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);

  const connect = useCallback(() => {
    // Check if Pusher is configured
    // Note: Next.js only exposes env vars prefixed with NEXT_PUBLIC_ to the client
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.log('Pusher not configured (missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER)');
      return;
    }

    // Don't reconnect if already connected
    if (pusherRef.current) return;

    try {
      // Initialize Pusher with proper WebSocket configuration
      pusherRef.current = new Pusher(key, {
        cluster,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        disabledTransports: [],
      });

      // Wait for connection before subscribing
      pusherRef.current.connection.bind('connected', () => {
        console.log('📡 Pusher WebSocket connected');
      });

      pusherRef.current.connection.bind('error', (err: any) => {
        console.error('Pusher connection error:', err);
      });

      pusherRef.current.connection.bind('disconnected', () => {
        console.log('📡 Pusher disconnected');
      });

      // Subscribe to channel
      channelRef.current = pusherRef.current.subscribe(PUSHER_CHANNEL);

      // Wait for subscription to be successful
      channelRef.current.bind('pusher:subscription_succeeded', () => {
        console.log('📡 Pusher subscribed to channel:', PUSHER_CHANNEL);
      });

      // Bind to email-opened event
      if (onEmailOpened) {
        channelRef.current.bind(PUSHER_EVENT_EMAIL_OPENED, onEmailOpened);
      }

      console.log('📡 Pusher initialized');
    } catch (error) {
      console.error('Pusher initialization error:', error);
    }
  }, [onEmailOpened]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unbind_all();
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }

    console.log('📡 Pusher disconnected');
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return { connect, disconnect };
}

