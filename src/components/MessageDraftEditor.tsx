'use client';

import { useState, useEffect } from 'react';
import { TemplateFormData } from '@/types';

interface MessageDraftEditorProps {
  initialData?: TemplateFormData | null;
  onSave: (data: TemplateFormData) => Promise<void>;
  isSaving: boolean;
}

const placeholders = [
  { key: '{{name}}', description: 'Recipient name' },
  { key: '{{email}}', description: 'Recipient email' },
  { key: '{{country}}', description: 'Recipient country' },
  { key: '{{phone}}', description: 'Recipient phone' },
  { key: '{{linkedin}}', description: 'LinkedIn URL' },
  { key: '{{github}}', description: 'GitHub URL' },
];

export default function MessageDraftEditor({
  initialData,
  onSave,
  isSaving,
}: MessageDraftEditorProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSubject(initialData.subject);
      setBody(initialData.body);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      const changed =
        subject !== initialData.subject || body !== initialData.body;
      setHasChanges(changed);
    } else {
      setHasChanges(subject.length > 0 || body.length > 0);
    }
  }, [subject, body, initialData]);

  const handleSave = async () => {
    if (!subject.trim() || !body.trim()) return;
    await onSave({ subject, body });
    setHasChanges(false);
  };

  const insertPlaceholder = (placeholder: string) => {
    setBody((prev) => prev + placeholder);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Message Template
        </h2>
        {hasChanges && (
          <span className="text-xs text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Unsaved changes
          </span>
        )}
      </div>

      {/* Placeholders */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Available placeholders (click to insert):</p>
        <div className="flex flex-wrap gap-2">
          {placeholders.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => insertPlaceholder(p.key)}
              className="px-2 py-1 text-xs bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-gray-300 hover:bg-[var(--card-border)] hover:text-white transition-colors"
              title={p.description}
            >
              {p.key}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
          Subject <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject..."
          className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
          disabled={isSaving}
        />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col min-h-0">
        <label htmlFor="body" className="block text-sm font-medium text-gray-300 mb-1">
          Message Body <span className="text-red-400">*</span>
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Hello {{name}},\n\nThank you for your interest...\n\nBest regards`}
          className="flex-1 w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors resize-none font-mono text-sm min-h-[200px]"
          disabled={isSaving}
        />
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !subject.trim() || !body.trim()}
        className="mt-4 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Template
          </>
        )}
      </button>
    </div>
  );
}

