'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, ArrowLeft, Settings, DollarSign, ListChecks, ShieldCheck, AlertTriangle, 
  RefreshCw, CheckCircle, XCircle, Clock, CreditCard, FileText, LogOut, Info, Users
} from 'lucide-react';

interface PendingTransaction {
  id: string;
  room_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  type: 'CONTRIBUTION' | 'REIMBURSEMENT';
  amount: number;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  admin_upi_id?: string;
  merchant_upi_id?: string;
  reference_id?: string;
  transaction_date: string;
  reimbursed?: boolean;
}

interface Room {
  id: string;
  name: string;
  admin_id: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

export default function AdminDashboard() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [approvedTransactions, setApprovedTransactions] = useState<PendingTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<PendingTransaction[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [processingTxn, setProcessingTxn] = useState<string | null>(null);
  
  const currentUserName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && roomId) {
      // fetchRoomData handles the main loading state and admin check
      fetchRoomData().then(() => {
        if (!pageError) { // Only fetch transactions if room data loaded successfully and no critical error
          fetchPendingTransactions();
          fetchApprovedTransactions();
          fetchAllTransactions();
        }
      });
    }
  }, [currentUser, roomId, pageError]); // pageError dependency to prevent re-fetching if initial error

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      } else {
        // If user data can't be fetched, likely not authenticated
        router.push('/login');
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setPageError("Failed to verify user session. Please try logging in again.");
      setLoading(false); // Stop loading as we can't proceed
      router.push('/login');
    }
  };

  const fetchRoomData = async () => {
    if (!currentUser) return; // Should be caught by useEffect dependency, but good practice
    setLoading(true); // Explicitly set loading true for this critical fetch
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room data');
      }
      const data = await response.json();
      setRoom(data.room);
      
      if (data.room.admin_id !== currentUser.id) {
        setPageError('Access Denied: Only room admins can access this page.');
        // setLoading(false) will be handled in finally
        return; // Stop further processing for this function
      }
    } catch (err: any) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update the admin panel to fetch user names for pending transactions
  const fetchPendingTransactions = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions for pending list');
      const data = await response.json();
      
      const pending = (data.transactions || []).filter((t: PendingTransaction) => 
        t.status === 'PENDING'
      );

      // Fetch user names for each pending transaction
      const pendingWithNames = await Promise.all(
        pending.map(async (tx: PendingTransaction) => {
          try {
            const userResponse = await fetch(`/api/users/${tx.user_id}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              return {
                ...tx,
                user_name: userData.name || userData.full_name || `User ${tx.user_id.substring(0, 8)}...`,
                user_email: userData.email
              };
            }
          } catch (err) {
            console.error('Error fetching user data for transaction:', err);
          }
          return {
            ...tx,
            user_name: `User ${tx.user_id.substring(0, 8)}...`
          };
        })
      );

      setPendingTransactions(pendingWithNames);
    } catch (err: any) {
      console.error('Error fetching pending transactions:', err.message);
    }
  };

  const fetchApprovedTransactions = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions for approved list');
      const data = await response.json();
      const approved = (data.transactions || []).filter((txn: PendingTransaction) => 
        txn.status === 'CONFIRMED' && txn.type === 'REIMBURSEMENT' && !txn.reimbursed
      );
      setApprovedTransactions(approved);
    } catch (err: any) {
      console.error('Error fetching approved transactions:', err.message);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch all transactions');
      const data = await response.json();
      setAllTransactions(data.transactions || []);
    } catch (err: any) {
      console.error('Error fetching all transactions:', err.message);
    }
  };
  
  const refreshData = () => {
    if (currentUser && roomId && room?.admin_id === currentUser.id) {
        setProcessingTxn(null);
        // Do not set pageError to null here, as a persistent error (like API down) should remain
        // setLoading(true); // Consider if a visual refresh indicator is needed for the whole page
        Promise.all([
            fetchPendingTransactions(),
            fetchApprovedTransactions(),
            fetchAllTransactions()
        ]).catch(err => {
            // Handle refresh-specific errors if necessary, or let individual fetches log
            console.error("Error during data refresh:", err);
        });
        // .finally(() => setLoading(false));
    }
  };

  const handleTransactionAction = async (transactionId: string, action: 'CONFIRMED' | 'REJECTED') => {
    setProcessingTxn(transactionId);
    // Don't clear pageError here, action might fail due to same persistent issue
    try {
      const response = await fetch(`/api/rooms/${roomId}/admin-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process transaction');
      }
      refreshData(); 
      alert(`Transaction ${action.toLowerCase()} successfully!`);
    } catch (err: any) {
      setPageError(err.message); // Show error related to this action
    } finally {
      setProcessingTxn(null);
    }
  };

  const handleReimbursementNavigation = (transaction: PendingTransaction) => {
    router.push(`/rooms/${roomId}/admin/reimbursement?transactionId=${transaction.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-slate-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  // Handle critical page errors, especially access denied
  if (pageError && (!room || room.admin_id !== currentUser?.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            {room && room.admin_id !== currentUser?.id ? "Access Denied" : "Error"}
          </h2>
          <p className="text-red-600 bg-red-50 p-3 rounded-md mb-4">{pageError}</p>
          <Link 
            href={room ? `/rooms/${roomId}` : "/dashboard"} 
            className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 
            {room ? "Back to Room" : "Go to Dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
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
              <span className="text-sm text-slate-600 hidden sm:block">Admin: {currentUserName}</span>
              <form action="/auth/signout" method="post">
                <button type="submit" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors" aria-label="Sign out">
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900 flex items-center">
                <ShieldCheck className="w-8 h-8 mr-3 text-blue-600 flex-shrink-0" />
                Admin Panel: <span className="ml-2 truncate" title={room?.name}>{room?.name || 'Room'}</span>
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <button onClick={() => router.push(`/rooms/${roomId}`)} className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Room
              </button>
               <button onClick={refreshData} disabled={processingTxn !== null} className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-colors">
                <RefreshCw className={`w-4 h-4 mr-2 ${processingTxn ? 'animate-spin' : ''}`} /> Refresh Data
              </button>
            </div>
          </div>

          {pageError && room && room.admin_id === currentUser?.id && ( 
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-start" role="alert">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>Error: {pageError}</span>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-lg border border-slate-200 mb-8">
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-yellow-500" />
                Pending Actions ({pendingTransactions.length})
              </h2>
              {pendingTransactions.length > 0 ? (
                <div className="space-y-6">
                  {pendingTransactions.map((tx) => (
                    <div key={tx.id} className="border border-slate-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow bg-slate-50/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                          <span className={`p-2 rounded-full ${tx.type === 'CONTRIBUTION' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {tx.type === 'CONTRIBUTION' ? <CreditCard className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </span>
                          <div>
                            <h3 className="text-md sm:text-lg font-semibold text-slate-800">
                              {tx.type === 'CONTRIBUTION' ? 'Contribution Verification' : 'Reimbursement Request'}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Amount: <span className="font-bold text-slate-700">₹{tx.amount.toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full self-start sm:self-center">
                          PENDING
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-3 space-y-0.5">
                        <p>User: {tx.user_name || tx.user_email || `ID: ${tx.user_id.substring(0,8)}...`}</p>
                        <p>Date: {new Date(tx.transaction_date).toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-slate-700 mb-3 p-2 bg-slate-100 rounded-md border border-slate-200">Notes: {tx.notes || 'N/A'}</p>
                      
                      {tx.type === 'CONTRIBUTION' && tx.admin_upi_id && (
                        <div className="text-sm bg-blue-50 p-3 rounded-md border border-blue-200 mb-3">
                          <h4 className="font-medium text-blue-900 mb-1">Verification Steps:</h4>
                          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-0.5">
                            <li>Check your UPI app/bank for payment of ₹{tx.amount.toFixed(2)} to <strong className="font-mono">{tx.admin_upi_id}</strong>.</li>
                            <li>Verify payment date and details.</li>
                            <li>Confirm or reject based on verification.</li>
                          </ol>
                        </div>
                      )}
                      {tx.type === 'REIMBURSEMENT' && (
                         <div className="text-sm bg-indigo-50 p-3 rounded-md border border-indigo-200 mb-3">
                          <h4 className="font-medium text-indigo-900 mb-1">Review Checklist:</h4>
                          <ol className="text-sm text-indigo-800 list-decimal list-inside space-y-0.5">
                            {tx.merchant_upi_id && <li>Expense paid to: <strong className="font-mono">{tx.merchant_upi_id}</strong></li>}
                            {tx.reference_id && <li>Reference ID: <strong className="font-mono">{tx.reference_id}</strong></li>}
                            <li>Is this expense legitimate for the room?</li>
                            <li>Is the amount reasonable?</li>
                          </ol>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <button onClick={() => handleTransactionAction(tx.id, 'CONFIRMED')} disabled={processingTxn === tx.id} className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-60 transition-colors">
                          <CheckCircle className="w-4 h-4 mr-1.5" /> {processingTxn === tx.id ? 'Processing...' : 'Confirm & Approve'}
                        </button>
                        <button onClick={() => handleTransactionAction(tx.id, 'REJECTED')} disabled={processingTxn === tx.id} className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-60 transition-colors">
                          <XCircle className="w-4 h-4 mr-1.5" /> {processingTxn === tx.id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-md font-medium text-slate-700">No Pending Actions</h3>
                  <p className="text-sm text-slate-500">All caught up!</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg border border-slate-200 mb-8">
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-blue-500" />
                Pay Approved Reimbursements ({approvedTransactions.length})
              </h2>
              {approvedTransactions.length > 0 ? (
                <div className="space-y-6">
                  {approvedTransactions.map((tx) => (
                    <div key={tx.id} className="border border-blue-200 rounded-lg p-4 sm:p-5 bg-blue-50/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                        <div>
                          <h3 className="text-md sm:text-lg font-semibold text-slate-800">Reimburse User</h3>
                          <p className="text-sm text-slate-600">Amount: <span className="font-bold text-blue-700">₹{tx.amount.toFixed(2)}</span></p>
                          <p className="text-xs text-slate-500">User: {tx.user_name || tx.user_email || `ID: ${tx.user_id.substring(0,8)}...`}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mt-2 sm:mt-0 self-start sm:self-center">
                          APPROVED - AWAITING PAYMENT
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 p-2 bg-slate-100 rounded-md border border-slate-200">Notes: {tx.notes || 'N/A'}</p>
                      {tx.merchant_upi_id && (
                        <div className="text-sm bg-slate-100 p-2 rounded-md border border-slate-200 mb-3">
                          <p className="font-medium text-slate-700">Original Merchant UPI: <span className="font-mono">{tx.merchant_upi_id}</span></p>
                          {tx.reference_id && <p className="text-xs text-slate-600">Ref: {tx.reference_id}</p>}
                        </div>
                      )}
                      <button onClick={() => handleReimbursementNavigation(tx)} className="w-full inline-flex items-center justify-center px-3 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors">
                        <CreditCard className="w-4 h-4 mr-2" /> Process Payment & Mark Reimbursed
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-md font-medium text-slate-700">No Reimbursements to Pay</h3>
                  <p className="text-sm text-slate-500">All approved expenses have been processed for payment.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg border border-slate-200">
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <ListChecks className="w-6 h-6 mr-2 text-slate-500" />
                Transaction History (Last 10)
              </h2>
              {allTransactions.length > 0 ? (
                <ul className="space-y-2.5">
                  {allTransactions.slice(0, 10).map((tx) => (
                    <li key={tx.id} className="flex flex-col sm:flex-row justify-between items-start p-2.5 bg-slate-50 rounded-md border border-slate-200 text-sm">
                      <div className="mb-1 sm:mb-0">
                        <span className={`font-semibold ${tx.type === 'CONTRIBUTION' ? 'text-green-700' : 'text-orange-700'}`}>
                          {tx.type}
                        </span>
                        <span className="ml-2 text-slate-800">₹{tx.amount.toFixed(2)}</span>
                        <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs" title={tx.notes}>{tx.notes || 'No notes'}</p>
                      </div>
                      <div className="text-xs text-right sm:text-left mt-1 sm:mt-0">
                        <span className={`px-2 py-0.5 font-semibold rounded-full ${
                          tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' 
                          : tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.status}
                        </span>
                        <p className="text-slate-400 mt-0.5">{new Date(tx.transaction_date).toLocaleDateString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                 <div className="text-center py-10">
                  <Info className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">No transaction history found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-slate-200 mt-auto">
        &copy; {new Date().getFullYear()} FinLoop Admin.
      </footer>
    </div>
  );
}
