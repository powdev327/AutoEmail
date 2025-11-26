'use client';

import { Status } from '@/types';

interface StatusBadgeProps {
  status: Status;
  openedAt?: Date | null;
  openCount?: number;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  READY: {
    label: 'Ready',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
  SENDING: {
    label: 'Sending...',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse-dot',
  },
  SENT: {
    label: 'Sent',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

export default function StatusBadge({ status, openedAt, openCount = 0 }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        {status === 'SENDING' && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />
        )}
        {status === 'SENT' && (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'FAILED' && (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {config.label}
      </span>
      
      {/* Opened badge - shown when email has been opened */}
      {openedAt && (
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-purple-500/20 text-purple-400 border-purple-500/30"
          title={`Opened ${openCount} time${openCount !== 1 ? 's' : ''} - First opened: ${new Date(openedAt).toLocaleString()}`}
        >
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Opened{openCount > 1 ? ` (${openCount})` : ''}
        </span>
      )}
    </div>
  );
}

