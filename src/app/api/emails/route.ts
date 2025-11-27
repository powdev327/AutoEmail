import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Auto-mark SENT emails as DELIVERED after 5 minutes
async function autoMarkDelivered() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  try {
    // Find SENT emails older than 5 minutes
    const sentEmails = await prisma.email.findMany({
      where: {
        status: 'SENT',
        sentAt: {
          lt: fiveMinutesAgo,
        },
      },
    });

    // Update each to DELIVERED and create event
    for (const email of sentEmails) {
      await prisma.email.update({
        where: { id: email.id },
        data: { status: 'DELIVERED' },
      });

      // Create delivery event
      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          event: 'delivered',
          status: 'DELIVERED',
          timestamp: new Date(),
        },
      });

      console.log(`Auto-marked email ${email.id} as DELIVERED`);
    }
  } catch (error) {
    console.error('Error auto-marking delivered:', error);
  }
}

// GET /api/emails - Get all emails
export async function GET() {
  try {
    // Auto-mark old SENT emails as DELIVERED (background, non-blocking)
    autoMarkDelivered();
    
    const emails = await prisma.email.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

// POST /api/emails - Add new email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, country, phone, linkedin, github } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.email.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create new email entry
    const newEmail = await prisma.email.create({
      data: {
        email,
        name: name || null,
        country: country || null,
        phone: phone || null,
        linkedin: linkedin || null,
        github: github || null,
        status: 'READY',
      },
    });

    return NextResponse.json({ success: true, data: newEmail }, { status: 201 });
  } catch (error) {
    console.error('Error adding email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add email' },
      { status: 500 }
    );
  }
}

