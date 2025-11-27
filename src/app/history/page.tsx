'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Email, EmailEvent } from '@/types';
import EventTimeline from '@/components/EventTimeline';

const statusColors: Record<string, string> = {
  READY: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SENDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SENT: 'bg-green-500/20 text-green-400 border-green-500/30',
  OPENED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BLOCKED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DROPPED: 'bg-red-500/20 text-red-400 border-red-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function HistoryPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.success) {
        setEmails(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch events for selected email
  const fetchEvents = useCallback(async (emailId: string) => {
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
  }, []);

  // Smart polling - only refresh when new events occur
  useEffect(() => {
    fetchEmails();
    
    // Check for new events every 3 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/events/latest');
        const data = await res.json();
        
        if (data.success && data.data.lastEventTime) {
          // If there's a new event, refresh the data
          if (data.data.lastEventTime !== lastEventTime) {
            setLastEventTime(data.data.lastEventTime);
            fetchEmails();
            
            // If the event is for the currently selected email, refresh timeline
            if (selectedEmail && data.data.lastEmailId === selectedEmail.id) {
              fetchEvents(selectedEmail.id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check for new events:', error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [fetchEmails, fetchEvents, lastEventTime, selectedEmail]);

  const handleEmailClick = (email: Email) => {
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null);
      setEvents([]);
    } else {
      setSelectedEmail(email);
      fetchEvents(email.id);
    }
  };

  // Filter emails based on status and search term
  const filteredEmails = emails.filter((email) => {
    const matchesFilter = filter === 'all' || email.status === filter;
    const matchesSearch = 
      email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (email.country?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Get counts for filter badges
  const counts = {
    all: emails.length,
    SENT: emails.filter(e => e.status === 'SENT').length,
    OPENED: emails.filter(e => e.status === 'OPENED').length,
    BLOCKED: emails.filter(e => e.status === 'BLOCKED').length,
    FAILED: emails.filter(e => e.status === 'FAILED').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading email history...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Email History
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              View all sent emails and their delivery status. Click a row to see the full event timeline.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Sender
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { key: 'all', label: 'Total', color: 'bg-gray-500' },
          { key: 'SENT', label: 'Sent', color: 'bg-green-500' },
          { key: 'OPENED', label: 'Opened', color: 'bg-purple-500' },
          { key: 'BLOCKED', label: 'Blocked', color: 'bg-orange-500' },
          { key: 'FAILED', label: 'Failed', color: 'bg-red-500' },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key)}
            className={`p-3 rounded-lg border transition-all ${
              filter === stat.key
                ? 'bg-[var(--card-bg)] border-blue-500 ring-1 ring-blue-500/50'
                : 'bg-[var(--card-bg)]/50 border-[var(--card-border)] hover:border-gray-500'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`} />
            <div className="text-2xl font-bold text-white">{counts[stat.key as keyof typeof counts] || 0}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by email, name, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Content: Table + Timeline Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className={`${selectedEmail ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--card-bg)] border-b border-[var(--card-border)]">
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-4 font-medium">Email</th>
                  <th className="px-4 py-4 font-medium">Name</th>
                  <th className="px-4 py-4 font-medium hidden md:table-cell">Country</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium hidden lg:table-cell">Sent At</th>
                  <th className="px-4 py-4 font-medium w-10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {filteredEmails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p>No emails found</p>
                      {filter !== 'all' && (
                        <button
                          onClick={() => setFilter('all')}
                          className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Clear filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredEmails.map((email) => (
                    <tr
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={`cursor-pointer transition-colors ${
                        selectedEmail?.id === email.id
                          ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                          : 'hover:bg-[var(--card-bg)]/80'
                      }`}
                    >
                      <td className="px-4 py-4">
                        <span className="text-sm text-white font-medium">{email.email}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">{email.name || '-'}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-300">{email.country || '-'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[email.status] || statusColors.FAILED}`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-300">
                          {email.sentAt ? new Date(email.sentAt).toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                            selectedEmail?.id === email.id ? 'text-blue-400' : 'text-gray-500'
                          }`}
                          title="View timeline"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline Panel */}
        {selectedEmail && (
          <div className="lg:col-span-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Event Timeline</h3>
                <p className="text-sm text-gray-400">{selectedEmail.email}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedEmail(null);
                  setEvents([]);
                }}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Email Info Summary */}
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-2 text-sm">
              {selectedEmail.name && (
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{selectedEmail.name}</span>
                </div>
              )}
              {selectedEmail.country && (
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{selectedEmail.country}</span>
                </div>
              )}
              {selectedEmail.phone && (
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{selectedEmail.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={statusColors[selectedEmail.status].split(' ')[1]}>
                  Current: {selectedEmail.status}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <EventTimeline events={events} isLoading={isLoadingEvents} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Showing {filteredEmails.length} of {emails.length} emails
      </div>
    </main>
  );
}
