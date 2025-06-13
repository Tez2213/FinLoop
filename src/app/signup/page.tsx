'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Mail, User, Lock, PartyPopper } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Metadata } from 'next';

//  SEO Metadata
// export const metadata: Metadata = {
//   title: 'Create Your Finloop Account',
//   description: 'Sign up for Finloop and start managing your group expenses effortlessly. Join today and simplify your finances!',
//   alternates: {
//     canonical: '/signup',
//   },
// };

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }
    if (formData.name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name.trim(), // Supabase often uses full_name
          },
          // emailRedirectTo: `${window.location.origin}/auth/callback`, // Optional: for email verification redirect
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // The user's profile might be created by a trigger in Supabase
        // or you can explicitly create/update it here if needed.
        // For now, we assume the `full_name` in options.data is handled.
        
        setSuccessMessage('Account created! Check your email to verify.');
        // Clear form or redirect after a delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else if (!data.session && !data.user) {
        // This case means email confirmation is required
        setSuccessMessage('Account created! Please check your email to verify your account before logging in.');
         setTimeout(() => {
          router.push('/login'); // Or a page that says "Check your email"
        }, 4000);
      }

    } catch (err: any) {
      if (err.message.includes("User already registered")) {
        setError("This email is already registered. Try logging in.");
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link href="/" className="inline-flex items-center text-purple-300 hover:text-purple-200 transition-colors group text-sm">
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8 text-center">
          <Link href="/" aria-label="Finloop Home">
            <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg mb-4 shadow-lg">
              <PartyPopper className="h-8 w-8 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Join FinLoop
          </h1>
          <p className="text-slate-400 text-sm">
            Create your account and simplify group expenses.
          </p>
        </div>

        <div className="p-6 sm:p-8 border-t border-purple-700/30">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-700/50 rounded-md">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-700/50 rounded-md">
              <p className="text-sm text-green-300">{successMessage}</p>
            </div>
          )}

          {!successMessage && ( // Only show form if no success message
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Alex Ryder"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {loading ? 'Creating Account...' : 'Create My Account'}
              </button>
            </form>
          )}

          {!successMessage && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-purple-400 font-medium hover:text-purple-300 hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>

        {!successMessage && (
          <div className="p-6 text-center border-t border-purple-700/30">
            <p className="text-xs text-slate-500">
              By creating an account, you agree to our
              <br className="sm:hidden"/> {/* Break line on small screens for better readability */}
              <Link href="/terms" className="underline hover:text-purple-400 transition-colors"> Terms of Service</Link>
              {' & '}
              <Link href="/privacy" className="underline hover:text-purple-400 transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}