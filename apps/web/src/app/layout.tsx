import type { Metadata } from 'next';
import { Jost } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const jost = Jost({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Your new way to listen to music',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={cn('h-full', 'antialiased', jost.variable, 'font-sans')}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
