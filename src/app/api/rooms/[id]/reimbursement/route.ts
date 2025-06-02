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

    if (!notes) {
      return NextResponse.json({ error: 'Description/notes are required for reimbursement' }, { status: 400 });
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

    // Create PENDING reimbursement transaction (cast to any to bypass type checking)
    const { data: transaction, error: transactionError } = await (supabase as any)
      .from('transactions')
      .insert({
        room_id: roomId,
        user_id: user.id,
        type: 'REIMBURSEMENT',
        amount: parseFloat(amount),
        notes: notes.trim(),
        status: 'PENDING', // Set as PENDING initially
        merchant_upi_id: merchantUpiId.trim(),
        reference_id: referenceId?.trim() || null,
        transaction_date: new Date().toISOString(),
        reimbursed: false
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating reimbursement transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create reimbursement request' }, { status: 500 });
    }

    console.log('Reimbursement request submitted for admin approval:', transaction);

    return NextResponse.json({
      success: true,
      message: 'Reimbursement request submitted successfully! Waiting for admin approval.',
      transaction
    });

  } catch (error: any) {
    console.error('Unexpected error in reimbursement:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}