import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  console.log('API /api/rooms/[id]/fund GET HIT for room:', roomId);
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Check if user is a member of this room
    const { data: memberData, error: memberError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Access denied - not a room member' }, { status: 403 });
    }

    // Try to get fund data from room_funds table first (cast to any to bypass type checking)
    const { data: roomFundData, error: roomFundError } = await (supabase as any)
      .from('room_funds')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (roomFundData && !roomFundError) {
      console.log('Fund data from room_funds table:', roomFundData);
      return NextResponse.json({
        total_contributions: roomFundData.total_contributions || 0,
        total_reimbursements: roomFundData.total_reimbursements || 0,
        current_balance: roomFundData.current_balance || 0,
        last_updated: roomFundData.updated_at
      });
    }

    // If no room_funds record exists, calculate from transactions
    console.log('No room_funds record found, calculating from transactions...');

    const { data: transactions, error: transactionError } = await (supabase as any)
      .from('transactions')
      .select('type, amount, status')
      .eq('room_id', roomId)
      .eq('status', 'CONFIRMED');

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Calculate totals
    let total_contributions = 0;
    let total_reimbursements = 0;

    transactions?.forEach((transaction: any) => {
      if (transaction.type === 'CONTRIBUTION') {
        total_contributions += transaction.amount;
      } else if (transaction.type === 'REIMBURSEMENT') {
        total_reimbursements += transaction.amount;
      }
    });

    const current_balance = total_contributions - total_reimbursements;

    const fundData = {
      total_contributions,
      total_reimbursements,
      current_balance,
      transaction_count: transactions?.length || 0
    };

    // Create room_funds record for future use (cast to any to bypass type checking)
    const { error: insertError } = await (supabase as any)
      .from('room_funds')
      .insert({
        room_id: roomId,
        total_contributions,
        total_reimbursements,
        current_balance,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating room fund record:', insertError);
    }

    console.log('Fund data calculated:', fundData);
    return NextResponse.json(fundData);

  } catch (error: any) {
    console.error('Unexpected error fetching fund data:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}