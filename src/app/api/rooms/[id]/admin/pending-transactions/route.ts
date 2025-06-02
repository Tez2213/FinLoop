import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('API /api/rooms/[id]/admin/pending-transactions GET HIT for room:', params.id);
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Check if user is admin of this room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('admin_id')
      .eq('id', params.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.admin_id !== user.id) {
      return NextResponse.json({ error: 'Access denied - Only room admin can view pending transactions' }, { status: 403 });
    }

    // Fetch all pending transactions for this room
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('room_id', params.id)
      .eq('status', 'PENDING')
      .order('transaction_date', { ascending: false });

    if (transactionError) {
      console.error('Error fetching pending transactions:', transactionError);
      return NextResponse.json({ error: 'Failed to fetch pending transactions' }, { status: 500 });
    }

    console.log(`Found ${transactions?.length || 0} pending transactions for room ${params.id}`);

    return NextResponse.json({
      transactions: transactions || [],
      count: transactions?.length || 0
    });

  } catch (error: any) {
    console.error('Unexpected error fetching pending transactions:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}