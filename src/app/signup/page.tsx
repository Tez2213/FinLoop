'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Removed: import { Button } from '@/components/ui/button';
// Removed: import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed: import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, EyeOff, Mail, User, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
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
            name: formData.name
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // You might want to redirect to a verification page or dashboard
        // For now, let's assume dashboard after successful signup
        router.push('/dashboard'); // Or a verification pending page
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
                  <User className="w-3 h-3 mr-1.5" />
                  Create Account
                </div>
              </div>
              
              {/* CardTitle Replacement */}
              <h2 className="text-2xl font-bold text-slate-900">
                Join FinLoop
              </h2>
              {/* CardDescription Replacement */}
              <p className="text-slate-600 text-sm mt-1">
                Start managing your group expenses like a pro
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
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors text-sm"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Create a password (min. 6 characters)"
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Button Replacement */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-slate-900 font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-slate-700">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}