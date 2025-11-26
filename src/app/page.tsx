'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Email, Template, EmailFormData, TemplateFormData } from '@/types';
import EmailInputForm from '@/components/EmailInputForm';
import MessageDraftEditor from '@/components/MessageDraftEditor';
import EmailListTable from '@/components/EmailListTable';
import ConfirmModal from '@/components/ConfirmModal';

type SendMode = 'all' | 'selected' | null;

export default function Home() {
  // State
  const [emails, setEmails] = useState<Email[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isDeletingEmail, setIsDeletingEmail] = useState<string | null>(null);
  const [isRetryingEmail, setIsRetryingEmail] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.success) {
        setEmails(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      toast.error('Failed to load emails');
    } finally {
      setIsLoadingEmails(false);
    }
  }, []);

  // Fetch template
  const fetchTemplate = useCallback(async () => {
    try {
      const res = await fetch('/api/template');
      const data = await res.json();
      if (data.success && data.data) {
        setTemplate(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setIsLoadingTemplate(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmails();
    fetchTemplate();
  }, [fetchEmails, fetchTemplate]);

  // Add email
  const handleAddEmail = async (formData: EmailFormData) => {
    setIsAddingEmail(true);
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add email');
      }

      setEmails((prev) => [data.data, ...prev]);
      toast.success('Email added successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add email';
      toast.error(message);
      throw error;
    } finally {
      setIsAddingEmail(false);
    }
  };

  // Save template
  const handleSaveTemplate = async (formData: TemplateFormData) => {
    setIsSavingTemplate(true);
    try {
      const res = await fetch('/api/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save template');
      }

      setTemplate(data.data);
      toast.success('Template saved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save template';
      toast.error(message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Delete email
  const handleDeleteEmail = async (id: string) => {
    setIsDeletingEmail(id);
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete email');
      }

      setEmails((prev) => prev.filter((e) => e.id !== id));
      toast.success('Email deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete email';
      toast.error(message);
    } finally {
      setIsDeletingEmail(null);
    }
  };

  // Retry email
  const handleRetryEmail = async (id: string) => {
    setIsRetryingEmail(id);
    try {
      const res = await fetch(`/api/emails/${id}/retry`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to retry email');
      }

      setEmails((prev) =>
        prev.map((e) => (e.id === id ? data.data : e))
      );

      if (data.data.status === 'SENT') {
        toast.success('Email sent successfully');
      } else {
        toast.error('Email failed to send');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry email';
      toast.error(message);
    } finally {
      setIsRetryingEmail(null);
    }
  };

  // Send all emails
  const handleSendAll = async () => {
    setShowSendConfirm(false);
    setIsSending(true);

    // Update UI to show sending status
    setEmails((prev) =>
      prev.map((e) =>
        e.status === 'READY' ? { ...e, status: 'SENDING' } : e
      )
    );

    try {
      const res = await fetch('/api/emails/send-all', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send emails');
      }

      setEmails(data.data.emails);

      const { summary } = data.data;
      if (summary.failed === 0) {
        toast.success(`All ${summary.sent} emails sent successfully!`);
      } else {
        toast(`Sent: ${summary.sent}, Failed: ${summary.failed}`, {
          icon: '⚠️',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send emails';
      toast.error(message);
      // Refresh to get actual status
      fetchEmails();
    } finally {
      setIsSending(false);
      setSendMode(null);
    }
  };

  // Send selected emails
  const handleSendSelected = async () => {
    setShowSendConfirm(false);
    setIsSending(true);

    // Update UI to show sending status for selected emails
    setEmails((prev) =>
      prev.map((e) =>
        selectedIds.includes(e.id) && e.status === 'READY' ? { ...e, status: 'SENDING' } : e
      )
    );

    try {
      const res = await fetch('/api/emails/send-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send emails');
      }

      setEmails(data.data.emails);

      const { summary } = data.data;
      if (summary.failed === 0) {
        toast.success(`${summary.sent} email${summary.sent !== 1 ? 's' : ''} sent successfully!`);
      } else {
        toast(`Sent: ${summary.sent}, Failed: ${summary.failed}`, {
          icon: '⚠️',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send emails';
      toast.error(message);
      // Refresh to get actual status
      fetchEmails();
    } finally {
      setIsSending(false);
      setSendMode(null);
      setSelectedIds([]);
    }
  };

  // Open send confirmation for all
  const openSendAllConfirm = async () => {
    if (!template) {
      toast.error('Please save a template first');
      return;
    }
    setSendMode('all');
    setShowSendConfirm(true);
  };

  // Open send confirmation for selected
  const openSendSelectedConfirm = async (ids: string[]) => {
    if (!template) {
      toast.error('Please save a template first');
      return;
    }
    setSelectedIds(ids);
    setSendMode('selected');
    setShowSendConfirm(true);
  };

  // Handle confirm based on mode
  const handleConfirmSend = () => {
    if (sendMode === 'all') {
      handleSendAll();
    } else if (sendMode === 'selected') {
      handleSendSelected();
    }
  };

  const readyCount = emails.filter((e) => e.status === 'READY').length;
  const selectedReadyCount = selectedIds.filter((id) =>
    emails.some((e) => e.id === id && e.status === 'READY')
  ).length;

  const confirmCount = sendMode === 'all' ? readyCount : selectedReadyCount;

  if (isLoadingEmails || isLoadingTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          Email Sender
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base">
          Send personalized emails to multiple recipients with tracking
        </p>
      </header>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Template Editor & Email Form */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Message Draft Editor */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 md:p-6">
            <MessageDraftEditor
              initialData={template ? { subject: template.subject, body: template.body } : null}
              onSave={handleSaveTemplate}
              isSaving={isSavingTemplate}
            />
          </div>

          {/* Email Input Form */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 md:p-6">
            <EmailInputForm
              onSubmit={handleAddEmail}
              isLoading={isAddingEmail}
            />
          </div>
        </div>

        {/* Right Panel - Email List */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 md:p-6 h-full min-h-[500px]">
            <EmailListTable
              emails={emails}
              onDelete={handleDeleteEmail}
              onRetry={handleRetryEmail}
              onSendAll={openSendAllConfirm}
              onSendSelected={openSendSelectedConfirm}
              isDeleting={isDeletingEmail}
              isRetrying={isRetryingEmail}
              isSending={isSending}
            />
          </div>
        </div>
      </div>

      {/* Send Confirmation Modal */}
      <ConfirmModal
        isOpen={showSendConfirm}
        title={sendMode === 'all' ? 'Send All Emails' : 'Send Selected Emails'}
        message={`You are about to send emails to ${confirmCount} recipient${confirmCount !== 1 ? 's' : ''}. This action cannot be undone.`}
        confirmText={`Send ${confirmCount} Email${confirmCount !== 1 ? 's' : ''}`}
        cancelText="Cancel"
        onConfirm={handleConfirmSend}
        onCancel={() => {
          setShowSendConfirm(false);
          setSendMode(null);
        }}
        isLoading={isSending}
      />
    </main>
  );
}
