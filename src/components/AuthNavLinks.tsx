'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Your client-side Supabase client
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function AuthNavLinks() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // If logged out, you might want to redirect or refresh
      if (event === 'SIGNED_OUT') {
        router.push('/'); // Or to /login
        router.refresh();
      }
      // If signed in (e.g. after email confirmation in another tab), refresh to update server state
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle the redirect and refresh
  };

  if (isLoading) {
    return ( // Basic loading state for links
      <div className="flex items-center space-x-4">
        <div className="h-5 w-12 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-20 bg-gray-700 rounded-md animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {user ? (
        <>
          <Link href="/dashboard" className="text-sm font-medium hover:text-slate-300 transition-colors">
            Dashboard
          </Link>
          <Link href="/rooms/create" className="text-sm font-medium hover:text-slate-300 transition-colors">
            Create Room
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="text-sm font-medium hover:text-slate-300 transition-colors">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            Sign Up
          </Link>
        </>
      )}
    </div>
  );
}