'use client';

import { useState, useEffect } from 'react';
import { Email, EmailEvent, Status } from '@/types';
import EventTimeline from './EventTimeline';

interface EmailDetailModalProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors: Record<Status, string> = {
  READY: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SENDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SENT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
  OPENED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BLOCKED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DROPPED: 'bg-red-500/20 text-red-400 border-red-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function EmailDetailModal({ email, isOpen, onClose }: EmailDetailModalProps) {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    if (email && isOpen) {
      fetchEvents(email.id);
    }
  }, [email, isOpen]);

  const fetchEvents = async (emailId: string) => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/events`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  if (!isOpen || !email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {email.name ? email.name.charAt(0).toUpperCase() : email.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{email.name || 'Unknown'}</h2>
              <p className="text-sm text-gray-400">{email.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Status Badge */}
          <div className="p-4 border-b border-[var(--card-border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Current Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[email.status]}`}>
                {email.status}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 border-b border-[var(--card-border)]">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm text-white">{email.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Country</p>
                <p className="text-sm text-white">{email.country || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-white">{email.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Added</p>
                <p className="text-sm text-white">{new Date(email.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Links */}
          {(email.linkedin || email.github) && (
            <div className="p-4 border-b border-[var(--card-border)]">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Links</h3>
              <div className="flex gap-3">
                {email.linkedin && (
                  <a
                    href={email.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                {email.github && (
                  <a
                    href={email.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-500/10 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-500/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Sent Message */}
          {email.sentSubject && (
            <div className="p-4 border-b border-[var(--card-border)]">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Sent Message
              </h3>
              <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg p-4">
                {/* Subject */}
                <div className="mb-3 pb-3 border-b border-[var(--card-border)]">
                  <p className="text-xs text-gray-500 mb-1">Subject</p>
                  <p className="text-sm text-white font-medium">{email.sentSubject}</p>
                </div>
                {/* Body - Display plain text directly from database */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Body</p>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {email.sentBody || ''}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Info */}
          {(email.ipAddress || email.userAgent || email.geoLocation) && (
            <div className="p-4 border-b border-[var(--card-border)]">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Tracking Information</h3>
              <div className="space-y-2">
                {email.ipAddress && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-gray-400">IP:</span>
                    <span className="text-white">{email.ipAddress}</span>
                  </div>
                )}
                {email.geoLocation && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white">{email.geoLocation}</span>
                  </div>
                )}
                {email.userAgent && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-400">Device:</span>
                    <span className="text-white">{email.userAgent}</span>
                  </div>
                )}
                {email.openedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-gray-400">Opened:</span>
                    <span className="text-white">
                      {new Date(email.openedAt).toLocaleString()}
                      {email.openCount > 1 && ` (${email.openCount} times)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="p-4 border-b border-[var(--card-border)]">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Timestamps</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-white">{new Date(email.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Updated</p>
                <p className="text-white">{new Date(email.updatedAt).toLocaleString()}</p>
              </div>
              {email.sentAt && (
                <div>
                  <p className="text-xs text-gray-500">Sent At</p>
                  <p className="text-white">{new Date(email.sentAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Event Timeline */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Event Timeline</h3>
            <EventTimeline events={events} isLoading={isLoadingEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}

