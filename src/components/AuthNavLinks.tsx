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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return ( // Basic loading state for links
      <div className="flex items-center space-x-4">
        <div className="h-5 w-12 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-20 bg-gray-700 rounded-md animate-pulse"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
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
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <Link href="/login" className="btn btn-primary">
        Login
      </Link>
      <Link
        href="/signup"
        className="btn btn-outline"
      >
        Sign Up
      </Link>
    </div>
  );
}