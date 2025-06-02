import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Calendar, ExternalLink } from "lucide-react";

export default async function MyRoomsPage() {
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

  // Get member counts for each room
  const roomsWithMemberCounts = await Promise.all(
    (userRooms || []).map(async (room) => {
      const { count } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);
      
      return {
        ...room,
        memberCount: count || 0
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-slate-300"></div>
              <h1 className="text-xl font-semibold text-slate-800">My Rooms</h1>
            </div>
            
            <Link 
              href="/rooms/create"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Room
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {roomsWithMemberCounts && roomsWithMemberCounts.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-slate-600">
                You have created {roomsWithMemberCounts.length} room{roomsWithMemberCounts.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomsWithMemberCounts.map((room) => (
                <div key={room.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 truncate">
                        {room.name}
                      </h3>
                      <Link
                        href={`/rooms/${room.id}`}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                    </div>

                    {room.description && (
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(room.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <Link
                        href={`/rooms/${room.id}`}
                        className="w-full flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                      >
                        Manage Room
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-slate-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No Rooms Created Yet
                </h3>
                <p className="text-slate-600 mb-6">
                  Create your first expense room to start managing group finances with your friends, family, or colleagues.
                </p>
                <Link 
                  href="/rooms/create"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Room
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}