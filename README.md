# Email Sender

A full-stack email sender application built with Next.js, PostgreSQL, and SendGrid. Send personalized emails to multiple recipients with tracking and retry capabilities.

## Features

- **Add Recipients**: Add emails with optional metadata (name, country, phone, LinkedIn, GitHub)
- **Message Templates**: Create personalized email templates with placeholder support
- **Bulk Sending**: Send emails to all ready recipients with a single click
- **Status Tracking**: Real-time status updates (Ready → Sending → Sent/Failed)
- **Open Tracking**: See when recipients open your emails (requires webhook setup)
- **Retry Failed**: Retry failed emails individually
- **Rate Limiting**: Built-in 1-second delay between sends to respect API limits

## Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Email Service**: SendGrid
- **Styling**: TailwindCSS
- **Notifications**: react-hot-toast

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (free options: [Neon](https://neon.tech), [Supabase](https://supabase.com))
- SendGrid account with API key (100 free emails/day)

## Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd EmailAuto
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp env.example.txt .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
SENDGRID_API_KEY="SG.your-api-key"
FROM_EMAIL="your-verified@email.com"
FROM_NAME="Your Name"
```

### 3. Setup Database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Template Placeholders

Use these placeholders in your email templates:

| Placeholder | Description |
|-------------|-------------|
| `{{name}}` | Recipient's name |
| `{{email}}` | Recipient's email |
| `{{country}}` | Recipient's country |
| `{{phone}}` | Recipient's phone |
| `{{linkedin}}` | LinkedIn URL |
| `{{github}}` | GitHub URL |

### Example Template

**Subject:** Hello {{name}}!

**Body:**
```
Hello {{name}},

Thank you for your interest in our project.

Best regards
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails` | Get all recipients |
| POST | `/api/emails` | Add new recipient |
| DELETE | `/api/emails/[id]` | Delete recipient |
| POST | `/api/emails/send-all` | Send to all ready recipients |
| POST | `/api/emails/[id]/retry` | Retry failed email |
| GET | `/api/template` | Get current template |
| PUT | `/api/template` | Save/update template |
| POST | `/api/webhooks/sendgrid` | SendGrid webhook for open tracking |

## Email Open Tracking Setup

To enable open tracking, you need to configure a SendGrid Event Webhook:

### 1. Deploy Your App First

The webhook URL must be publicly accessible. Deploy to Vercel first.

### 2. Configure SendGrid Webhook

1. Go to [SendGrid Settings > Mail Settings > Event Webhooks](https://app.sendgrid.com/settings/mail_settings)
2. Click **Create new webhook**
3. Enter your webhook URL: `https://your-domain.vercel.app/api/webhooks/sendgrid`
4. Select **Open** event (and optionally: Click, Bounce, Spam Report)
5. Set status to **Enabled**
6. Click **Save**

### 3. Test the Webhook

SendGrid will now send events to your app when recipients open emails. The "Opened" badge will appear next to emails that have been opened, showing the open count on hover.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `DATABASE_URL`
- `SENDGRID_API_KEY`
- `FROM_EMAIL`
- `FROM_NAME`

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Vercel | Unlimited deployments |
| Neon | 512MB storage, auto-suspend |
| Supabase | 500MB, 2 projects |
| SendGrid | 100 emails/day |

## License

MIT

