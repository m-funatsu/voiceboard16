import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'VoiceBoard - Collect & Prioritize User Feedback with AI',
  description: 'The AI-powered feedback platform with unlimited voters and flat pricing. Embed a feedback widget, let users vote, and get AI-powered insights.',
  keywords: ['feedback', 'user feedback', 'feature requests', 'voting board', 'product feedback', 'AI analysis'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        {children}
              <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
