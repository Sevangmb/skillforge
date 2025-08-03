import type {Metadata} from 'next';
import './globals.css';
import { ToastContainer } from "@/components/ui/ToastContainer";
import { AchievementNotifications } from "@/components/achievements/AchievementNotifications";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: 'SkillForge AI',
  description: 'The Civilization of learning with generative AI.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" 
          rel="stylesheet" 
        />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
        <ToastContainer />
        <AchievementNotifications />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handling for unhandled promises
              window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled promise rejection:', event.reason);
                // Send to error reporting
                if (window.reportError) {
                  window.reportError({
                    type: 'unhandledrejection',
                    error: event.reason,
                    timestamp: new Date().toISOString()
                  });
                }
                event.preventDefault();
              });
              
              // Global error handling for uncaught exceptions
              window.addEventListener('error', function(event) {
                console.error('Uncaught error:', event.error);
                if (window.reportError) {
                  window.reportError({
                    type: 'error',
                    error: event.error,
                    timestamp: new Date().toISOString(),
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                  });
                }
              });
              
              // Performance monitoring initialization
              if ('performance' in window && 'PerformanceObserver' in window) {
                // Mark navigation start
                performance.mark('skillforge-navigation-start');
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
