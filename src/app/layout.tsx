import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WIPA Support Global Console | supportglobal.womensipalliance.com',
  description: 'Dedicated Agent Command Center for Women in IP Alliance (WIPA) Global Support & Live Chat.',
  keywords: ['WIPA', 'Support', 'Agent Console', 'Live Chat', 'Intellectual Property'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070913] text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
