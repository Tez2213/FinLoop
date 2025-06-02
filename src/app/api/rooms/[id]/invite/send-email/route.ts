import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { inviteCode, email, message, roomName } = await request.json();

    if (!inviteCode || !email) {
      return NextResponse.json({ error: 'Invite code and email are required' }, { status: 400 });
    }

    // Verify the invite code exists and belongs to this room
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('code', inviteCode)
      .eq('room_id', roomId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if user is admin of this room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('admin_id, name')
      .eq('id', roomId)
      .single();

    if (roomError || room.admin_id !== user.id) {
      return NextResponse.json({ error: 'Only room admin can send invites' }, { status: 403 });
    }

    // Get admin profile for sender name
    const { data: adminProfile } = await supabase
      .from('profile')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const adminName = adminProfile?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Room Admin';
    const joinUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/rooms/join/${inviteCode}`;

    // Send email using Supabase Auth
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        room_name: roomName,
        room_id: roomId,
        invite_code: inviteCode,
        inviter_name: adminName,
        custom_message: message || '',
        join_url: joinUrl
      },
      redirectTo: joinUrl
    });

    if (emailError) {
      // Fallback: Create a custom email using Supabase Edge Functions or external service
      console.error('Supabase invite failed, trying custom email:', emailError);
      
      // You can implement a custom email service here
      // For now, we'll use a simple approach
      const { error: customEmailError } = await sendCustomInviteEmail({
        supabase,
        toEmail: email,
        roomName: roomName,
        inviterName: adminName,
        joinUrl,
        customMessage: message
      });

      if (customEmailError) {
        throw new Error(customEmailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully'
    });

  } catch (error: any) {
    console.error('Error sending invite email:', error);
    return NextResponse.json({
      error: 'Failed to send invitation email',
      details: error.message
    }, { status: 500 });
  }
}

// Custom email function using Supabase's built-in email
async function sendCustomInviteEmail({
  supabase,
  toEmail,
  roomName,
  inviterName,
  joinUrl,
  customMessage
}: {
  supabase: any;
  toEmail: string;
  roomName: string;
  inviterName: string;
  joinUrl: string;
  customMessage?: string;
}) {
  try {
    // Use Supabase's SQL function to send email
    const { error } = await supabase.rpc('send_invite_email', {
      to_email: toEmail,
      room_name: roomName,
      inviter_name: inviterName,
      join_url: joinUrl,
      custom_message: customMessage || ''
    });

    return { error: error?.message };
  } catch (err: any) {
    return { error: err.message };
  }
}