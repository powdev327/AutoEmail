'use client';

import { Email } from '@/types';

interface MessageModalProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageModal({ email, isOpen, onClose }: MessageModalProps) {
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Sent Message</h2>
              <p className="text-sm text-gray-400">To: {email.email}</p>
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
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
          {email.sentSubject ? (
            <>
              {/* Subject */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Subject</p>
                <p className="text-lg text-white font-medium">{email.sentSubject}</p>
              </div>

              {/* Sent timestamp */}
              {email.sentAt && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sent on {new Date(email.sentAt).toLocaleString()}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-[var(--card-border)] my-4" />

              {/* Body */}
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Message Body</p>
                <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg p-4">
                  <div 
                    className="text-sm text-gray-200 prose prose-invert prose-sm max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: email.sentBody || '' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No message has been sent to this recipient yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

