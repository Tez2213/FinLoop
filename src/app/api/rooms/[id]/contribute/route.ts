import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('API /api/rooms/[id]/contribute POST HIT for room:', params.id);
  
  const supabase = createClient();
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
    const { data: memberData, error: memberError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Access denied - not a room member' }, { status: 403 });
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        room_id: params.id,
        user_id: user.id,
        type: 'CONTRIBUTION',
        amount: parseFloat(amount),
        notes: notes || 'Fund contribution',
        status: 'PENDING',
        transaction_date: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Update or create room_fund record
    await updateRoomFund(supabase, params.id);

    return NextResponse.json({ 
      message: 'Contribution submitted successfully',
      transaction 
    });

  } catch (error: any) {
    console.error('Unexpected error in contribute API:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to update room fund
async function updateRoomFund(supabase: any, roomId: string) {
  try {
    // Get all confirmed transactions for this room
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('type, amount, status')
      .eq('room_id', roomId)
      .eq('status', 'CONFIRMED');

    if (transactionError) {
      console.error('Error fetching transactions for fund update:', transactionError);
      return;
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

    // Check if room_funds record exists (CHANGED)
    const { data: existingFund, error: fundFetchError } = await supabase
      .from('room_funds')  // ← CHANGED
      .select('id')
      .eq('room_id', roomId)
      .single();

    if (existingFund) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('room_funds')  // ← CHANGED
        .update({
          total_contributions,
          total_reimbursements,
          current_balance,
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId);

      if (updateError) {
        console.error('Error updating room fund:', updateError);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('room_funds')  // ← CHANGED
        .insert({
          room_id: roomId,
          total_contributions,
          total_reimbursements,
          current_balance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating room fund:', insertError);
      }
    }
  } catch (error) {
    console.error('Error in updateRoomFund:', error);
  }
}