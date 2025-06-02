import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  console.log('API /api/rooms/[id]/invite POST HIT for room:', roomId);
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Create invite auth error:', authError);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { expires_in_hours = 24, max_uses = 10 } = body;

    // Verify user is admin of this room
    const { data: memberData, error: memberError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData || memberData.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only room admins can create invites' 
      }, { status: 403 });
    }

    // Generate unique invite code
    const inviteCode = randomBytes(16).toString('hex');
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // Create invite record (cast to any to bypass type checking)
    const { data: inviteData, error: inviteError } = await (supabase as any)
      .from('room_invites')
      .insert({
        room_id: roomId,
        invite_code: inviteCode,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses: max_uses,
        current_uses: 0
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return NextResponse.json({ 
        error: 'Failed to create invite' 
      }, { status: 500 });
    }

    console.log('Invite created successfully:', inviteData);

    return NextResponse.json({
      invite_code: inviteCode,
      expires_at: expiresAt.toISOString(),
      max_uses: max_uses
    });

  } catch (error: any) {
    console.error('Unexpected error creating invite:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}