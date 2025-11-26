import sgMail from '@sendgrid/mail';
import { Email, Template } from '@/types';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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
 * Send a single email using SendGrid with open tracking
 */
export async function sendEmail(
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
      text: htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for plain text version
      trackingSettings: {
        openTracking: {
          enable: true,
        },
      },
      customArgs: emailId ? { emailId } : undefined,
    });

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('SendGrid Error:', errorMessage);
    return { success: false, error: errorMessage };
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

  // Pass email.id for open tracking
  return sendEmail(email.email, personalizedSubject, personalizedBody, email.id);
}

