import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('API /api/rooms/[id] GET HIT for room:', params.id);
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Get room auth error:', authError);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Fetch room details
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', params.id)
      .single();

    if (roomError) {
      console.error('Error fetching room:', roomError);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Fetch room members
    const { data: membersData, error: membersError } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', params.id);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      // Don't fail the whole request if members can't be fetched
    }

    console.log('Room data fetched successfully:', roomData);
    console.log('Members data:', membersData);

    return NextResponse.json({
      room: roomData,
      members: membersData || []
    });

  } catch (error: any) {
    console.error('Unexpected error in room fetch:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}