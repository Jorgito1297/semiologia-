import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // WARN-01 FIX: Configuraciones críticas de seguridad y compatibilidad

  // Cabeceras de seguridad HTTP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com http://localhost:11434",
              "frame-src 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Imágenes externas permitidas
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // Paquetes Node.js nativos que no deben bundlearse en el cliente
  serverExternalPackages: [],

  // Producción: standalone permite despliegue en Firebase App Hosting / Docker
  // Comentado por defecto para no romper el dev server; activar antes del deploy
  // output: 'standalone',
};

export default nextConfig;
