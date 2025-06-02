import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createRoomSchema = z.object({
  name: z.string().min(1, { message: 'Room name is required.' }).max(100),
  description: z.string().max(500).optional(),
  admin_upi_id: z.string().min(3, { message: 'Admin UPI ID is required.' }).max(50),
});

export async function POST(request: Request) {
  console.log('API /api/rooms/create HIT');
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Create room auth error:', authError);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  if (!user) {
    console.error('Create room: No user found');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  console.log('Authenticated user:', user.id, user.email);

  let validatedData;
  let requestBody;
  try {
    requestBody = await request.json();
    console.log('Request body received:', requestBody);
    validatedData = createRoomSchema.parse(requestBody);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
  }

  const { name, description, admin_upi_id } = validatedData;
  
  const roomInsertData = {
    name: name,
    description: description || null,
    admin_id: user.id,
    admin_upi_id: admin_upi_id,
  };
  
  console.log('Data to insert into rooms:', roomInsertData);

  try {
    // Step 1: Insert the room and get the created room data
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert(roomInsertData)
      .select('*')  // Select all columns to get the full room data
      .single();

    if (roomError) {
      console.error('Supabase insert room error:', roomError);
      return NextResponse.json({ 
        error: 'Failed to create room', 
        details: roomError.message 
      }, { status: 500 });
    }

    console.log('Room created successfully:', roomData);
    console.log('Room ID for member insertion:', roomData.id);

    // Step 2: Insert the admin as a member of the room
    const memberInsertData = {
      room_id: roomData.id,  // Use the ID from the created room
      user_id: user.id,
      role: 'admin',
    };
    
    console.log('Data to insert into room_members:', memberInsertData);

    const { data: memberData, error: memberError } = await supabase
      .from('room_members')
      .insert(memberInsertData)
      .select('*')
      .single();

    if (memberError) {
      console.error('Supabase insert room_member error:', memberError);
      
      // If member insertion fails, we should consider removing the room
      // to keep data consistent, but for debugging let's keep the room
      console.error('Room was created but failed to add admin as member');
      
      return NextResponse.json({ 
        error: 'Room created but failed to add admin as member',
        details: memberError.message,
        roomId: roomData.id  // Include room ID for debugging
      }, { status: 500 });
    }

    console.log('Admin added as room member successfully:', memberData);

    // Step 3: Return the complete room data
    return NextResponse.json({
      id: roomData.id,
      name: roomData.name,
      description: roomData.description,
      admin_id: roomData.admin_id,
      admin_upi_id: roomData.admin_upi_id,
      created_at: roomData.created_at,
      member_role: memberData.role
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in room creation:', error);
    return NextResponse.json({ 
      error: 'Server error during room creation',
      details: error.message 
    }, { status: 500 });
  }
}