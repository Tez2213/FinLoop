import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  console.log('API /api/rooms/[id]/contribute POST HIT for room:', roomId);
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { amount, notes } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Check if user is a member of this room
    const { data: memberCheck, error: memberError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json({ error: 'Access denied - not a room member' }, { status: 403 });
    }

    // Get room details to get admin UPI ID
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('admin_upi_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room || !room.admin_upi_id) {
      return NextResponse.json({ error: 'Room not found or admin UPI ID not configured' }, { status: 404 });
    }

    // Create PENDING transaction (cast to any to bypass type checking)
    const { data: transaction, error: transactionError } = await (supabase as any)
      .from('transactions')
      .insert({
        room_id: roomId,
        user_id: user.id,
        type: 'CONTRIBUTION',
        amount: parseFloat(amount),
        notes: notes?.trim() || 'Fund contribution',
        status: 'PENDING', // Set as PENDING initially
        admin_upi_id: room.admin_upi_id,
        transaction_date: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create contribution record' }, { status: 500 });
    }

    console.log('Contribution submitted for admin approval:', transaction);

    return NextResponse.json({
      success: true,
      message: 'Contribution submitted successfully! Waiting for admin approval.',
      transaction
    });

  } catch (error: any) {
    console.error('Unexpected error in contribution:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}