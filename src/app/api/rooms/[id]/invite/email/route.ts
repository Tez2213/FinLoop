import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  console.log('API /api/rooms/[id]/invite/email POST HIT for room:', roomId);
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { email, message, inviteCode } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Verify the room exists and user is admin
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, admin_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.admin_id !== user.id) {
      return NextResponse.json({ error: 'Only room admin can send invites' }, { status: 403 });
    }

    // Create invite code first
    let finalInviteCode = inviteCode;
    
    if (!finalInviteCode) {
      console.log('Creating new invite code in room_invites table...');
      const newInviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data: invite, error: inviteError } = await (supabase as any)
        .from('room_invites')
        .insert({
          room_id: roomId,
          invite_code: newInviteCode,
          created_by: user.id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          max_uses: 10,
          current_uses: 0
        })
        .select()
        .single();

      if (inviteError) {
        console.error('Error creating invite in room_invites:', inviteError);
        return NextResponse.json({ error: 'Failed to generate invite code' }, { status: 500 });
      }

      finalInviteCode = invite.invite_code;
      console.log('New invite code created:', finalInviteCode);
    }

    // Get admin profile for sender name
    const { data: adminProfile } = await supabase
      .from('profile')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const adminName = adminProfile?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Room Admin';
    const joinUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/rooms/join/${finalInviteCode}`;

    console.log('Checking if user already exists...');

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);

    if (existingUser) {
      console.log('User exists, checking if already in room...');
      
      // Check if user is already a member of this room
      const { data: existingMember } = await supabase
        .from('room_members')
        .select('id, role')
        .eq('room_id', roomId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        // User is already a member - send a "reminder" email instead
        console.log('User is already a member, sending reminder email...');
        
        const reminderEmailSubject = `🔔 Reminder: You're already in "${room.name}" on FinLoop`;
        const reminderEmailHTML = createReminderEmail(room.name, adminName, message, roomId);

        // Store reminder email
        await storeEmailInQueue(supabase, email, reminderEmailSubject, reminderEmailHTML, roomId, finalInviteCode, true);

        return NextResponse.json({
          success: true,
          message: `Reminder sent! ${email} is already a member of this room.`,
          inviteCode: finalInviteCode,
          method: 'reminder_email',
          userExists: true,
          alreadyMember: true,
          emailPreview: {
            to: email,
            subject: reminderEmailSubject,
            roomUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/rooms/${roomId}`,
            roomId: roomId
          }
        });
      }

      // User exists but not in room - add them and send welcome email
      console.log('Adding existing user to room...');
      const { error: memberError } = await (supabase as any)
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: existingUser.id,
          role: 'member',
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        console.error('Error adding user to room:', memberError);
        return NextResponse.json({ 
          error: 'Failed to add user to room',
          details: memberError.message 
        }, { status: 500 });
      }

      // Send welcome email for existing user
      const welcomeEmailSubject = `🎉 You've been added to "${room.name}" on FinLoop!`;
      const welcomeEmailHTML = createWelcomeEmail(room.name, adminName, message, roomId);

      // Store welcome email
      await storeEmailInQueue(supabase, email, welcomeEmailSubject, welcomeEmailHTML, roomId, finalInviteCode, true);

      return NextResponse.json({
        success: true,
        message: `Success! ${email} has been added to the room and notified.`,
        inviteCode: finalInviteCode,
        method: 'existing_user_added',
        userExists: true,
        alreadyMember: false,
        emailPreview: {
          to: email,
          subject: welcomeEmailSubject,
          roomUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/rooms/${roomId}`,
          roomId: roomId
        }
      });

    } else {
      // User doesn't exist - try to invite them
      console.log('User does not exist, sending invitation...');
      
      try {
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            room_name: room.name,
            room_id: roomId,
            invite_code: finalInviteCode,
            inviter_name: adminName,
            custom_message: message || '',
            invited_to_room: true
          },
          redirectTo: joinUrl
        });

        if (inviteError) {
          throw inviteError;
        }

        console.log('Supabase invitation sent successfully:', inviteData);

        // Store invitation email
        await storeEmailInQueue(supabase, email, `Invitation to join ${room.name} on FinLoop`, 'Supabase system invitation sent', roomId, finalInviteCode, true);

        return NextResponse.json({
          success: true,
          message: 'Invitation email sent successfully! The user will receive a confirmation email.',
          inviteCode: finalInviteCode,
          method: 'supabase_invitation',
          userExists: false,
          emailPreview: {
            to: email,
            subject: `Invitation to join ${room.name} on FinLoop`,
            joinUrl: joinUrl,
            roomId: roomId
          },
          note: 'User will receive an email similar to signup confirmation. After clicking the link, they will be redirected to join the room.'
        });

      } catch (inviteError: any) {
        console.error('Supabase invitation failed:', inviteError);
        
        // Fallback to custom invitation email
        const inviteEmailSubject = `🎉 You're invited to join "${room.name}" on FinLoop!`;
        const inviteEmailHTML = createInviteEmail(room.name, adminName, message, joinUrl);

        // Store custom invitation email
        await storeEmailInQueue(supabase, email, inviteEmailSubject, inviteEmailHTML, roomId, finalInviteCode, false);

        return NextResponse.json({
          success: true,
          message: 'Custom invitation created! (Supabase invitation failed, using custom email)',
          inviteCode: finalInviteCode,
          method: 'custom_invitation',
          userExists: false,
          emailPreview: {
            to: email,
            subject: inviteEmailSubject,
            joinUrl: joinUrl,
            roomId: roomId,
            note: 'Custom invitation email created - would be sent via email service in production'
          }
        });
      }
    }

  } catch (error: any) {
    console.error('Error processing invite email:', error);
    return NextResponse.json({
      error: 'Failed to process invitation email',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to store emails in queue
async function storeEmailInQueue(supabase: any, email: string, subject: string, htmlContent: string, roomId: string, inviteCode: string, sent: boolean) {
  await supabase
    .from('email_queue')
    .insert({
      to_email: email,
      subject: subject,
      html_content: htmlContent,
      room_id: roomId,
      invite_code: inviteCode,
      sent: sent,
      sent_at: sent ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    });
}

// Helper function to create reminder email for existing members
function createReminderEmail(roomName: string, adminName: string, message: string | null, roomId: string) {
  const roomUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/rooms/${roomId}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reminder: You're in ${roomName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔔 FinLoop</h1>
        <p style="color: #FEF3C7; margin: 5px 0 0 0;">Just a friendly reminder!</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">You're already in! 🎉</h2>
        
        <p style="font-size: 16px;">Hi there! 👋</p>
        
        <p style="font-size: 16px;"><strong>${adminName}</strong> tried to invite you to <strong>"${roomName}"</strong>, but good news - you're already a member!</p>
        
        ${message ? `
        <div style="background: #FEF3C7; padding: 20px; border-left: 4px solid #F59E0B; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic; color: #92400E;">
                <strong>Their message:</strong><br>
                "${message}"
            </p>
            <small style="color: #D97706;">- ${adminName}</small>
        </div>
        ` : ''}
        
        <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #0EA5E9;">
            <p style="margin: 0; color: #0369A1; font-size: 14px;">
                💡 <strong>Quick reminder:</strong> You can access this room anytime from your FinLoop dashboard.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${roomUrl}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                🏠 Go to Room
            </a>
        </div>
        
        <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; text-align: center;">
            This reminder was sent by ${adminName} through FinLoop.
        </p>
    </div>
</body>
</html>
  `;
}

// Helper function to create welcome email for existing users
function createWelcomeEmail(roomName: string, adminName: string, message: string | null, roomId: string) {
  const roomUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/rooms/${roomId}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to ${roomName}!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎯 FinLoop</h1>
        <p style="color: #D1FAE5; margin: 5px 0 0 0;">Welcome aboard! 🚀</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">You're in! ✨</h2>
        
        <p style="font-size: 16px;">Hi there! 👋</p>
        
        <p style="font-size: 16px;"><strong>${adminName}</strong> has added you to the expense room <strong>"${roomName}"</strong> on FinLoop!</p>
        
        ${message ? `
        <div style="background: #F0FDF4; padding: 20px; border-left: 4px solid #10B981; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic; color: #047857;">
                <strong>Personal message:</strong><br>
                "${message}"
            </p>
            <small style="color: #059669;">- ${adminName}</small>
        </div>
        ` : ''}
        
        <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #0EA5E9;">
            <h3 style="color: #0C4A6E; margin: 0 0 10px 0; font-size: 18px;">🎊 You're automatically in!</h3>
            <p style="margin: 0; color: #0369A1; font-size: 14px;">
                Since you already have a FinLoop account, you've been automatically added to this room. 
                No additional signup required!
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${roomUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                🚀 Go to Room
            </a>
        </div>
        
        <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; text-align: center;">
            You were added by ${adminName} through FinLoop.
        </p>
    </div>
</body>
</html>
  `;
}

// Helper function to create invite email for new users
function createInviteEmail(roomName: string, adminName: string, message: string | null, joinUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Join ${roomName} on FinLoop</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎯 FinLoop</h1>
        <p style="color: #e0e7ff; margin: 5px 0 0 0;">Expense Management Made Simple</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">You're Invited! 🎉</h2>
        
        <p style="font-size: 16px;">Hi there! 👋</p>
        
        <p style="font-size: 16px;"><strong>${adminName}</strong> has invited you to join the expense room <strong>"${roomName}"</strong> on FinLoop.</p>
        
        ${message ? `
        <div style="background: #f7fafc; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic; color: #2d3748;">
                <strong>Personal message:</strong><br>
                "${message}"
            </p>
            <small style="color: #718096;">- ${adminName}</small>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${joinUrl}" style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);">
                🚀 Join Room Now
            </a>
        </div>
        
        <p style="font-size: 14px; color: #718096;">
            <strong>Can't click the button?</strong> Copy and paste this link:<br>
            <code style="background: #f7fafc; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">${joinUrl}</code>
        </p>
    </div>
</body>
</html>
  `;
}