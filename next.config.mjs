const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com ws://*.pusher.com https://*.pusherapp.com https://ipapi.co",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "frame-src 'self'",
    ]
      .join('; ')
      .replace(/\s{2,}/g, ' ')
      .trim(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

