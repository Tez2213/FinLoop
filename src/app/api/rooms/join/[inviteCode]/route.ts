import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params;
  console.log('API /api/rooms/join/[inviteCode] GET HIT for code:', inviteCode);
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Join room auth error:', authError);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Fetch invite details first
    const { data: inviteData, error: inviteError } = await supabase
      .from('room_invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (inviteError || !inviteData) {
      console.error('Invite not found:', inviteError);
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Fetch room details separately
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, description')
      .eq('id', inviteData.room_id)
      .single();

    if (roomError || !roomData) {
      console.error('Room not found:', roomError);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if invite has expired
    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Check if invite has reached max uses
    if (inviteData.current_uses >= inviteData.max_uses) {
      return NextResponse.json({ error: 'Invite has reached maximum uses' }, { status: 400 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('room_members')
      .select('id, role')
      .eq('room_id', inviteData.room_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      // User is already a member - return special response
      return NextResponse.json({
        already_member: true,
        room_id: inviteData.room_id,
        room_name: roomData.name,
        room_description: roomData.description,
        user_role: existingMember.role,
        message: 'You are already a member of this room'
      });
    }

    console.log('Invite details validated successfully:', inviteData);
    console.log('Room details:', roomData);

    return NextResponse.json({
      room_id: inviteData.room_id,
      room_name: roomData.name,
      room_description: roomData.description,
      created_by: inviteData.created_by,
      expires_at: inviteData.expires_at,
      max_uses: inviteData.max_uses,
      current_uses: inviteData.current_uses
    });

  } catch (error: any) {
    console.error('Unexpected error validating invite:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params;
  console.log('API /api/rooms/join/[inviteCode] POST HIT for code:', inviteCode);
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Join room auth error:', authError);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Fetch and validate invite (same validation as GET)
    const { data: inviteData, error: inviteError } = await supabase
      .from('room_invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    if (inviteData.current_uses >= inviteData.max_uses) {
      return NextResponse.json({ error: 'Invite has reached maximum uses' }, { status: 400 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', inviteData.room_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      // User is already a member - redirect them to the room
      return NextResponse.json({
        success: true,
        already_member: true,
        room_id: inviteData.room_id,
        message: 'You are already a member of this room'
      });
    }

    // Add user as member
    const { data: memberData, error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: inviteData.room_id,
        user_id: user.id,
        role: 'member'
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error adding member:', memberError);
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
    }

    // Update invite usage count
    const { error: updateError } = await supabase
      .from('room_invites')
      .update({ 
        current_uses: inviteData.current_uses + 1,
        used_by: user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', inviteData.id);

    if (updateError) {
      console.error('Error updating invite usage:', updateError);
      // Don't fail the request, member was added successfully
    }

    console.log('User successfully joined room:', memberData);

    return NextResponse.json({
      success: true,
      room_id: inviteData.room_id,
      member_id: memberData.id
    });

  } catch (error: any) {
    console.error('Unexpected error joining room:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}