import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { Email, Template } from '@/types';

// Email provider type
type EmailProvider = 'smtp' | 'sendgrid';

// Determine which provider to use based on env vars
function getProvider(): EmailProvider {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return 'smtp';
  }
  if (process.env.SENDGRID_API_KEY) {
    return 'sendgrid';
  }
  return 'smtp'; // Default to SMTP
}

// Initialize SendGrid if configured
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create SMTP transporter for Gmail/Outlook/etc.
function createSMTPTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Replace placeholders in text with actual values
 * Supports: {{email}}, {{name}}, {{country}}, {{phone}}, {{linkedin}}, {{github}}
 */
export function replacePlaceholders(text: string, email: Email): string {
  const placeholders: Record<string, string> = {
    '{{email}}': email.email,
    '{{name}}': email.name || '',
    '{{country}}': email.country || '',
    '{{phone}}': email.phone || '',
    '{{linkedin}}': email.linkedin || '',
    '{{github}}': email.github || '',
  };

  let result = text;
  for (const [placeholder, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(placeholder, 'gi'), value);
  }

  return result;
}

/**
 * Send email via SMTP (Gmail, Outlook, etc.)
 */
async function sendViaSMTP(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { success: false, error: 'SMTP credentials not configured. Set SMTP_USER and SMTP_PASS.' };
  }

  try {
    const transporter = createSMTPTransporter();
    
    await transporter.sendMail({
      from: {
        name: process.env.FROM_NAME || 'Email Sender',
        address: process.env.FROM_EMAIL || process.env.SMTP_USER,
      },
      to,
      subject,
      html: htmlBody,
      text: htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
    });

    console.log(`Email sent via SMTP to ${to}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown SMTP error';
    console.error('SMTP Error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(
  to: string,
  subject: string,
  htmlBody: string,
  emailId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured' };
  }

  if (!process.env.FROM_EMAIL) {
    return { success: false, error: 'FROM_EMAIL not configured' };
  }

  try {
    await sgMail.send({
      to,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME || 'Email Sender',
      },
      subject,
      html: htmlBody,
      text: htmlBody.replace(/<[^>]*>/g, ''),
      trackingSettings: {
        openTracking: {
          enable: true,
        },
      },
      customArgs: emailId ? { emailId } : undefined,
    });

    console.log(`Email sent via SendGrid to ${to}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown SendGrid error';
    console.error('SendGrid Error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a single email using the configured provider
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  emailId?: string
): Promise<{ success: boolean; error?: string }> {
  const provider = getProvider();
  
  console.log(`Sending email via ${provider.toUpperCase()} to ${to}`);
  
  if (provider === 'smtp') {
    return sendViaSMTP(to, subject, htmlBody);
  } else {
    return sendViaSendGrid(to, subject, htmlBody, emailId);
  }
}

/**
 * Utility function to delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process email body - converts line breaks to HTML
 */
export function processEmailBody(body: string): string {
  return body
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '');
}

/**
 * Send email to a single recipient with template
 */
export async function sendTemplatedEmail(
  email: Email,
  template: Template
): Promise<{ success: boolean; error?: string }> {
  const personalizedSubject = replacePlaceholders(template.subject, email);
  const personalizedBody = processEmailBody(replacePlaceholders(template.body, email));

  return sendEmail(email.email, personalizedSubject, personalizedBody, email.id);
}

/**
 * Get current email provider info
 */
export function getProviderInfo(): { provider: EmailProvider; configured: boolean } {
  const provider = getProvider();
  
  if (provider === 'smtp') {
    return {
      provider: 'smtp',
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    };
  }
  
  return {
    provider: 'sendgrid',
    configured: !!process.env.SENDGRID_API_KEY,
  };
}

