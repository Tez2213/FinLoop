import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, UserCircle, Settings, LayoutDashboard, Plus, Eye } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's rooms
  const { data: userRooms } = await supabase
    .from('rooms')
    .select('id, name, description, created_at')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false });

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
              Welcome to your FinLoop dashboard. Manage your expense rooms and track your finances.
            </p>
          </div>

          {/* Dashboard Cards/Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
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

            {/* Quick Actions Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-slate-700">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <Link 
                  href="/rooms/create"
                  className="w-full flex items-center px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Expense Room
                </Link>
                
                {userRooms && userRooms.length > 0 ? (
                  <Link 
                    href="/dashboard/rooms"
                    className="w-full flex items-center px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View My Rooms ({userRooms.length})
                  </Link>
                ) : (
                  <div className="w-full flex items-center px-4 py-2 text-sm text-slate-500 bg-slate-50 rounded-md cursor-not-allowed">
                    <Eye className="w-4 h-4 mr-2" />
                    No Rooms Created Yet
                  </div>
                )}
                
                <Link 
                  href="/dashboard/settings"
                  className="w-full flex items-center px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Link>
              </div>
            </div>
            
            {/* My Rooms Overview Card */}
            <div className="bg-white shadow rounded-lg p-6 md:col-span-2 lg:col-span-1">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">My Rooms Overview</h2>
              
              {userRooms && userRooms.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Total Rooms:</span>
                    <span className="font-medium text-slate-800">{userRooms.length}</span>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {userRooms.slice(0, 3).map((room) => (
                      <Link
                        key={room.id}
                        href={`/rooms/${room.id}`}
                        className="block p-2 bg-slate-50 hover:bg-slate-100 rounded text-sm transition-colors"
                      >
                        <div className="font-medium text-slate-800 truncate">{room.name}</div>
                        <div className="text-slate-500 text-xs">
                          Created {new Date(room.created_at).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {userRooms.length > 3 && (
                    <Link 
                      href="/dashboard/rooms"
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2 border-t border-slate-200"
                    >
                      View All Rooms &rarr;
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400 mb-2">No rooms created yet</div>
                  <Link 
                    href="/rooms/create"
                    className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Room
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-slate-200">
        &copy; {new Date().getFullYear()} FinLoop. All rights reserved.
      </footer>
    </div>
  );
}