import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  console.log('API /api/rooms/[id] GET HIT for room:', roomId);
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Get room details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if user is a member
    const { data: memberCheck, error: memberError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json({ error: 'Access denied - not a room member' }, { status: 403 });
    }

    // Get all room members (cast to any to bypass type checking)
    const { data: membersData, error: membersError } = await (supabase as any)
      .from('room_members')
      .select('*')
      .eq('room_id', roomId);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch room members' }, { status: 500 });
    }

    // Get profile information for each member
    const membersWithNames = await Promise.all(
      (membersData || []).map(async (member: any) => {
        const { data: profile } = await supabase
          .from('profile')
          .select('full_name')
          .eq('id', member.user_id)
          .single();

        return {
          ...member,
          user_name: profile?.full_name || `User ${member.user_id.substring(0, 8)}...`
        };
      })
    );

    return NextResponse.json({
      room,
      members: membersWithNames,
      userRole: memberCheck.role
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}