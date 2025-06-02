'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, ArrowLeft, HandCoins, DollarSign, Info, AlertTriangle, RefreshCw, CheckCircle, Send, LogOut, ClipboardCopy, Zap
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  admin_upi_id: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string; // Added for nav bar consistency
}

export default function ContributePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [contributionForm, setContributionForm] = useState({
    amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [roomId]);

  const fetchData = async () => {
    setLoading(true); // Ensure loading is true at the start
    setError(null);
    try {
      // Get current user
      const userResponse = await fetch('/api/auth/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
      } else {
        // Handle case where user might not be fetched, though page might still be accessible
        console.warn("Could not fetch current user details for navigation.");
      }

      // Get room data
      const roomResponse = await fetch(`/api/rooms/${roomId}`);
      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setRoom(roomData.room);
        if (!roomData.room?.admin_upi_id) {
          setError("Admin UPI ID is not set for this room. Contributions cannot be made at this time.");
        }
      } else {
        const errorData = await roomResponse.json();
        throw new Error(errorData.error || 'Failed to load room details.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load page data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contributionForm.amount || parseFloat(contributionForm.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!room?.admin_upi_id) {
      setError('Admin UPI ID is missing. Cannot submit contribution.');
      return;
    }

    setSubmitting(true);
    setError(null);
    // setSuccess(false); // Keep success true if it was already true, until new submission

    try {
      const response = await fetch(`/api/rooms/${roomId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(contributionForm.amount),
          notes: contributionForm.notes.trim() || 'Fund contribution', // Ensure notes is a string
          admin_upi_id: room.admin_upi_id // Send admin_upi_id with the request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit contribution. Please ensure you have completed the UPI payment.');
      }

      setSuccess(true);
      // Form is cleared in success state's "Contribute Again" button
    } catch (err: any) {
      setError(err.message);
      setSuccess(false); // Explicitly set success to false on error
    } finally {
      setSubmitting(false);
    }
  };

  const openUPIApp = () => {
    if (!contributionForm.amount || parseFloat(contributionForm.amount) <= 0) {
      setError('Please enter a valid amount before opening UPI app.');
      return;
    }
    if (!room?.admin_upi_id) {
      setError('Admin UPI ID is not available. Cannot proceed with payment.');
      return;
    }
    setError(null); // Clear previous errors
    const upiUrl = `upi://pay?pa=${room.admin_upi_id}&pn=${encodeURIComponent(room.name || 'Room Fund')}&am=${contributionForm.amount}&cu=INR&tn=${encodeURIComponent(`Room: ${room.name} - ${contributionForm.notes || 'Fund contribution'}`)}`;
    window.open(upiUrl, '_blank');
  };
  
  const currentUserName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User';

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-slate-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Contribution Page...</p>
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

      <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center">
                <HandCoins className="w-8 h-8 mr-3 text-green-600 flex-shrink-0" />
                Contribute to Room Fund
              </h1>
              {room && <p className="mt-1 text-sm text-slate-600">For Room: <span className="font-medium">{room.name}</span></p>}
            </div>
            <button
              onClick={() => router.push(`/rooms/${roomId}`)}
              className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Room
            </button>
          </div>
          
          {loading && room && ( // Smaller loader if room data is present but still loading (e.g. user)
             <div className="text-center py-6">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
            </div>
          )}

          {!loading && error && !success && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-start" role="alert">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="bg-white shadow-xl rounded-lg border border-slate-200 p-6 sm:p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Contribution Submitted!</h2>
              <p className="text-slate-600 mb-6">
                Your contribution request has been sent. The room admin will verify your payment and confirm your contribution.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setError(null);
                    setContributionForm({ amount: '', notes: '' });
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <HandCoins className="w-5 h-5 mr-2" /> Contribute Again
                </button>
                <button
                  onClick={() => router.push(`/rooms/${roomId}`)}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Back to Room
                </button>
              </div>
            </div>
          ) : room ? (
            <div className="bg-white p-6 sm:p-8 shadow-xl rounded-lg border border-slate-200 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="flex items-start">
                  <Info className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">How to Contribute:</h3>
                    <ol className="list-decimal list-inside text-blue-700 space-y-1">
                      <li>Enter the amount you wish to contribute.</li>
                      <li>Use the "Open UPI App" button or manually pay to the Admin's UPI ID shown below.</li>
                      <li>After successful payment, fill out this form and click "I Have Paid & Submit".</li>
                      <li>The room admin will verify your payment and confirm your contribution.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {room.admin_upi_id ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-slate-800 mb-2 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-slate-500" />
                    Payment Details
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">
                      Admin's UPI ID (Pay to this ID):
                    </label>
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-300 rounded-md">
                      <span className="font-mono text-md font-semibold text-slate-900">{room.admin_upi_id}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (room.admin_upi_id) {
                            navigator.clipboard.writeText(room.admin_upi_id);
                            alert('UPI ID copied to clipboard!');
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        aria-label="Copy UPI ID"
                      >
                        <ClipboardCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-lg text-sm flex items-start">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>Admin UPI ID is not configured for this room. Please contact the admin. Contributions cannot be made.</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Contribution Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      min="1"
                      step="0.01"
                      value={contributionForm.amount}
                      onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
                      required
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                      placeholder="e.g., 500"
                      disabled={submitting || !room.admin_upi_id}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={3}
                    value={contributionForm.notes}
                    onChange={(e) => setContributionForm({ ...contributionForm, notes: e.target.value })}
                    className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                    placeholder="e.g., My share for monthly expenses"
                    disabled={submitting || !room.admin_upi_id}
                  />
                </div>

                {room.admin_upi_id && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-green-800 mb-2 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-green-600" />
                      Quick Payment via UPI App
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      Click below to open your UPI app with pre-filled payment details.
                    </p>
                    <button
                      type="button"
                      onClick={openUPIApp}
                      disabled={submitting || !contributionForm.amount || parseFloat(contributionForm.amount) <= 0 || !room.admin_upi_id}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-60 transition-colors"
                    >
                      <Send className="w-5 h-5 mr-2" /> Open UPI App to Pay ₹{contributionForm.amount || '0.00'}
                    </button>
                  </div>
                )}
                
                {error && !success && ( // Show error here as well if it occurs during form interaction
                  <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-start" role="alert">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2 space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
                  <button
                    type="submit"
                    disabled={submitting || !contributionForm.amount || !room.admin_upi_id}
                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors"
                  >
                    {submitting ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    {submitting ? 'Submitting...' : 'I Have Paid & Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/rooms/${roomId}`)}
                    disabled={submitting}
                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
             !loading && <div className="text-center text-slate-500 py-10">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p>Could not load room details or admin UPI is not set. Please try again or go back.</p>
            </div>
          )}
        </div>
      </main>
      <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-slate-200 mt-auto">
        &copy; {new Date().getFullYear()} FinLoop. All rights reserved.
      </footer>
    </div>
  );
}