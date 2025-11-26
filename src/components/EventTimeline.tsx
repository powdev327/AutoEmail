'use client';

import { EmailEvent, Status } from '@/types';

interface EventTimelineProps {
  events: EmailEvent[];
  isLoading?: boolean;
}

const eventConfig: Record<string, { label: string; icon: string; color: string }> = {
  sent: { label: 'Sent', icon: '📤', color: 'text-yellow-400' },
  retry_sent: { label: 'Retry Sent', icon: '🔄', color: 'text-yellow-400' },
  processed: { label: 'Processed', icon: '⚙️', color: 'text-blue-400' },
  delivered: { label: 'Delivered', icon: '✅', color: 'text-green-400' },
  open: { label: 'Opened', icon: '👁️', color: 'text-purple-400' },
  click: { label: 'Clicked', icon: '🔗', color: 'text-cyan-400' },
  bounce: { label: 'Bounced', icon: '❌', color: 'text-red-400' },
  blocked: { label: 'Blocked', icon: '🚫', color: 'text-orange-400' },
  dropped: { label: 'Dropped', icon: '⬇️', color: 'text-red-400' },
  spamreport: { label: 'Spam Report', icon: '⚠️', color: 'text-red-400' },
  deferred: { label: 'Deferred', icon: '⏳', color: 'text-amber-400' },
  failed: { label: 'Failed', icon: '💥', color: 'text-red-400' },
  retry_failed: { label: 'Retry Failed', icon: '💥', color: 'text-red-400' },
};

const statusColors: Record<Status, string> = {
  READY: 'bg-gray-500',
  SENDING: 'bg-blue-500',
  SENT: 'bg-yellow-500',
  DELIVERED: 'bg-green-500',
  OPENED: 'bg-purple-500',
  BLOCKED: 'bg-orange-500',
  BOUNCED: 'bg-red-500',
  DROPPED: 'bg-red-500',
  FAILED: 'bg-red-500',
};

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function EventTimeline({ events, isLoading }: EventTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const config = eventConfig[event.event] || { 
            label: event.event, 
            icon: '📧', 
            color: 'text-gray-400' 
          };

          return (
            <div key={event.id} className="relative flex items-start gap-4 pl-10">
              {/* Timeline dot */}
              <div
                className={`absolute left-2 w-5 h-5 rounded-full ${statusColors[event.status]} flex items-center justify-center text-xs`}
                style={{ top: '2px' }}
              >
                <span className="text-white text-[10px]">{index + 1}</span>
              </div>

              {/* Event card */}
              <div className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className={`font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>

                {/* Event details */}
                <div className="text-xs space-y-1">
                  {event.ipAddress && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span>IP: {event.ipAddress}</span>
                    </div>
                  )}
                  {event.geoLocation && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.geoLocation}</span>
                    </div>
                  )}
                  {event.userAgent && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{event.userAgent}</span>
                    </div>
                  )}
                  {event.errorReason && (
                    <div className="flex items-center gap-2 text-red-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{event.errorReason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

