import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, UserCircle, Settings, LayoutDashboard, Plus, Eye, Users, Calendar, TrendingUp, DollarSign } from "lucide-react";
import AdsenseAdUnit from "@/components/AdsenseAdUnit"; // Adjust path if necessary

// Add proper TypeScript interfaces
interface Room {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  admin_id: string;
}

interface MemberRoom {
  room_id: string;
  role: string;
  joined_at: string;
  rooms: Room;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's created rooms
  const { data: userRooms } = await supabase
    .from('rooms')
    .select('id, name, description, created_at')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false });

  // Get rooms where user is a member - fix the type issue
  const { data: memberRooms } = await supabase
    .from('room_members')
    .select(`
      room_id,
      role,
      joined_at,
      rooms!inner (
        id,
        name,
        description,
        created_at,
        admin_id
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false });

  // Get user profile
  const { data: profile } = await supabase
    .from('profile')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const userName = profile?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const totalRooms = (userRooms?.length || 0) + (memberRooms?.length || 0);

  // Type the memberRooms properly
  const typedMemberRooms = memberRooms as MemberRoom[] | null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Logo */}
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    FinLoop
                  </span>
                  <div className="text-xs text-slate-500">Dashboard</div>
                </div>
              </Link>
            </div>

            {/* Enhanced User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-slate-800">Welcome back!</div>
                <div className="text-xs text-slate-500">{userName}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href="/dashboard/profile"
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
                >
                  <UserCircle className="w-6 h-6" />
                </Link>
                <form action="/auth/signout" method="post">
                  <button 
                    type="submit"
                    className="p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  Welcome back, {userName}! 👋
                </h1>
                <p className="text-blue-100 text-lg">
                  Ready to manage your expenses? You're in {totalRooms} room{totalRooms !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Rooms Created</p>
                  <p className="text-3xl font-bold text-slate-900">{userRooms?.length || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Member Of</p>
                  <p className="text-3xl font-bold text-slate-900">{typedMemberRooms?.length || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Rooms</p>
                  <p className="text-3xl font-bold text-slate-900">{totalRooms}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* AdSense Ad Unit Placement */}
          <div className="my-8"> {/* Container for the ad, adjust margin as needed */}
            <AdsenseAdUnit
              adClient="ca-pub-3743564978461381"
              adSlot="7538048353" // Use your specific ad slot ID from AdSense
              className="text-center" // Optional: for centering or other styling
            />
          </div>
          {/* End AdSense Ad Unit Placement */}

          {/* Enhanced Dashboard Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <Link 
                  href="/rooms/create"
                  className="w-full flex items-center px-4 py-3 text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-3" />
                  Create New Expense Room
                </Link>
                
                <Link 
                  href="/dashboard/rooms"
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border"
                >
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-3" />
                    View All My Rooms
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {totalRooms}
                  </span>
                </Link>
                
                <Link 
                  href="/dashboard/settings"
                  className="w-full flex items-center px-4 py-3 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Account Settings
                </Link>
              </div>
            </div>

            {/* My Created Rooms */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Rooms I Created</h2>
              
              {userRooms && userRooms.length > 0 ? (
                <div className="space-y-3">
                  {userRooms.slice(0, 3).map((room) => (
                    <Link
                      key={room.id}
                      href={`/rooms/${room.id}`}
                      className="block p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-all duration-200 border border-blue-200"
                    >
                      <div className="font-medium text-slate-800 truncate">{room.name}</div>
                      <div className="text-slate-500 text-xs flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        Created {new Date(room.created_at).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                  
                  {userRooms.length > 3 && (
                    <Link 
                      href="/dashboard/rooms"
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-3 border-t border-slate-200"
                    >
                      View All {userRooms.length} Rooms →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-slate-400 mb-3">
                    <Plus className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-slate-500 text-sm mb-4">No rooms created yet</p>
                  <Link 
                    href="/rooms/create"
                    className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Room
                  </Link>
                </div>
              )}
            </div>

            {/* Member Rooms - Fixed */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Rooms I'm In</h2>
              
              {typedMemberRooms && typedMemberRooms.length > 0 ? (
                <div className="space-y-3">
                  {typedMemberRooms.slice(0, 3).map((member) => (
                    <Link
                      key={member.room_id}
                      href={`/rooms/${member.rooms.id}`}
                      className="block p-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition-all duration-200 border border-green-200"
                    >
                      <div className="font-medium text-slate-800 truncate">{member.rooms.name}</div>
                      <div className="text-slate-500 text-xs flex items-center justify-between mt-1">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {member.role}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {typedMemberRooms.length > 3 && (
                    <Link 
                      href="/dashboard/rooms"
                      className="block text-center text-sm text-green-600 hover:text-green-700 font-medium pt-3 border-t border-slate-200"
                    >
                      View All {typedMemberRooms.length} Rooms →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-slate-400 mb-3">
                    <Users className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-slate-500 text-sm">Not a member of any rooms yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} FinLoop. Made with ❤️ for better expense management.
          </p>
        </div>
      </footer>
    </div>
  );
}