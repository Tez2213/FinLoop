'use client';

import { useState, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, ArrowLeft, Users, Settings, DollarSign, ListChecks, 
  RefreshCw, Copy, X, Edit, LogOut, Info, UserPlus, CreditCard, FileText, CheckCircle, AlertTriangle 
} from 'lucide-react';

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
  user_id: string; // Assuming this will be populated with more user details later
  role: string;
  joined_at: string;
  // Add user_name or user_email if available from your API
  user_name?: string; 
  user_email?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string; // Add if available
}

interface RoomFund {
  total_contributions: number;
  total_reimbursements: number;
  current_balance: number;
}

interface Transaction {
  id: string;
  type: 'CONTRIBUTION' | 'REIMBURSEMENT' | 'EXPENSE'; // Added EXPENSE for clarity
  amount: number;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  user_id: string;
  user_name?: string; // Add if available
  transaction_date: string;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null); // Renamed from error to avoid conflict
  
  const [roomFund, setRoomFund] = useState<RoomFund | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [activeModal, setActiveModal] = useState<'contribute' | 'reimburse' | 'transactions' | 'invite' | null>(null);
  
  const [contributionForm, setContributionForm] = useState({ amount: '', notes: '' });
  const [reimbursementForm, setReimbursementForm] = useState({
    amount: '', notes: '', merchantUpiId: '', referenceId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null); // Specific error for modals
  
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user'); // Ensure this endpoint exists and returns user data
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      } else {
        console.error('Failed to fetch current user, redirecting to login.');
        router.push('/login');
      }
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
        setTransactions(data.transactions || []);
      }
    } catch (err) { console.error('Error fetching transactions:', err); }
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
    setActiveModal(null);
    setModalError(null);
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
      const response = await fetch(`/api/rooms/${roomId}/contribute`, { /* ... */ });
      if (!response.ok) { /* ... */ throw new Error(/* ... */); }
      closeModal(); fetchRoomFund(); fetchTransactions(); alert('Contribution submitted!');
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
      const response = await fetch(`/api/rooms/${roomId}/reimbursement`, { /* ... */ });
      if (!response.ok) { /* ... */ throw new Error(/* ... */); }
      closeModal(); fetchRoomFund(); fetchTransactions(); alert('Reimbursement request submitted!');
    } catch (err: any) { setModalError(err.message); } finally { setSubmitting(false); }
  };

  const generateInvite = async () => {
    if (!isAdmin()) { 
      setModalError('Only admins can create invites'); 
      return; 
    }
    
    setGeneratingInvite(true); 
    setModalError(null);
    
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
    } finally { 
      setGeneratingInvite(false); 
    }
  };

  const copyInviteLink = () => {
    if (inviteCode) {
      const inviteUrl = `${window.location.origin}/rooms/join/${inviteCode}`;
      navigator.clipboard.writeText(inviteUrl).then(() => alert('Invite link copied!'))
        .catch(() => alert('Failed to copy link.'));
    }
  };

  if (loading && !room) { // Show full page loader only on initial load
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-slate-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Room Details...</p>
        </div>
      </div>
    );
  }

  if (pageError && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Room</h2>
          <p className="text-red-600 bg-red-50 p-3 rounded-md mb-4">{pageError}</p>
          <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
         <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <Info className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Room Not Found</h2>
          <p className="text-slate-600 mb-4">The room you are looking for does not exist or you may not have access.</p>
          <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  const userIsAdmin = isAdmin();
  const currentUserName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User';

  return (
    <>
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Top Navigation Bar */}
        <nav className="bg-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-800">FinLoop</span>
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600 hidden sm:block">Hi, {currentUserName}</span>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors" aria-label="Sign out">
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
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900 truncate" title={room.name}>
                  {room.name}
                </h1>
                {room.description && (
                  <p className="mt-1 text-sm text-slate-600 truncate" title={room.description}>{room.description}</p>
                )}
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                {userIsAdmin && (
                  <Link href={`/rooms/${roomId}/admin`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">
                    <Settings className="w-4 h-4 mr-2" /> Admin
                  </Link>
                )}
                 <button onClick={() => refreshAllData()} disabled={loading} className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-colors">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading && !roomFund ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>
            
            {pageError && !loading && ( // Show non-critical errors here
              <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-start" role="alert">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Error: {pageError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Room Info (Left Column) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white shadow-lg rounded-lg border border-slate-200">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-semibold text-slate-800">Room Details</h2>
                      {userIsAdmin && (
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Admin View</span>
                      )}
                    </div>
                    <dl className="space-y-3 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <dt className="text-slate-500">Admin UPI</dt>
                        <dd className="text-slate-700 font-medium sm:col-span-2">{room.admin_upi_id}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <dt className="text-slate-500">Created</dt>
                        <dd className="text-slate-700 sm:col-span-2">{new Date(room.created_at).toLocaleDateString()}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <dt className="text-slate-500">Your Role</dt>
                        <dd className="text-slate-700 font-semibold sm:col-span-2 capitalize">{userRole || 'Observer'}</dd>
                      </div>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <dt className="text-slate-500">Room ID</dt>
                        <dd className="text-slate-700 font-mono text-xs sm:col-span-2 break-all">{room.id}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg border border-slate-200">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-slate-800">Members ({members.length})</h2>
                      {userIsAdmin && (
                        <button onClick={generateInvite} disabled={generatingInvite} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-60 transition-colors">
                          <UserPlus className="w-4 h-4 mr-1.5" /> Invite
                        </button>
                      )}
                    </div>
                    {members.length > 0 ? (
                      <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {members.map((member) => (
                          <li key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
                            <div>
                              <p className="font-medium text-slate-800 text-sm">
                                {member.user_name || member.user_email || `User ID: ${member.user_id.substring(0,8)}...`}
                                {member.user_id === currentUser?.id && (
                                  <span className="ml-1.5 text-xs text-blue-600">(You)</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              member.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {member.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 text-sm">No members yet. Invite someone!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fund Management Sidebar (Right Column) */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white shadow-lg rounded-lg border border-slate-200">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" /> Room Fund
                      </h3>
                    </div>
                    {loading && !roomFund ? (
                       <div className="animate-pulse space-y-3 mt-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                          <div className="h-6 bg-slate-200 rounded w-full mt-2"></div>
                        </div>
                    ) : roomFund ? (
                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-600">Contributions:</span>
                          <span className="font-semibold text-green-600 text-base">₹{roomFund.total_contributions.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-600">Reimbursements:</span>
                          <span className="font-semibold text-red-600 text-base">₹{roomFund.total_reimbursements.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2.5 mt-2.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-slate-800">Current Balance:</span>
                            <span className="font-bold text-xl text-blue-700">₹{roomFund.current_balance.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-4">Fund data unavailable.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg border border-slate-200">
                   <div className="p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <ListChecks className="w-5 h-5 mr-2 text-slate-600" /> Fund Actions
                    </h3>
                    <div className="space-y-3">
                      <Link href={`/rooms/${roomId}/contribute`} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                        <CreditCard className="w-4 h-4 mr-2" /> Contribute Fund
                      </Link>
                      <Link href={`/rooms/${roomId}/reimbursement`} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                        <CreditCard className="w-4 h-4 mr-2" /> Request Reimbursement
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow-lg rounded-lg border border-slate-200">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                        <Link href={`/rooms/${roomId}/transactions`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View All
                        </Link>
                    </div>
                    {loading && transactions.length === 0 ? (
                       <div className="animate-pulse space-y-3 mt-2">
                          <div className="h-10 bg-slate-200 rounded"></div>
                          <div className="h-10 bg-slate-200 rounded"></div>
                        </div>
                    ) : transactions.length > 0 ? (
                      <ul className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {transactions.slice(0, 5).map((tx) => (
                          <li key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200 text-sm">
                            <div>
                              <p className={`font-medium ${tx.type === 'CONTRIBUTION' ? 'text-green-700' : 'text-orange-700'}`}>
                                {tx.type === 'CONTRIBUTION' ? 'Contribution' : 'Reimbursement'}
                                <span className="ml-1.5 text-slate-800">₹{tx.amount.toFixed(2)}</span>
                              </p>
                              <p className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-xs" title={tx.notes}>{tx.notes || 'No notes'}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' 
                              : tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-red-100 text-red-700'
                            }`}>
                              {tx.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-4">No transactions yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-slate-200 mt-auto">
          &copy; {new Date().getFullYear()} FinLoop. All rights reserved.
        </footer>
      </div>

      {/* Modal Overlay & Content - Keep existing modal structure, ensure modalError is used */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          {/* Contribution Modal */}
          {activeModal === 'contribute' && room && (
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                  <h3 className="text-xl font-semibold text-slate-800 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-green-600"/>Contribute to Room Fund</h3>
                  <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-700 space-y-1">
                  <p><strong>Instructions:</strong></p>
                  <ol className="list-decimal list-inside pl-2">
                    <li>Pay the amount to admin's UPI ID: <strong className="font-mono">{room.admin_upi_id}</strong>
                      <button onClick={() => { navigator.clipboard.writeText(room.admin_upi_id); alert('UPI ID copied!'); }} className="ml-2 text-blue-600 hover:underline text-xs">(Copy)</button>
                    </li>
                    <li>Fill this form with payment details.</li>
                    <li>Click "I Have Paid" to notify admin.</li>
                  </ol>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
                    <input type="number" min="1" step="0.01" placeholder="Enter amount" value={contributionForm.amount} onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                    <textarea rows={2} placeholder="e.g., My share for dinner" value={contributionForm.notes} onChange={(e) => setContributionForm({ ...contributionForm, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"/>
                  </div>
                  {parseFloat(contributionForm.amount) > 0 && (
                    <button onClick={() => { const upiUrl = `upi://pay?pa=${room.admin_upi_id}&pn=${encodeURIComponent(room.name)}&am=${contributionForm.amount}&cu=INR&tn=${encodeURIComponent(contributionForm.notes || 'Fund contribution')}`; window.open(upiUrl, '_blank'); }} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500">
                      Open UPI App to Pay ₹{contributionForm.amount}
                    </button>
                  )}
                  {modalError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{modalError}</p>}
                </div>
                <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-200">
                  <button onClick={handleContribute} disabled={submitting || !contributionForm.amount} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'I Have Paid'}
                  </button>
                  <button onClick={closeModal} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {/* Reimbursement Modal */}
          {activeModal === 'reimburse' && room && (
             <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                  <h3 className="text-xl font-semibold text-slate-800 flex items-center"><FileText className="w-5 h-5 mr-2 text-orange-500"/>Request Reimbursement</h3>
                  <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                 <div className="bg-orange-50 p-3 rounded-md mb-4 text-sm text-orange-700 space-y-1">
                  <p><strong>Process:</strong></p>
                  <ol className="list-decimal list-inside pl-2">
                    <li>You paid for room expenses from your pocket.</li>
                    <li>Fill details of your payment below.</li>
                    <li>Admin will verify and reimburse you from the room fund.</li>
                  </ol>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid (₹) <span className="text-red-500">*</span></label>
                    <input type="number" min="1" step="0.01" placeholder="Amount you paid" value={reimbursementForm.amount} onChange={(e) => setReimbursementForm({ ...reimbursementForm, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Merchant UPI ID <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="UPI ID where you paid" value={reimbursementForm.merchantUpiId} onChange={(e) => setReimbursementForm({ ...reimbursementForm, merchantUpiId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reference/Transaction ID (Optional)</label>
                    <input type="text" placeholder="Payment reference" value={reimbursementForm.referenceId} onChange={(e) => setReimbursementForm({ ...reimbursementForm, referenceId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Purpose <span className="text-red-500">*</span></label>
                    <textarea rows={3} placeholder="What did you buy? Why?" value={reimbursementForm.notes} onChange={(e) => setReimbursementForm({ ...reimbursementForm, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
                  </div>
                  {modalError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{modalError}</p>}
                </div>
                <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-200">
                  <button onClick={handleReimbursement} disabled={submitting || !reimbursementForm.amount || !reimbursementForm.merchantUpiId || !reimbursementForm.notes} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button onClick={closeModal} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {/* All Transactions Modal */}
          {activeModal === 'transactions' && (
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                  <h3 className="text-xl font-semibold text-slate-800 flex items-center"><ListChecks className="w-5 h-5 mr-2 text-slate-600"/>All Transactions</h3>
                  <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                {transactions.length > 0 ? (
                  <ul className="space-y-3">
                    {transactions.map((tx) => (
                      <li key={tx.id} className="p-3 border border-slate-200 rounded-md hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xl ${tx.type === 'CONTRIBUTION' ? 'text-green-500' : 'text-orange-500'}`}>
                              {tx.type === 'CONTRIBUTION' ? <CreditCard className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
                            </span>
                            <div>
                              <h4 className="font-medium text-slate-800 text-sm">{tx.type === 'CONTRIBUTION' ? 'Contribution' : 'Reimbursement'} - ₹{tx.amount.toFixed(2)}</h4>
                              <p className="text-xs text-slate-500">By: {tx.user_name || `User ${tx.user_id.substring(0,6)}...`}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }`}>
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-1 ml-7 truncate" title={tx.notes}>{tx.notes || 'No notes provided'}</p>
                        <p className="text-xs text-slate-400 text-right">{new Date(tx.transaction_date).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10">
                    <ListChecks className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500">No transactions recorded yet.</p>
                  </div>
                )}
                 <div className="mt-6 pt-4 border-t border-slate-200">
                  <button onClick={closeModal} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500">Close</button>
                </div>
              </div>
            </div>
          )}
          {/* Invite Modal */}
          {activeModal === 'invite' && inviteCode && userIsAdmin && room && (
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                  <h3 className="text-xl font-semibold text-slate-800 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-green-600"/>Invite Members</h3>
                  <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-slate-600 mb-3">Share this link to invite members to <strong>{room.name}</strong>:</p>
                <div className="bg-slate-100 p-3 rounded-md mb-4 break-all text-sm font-mono border border-slate-200">
                  {`${window.location.origin}/rooms/join/${inviteCode}`}
                </div>
                {modalError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md mb-3">{modalError}</p>}
                <div className="flex space-x-3 pt-4 border-t border-slate-200">
                  <button onClick={copyInviteLink} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500">
                    <Copy className="w-4 h-4 mr-2"/> Copy Link
                  </button>
                  <button onClick={closeModal} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
