'use client';

import { useState, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, ArrowLeft, Users, Settings, DollarSign, Mail, ListChecks, 
  RefreshCw, Copy, X, Edit, LogOut, Info, UserPlus, CreditCard, FileText, CheckCircle, AlertTriangle, Loader2, Home, ExternalLink, MessageSquare
} from 'lucide-react'; // Added Loader2, Home, ExternalLink, MessageSquare

interface Room {
  id: string;
  name: string;
  description: string;
  admin_id: string;
  admin_upi_id: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_name?: string; 
  user_email?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

interface RoomFund {
  total_contributions: number;
  total_reimbursements: number;
  current_balance: number;
}

interface Transaction {
  id: string;
  type: 'CONTRIBUTION' | 'REIMBURSEMENT' | 'EXPENSE';
  amount: number;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  user_id: string;
  user_name?: string;
  transaction_date: string;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const supabase = createClient();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  
  const [roomFund, setRoomFund] = useState<RoomFund | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [activeModal, setActiveModal] = useState<'contribute' | 'reimburse' | 'transactions' | 'invite' | null>(null);
  
  const [contributionForm, setContributionForm] = useState({ amount: '', notes: '' });
  const [reimbursementForm, setReimbursementForm] = useState({
    amount: '', notes: '', merchantUpiId: '', referenceId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteMode, setInviteMode] = useState<'link' | 'email' | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false); // This state might be better handled by a temporary success message

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.error('Failed to fetch current user:', error);
        router.push('/login');
        return;
      }
      
