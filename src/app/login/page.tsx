'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Removed: import { Button } from '@/components/ui/button';
// Removed: import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed: import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        router.push('/dashboard'); // Or your desired redirect path
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Handler for demo login
  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@finloop.com',
        password: 'password123'
      });

      if (signInError) {
        throw signInError;
      }
      if (data.user) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo account');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Header */}
      <nav className="border-b border-slate-200/60 bg-white/70 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                FinLoop
              </span>
            </Link>
            
            <Link href="/" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card Replacement */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl">
            {/* CardHeader Replacement */}
            <div className="text-center p-6 border-b border-slate-200">
              <div className="flex justify-center mb-4">
                {/* Badge Replacement */}
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <LogIn className="w-3 h-3 mr-1.5" />
                  Welcome Back
                </div>
              </div>
              
              {/* CardTitle Replacement */}
              <h2 className="text-2xl font-bold text-slate-900">
                Sign in to FinLoop
              </h2>
              {/* CardDescription Replacement */}
              <p className="text-slate-600 text-sm mt-1">
                Continue managing your group expenses
              </p>
            </div>

            {/* CardContent Replacement */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-slate-600">
                    <input type="checkbox" className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500 focus:ring-offset-1" />
                    <span className="ml-2">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-slate-900 hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                {/* Button Replacement */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-slate-900 font-medium hover:underline">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demo */}
          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Try Demo Account
            </button>
            <p className="text-xs text-slate-500 mt-2">
              Use demo@finloop.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}