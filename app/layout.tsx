import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Intern Buddy',
  description: 'Your AI internship companion — earn that return offer.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-[family-name:var(--font-inter)] antialiased bg-gray-50 text-gray-900">
        <ToastProvider>
          <div className="bg-gray-50 min-h-screen">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