      // Get user profile for display name
      const { data: profile } = await supabase
        .from('profile')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      setCurrentUser({ 
        id: user.id, 
        email: user.email!, 
        name: profile?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      });
    } catch (err) {
      console.error('Error fetching current user:', err);
      router.push('/login');
    }
  };
  
  const fetchRoomData = async () => {
    if (!currentUser || !roomId) return;
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch room data');
      }
      const data = await response.json();
      setRoom(data.room);
      setMembers(data.members || []);
      const userMember = data.members?.find((member: Member) => member.user_id === currentUser.id);
      setUserRole(userMember?.role || null);
    } catch (err: any) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomFund = async () => {
    if (!roomId) return;
    try {
      const response = await fetch(`/api/rooms/${roomId}/fund`);
      if (response.ok) setRoomFund(await response.json());
    } catch (err) { console.error('Error fetching room fund:', err); }
  };

  const fetchTransactions = async () => {
    if (!roomId) return;
    try {
      const response = await fetch(`/api/rooms/${roomId}/transactions`);
      if (response.ok) {
        const data = await response.json();
        
        // Fetch user names for each transaction
        const transactionsWithNames = await Promise.all(
          (data.transactions || []).map(async (tx: Transaction) => {
            const { data: profile } = await supabase
              .from('profile')
              .select('full_name')
              .eq('id', tx.user_id)
              .single();
            
            return {
              ...tx,
              user_name: profile?.full_name || `User ${tx.user_id.substring(0, 8)}...`
            };
          })
        );
        
        setTransactions(transactionsWithNames);
      }
    } catch (err) { 
      console.error('Error fetching transactions:', err); 
    }
  };

  useEffect(() => {
    if (roomId) fetchCurrentUser();
  }, [roomId]);

  useEffect(() => {
    if (currentUser && roomId) {
      setLoading(true);
      Promise.all([fetchRoomData(), fetchRoomFund(), fetchTransactions()])
        .catch(err => setPageError(err.message || "Failed to load room details."))
        .finally(() => setLoading(false));
    }
  }, [currentUser, roomId]);


  const isAdmin = () => currentUser?.id === room?.admin_id || userRole === 'admin';

  const closeModal = () => {
    setActiveModal(null); setModalError(null); setInviteCode(null); setInviteMode(null);
    setInviteEmail(''); setInviteMessage(''); setEmailSent(false);
    setContributionForm({ amount: '', notes: '' });
    setReimbursementForm({ amount: '', notes: '', merchantUpiId: '', referenceId: '' });
  };

  const refreshAllData = async (event?: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    if(event) event.preventDefault();
    setModalError(null); // Clear modal error on refresh
    if (!roomId || !currentUser) return;
    console.log("Refreshing all data...");
    setLoading(true); // Indicate loading state for main page data
    try {
      await Promise.all([fetchRoomData(), fetchRoomFund(), fetchTransactions()]);
    } catch (err: any) {
      setPageError(err.message || "Failed to refresh data.");
    } finally {
      setLoading(false);
    }
  };
  
  // Action Handlers (Contribute, Reimburse, Invite) - Keep existing logic, ensure modalError is used
  const handleContribute = async () => {
    if (!contributionForm.amount || parseFloat(contributionForm.amount) <= 0) {
      setModalError('Please enter a valid amount'); return;
    }
    setSubmitting(true); setModalError(null);
    try {
      const response = await fetch(`/api/rooms/${roomId}/contribute`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ amount: parseFloat(contributionForm.amount), notes: contributionForm.notes }) 
      });
      if (!response.ok) { 
        const errorData = await response.json(); 
        throw new Error(errorData.error || 'Contribution failed'); 
      }
      closeModal(); fetchRoomFund(); fetchTransactions(); alert('Contribution submitted!'); // Consider replacing alert with styled notification
    } catch (err: any) { setModalError(err.message); } finally { setSubmitting(false); }
  };

  const handleReimbursement = async () => {
    if (!reimbursementForm.amount || parseFloat(reimbursementForm.amount) <= 0) {
      setModalError('Valid amount required'); return;
    }
    if (!reimbursementForm.merchantUpiId) {
      setModalError('Merchant UPI ID required'); return;
    }
    if (!reimbursementForm.notes) {
      setModalError('Notes for reimbursement are required'); return;
    }
    setSubmitting(true); setModalError(null);
    try {
      const response = await fetch(`/api/rooms/${roomId}/reimbursement`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          amount: parseFloat(reimbursementForm.amount), 
          notes: reimbursementForm.notes, 
          merchant_upi_id: reimbursementForm.merchantUpiId, 
          reference_id: reimbursementForm.referenceId 
        }) 
      });
      if (!response.ok) { 
        const errorData = await response.json(); 
        throw new Error(errorData.error || 'Reimbursement request failed'); 
      }
      closeModal(); fetchRoomFund(); fetchTransactions(); alert('Reimbursement request submitted!'); // Consider replacing alert
    } catch (err: any) { setModalError(err.message); } finally { setSubmitting(false); }
  };

  const generateInvite = async (mode: 'link' | 'email') => {
    if (!isAdmin()) { 
      setModalError('Only admins can create invites'); 
      return; 
    }
    
    setGeneratingInvite(true); 
    setModalError(null);
    setInviteMode(mode);
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expires_in_hours: 24,
          max_uses: 10
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invite');
      }
      
      const data = await response.json();
      setInviteCode(data.invite_code); 
      setActiveModal('invite');
    } catch (err: any) { 
      setModalError(`Invite generation failed: ${err.message}`); 
      setInviteMode(null);
    } finally { 
      setGeneratingInvite(false); 
    }
  };

  // Update your sendEmailInvite function in the room page
