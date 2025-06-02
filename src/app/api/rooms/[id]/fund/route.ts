import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('API /api/rooms/[id]/fund GET HIT for room:', params.id);
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Check if user is a member of this room
    const { data: memberData, error: memberError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Access denied - not a room member' }, { status: 403 });
    }

    // Try to get fund data from room_funds table first (CHANGED)
    const { data: roomFundData, error: roomFundError } = await supabase
      .from('room_funds')  // ← CHANGED
      .select('*')
      .eq('room_id', params.id)
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

    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('type, amount, status')
      .eq('room_id', params.id)
      .eq('status', 'CONFIRMED');

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Calculate totals
    let total_contributions = 0;
    let total_reimbursements = 0;

    transactions?.forEach(transaction => {
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

    // Create room_funds record for future use (CHANGED)
    const { error: insertError } = await supabase
      .from('room_funds')  // ← CHANGED
      .insert({
        room_id: params.id,
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