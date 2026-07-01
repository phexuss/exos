import type { Metadata } from 'next';
import { Jost } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
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
    <html className={cn('h-full', 'antialiased', jost.variable, 'font-sans')}>
      <body className="min-h-full flex flex-col font-sans">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
