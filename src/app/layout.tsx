import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/layout/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'AutoDesk AI — Autonomous IT Service Desk Resolution Agent',
  description: 'Evidence-driven autonomous AI IT Helpdesk agent with policy guardrails and human-in-the-loop approvals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col cyber-grid-bg text-[#e0e0e0] selection:bg-[#00ff88]/30 selection:text-[#00ff88]">
        <div className="scanline-overlay" aria-hidden="true" />
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
