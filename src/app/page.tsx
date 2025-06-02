'use client';

import Link from 'next/link';
import { ArrowRight, Users, IndianRupee, BarChartBig, Zap, Shield, Smartphone, Menu, X, Github, Twitter, Mail, Heart } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                FinLoop
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How it Works</a>
              <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
              <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full font-medium transition-all transform hover:scale-105">
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-300 hover:text-white p-2"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-black/40 backdrop-blur-md rounded-lg mt-2 p-4 space-y-4">
              <a href="#features" className="block text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="block text-slate-300 hover:text-white transition-colors">How it Works</a>
              <a href="#about" className="block text-slate-300 hover:text-white transition-colors">About</a>
              <Link href="/login" className="block text-slate-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/signup" className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium text-center">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-4 py-2 mb-8">
            <Zap className="h-4 w-4 text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-400">Built for the digital generation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Split Expenses,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Not Friendships 
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            The <strong className="text-blue-400">smartest way</strong> to manage group expenses. 
            Track contributions, split bills, and settle up with <strong className="text-purple-400">instant UPI payments</strong>. 
            No more awkward money conversations! 
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
            <Link href="/signup" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg inline-flex items-center transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Create Your First Room
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full text-lg border border-white/20 hover:border-white/30 transition-all">
              Login to Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <IndianRupee className="h-8 w-8 mb-3 text-green-400 mx-auto" />
              <div className="text-3xl font-bold text-white mb-1">₹10L+</div>
              <div className="text-slate-400">Money Managed</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <Users className="h-8 w-8 mb-3 text-blue-400 mx-auto" />
              <div className="text-3xl font-bold text-white mb-1">500+</div>
              <div className="text-slate-400">Active Rooms</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <BarChartBig className="h-8 w-8 mb-3 text-purple-400 mx-auto" />
              <div className="text-3xl font-bold text-white mb-1">2K+</div>
              <div className="text-slate-400">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Features that <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">actually matter</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Built by Gen Z, for Gen Z. We get it - money stuff should be simple, fast, and stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant UPI Integration</h3>
              <p className="text-slate-300">Pay and get paid instantly with UPI. No more "I'll pay you back later" promises!</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all group">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Room-Based Management</h3>
              <p className="text-slate-300">Create rooms for different groups - roommates, travel squads, work teams. Keep everything organized!</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-md rounded-2xl p-8 border border-green-500/20 hover:border-green-500/40 transition-all group">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-time Tracking</h3>
              <p className="text-slate-300">See who owes what in real-time. No more confusion about who paid for what!</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How it <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">works</span>
            </h2>
            <p className="text-xl text-slate-300">Three simple steps to financial harmony</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">1</div>
              <h3 className="text-xl font-bold text-white mb-3">Create or Join a Room</h3>
              <p className="text-slate-300">Start a new room for your group or join an existing one with an invite code.</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">2</div>
              <h3 className="text-xl font-bold text-white mb-3">Track Expenses</h3>
              <p className="text-slate-300">Add expenses, contributions, and reimbursements. Everything is tracked automatically.</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-pink-500 to-red-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">3</div>
              <h3 className="text-xl font-bold text-white mb-3">Settle Up Instantly</h3>
              <p className="text-slate-300">Pay or request money with integrated UPI. No more awkward money conversations!</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Built by <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">developers</span>, for everyone
          </h2>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            We're tired of splitting bills the old way. FinLoop is our answer to the endless "who owes what" group chats. 
            Built with modern tech stack (Next.js, Supabase) and designed for the way we actually live and spend money today.
          </p>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <p className="text-lg text-slate-300 italic">
              "No more screenshots of expense calculators. No more forgetting who paid for dinner. 
              Just clean, simple expense management that actually works." 
            </p>
            <p className="text-blue-400 mt-4 font-medium">- The FinLoop Team</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to simplify your expenses?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of users who've made expense splitting stress-free.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/signup" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg inline-flex items-center transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="text-slate-300 hover:text-white font-medium">
              Already have an account? <span className="text-blue-400 hover:text-blue-300">Login here</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  FinLoop
                </span>
              </div>
              <p className="text-slate-400 mb-4 max-w-md">
                The smartest way to manage group expenses. Built for the digital generation with UPI integration and real-time tracking.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="mailto:support@finloop.app" className="text-slate-400 hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#about" className="text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><Link href="/signup" className="text-slate-400 hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="mailto:support@finloop.app" className="text-slate-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-slate-400 flex items-center justify-center">
              Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> by the FinLoop team
            </p>
            <p className="text-slate-500 text-sm mt-2">
              © 2024 FinLoop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}