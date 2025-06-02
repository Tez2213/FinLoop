'use client';

import { usePathname } from 'next/navigation';
import Link from "next/link";
import AuthNavLinks from "@/components/AuthNavLinks";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show header/footer on landing page and auth pages
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname.startsWith('/auth/');
  
  if (isLandingPage || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white shadow-md">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-slate-300 transition-colors">
            Finloop
          </Link>
          <AuthNavLinks />
        </nav>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 text-slate-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Finloop. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <span className="mx-2">|</span>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}