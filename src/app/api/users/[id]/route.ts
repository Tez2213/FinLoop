import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      // Try to get from auth.users if profile doesn't exist
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
      
      if (authUserError || !authUser.user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: authUser.user.id,
        email: authUser.user.email,
        name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'User'
      });
    }

    // Get email from auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    return NextResponse.json({
      id: userId,
      email: authUser?.user?.email || null,
      name: profile.full_name,
      full_name: profile.full_name
    });

  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}