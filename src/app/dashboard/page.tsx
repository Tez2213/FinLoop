import { createClient } from "@/lib/supabase/server"; // Use server client
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, UserCircle, Settings, LayoutDashboard } from "lucide-react"; // Example icons

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // Protect this route
  }

  // Extract user's name from metadata if available, otherwise use email part
  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-800">
                  FinLoop
                </span>
              </Link>
            </div>

            {/* User Menu / Logout */}
            <div className="flex items-center">
              <span className="text-sm text-slate-600 mr-3 hidden sm:block">
                Welcome, {userName}
              </span>
              {/* Simple Logout Button - For a real app, this would be a dropdown with profile, settings etc. */}
              <form action="/auth/signout" method="post">
                <button 
                  type="submit"
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
              Hello, {userName}!
            </h1>
            <p className="text-slate-600">
              Welcome to your FinLoop dashboard. Here's a quick overview.
            </p>
          </div>

          {/* Dashboard Cards/Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example Card 1: User Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <UserCircle className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-slate-700">Your Profile</h2>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> <span className="break-all">{user.id}</span></p>
                <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <Link href="/dashboard/profile" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium">
                Edit Profile &rarr;
              </Link>
            </div>

            {/* Example Card 2: Quick Actions (Placeholder) */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-slate-700">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                  Create New Expense Room
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                  View My Rooms
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                  Account Settings
                </button>
              </div>
            </div>
            
            {/* Example Card 3: Stats (Placeholder) */}
            <div className="bg-white shadow rounded-lg p-6 md:col-span-2 lg:col-span-1">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">Activity Overview</h2>
              <p className="text-slate-500 text-sm">
                More detailed stats and charts will appear here soon...
              </p>
              {/* Placeholder for charts or more stats */}
              <div className="mt-4 h-32 bg-slate-50 rounded-md flex items-center justify-center text-slate-400">
                Chart Area
              </div>
            </div>
          </div>

          {/* More dashboard content can be added here */}
        </div>
      </main>

      {/* Footer (Optional) */}
      <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-slate-200">
        &copy; {new Date().getFullYear()} FinLoop. All rights reserved.
      </footer>
    </div>
  );
}