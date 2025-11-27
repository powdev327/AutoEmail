'use client';

import { useState, useEffect } from 'react';
import { Email } from '@/types';
import StatusBadge from './StatusBadge';

interface EmailListTableProps {
  emails: Email[];
  onDelete: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onSendAll: () => Promise<void>;
  onSendSelected: (ids: string[]) => Promise<void>;
  onEmailClick: (email: Email) => void;
  isDeleting: string | null;
  isRetrying: string | null;
  isSending: boolean;
}

export default function EmailListTable({
  emails,
  onDelete,
  onRetry,
  onSendAll,
  onSendSelected,
  onEmailClick,
  isDeleting,
  isRetrying,
  isSending,
}: EmailListTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter emails by search term
  const filteredEmails = emails.filter((email) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      email.email.toLowerCase().includes(term) ||
      email.name?.toLowerCase().includes(term) ||
      email.country?.toLowerCase().includes(term)
    );
  });

  const readyEmails = filteredEmails.filter((e) => e.status === 'READY');
  const readyCount = readyEmails.length;
  const sentCount = filteredEmails.filter((e) => e.status === 'SENT').length;
  const deliveredCount = filteredEmails.filter((e) => e.status === 'DELIVERED').length;
  const openedCount = filteredEmails.filter((e) => e.status === 'OPENED').length;
  const failedCount = filteredEmails.filter((e) => ['FAILED', 'BLOCKED', 'DROPPED'].includes(e.status)).length;

  // Count selected emails that are READY
  const selectedReadyCount = readyEmails.filter((e) => selectedIds.has(e.id)).length;

  // Clear selection when emails change (e.g., after sending)
  useEffect(() => {
    setSelectedIds((prev) => {
      const newSet = new Set<string>();
      prev.forEach((id) => {
        if (emails.some((e) => e.id === id && e.status === 'READY')) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [emails]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === readyEmails.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all ready emails
      setSelectedIds(new Set(readyEmails.map((e) => e.id)));
    }
  };

  const handleSendSelected = () => {
    onSendSelected(Array.from(selectedIds));
  };

  const isAllSelected = readyEmails.length > 0 && selectedIds.size === readyEmails.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < readyEmails.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with stats and send buttons */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recipients ({emails.length})
            </h2>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email, name, country..."
              className="w-64 pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-gray-400">Ready: {readyCount}</span>
          <span className="text-gray-600">|</span>
          <span className="text-yellow-400">Sent: {sentCount}</span>
          <span className="text-gray-600">|</span>
          <span className="text-green-400">Delivered: {deliveredCount}</span>
          <span className="text-gray-600">|</span>
          <span className="text-purple-400">Opened: {openedCount}</span>
          <span className="text-gray-600">|</span>
          <span className="text-red-400">Failed: {failedCount}</span>
          {searchTerm && (
            <>
              <span className="text-gray-600">|</span>
              <span className="text-blue-400">Showing: {filteredEmails.length}</span>
            </>
          )}
        </div>

        {/* Send buttons row */}
        <div className="flex items-center gap-3">
          {/* Send Selected button */}
          <button
            type="button"
            onClick={handleSendSelected}
            disabled={isSending || selectedReadyCount === 0}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Send Selected ({selectedReadyCount})
              </>
            )}
          </button>

          {/* Send All button */}
          <button
            type="button"
            onClick={onSendAll}
            disabled={isSending || readyCount === 0}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send All ({readyCount})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-auto rounded-lg border border-[var(--card-border)]">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
            <svg className="w-12 h-12 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            {searchTerm ? (
              <>
                <p className="text-sm">No results found</p>
                <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="text-sm">No recipients added yet</p>
                <p className="text-xs text-gray-500 mt-1">Add emails using the form on the left</p>
              </>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--card-bg)] sticky top-0 z-10">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium w-10">
                  {/* Select All checkbox */}
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={readyCount === 0}
                    className="w-5 h-5 rounded border border-gray-600 flex items-center justify-center hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isAllSelected ? 'Deselect all' : 'Select all ready'}
                  >
                    {isAllSelected && (
                      <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {isSomeSelected && (
                      <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Country</th>
                <th className="px-4 py-3 font-medium hidden xl:table-cell">Links</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Tracking</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredEmails.map((email) => {
                const isSelected = selectedIds.has(email.id);
                const isReady = email.status === 'READY';

                return (
                  <tr
                    key={email.id}
                    onClick={() => onEmailClick(email)}
                    className={`bg-[var(--card-bg)]/50 hover:bg-[var(--card-bg)] transition-colors animate-slide-up cursor-pointer ${
                      isSelected ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {/* Row checkbox - only for READY emails */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(email.id)}
                        disabled={!isReady}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isReady
                            ? isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-600 hover:border-gray-400'
                            : 'border-gray-700 opacity-30 cursor-not-allowed'
                        }`}
                        title={isReady ? (isSelected ? 'Deselect' : 'Select') : 'Only ready emails can be selected'}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white font-medium">{email.email}</span>
                      {email.phone && (
                        <span className="block text-xs text-gray-500 mt-0.5">{email.phone}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">{email.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-300">{email.country || '-'}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell" onClick={(e) => e.stopPropagation()}>
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
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={email.status} openedAt={email.openedAt} openCount={email.openCount} />
                      {email.lastError && (
                        <span className="block text-xs text-red-400 mt-1 max-w-[150px] truncate" title={email.lastError}>
                          {email.lastError}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {email.openedAt ? (
                        <div className="space-y-1 text-xs">
                          {email.ipAddress && (
                            <div className="flex items-center gap-1.5 text-gray-300">
                              <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              <span title="IP Address">{email.ipAddress}</span>
                            </div>
                          )}
                          {email.geoLocation && (
                            <div className="flex items-center gap-1.5 text-gray-300">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span title="Location">{email.geoLocation}</span>
                            </div>
                          )}
                          {email.userAgent && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span title="Device">{email.userAgent}</span>
                            </div>
                          )}
                          {!email.ipAddress && !email.geoLocation && !email.userAgent && (
                            <span className="text-gray-500">No data yet</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {['FAILED', 'BLOCKED', 'DROPPED'].includes(email.status) && (
                          <button
                            type="button"
                            onClick={() => onRetry(email.id)}
                            disabled={isRetrying === email.id}
                            className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded transition-colors disabled:opacity-50"
                            title="Retry"
                          >
                            {isRetrying === email.id ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(email.id)}
                          disabled={isDeleting === email.id || email.status === 'SENDING'}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {isDeleting === email.id ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
