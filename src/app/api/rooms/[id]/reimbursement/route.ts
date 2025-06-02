import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  console.log('API /api/rooms/[id]/reimbursement POST HIT for room:', roomId);
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { amount, notes, merchantUpiId, referenceId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!merchantUpiId) {
      return NextResponse.json({ error: 'Merchant UPI ID is required' }, { status: 400 });
    }

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

    // Create transaction record (cast to any to bypass type checking)
    const { data: transaction, error: transactionError } = await (supabase as any)
      .from('transactions')
      .insert({
        room_id: roomId,
        user_id: user.id,
        type: 'REIMBURSEMENT',
        amount: parseFloat(amount),
        notes: notes || 'Reimbursement request',
        merchant_upi_id: merchantUpiId,
        reference_id: referenceId,
        status: 'PENDING',
        transaction_date: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating reimbursement transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create reimbursement request' }, { status: 500 });
    }

    // Update room fund (though this won't change totals until admin confirms)
    await updateRoomFund(supabase, roomId);

    return NextResponse.json({ 
      message: 'Reimbursement request submitted successfully',
      transaction 
    });

  } catch (error: any) {
    console.error('Unexpected error in reimbursement API:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to update room fund (same as in contribute API)
async function updateRoomFund(supabase: any, roomId: string) {
  try {
    // Get all confirmed transactions for this room (cast to any to bypass type checking)
    const { data: transactions, error: transactionError } = await (supabase as any)
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

    // Check if room_funds record exists (cast to any to bypass type checking)
    const { data: existingFund, error: fundFetchError } = await (supabase as any)
      .from('room_funds')
      .select('id')
      .eq('room_id', roomId)
      .single();

    if (existingFund) {
      // Update existing record
      const { error: updateError } = await (supabase as any)
        .from('room_funds')
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
        console.error('Error creating room fund:', insertError);
      }
    }
  } catch (error) {
    console.error('Error in updateRoomFund:', error);
  }
}