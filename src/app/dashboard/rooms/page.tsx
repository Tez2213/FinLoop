import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Calendar, ExternalLink, Crown, User, Settings, Eye, Search, Filter, LayoutGrid, List, LogOut } from "lucide-react"; // Added more icons

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

interface RoomWithCounts extends Room {
  memberCount: number;
  type: 'created';
}

interface MemberRoomWithCounts extends Room {
  memberCount: number;
  role: string;
  joined_at: string;
  type: 'member';
}

export default async function MyRoomsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's created rooms - Add admin_id
  const { data: userRooms } = await supabase
    .from('rooms')
    .select('id, name, description, created_at, admin_id')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false });

  // Get rooms where user is a member
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

  // Get member counts for created rooms
  const createdRoomsWithCounts: RoomWithCounts[] = await Promise.all(
    (userRooms || []).map(async (room) => {
      const { count } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);
      
      return {
        ...room,
        memberCount: count || 0,
        type: 'created' as const
      };
    })
  );

  // Get member counts for member rooms - Fixed the type issue
  const memberRoomsWithCounts: MemberRoomWithCounts[] = await Promise.all(
    ((memberRooms as unknown) as MemberRoom[] || []).map(async (member) => {
      const { count } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', member.room_id);
      
      return {
        id: member.rooms.id,
        name: member.rooms.name,
        description: member.rooms.description,
        created_at: member.rooms.created_at,
        admin_id: member.rooms.admin_id,
        memberCount: count || 0,
        role: member.role,
        joined_at: member.joined_at,
        type: 'member' as const
      };
    })
  );

  const totalRooms = createdRoomsWithCounts.length + memberRoomsWithCounts.length;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-200">
      {/* Enhanced Navigation */}
      <nav className="bg-slate-800/70 backdrop-blur-lg border-b border-purple-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20"> {/* Increased height for better spacing */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center text-purple-300 hover:text-purple-200 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 mr-1.5 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-purple-700/50"></div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-100">My Rooms</h1>
                <p className="text-xs text-slate-400">{totalRooms} total room{totalRooms !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <Link 
              href="/rooms/create"
              className="flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">New Room</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-10">
        {totalRooms > 0 ? (
          <>
            {/* Stats Overview - More vibrant */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { title: "Rooms Created", count: createdRoomsWithCounts.length, Icon: Crown, color: "blue" },
                { title: "Member Of", count: memberRoomsWithCounts.length, Icon: User, color: "green" },
                { title: "Total Rooms", count: totalRooms, Icon: Users, color: "purple" }
              ].map(stat => (
                <div key={stat.title} className={`bg-slate-800/50 backdrop-blur-md rounded-xl shadow-lg p-5 sm:p-6 border border-purple-700/30 hover:border-purple-600/70 transition-all group`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{stat.title}</p>
                      <p className={`text-2xl sm:text-3xl font-bold text-${stat.color}-400 group-hover:text-${stat.color}-300 transition-colors`}>{stat.count}</p>
                    </div>
                    <div className={`p-2.5 sm:p-3 bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/10 rounded-lg group-hover:scale-110 transition-transform`}>
                      <stat.Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${stat.color}-400`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Created Rooms Section */}
            {createdRoomsWithCounts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <div className="flex items-center space-x-2.5 sm:space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg">
                      <Crown className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Rooms I Created</h2>
                      <p className="text-xs sm:text-sm text-slate-400">You are the admin of these rooms</p>
                    </div>
                  </div>
                  <span className="bg-blue-500/20 text-blue-300 text-xs sm:text-sm px-2.5 py-1 rounded-full font-medium">
                    {createdRoomsWithCounts.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {createdRoomsWithCounts.map((room) => (
                    <div key={room.id} className="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300 border border-purple-700/40 group overflow-hidden flex flex-col">
                      <div className="p-5 sm:p-6 flex-grow">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-slate-100 group-hover:text-purple-300 transition-colors truncate pr-2">
                            {room.name}
                          </h3>
                          <span title="Room Admin" className="p-1.5 bg-blue-500/20 rounded-md flex-shrink-0">
                            <Crown className="w-4 h-4 text-blue-400" />
                          </span>
                        </div>
                        {room.description && (
                          <p className="text-slate-400 text-sm line-clamp-2 mb-3 sm:mb-4">
                            {room.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5">
                          <div className="flex items-center">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                            <span>{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                            <span>{formatDate(room.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-purple-700/30 p-3 sm:p-4 bg-slate-800/40">
                        <div className="flex space-x-2 sm:space-x-3">
                          <Link
                            href={`/rooms/${room.id}/settings`} // Assuming settings page
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md transition-all text-xs sm:text-sm font-medium transform hover:scale-105"
                          >
                            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Manage
                          </Link>
                          <Link
                            href={`/rooms/${room.id}`}
                            className="p-2 text-slate-400 hover:text-purple-300 bg-slate-700/50 hover:bg-purple-600/30 rounded-md transition-colors"
                            title="View Room"
                          >
                            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Member Rooms Section */}
            {memberRoomsWithCounts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <div className="flex items-center space-x-2.5 sm:space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg">
                      <User className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Rooms I'm In</h2>
                      <p className="text-xs sm:text-sm text-slate-400">You are a member of these rooms</p>
                    </div>
                  </div>
                  <span className="bg-green-500/20 text-green-300 text-xs sm:text-sm px-2.5 py-1 rounded-full font-medium">
                    {memberRoomsWithCounts.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {memberRoomsWithCounts.map((room) => (
                    <div key={room.id} className="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300 border border-purple-700/40 group overflow-hidden flex flex-col">
                      <div className="p-5 sm:p-6 flex-grow">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-slate-100 group-hover:text-purple-300 transition-colors truncate pr-2">
                            {room.name}
                          </h3>
                          <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            {room.role}
                          </span>
                        </div>
                        {room.description && (
                          <p className="text-slate-400 text-sm line-clamp-2 mb-3 sm:mb-4">
                            {room.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5">
                          <div className="flex items-center">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                            <span>{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                            <span>Joined {formatDate(room.joined_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-purple-700/30 p-3 sm:p-4 bg-slate-800/40">
                        <div className="flex space-x-2 sm:space-x-3">
                          <Link
                            href={`/rooms/${room.id}`}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-md transition-all text-xs sm:text-sm font-medium transform hover:scale-105"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            View Room
                          </Link>
                           <Link
                            href={`/rooms/${room.id}/leave`} // Example leave action
                            className="p-2 text-slate-400 hover:text-red-400 bg-slate-700/50 hover:bg-red-600/30 rounded-md transition-colors"
                            title="Leave Room" // Add a leave room functionality if needed
                          >
                            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> 
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] sm:min-h-[calc(100vh-12rem)]">
            <div className="text-center max-w-lg mx-auto">
              <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl p-8 sm:p-12 border border-purple-700/50">
                <div className="text-purple-400 mb-6">
                  <Users className="w-16 h-16 sm:w-20 sm:h-20 mx-auto opacity-70" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">
                  No Rooms Yet
                </h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm sm:text-base">
                  Create your first expense room or join one to start managing group finances with ease.
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <Link 
                    href="/rooms/create"
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Room
                  </Link>
                  <Link 
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center px-6 py-3 text-purple-300 hover:text-purple-200 hover:bg-purple-600/20 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}