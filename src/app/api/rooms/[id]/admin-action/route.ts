import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  console.log('API /api/rooms/[id]/admin-action POST HIT for room:', resolvedParams.id);
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { transactionId, action } = await request.json();
    
    if (!transactionId || !action) {
      return NextResponse.json({ error: 'Transaction ID and action are required' }, { status: 400 });
    }

    if (!['CONFIRMED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be CONFIRMED or REJECTED' }, { status: 400 });
    }

    // Check if user is admin of this room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('admin_id')
      .eq('id', resolvedParams.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.admin_id !== user.id) {
      return NextResponse.json({ error: 'Access denied - Only room admin can perform this action' }, { status: 403 });
    }

    // Update the transaction status
    const { data: transaction, error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: action,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .eq('room_id', resolvedParams.id) // Ensure transaction belongs to this room
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // If confirmed, update room fund
    if (action === 'CONFIRMED') {
      await updateRoomFund(supabase, resolvedParams.id);
    }

    console.log(`Transaction ${transactionId} ${action} successfully`);

    return NextResponse.json({
      success: true,
      message: `Transaction ${action.toLowerCase()} successfully`,
      transaction
    });

  } catch (error: any) {
    console.error('Unexpected error in admin action:', error);
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

    // Check if room_fund record exists
    const { data: existingFund, error: fundFetchError } = await supabase
      .from('room_fund')
      .select('id')
      .eq('room_id', roomId)
      .single();

    if (existingFund) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('room_fund')
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
        .from('room_fund')
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