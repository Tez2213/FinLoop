import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  console.log('🎯 MARK REIMBURSED API HIT for room:', roomId);
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { transactionId, memberUpiId } = await request.json();

    if (!transactionId || !memberUpiId) {
      return NextResponse.json({ error: 'Transaction ID and member UPI ID are required' }, { status: 400 });
    }

    // Check if user is admin of this room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('admin_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room || room.admin_id !== user.id) {
      return NextResponse.json({ error: 'Access denied - Only room admin can mark reimbursements' }, { status: 403 });
    }

    // Get the original transaction
    const { data: originalTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('room_id', roomId)
      .single();

    if (fetchError || !originalTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Update original transaction to mark as reimbursed
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        reimbursed: true,
        reimbursed_date: new Date().toISOString(),
        reimbursed_by: user.id,
        member_upi_id: memberUpiId
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return NextResponse.json({ error: 'Failed to mark transaction as reimbursed' }, { status: 500 });
    }

    // Create a new REIMBURSEMENT transaction record for tracking
    const { data: reimbursementTransaction, error: reimbursementError } = await supabase
      .from('transactions')
      .insert({
        room_id: roomId,
        user_id: originalTransaction.user_id,
        type: 'REIMBURSEMENT_PAYMENT',
        amount: originalTransaction.amount,
        notes: `Reimbursement for: ${originalTransaction.notes}`,
        status: 'CONFIRMED',
        transaction_date: new Date().toISOString(),
        reference_transaction_id: transactionId,
        paid_via_upi: memberUpiId,
        paid_by_admin: user.id
      })
      .select()
      .single();

    if (reimbursementError) {
      console.error('Error creating reimbursement record:', reimbursementError);
    }

    // Update room fund
    await updateRoomFund(supabase, roomId);

    console.log(`Transaction ${transactionId} marked as reimbursed via UPI ${memberUpiId}`);

    return NextResponse.json({
      success: true,
      message: 'Transaction marked as reimbursed successfully',
      reimbursementTransaction
    });

  } catch (error: any) {
    console.error('Unexpected error in mark reimbursed:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to update room fund
async function updateRoomFund(supabase: any, roomId: string) {
  try {
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('type, amount, status')
      .eq('room_id', roomId)
      .eq('status', 'CONFIRMED');

    if (transactionError) return;

    let total_contributions = 0;
    let total_reimbursements = 0;

    transactions?.forEach((transaction: any) => {
      if (transaction.type === 'CONTRIBUTION') {
        total_contributions += transaction.amount;
      } else if (transaction.type === 'REIMBURSEMENT' || transaction.type === 'REIMBURSEMENT_PAYMENT') {
        total_reimbursements += transaction.amount;
      }
    });

    const current_balance = total_contributions - total_reimbursements;

    const { data: existingFund } = await supabase
      .from('room_funds')
      .select('id')
      .eq('room_id', roomId)
      .single();

    if (existingFund) {
      await supabase
        .from('room_funds')
        .update({
          total_contributions,
          total_reimbursements,
          current_balance,
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId);
    } else {
      await supabase
        .from('room_funds')
        .insert({
          room_id: roomId,
          total_contributions,
          total_reimbursements,
          current_balance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error updating room fund:', error);
  }
}