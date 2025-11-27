import sgMail from '@sendgrid/mail';
import { Email, Template } from '@/types';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not configured - email sending will fail');
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
 * Generate tracking pixel HTML
 */
function getTrackingPixel(emailId: string): string {
  // Use configured APP_URL or default to Vercel URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auto-email-plum.vercel.app';
  
  // Add timestamp to prevent caching
  const trackingUrl = `${baseUrl}/api/track/${emailId}?t=${Date.now()}`;
  
  return `<img src="${trackingUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />`;
}

/**
 * Send email via SendGrid
 * Includes custom tracking pixel for manual tracking (in addition to SendGrid's built-in tracking)
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  emailId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured. Set SENDGRID_API_KEY.' };
  }

  if (!process.env.FROM_EMAIL) {
    return { success: false, error: 'FROM_EMAIL not configured' };
  }

  try {
    // Add our custom tracking pixel if emailId provided
    // This works alongside SendGrid's built-in open tracking
    let finalHtml = htmlBody;
    if (emailId) {
      const trackingPixel = getTrackingPixel(emailId);
      finalHtml = `${htmlBody}${trackingPixel}`;
    }

    await sgMail.send({
      to,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME || 'Email Sender',
      },
      subject,
      html: finalHtml,
      text: htmlBody.replace(/<[^>]*>/g, ''), // Plain text version (no pixel)
      // SendGrid's built-in tracking (will also send webhooks)
      trackingSettings: {
        openTracking: {
          enable: true,
        },
        clickTracking: {
          enable: false, // We only track opens
        },
      },
      // Pass emailId in custom args so webhook can identify the email
      customArgs: emailId ? { emailId } : undefined,
    });

    console.log(`Email sent via SendGrid to ${to} (with tracking pixel and webhook)`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown SendGrid error';
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
 * 
 * Flow:
 * 1. Replace placeholders in plain text
 * 2. Save PLAIN TEXT to database (sentBody)
 * 3. Convert to HTML + add tracking pixel ONLY for sending
 */
export async function sendTemplatedEmail(
  email: Email,
  template: Template
): Promise<{ success: boolean; error?: string; sentSubject?: string; sentBody?: string }> {
  // Step 1: Replace placeholders - keep as PLAIN TEXT
  const personalizedSubject = replacePlaceholders(template.subject, email);
  const personalizedBodyPlainText = replacePlaceholders(template.body, email);

  // Step 2: Convert to HTML ONLY for sending (not for storage)
  const htmlBodyForEmail = processEmailBody(personalizedBodyPlainText);

  // Step 3: Send email with HTML body (tracking pixel added inside sendEmail)
  const result = await sendEmail(email.email, personalizedSubject, htmlBodyForEmail, email.id);
  
  // Step 4: Return PLAIN TEXT for storage in database (no HTML, no tracking pixel)
  return {
    ...result,
    sentSubject: personalizedSubject,
    sentBody: personalizedBodyPlainText,  // Store PLAIN TEXT only
  };
}

/**
 * Get current email provider info
 */
export function getProviderInfo(): { provider: 'sendgrid'; configured: boolean } {
  return {
    provider: 'sendgrid',
    configured: !!(process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL),
  };
}

