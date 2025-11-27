import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTemplatedEmail, delay } from '@/lib/email';

// POST /api/emails/send-all - Send emails to all ready recipients
export async function POST() {
  try {
    // Get the active template
    const template = await prisma.template.findFirst({
      where: { isActive: true },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'No active template found. Please save a template first.' },
        { status: 400 }
      );
    }

    // Get all emails with READY status
    const emails = await prisma.email.findMany({
      where: { status: 'READY' },
    });

    if (emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No emails ready to send' },
        { status: 400 }
      );
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    // Process each email with rate limiting
    for (const email of emails) {
      // Update status to SENDING
      await prisma.email.update({
        where: { id: email.id },
        data: { status: 'SENDING', lastError: null },
      });

      // Send the email
      const result = await sendTemplatedEmail(email, template);
      const now = new Date();

      // Update status based on result
      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          lastError: result.error || null,
          sentAt: result.success ? now : null,
          sentSubject: result.success ? result.sentSubject : null,
          sentBody: result.success ? result.sentBody : null,
        },
      });

      // Create event record for history
      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          event: result.success ? 'sent' : 'failed',
          status: result.success ? 'SENT' : 'FAILED',
          errorReason: result.error || null,
          timestamp: now,
        },
      });

      results.push({
        id: email.id,
        success: result.success,
        error: result.error,
      });

      // Rate limiting: wait 1 second between sends
      if (emails.indexOf(email) < emails.length - 1) {
        await delay(1000);
      }
    }

    // Get updated email list
    const updatedEmails = await prisma.email.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        emails: updatedEmails,
        summary: {
          total: results.length,
          sent: successCount,
          failed: failCount,
        },
      },
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}

