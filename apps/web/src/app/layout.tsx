import type { Metadata } from 'next';
import { Jost } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { cn } from '@/lib/utils';
import { GlassBackdrop } from '@/components/glass/GlassBackdrop';
import {
  GlassModeProvider,
  glassModeInitScript,
} from '@/components/providers/GlassModeProvider';
import { LenisProvider } from '@/components/providers/LenisProvider';

const jost = Jost({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EXØS - Your music. Your rules.',
  description: 'to be implemented',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn('h-full', 'antialiased', jost.variable, 'font-sans')}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Script id="glass-mode-init" strategy="beforeInteractive">
          {glassModeInitScript}
        </Script>
        <GlassModeProvider>
          <GlassBackdrop />
          <LenisProvider>{children}</LenisProvider>
        </GlassModeProvider>
      </body>
    </html>
  );
}
