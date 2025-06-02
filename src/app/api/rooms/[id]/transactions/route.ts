import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('API /api/rooms/[id]/transactions GET HIT for room:', params.id);
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Check if user is a member of this room OR admin
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('admin_id')
      .eq('id', params.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if user is admin OR member
    const isAdmin = room.admin_id === user.id;
    
    if (!isAdmin) {
      // Check if user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', params.id)
        .eq('user_id', user.id)
        .single();

      if (memberError || !memberData) {
        return NextResponse.json({ error: 'Access denied - not a room member' }, { status: 403 });
      }
    }

    // Fetch ALL transactions for this room (no status filter)
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('room_id', params.id)
      .order('transaction_date', { ascending: false });

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    console.log(`Found ${transactions?.length || 0} total transactions for room ${params.id}`);
    console.log('Transactions:', transactions); // Debug log

    return NextResponse.json({
      transactions: transactions || [],
      count: transactions?.length || 0
    });

  } catch (error: any) {
    console.error('Unexpected error fetching transactions:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}