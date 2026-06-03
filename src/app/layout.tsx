
import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Faminance',
  description: 'Gestión de finanzas familiares simplificada',
};

export const viewport: Viewport = {
  themeColor: "#171F2D",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        {/* Register Service Worker */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) {
                  // Force the waiting SW to activate immediately
                  if (reg.waiting) { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); }
                  reg.addEventListener('updatefound', function() {
                    var newSW = reg.installing;
                    if (newSW) {
                      newSW.addEventListener('statechange', function() {
                        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                          // New content available – reload to get fresh assets
                          window.location.reload();
                        }
                      });
                    }
                  });
                })
                .catch(function(err) { console.warn('[SW] Registration failed:', err); });
            });
          }
        ` }} />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-body antialiased",
      )}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="min-h-screen w-full transition-colors duration-500 mesh-bg-light dark:mesh-bg-dark">
            <Providers>
              {children}
            </Providers>
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