const sendEmailInvite = async () => {
  if (!inviteEmail) return;
  setSendingEmail(true); setModalError(null);
  
  try {
    const response = await fetch(`/api/rooms/${roomId}/invite/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: inviteEmail,
        message: inviteMessage,
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email invite');
    }
    
    setEmailSent(true);
    
    // Show appropriate success message based on the method
    let successMessage = '';
    
    switch (data.method) {
      case 'reminder_email':
        successMessage = `
🔔 Reminder Sent!

📧 To: ${inviteEmail}
💭 Status: User is already a member of this room
📨 Action: Sent a friendly reminder email

The user has been notified that they're already part of "${room?.name}".
        `;
        break;
        
      case 'existing_user_added':
        successMessage = `
🎉 User Added Successfully!

📧 To: ${inviteEmail}
✅ Status: Existing user added to room
📨 Action: Sent welcome email

${inviteEmail} has been automatically added to the room and notified!
        `;
        break;
        
      case 'supabase_invitation':
        successMessage = `
📧 Invitation Sent!

📧 To: ${inviteEmail}
🔗 Join URL: ${data.emailPreview?.joinUrl}
🎫 Invite Code: ${data.inviteCode}

New user will receive a signup confirmation email from Supabase.
        `;
        break;
        
      case 'custom_invitation':
        successMessage = `
📨 Custom Invitation Created!

📧 To: ${inviteEmail}
🔗 Join URL: ${data.emailPreview?.joinUrl}
🎫 Invite Code: ${data.inviteCode}

Note: Custom invitation email created (check console for preview).
        `;
        break;
        
      default:
        successMessage = `
✅ Invitation Processed!

📧 Sent to: ${inviteEmail}
🎫 Invite Code: ${data.inviteCode}

The user should receive an email shortly.
        `;
    }
    
    alert(successMessage);
    
    setTimeout(() => {
      setInviteEmail('');
      setInviteMessage('');
      setEmailSent(false);
      closeModal();
      // Refresh the page to show the new member (if they were added directly)
      if (data.method === 'existing_user_added') {
        window.location.reload();
      }
    }, 3000);
    
  } catch (err: any) {
    console.error('Email invite error:', err);
    setModalError(`Email invite failed: ${err.message}`);
  } finally {
    setSendingEmail(false);
  }
};
  const copyInviteLink = () => {
    if (inviteCode) {
      const inviteUrl = `${window.location.origin}/rooms/join/${inviteCode}`;
      navigator.clipboard.writeText(inviteUrl).then(() => alert('Invite link copied!')) // Consider styled notification
        .catch(() => alert('Failed to copy link.'));
    }
  };

  const userIsAdmin = isAdmin();
  const currentUserName = currentUser?.name || 'User';
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Full Page Loader
  if (loading && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto" />
          <p className="mt-4 text-slate-300 text-lg">Loading Room Details...</p>
        </div>
      </div>
    );
  }

  // Full Page Error (if room data fails to load initially)
  if (pageError && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-lg border border-red-700/50 rounded-xl shadow-2xl p-6 sm:p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-red-300 mb-3">Error Loading Room</h1>
          <p className="text-slate-400 bg-red-900/30 p-3 rounded-md mb-8 text-sm sm:text-base">{pageError}</p>
          <Link href="/dashboard" className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105">
            <Home className="w-5 h-5 mr-2" /> Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Room Not Found (after loading, if room is still null)
  if (!room) {
     return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl p-6 sm:p-8 text-center">
          <Info className="h-16 w-16 text-purple-400 mx-auto mb-6 opacity-70" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">Room Not Found</h1>
          <p className="text-slate-400 mb-8 text-sm sm:text-base">The room you are looking for does not exist or you may not have access.</p>
          <Link href="/dashboard" className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105">
            <Home className="w-5 h-5 mr-2" /> Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-200 flex flex-col">
        {/* Top Navigation Bar */}
        <nav className="bg-slate-800/70 backdrop-blur-lg border-b border-purple-700/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/dashboard" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">FinLoop</span>
              </Link>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <span className="text-xs sm:text-sm text-slate-400 hidden md:block">Hi, {currentUserName}</span>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="p-2 rounded-full text-slate-400 hover:bg-purple-600/30 hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 transition-colors" aria-label="Sign out">
                    <LogOut className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-100 truncate" title={room.name}>
                  {room.name}
                </h1>
                {room.description && (
                  <p className="mt-1 text-sm text-slate-400 truncate" title={room.description}>{room.description}</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0 md:ml-4">
                {userIsAdmin && (
                  <Link href={`/rooms/${roomId}/admin`} className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105">
                    <Settings className="w-4 h-4 mr-2" /> Admin Panel
                  </Link>
                )}
                 <button onClick={refreshAllData} disabled={loading} className="inline-flex items-center px-4 py-2.5 bg-slate-700/50 border border-purple-600/50 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium disabled:opacity-60">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading && !roomFund ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>
            
            {pageError && !loading && (
              <div className="mb-6 p-3 sm:p-4 text-sm text-red-300 bg-red-500/20 border border-red-700/50 rounded-lg flex items-start" role="alert">
                <AlertTriangle className="w-5 h-5 mr-2.5 flex-shrink-0 text-red-400" />
                <span>Error: {pageError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Room Info (Left Column) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Room Details Card */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-xl border border-purple-700/40">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-semibold text-slate-100">Room Details</h2>
                      {userIsAdmin && (
                        <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">Admin View</span>
                      )}
                    </div>
                    <dl className="space-y-3 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <dt className="text-slate-400">Admin UPI</dt>
                        <dd className="text-slate-200 font-medium sm:col-span-2">{room.admin_upi_id}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <dt className="text-slate-400">Created</dt>
                        <dd className="text-slate-200 sm:col-span-2">{formatDate(room.created_at)}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <dt className="text-slate-400">Your Role</dt>
                        <dd className="text-slate-100 font-semibold sm:col-span-2 capitalize">{userRole || 'Observer'}</dd>
                      </div>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <dt className="text-slate-400">Room ID</dt>
                        <dd className="text-slate-300 font-mono text-xs sm:col-span-2 break-all">{room.id}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Members Card */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-xl border border-purple-700/40">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-slate-100">Members ({members.length})</h2>
                      {userIsAdmin && (
                        <button 
                          onClick={() => setActiveModal('invite')}
                          disabled={generatingInvite} 
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-md shadow-sm hover:shadow-md transition-all text-xs font-medium transform hover:scale-105 disabled:opacity-70"
                        >
                          <UserPlus className="w-4 h-4 mr-1.5" /> Invite
                        </button>
                      )}
                    </div>
                    {members.length > 0 ? (
                      <ul className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {members.map((member) => (
                          <li key={member.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-purple-600/30 hover:border-purple-500/70 transition-colors">
                            <div>
                              <p className="font-medium text-slate-200 text-sm">
                                {member.user_name}
                                {member.user_id === currentUser?.id && (
                                  <span className="ml-1.5 text-xs text-purple-300">(You)</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400">
                                Joined: {formatDate(member.joined_at)}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">
                                ID: {member.user_id.substring(0, 8)}...
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              member.role === 'admin' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                            }`}>
                              {member.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-4">No members yet. Invite someone!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fund Management Sidebar (Right Column) */}
              <div className="lg:col-span-1 space-y-6">
                {/* Room Fund Card */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-xl border border-purple-700/40">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-slate-100 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-400" /> Room Fund
                      </h3>
                    </div>
                    {loading && !roomFund ? (
                       <div className="animate-pulse space-y-3 mt-2">
                          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                          <div className="h-6 bg-slate-700 rounded w-full mt-2"></div>
                        </div>
                    ) : roomFund ? (
                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-400">Contributions:</span>
                          <span className="font-semibold text-green-400 text-base">₹{roomFund.total_contributions.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-400">Reimbursements:</span>
                          <span className="font-semibold text-red-400 text-base">₹{roomFund.total_reimbursements.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-purple-700/30 pt-2.5 mt-2.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-slate-200">Current Balance:</span>
                            <span className="font-bold text-xl text-blue-400">₹{roomFund.current_balance.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-4">Fund data unavailable.</p>
                    )}
                  </div>
                </div>

                {/* Fund Actions Card */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-xl border border-purple-700/40">
                   <div className="p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                      <ListChecks className="w-5 h-5 mr-2 text-purple-400" /> Fund Actions
                    </h3>
                    <div className="space-y-3">
                      <Link href={`/rooms/${roomId}/contribute`} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105">
                        <CreditCard className="w-4 h-4 mr-2" /> Contribute Fund
                      </Link>
                      <Link href={`/rooms/${roomId}/reimbursement`} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105">
                        <FileText className="w-4 h-4 mr-2" /> Request Reimbursement
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity Card */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-xl border border-purple-700/40">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-slate-100">Recent Activity</h3>
                      <button 
                        onClick={() => setActiveModal('transactions')} 
                        className="text-sm text-purple-400 hover:text-purple-300 hover:underline font-medium"
                      >
                        View All
                      </button>
                    </div>
                    {loading && transactions.length === 0 ? (
                       <div className="animate-pulse space-y-3 mt-2">
                          <div className="h-12 bg-slate-700 rounded-lg"></div>
                          <div className="h-12 bg-slate-700 rounded-lg"></div>
                        </div>
                    ) : transactions.length > 0 ? (
                      <ul className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                        {transactions.slice(0, 5).map((tx) => (
                          <li key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-700/50 rounded-lg border border-purple-600/30 text-sm hover:border-purple-500/70 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`${tx.type === 'CONTRIBUTION' ? 'text-green-400' : 'text-orange-400'}`}>
                                  {tx.type === 'CONTRIBUTION' ? <CreditCard className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium ${tx.type === 'CONTRIBUTION' ? 'text-green-300' : 'text-orange-300'} truncate`}>
                                    {tx.type === 'CONTRIBUTION' ? 'Contribution' : 'Reimbursement'}
                                    <span className="ml-1 text-slate-200">₹{tx.amount.toFixed(2)}</span>
                                  </p>
                                  <p className="text-xs text-slate-400 truncate" title={`By: ${tx.user_name}`}>
                                    By: <span className="font-medium text-slate-300">{tx.user_name}</span>
                                    {tx.user_id === currentUser?.id && <span className="text-purple-400 ml-1">(You)</span>}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate" title={tx.notes}>
                                    {tx.notes || 'No notes'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                              tx.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-300' 
                              : tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' 
                              : 'bg-red-500/20 text-red-300'
                            }`}>
                              {tx.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-4">No transactions yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-purple-700/30 mt-auto">
          &copy; {new Date().getFullYear()} FinLoop. All rights reserved.
        </footer>
      </div>

      {/* Modal Overlay & Content - Styled for Dark Theme */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          {/* Contribution Modal */}
          {activeModal === 'contribute' && room && (
            <div className="bg-slate-800/80 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-purple-700/30">
                  <h3 className="text-xl font-semibold text-slate-100 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-green-400"/>Contribute to Room Fund</h3>
                  <button onClick={closeModal} className="p-1.5 rounded-full text-slate-400 hover:bg-purple-600/30 hover:text-purple-300 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-blue-900/30 border border-blue-700/50 p-3 rounded-lg mb-4 text-sm text-blue-300 space-y-1">
                  <p><strong>Instructions:</strong></p>
                  <ol className="list-decimal list-inside pl-2 space-y-0.5">
                    <li>Pay the amount to admin's UPI ID: <strong className="font-mono text-blue-200">{room.admin_upi_id}</strong>
                      <button onClick={() => { navigator.clipboard.writeText(room.admin_upi_id); alert('UPI ID copied!'); }} className="ml-2 text-purple-400 hover:underline text-xs">(Copy)</button>
                    </li>
                    <li>Fill this form with payment details.</li>
                    <li>Click "I Have Paid" to notify admin.</li>
                  </ol>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount (₹) <span className="text-red-400">*</span></label>
                    <input type="number" min="1" step="0.01" placeholder="Enter amount" value={contributionForm.amount} onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })} className="w-full px-3 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes (Optional)</label>
                    <textarea rows={2} placeholder="e.g., My share for dinner" value={contributionForm.notes} onChange={(e) => setContributionForm({ ...contributionForm, notes: e.target.value })} className="w-full px-3 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"/>
                  </div>
                  {parseFloat(contributionForm.amount) > 0 && (
                    <button onClick={() => { const upiUrl = `upi://pay?pa=${room.admin_upi_id}&pn=${encodeURIComponent(room.name)}&am=${contributionForm.amount}&cu=INR`; window.open(upiUrl, '_blank'); }} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open UPI App to Pay ₹{contributionForm.amount}
                    </button>
                  )}
                  {modalError && <p className="text-sm text-red-300 bg-red-500/20 p-2.5 rounded-md border border-red-700/50">{modalError}</p>}
                </div>
                <div className="flex space-x-3 mt-6 pt-4 border-t border-purple-700/30">
                  <button onClick={handleContribute} disabled={submitting || !contributionForm.amount} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105 disabled:opacity-70">
                    {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <CheckCircle className="w-5 h-5 mr-2"/>}
                    {submitting ? 'Submitting...' : 'I Have Paid'}
                  </button>
                  <button onClick={closeModal} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-700/50 border border-purple-600/50 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {/* Reimbursement Modal */}
          {activeModal === 'reimburse' && room && (
             <div className="bg-slate-800/80 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-purple-700/30">
                  <h3 className="text-xl font-semibold text-slate-100 flex items-center"><FileText className="w-5 h-5 mr-2 text-orange-400"/>Request Reimbursement</h3>
                  <button onClick={closeModal} className="p-1.5 rounded-full text-slate-400 hover:bg-purple-600/30 hover:text-purple-300 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                 <div className="bg-orange-900/30 border border-orange-700/50 p-3 rounded-lg mb-4 text-sm text-orange-300 space-y-1">
                  <p><strong>Process:</strong></p>
                  <ol className="list-decimal list-inside pl-2 space-y-0.5">
                    <li>You paid for room expenses from your pocket.</li>
                    <li>Fill details of your payment below.</li>
                    <li>Admin will verify and reimburse you from the room fund.</li>
                  </ol>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount Paid (₹) <span className="text-red-400">*</span></label>
                    <input type="number" min="1" step="0.01" placeholder="Amount you paid" value={reimbursementForm.amount} onChange={(e) => setReimbursementForm({ ...reimbursementForm, amount: e.target.value })} className="w-full px-3 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Merchant UPI ID <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="UPI ID where you paid" value={reimbursementForm.merchantUpiId} onChange={(e) => setReimbursementForm({ ...reimbursementForm, merchantUpiId: e.target.value })} className="w-full px-3 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Reference/Transaction ID (Optional)</label>
                    <input type="text" placeholder="Payment reference" value={reimbursementForm.referenceId} onChange={(e) => setReimbursementForm({ ...reimbursementForm, referenceId: e.target.value })} className="w-full px-3 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes / Purpose <span className="text-red-400">*</span></label>
                    <textarea rows={3} placeholder="What did you buy? Why?" value={reimbursementForm.notes} onChange={(e) => setReimbursementForm({ ...reimbursementForm, notes: e.target.value })} className="w-full px-3 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
                  </div>
                  {modalError && <p className="text-sm text-red-300 bg-red-500/20 p-2.5 rounded-md border border-red-700/50">{modalError}</p>}
                </div>
                <div className="flex space-x-3 mt-6 pt-4 border-t border-purple-700/30">
                  <button onClick={handleReimbursement} disabled={submitting || !reimbursementForm.amount || !reimbursementForm.merchantUpiId || !reimbursementForm.notes} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105 disabled:opacity-70">
                    {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <CheckCircle className="w-5 h-5 mr-2"/>}
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button onClick={closeModal} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-700/50 border border-purple-600/50 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {/* All Transactions Modal */}
          {activeModal === 'transactions' && (
            <div className="bg-slate-800/80 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-purple-700/30">
                  <h3 className="text-xl font-semibold text-slate-100 flex items-center">
                    <ListChecks className="w-5 h-5 mr-2 text-purple-400"/>All Transactions
                  </h3>
                  <button onClick={closeModal} className="p-1.5 rounded-full text-slate-400 hover:bg-purple-600/30 hover:text-purple-300 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {transactions.length > 0 ? (
                  <ul className="space-y-3">
                    {transactions.map((tx) => (
                      <li key={tx.id} className="p-3 bg-slate-700/50 border border-purple-600/30 rounded-lg hover:border-purple-500/70 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-3">
                            <span className={`${tx.type === 'CONTRIBUTION' ? 'text-green-400' : 'text-orange-400'}`}>
                              {tx.type === 'CONTRIBUTION' ? <CreditCard className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-200 text-sm">
                                {tx.type === 'CONTRIBUTION' ? 'Contribution' : 'Reimbursement'} - ₹{tx.amount.toFixed(2)}
                              </h4>
                              <p className="text-xs text-slate-400">
                                By: <span className="font-medium text-slate-300">{tx.user_name}</span>
                                {tx.user_id === currentUser?.id && <span className="text-purple-400 ml-1">(You)</span>}
                              </p>
                              <p className="text-xs text-slate-500 mt-1" title={tx.notes}>
                                {tx.notes || 'No notes provided'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                            tx.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-300' 
                            : tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' 
                            : 'bg-red-500/20 text-red-300'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 text-right">
                          {formatDateTime(tx.transaction_date)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10">
                    <ListChecks className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No transactions recorded yet.</p>
                  </div>
                )}
                 <div className="mt-6 pt-4 border-t border-purple-700/30">
                  <button onClick={closeModal} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-700/50 border border-purple-600/50 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Invite Modal */}
          {activeModal === 'invite' && userIsAdmin && room && (
            <div className="bg-slate-800/80 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl max-w-lg w-full">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-purple-700/30">
                  <h3 className="text-xl font-semibold text-slate-100 flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-green-400"/>Invite Members
                  </h3>
                  <button onClick={closeModal} className="p-1.5 rounded-full text-slate-400 hover:bg-purple-600/30 hover:text-purple-300 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!inviteCode ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300 mb-4">
                      Choose how you want to invite members to <strong className="text-purple-300">{room.name}</strong>:
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => generateInvite('link')}
                        disabled={generatingInvite}
                        className="w-full p-4 border-2 border-purple-700/50 rounded-lg hover:border-blue-500 hover:bg-blue-900/30 transition-colors text-left group"
                      >
                        <div className="flex items-center">
                          <Copy className="w-5 h-5 text-blue-400 group-hover:text-blue-300 mr-3" />
                          <div>
                            <h4 className="font-medium text-slate-200 group-hover:text-blue-300">Copy Invite Link</h4>
                            <p className="text-sm text-slate-400 group-hover:text-slate-300">Generate a link that you can share manually</p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => generateInvite('email')}
                        disabled={generatingInvite}
                        className="w-full p-4 border-2 border-purple-700/50 rounded-lg hover:border-green-500 hover:bg-green-900/30 transition-colors text-left group"
                      >
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-green-400 group-hover:text-green-300 mr-3" />
                          <div>
                            <h4 className="font-medium text-slate-200 group-hover:text-green-300">Send Email Invitation</h4>
                            <p className="text-sm text-slate-400 group-hover:text-slate-300">Send invite directly to member's email</p>
                          </div>
                        </div>
                      </button>
                    </div>
                    {generatingInvite && (
                      <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Generating invite...</p>
                      </div>
                    )}
                    {modalError && <p className="text-sm text-red-300 bg-red-500/20 p-3 rounded-md border border-red-700/50">{modalError}</p>}
                  </div>
                ) : inviteMode === 'link' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300 mb-3">Share this link to invite members:</p>
                    <div className="bg-slate-700/50 p-3 rounded-lg break-all text-sm font-mono border border-purple-600/50 text-purple-300">
                      {`${window.location.origin}/rooms/join/${inviteCode}`}
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={copyInviteLink} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105">
                        <Copy className="w-4 h-4 mr-2"/> Copy Link
                      </button>
                      <button onClick={() => { setInviteCode(null); setInviteMode(null); }} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-700/50 border border-purple-600/50 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium">
                        Back
                      </button>
                    </div>
                  </div>
                ) : ( // inviteMode === 'email'
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300 mb-3">Enter the email address to send an invitation:</p>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="member@example.com"
                        className="w-full px-3 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Personal Message (Optional)</label>
                      <textarea
                        rows={3}
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        placeholder="Hi! I'd like to invite you to join our expense room..."
                        className="w-full px-3 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    {modalError && <p className="text-sm text-red-300 bg-red-500/20 p-3 rounded-md border border-red-700/50">{modalError}</p>}
                    {emailSent && <p className="text-sm text-green-300 bg-green-500/20 p-3 rounded-md border border-green-700/50">Invitation sent successfully to {inviteEmail}!</p>}
                    <div className="flex space-x-3">
                      <button 
                        onClick={sendEmailInvite}
                        disabled={!inviteEmail || sendingEmail}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105 disabled:opacity-70"
                      >
                        {sendingEmail ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Mail className="w-4 h-4 mr-2"/>}
                        {sendingEmail ? 'Sending...' : 'Send Invitation'}
                      </button>
                      <button onClick={() => { setInviteCode(null); setInviteMode(null); setInviteEmail(''); setInviteMessage(''); }} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-700/50 border border-purple-600/50 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium">
                        Back
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-purple-700/30">
                  <button onClick={closeModal} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-700/50 border border-purple-600/50 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
