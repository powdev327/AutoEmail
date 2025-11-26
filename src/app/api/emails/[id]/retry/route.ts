import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTemplatedEmail } from '@/lib/sendgrid';

// POST /api/emails/[id]/retry - Retry sending a failed email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the email
    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email not found' },
        { status: 404 }
      );
    }

    const retryableStatuses = ['FAILED', 'BLOCKED', 'BOUNCED', 'DROPPED'];
    if (!retryableStatuses.includes(email.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only retry failed, blocked, bounced, or dropped emails' },
        { status: 400 }
      );
    }

    // Get the active template
    const template = await prisma.template.findFirst({
      where: { isActive: true },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'No active template found' },
        { status: 400 }
      );
    }

    // Update status to SENDING
    await prisma.email.update({
      where: { id },
      data: { status: 'SENDING', lastError: null },
    });

    // Send the email
    const result = await sendTemplatedEmail(
      {
        ...email,
        status: 'SENDING',
        lastError: null,
      },
      template
    );

    // Update status based on result
    const updatedEmail = await prisma.email.update({
      where: { id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        lastError: result.error || null,
        sentAt: result.success ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: updatedEmail });
  } catch (error) {
    console.error('Error retrying email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retry email' },
      { status: 500 }
    );
  }
}

