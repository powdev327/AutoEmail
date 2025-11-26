'use client';

import { Status } from '@/types';

interface StatusBadgeProps {
  status: Status;
  openedAt?: Date | null;
  openCount?: number;
}

const statusConfig: Record<Status, { label: string; className: string; icon?: string }> = {
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
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  DELIVERED: {
    label: 'Delivered',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  OPENED: {
    label: 'Opened',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  BLOCKED: {
    label: 'Blocked',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  BOUNCED: {
    label: 'Bounced',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  DROPPED: {
    label: 'Dropped',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

export default function StatusBadge({ status, openedAt, openCount = 0 }: StatusBadgeProps) {
  const config = statusConfig[status];

  // Icon based on status
  const renderIcon = () => {
    switch (status) {
      case 'SENDING':
        return <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />;
      case 'SENT':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'DELIVERED':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'OPENED':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'BLOCKED':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'BOUNCED':
      case 'DROPPED':
      case 'FAILED':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
        title={status === 'OPENED' && openedAt ? `Opened ${openCount} time${openCount !== 1 ? 's' : ''} - First: ${new Date(openedAt).toLocaleString()}` : undefined}
      >
        {renderIcon()}
        {config.label}
        {status === 'OPENED' && openCount > 1 && ` (${openCount})`}
      </span>
    </div>
  );
}
