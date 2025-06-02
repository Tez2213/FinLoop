import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Calendar, ExternalLink, Crown, User, Settings, Eye } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center text-slate-600 hover:text-slate-800 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">My Rooms</h1>
                <p className="text-xs text-slate-500">{totalRooms} total rooms</p>
              </div>
            </div>
            
            <Link 
              href="/rooms/create"
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Room
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {totalRooms > 0 ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Rooms Created</p>
                    <p className="text-3xl font-bold text-blue-600">{createdRoomsWithCounts.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Crown className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Member Of</p>
                    <p className="text-3xl font-bold text-green-600">{memberRoomsWithCounts.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Rooms</p>
                    <p className="text-3xl font-bold text-purple-600">{totalRooms}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Created Rooms Section */}
            {createdRoomsWithCounts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Crown className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Rooms I Created</h2>
                      <p className="text-slate-500">You are the admin of these rooms</p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                    {createdRoomsWithCounts.length} room{createdRoomsWithCounts.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {createdRoomsWithCounts.map((room) => (
                    <div key={room.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200 overflow-hidden group">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-slate-800 truncate">
                                {room.name}
                              </h3>
                              <span title="Room Admin">
                                <Crown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              </span>
                            </div>
                            {room.description && (
                              <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                                {room.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(room.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            href={`/rooms/${room.id}`}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Manage
                          </Link>
                          <Link
                            href={`/rooms/${room.id}`}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Room"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member Rooms Section */}
            {memberRoomsWithCounts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Rooms I'm In</h2>
                      <p className="text-slate-500">You are a member of these rooms</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                    {memberRoomsWithCounts.length} room{memberRoomsWithCounts.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {memberRoomsWithCounts.map((room) => (
                    <div key={room.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200 overflow-hidden group">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-slate-800 truncate">
                                {room.name}
                              </h3>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                {room.role}
                              </span>
                            </div>
                            {room.description && (
                              <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                                {room.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Joined {new Date(room.joined_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            href={`/rooms/${room.id}`}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Room
                          </Link>
                          <Link
                            href={`/rooms/${room.id}`}
                            className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Open Room"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-12 border border-slate-200">
                <div className="text-slate-400 mb-6">
                  <Users className="w-20 h-20 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  No Rooms Yet
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Create your first expense room to start managing group finances with your friends, family, or colleagues. 
                  You can also join existing rooms using an invite link.
                </p>
                <div className="space-y-3">
                  <Link 
                    href="/rooms/create"
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Room
                  </Link>
                  <Link 
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors"
                  >
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