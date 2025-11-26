'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Email } from '@/types';

const statusColors: Record<string, string> = {
  READY: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SENDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SENT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
  OPENED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BLOCKED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  BOUNCED: 'bg-red-500/20 text-red-400 border-red-500/30',
  DROPPED: 'bg-red-500/20 text-red-400 border-red-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function HistoryPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

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
    DELIVERED: emails.filter(e => e.status === 'DELIVERED').length,
    OPENED: emails.filter(e => e.status === 'OPENED').length,
    BLOCKED: emails.filter(e => e.status === 'BLOCKED').length,
    BOUNCED: emails.filter(e => e.status === 'BOUNCED').length,
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
              View all sent emails and their delivery status
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { key: 'all', label: 'Total', color: 'bg-gray-500' },
          { key: 'SENT', label: 'Sent', color: 'bg-yellow-500' },
          { key: 'DELIVERED', label: 'Delivered', color: 'bg-green-500' },
          { key: 'OPENED', label: 'Opened', color: 'bg-purple-500' },
          { key: 'BLOCKED', label: 'Blocked', color: 'bg-orange-500' },
          { key: 'BOUNCED', label: 'Bounced', color: 'bg-red-500' },
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

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--card-bg)] border-b border-[var(--card-border)]">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-4 font-medium">Email</th>
                <th className="px-4 py-4 font-medium">Name</th>
                <th className="px-4 py-4 font-medium">Country</th>
                <th className="px-4 py-4 font-medium">Phone</th>
                <th className="px-4 py-4 font-medium">Links</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Sent At</th>
                <th className="px-4 py-4 font-medium">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredEmails.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
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
                    className="hover:bg-[var(--card-bg)]/80 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="text-sm text-white font-medium">{email.email}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">{email.name || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">{email.country || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">{email.phone || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {email.linkedin && (
                          <a
                            href={email.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                            title="LinkedIn"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {email.github && (
                          <a
                            href={email.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-300"
                            title="GitHub"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                          </a>
                        )}
                        {!email.linkedin && !email.github && (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[email.status] || statusColors.FAILED}`}>
                        {email.status}
                      </span>
                      {email.lastError && (
                        <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={email.lastError}>
                          {email.lastError}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {email.sentAt ? new Date(email.sentAt).toLocaleString() : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {email.openedAt ? (
                        <div className="space-y-1 text-xs">
                          {email.ipAddress && (
                            <div className="flex items-center gap-1.5 text-gray-300">
                              <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              <span>{email.ipAddress}</span>
                            </div>
                          )}
                          {email.geoLocation && (
                            <div className="flex items-center gap-1.5 text-gray-300">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{email.geoLocation}</span>
                            </div>
                          )}
                          {email.userAgent && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{email.userAgent}</span>
                            </div>
                          )}
                          <div className="text-gray-500 mt-1">
                            Opened: {new Date(email.openedAt).toLocaleString()}
                            {email.openCount > 1 && ` (${email.openCount}x)`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Showing {filteredEmails.length} of {emails.length} emails
      </div>
    </main>
  );
}

