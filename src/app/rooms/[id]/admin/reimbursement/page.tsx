'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, ArrowLeft, DollarSign, Info, AlertTriangle, RefreshCw, CreditCard, CheckCircle, ShieldCheck, LogOut 
} from 'lucide-react';

interface Transaction {
  id: string;
  room_id: string;
  user_id: string;
  user_name?: string; // Assuming this might be available
  user_email?: string; // Assuming this might be available
  type: 'CONTRIBUTION' | 'REIMBURSEMENT';
  amount: number;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  merchant_upi_id?: string;
  reference_id?: string;
  transaction_date: string;
  reimbursed?: boolean;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

export default function ReimbursementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const transactionId = searchParams.get('transactionId');

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [memberUpiId, setMemberUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null); // For nav bar

  useEffect(() => {
    fetchCurrentUser(); // For nav bar
    if (transactionId) {
      fetchTransaction();
    } else {
      setError('No transaction ID provided. Please go back and select a transaction.');
      setLoading(false);
    }
  }, [transactionId]);

  const fetchCurrentUser = async () => { // For nav bar
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) setCurrentUser(await response.json());
    } catch (err) { console.error('Error fetching current user for nav:', err); }
  };

  const fetchTransaction = async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming your API can fetch a single transaction by ID or you filter from a list
      // For this example, I'll adapt your existing fetch and filter logic
      const response = await fetch(`/api/rooms/${roomId}/transactions?transactionId=${transactionId}`); // Adjust API if needed
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch transaction (status ${response.status})`);
      }
      const data = await response.json();
      
      // If API returns a list, find the specific transaction
      // If API returns a single transaction, data itself might be the transaction
      const txn = Array.isArray(data.transactions) 
        ? data.transactions.find((t: Transaction) => t.id === transactionId)
        : data.transaction; // Adjust based on your API response structure

      if (txn) {
        setTransaction(txn);
        if (txn.type !== 'REIMBURSEMENT' || txn.status !== 'CONFIRMED' || txn.reimbursed) {
            setError('This transaction is not eligible for reimbursement processing.');
        }
      } else {
        setError('Transaction not found or access denied.');
      }
    } catch (err: any) {
      console.error('Error fetching transaction:', err);
      setError(err.message || 'Failed to fetch transaction details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPayment = () => {
    if (!memberUpiId.trim()) {
      setError('Please enter the member\'s UPI ID to proceed.');
      return;
    }
    setError(null);
    if (!transaction) return;

    const upiUrl = `upi://pay?pa=${memberUpiId.trim()}&pn=${encodeURIComponent(transaction.user_name || 'Member')}&am=${transaction.amount}&cu=INR&tn=${encodeURIComponent(`Reimbursement for ${transaction.notes || 'Room Expense'}`)}`;
    
    // Attempt to open UPI app
    window.open(upiUrl, '_blank'); 
    // No reliable way to confirm if it opened, user needs to confirm payment and then mark as reimbursed
  };

  const markAsReimbursed = async () => {
    if (!memberUpiId.trim()) {
      setError('Please enter the member\'s UPI ID before marking as reimbursed.');
      return;
    }
    if (!transaction) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}/mark-reimbursed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          memberUpiId: memberUpiId.trim() 
        })
      });

      if (response.ok) {
        alert('Reimbursement marked successfully!');
        router.push(`/rooms/${roomId}/admin`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark reimbursement. Please try again.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };
  
  const currentUserName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-slate-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Reimbursement Details...</p>
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
              <form action="/auth/signout" method="post"> {/* Assuming this route exists */}
                <button type="submit" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors" aria-label="Sign out">
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:flex md:items-center md:justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center">
              <DollarSign className="w-8 h-8 mr-3 text-blue-600 flex-shrink-0" />
              Process Reimbursement
            </h1>
            <button
              onClick={() => router.push(`/rooms/${roomId}/admin`)}
              className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
            </button>
          </div>

          {error && !transaction && ( // Show critical error if transaction couldn't be loaded
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-start" role="alert">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {transaction && (
            <>
              <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-5 sm:p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-3">Transaction Details</h2>
                <dl className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                    <dt className="text-slate-500">Amount to Reimburse:</dt>
                    <dd className="text-slate-800 font-bold text-2xl sm:col-span-2 text-green-600">₹{transaction.amount.toFixed(2)}</dd>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                    <dt className="text-slate-500">User:</dt>
                    <dd className="text-slate-700 font-medium sm:col-span-2">{transaction.user_name || transaction.user_email || `User ID: ${transaction.user_id.substring(0,8)}...`}</dd>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                    <dt className="text-slate-500">Status:</dt>
                    <dd className="sm:col-span-2">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        APPROVED - AWAITING PAYMENT
                      </span>
                    </dd>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                    <dt className="text-slate-500">Original Expense Notes:</dt>
                    <dd className="text-slate-700 sm:col-span-2 whitespace-pre-wrap">{transaction.notes || 'N/A'}</dd>
                  </div>
                  {transaction.merchant_upi_id && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                      <dt className="text-slate-500">Original Merchant UPI:</dt>
                      <dd className="text-slate-700 font-mono sm:col-span-2">{transaction.merchant_upi_id}</dd>
                    </div>
                  )}
                  {transaction.reference_id && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                      <dt className="text-slate-500">Original Ref ID:</dt>
                      <dd className="text-slate-700 font-mono sm:col-span-2">{transaction.reference_id}</dd>
                    </div>
                  )}
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                    <dt className="text-slate-500">Transaction Date:</dt>
                    <dd className="text-slate-700 sm:col-span-2">{new Date(transaction.transaction_date).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-5 sm:p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-1">Payment to Member</h2>
                <p className="text-sm text-slate-500 mb-4">Enter the member's UPI ID to send them ₹{transaction.amount.toFixed(2)}.</p>
                
                <div>
                  <label htmlFor="memberUpiId" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Member's UPI ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="memberUpiId"
                    value={memberUpiId}
                    onChange={(e) => setMemberUpiId(e.target.value)}
                    placeholder="e.g., membername@okhdfcbank"
                    className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    disabled={processing}
                  />
                </div>

                {error && transaction && ( // Show non-critical errors here
                  <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-start" role="alert">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleUpiPayment}
                    disabled={!memberUpiId.trim() || processing}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors"
                  >
                    <CreditCard className="w-5 h-5 mr-2" /> Open UPI App to Pay ₹{transaction.amount.toFixed(2)}
                  </button>
                  
                  <div className="text-center text-slate-500 text-xs pt-2">
                    After completing the payment in your UPI app, click below.
                  </div>
                  
                  <button
                    onClick={markAsReimbursed}
                    disabled={!memberUpiId.trim() || processing}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 transition-colors"
                  >
                    {processing ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    {processing ? 'Processing...' : 'Mark as Reimbursed'}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="flex items-start">
                  <Info className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">Important Steps:</h3>
                    <ol className="list-decimal list-inside text-blue-700 space-y-1">
                      <li>Enter the correct UPI ID of the member who needs to be reimbursed.</li>
                      <li>Click "Open UPI App" to initiate the payment. Your device will attempt to open your default UPI application.</li>
                      <li>Complete the payment of ₹{transaction.amount.toFixed(2)} within your UPI app.</li>
                      <li>Once payment is confirmed in your app, return to this page.</li>
                      <li>Click "Mark as Reimbursed" to update the transaction status in FinLoop.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-slate-200 mt-auto">
        &copy; {new Date().getFullYear()} FinLoop Admin.
      </footer>
    </div>
  );
}
