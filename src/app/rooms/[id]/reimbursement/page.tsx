'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, ArrowLeft, FileText, DollarSign, Info, AlertTriangle, RefreshCw, CheckCircle, Send, LogOut, Lightbulb
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
}

interface CurrentUser { // Added for nav bar consistency
  id: string;
  email: string;
  name?: string;
}

export default function ReimbursementPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null); // For nav bar
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [reimbursementForm, setReimbursementForm] = useState({
    amount: '',
    notes: '',
    merchantUpiId: '',
    referenceId: ''
  });

  useEffect(() => {
    fetchCurrentUser(); // For nav bar
    fetchRoomData();
  }, [roomId]);

  const fetchCurrentUser = async () => { // For nav bar
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) setCurrentUser(await response.json());
    } catch (err) { console.error('Error fetching current user for nav:', err); }
  };

  const fetchRoomData = async () => {
    setLoading(true); // Ensure loading is true at the start of fetch
    setError(null);
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load room details.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reimbursementForm.amount || parseFloat(reimbursementForm.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!reimbursementForm.merchantUpiId.trim()) {
      setError('Please enter the merchant UPI ID.');
      return;
    }
    if (!reimbursementForm.notes.trim()) {
      setError('Please provide details about the expense.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/rooms/${roomId}/reimbursement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(reimbursementForm.amount),
          notes: reimbursementForm.notes.trim(),
          merchantUpiId: reimbursementForm.merchantUpiId.trim(),
          referenceId: reimbursementForm.referenceId.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit reimbursement request. Please try again.');
      }

      setSuccess(true);
      // Don't clear form here, success state will show. Clear on "Submit Another"
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const currentUserName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User';

  if (loading && !room) { // Show full page loader only on initial load without room data
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-slate-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Reimbursement Form...</p>
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
                <FileText className="w-8 h-8 mr-3 text-orange-600 flex-shrink-0" />
                Request Reimbursement
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

          {loading && room && ( // Show a smaller loading indicator if room data is present but still loading something else (e.g., user)
            <div className="text-center py-6">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
            </div>
          )}

          {!loading && error && !success && ( // Show error only if not in success state
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-start" role="alert">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="bg-white shadow-xl rounded-lg border border-slate-200 p-6 sm:p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Submitted!</h2>
              <p className="text-slate-600 mb-6">
                Your reimbursement request has been sent to the room admin for review. You'll be notified once it's processed.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setError(null);
                    setReimbursementForm({ amount: '', notes: '', merchantUpiId: '', referenceId: '' });
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  <FileText className="w-5 h-5 mr-2" /> Submit Another Request
                </button>
                <button
                  onClick={() => router.push(`/rooms/${roomId}`)}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Back to Room
                </button>
              </div>
            </div>
          ) : room ? ( // Only show form if room data is loaded
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 shadow-xl rounded-lg border border-slate-200">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm">
                <div className="flex items-start">
                  <Info className="w-5 h-5 mr-2 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-1">Reimbursement Process:</h3>
                    <ol className="list-decimal list-inside text-orange-700 space-y-1">
                      <li>You have already paid for a room-related expense from your own pocket.</li>
                      <li>Fill out this form with the accurate payment details.</li>
                      <li>The room admin will review and verify your request.</li>
                      <li>If approved, you will be reimbursed the specified amount from the room fund.</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Amount Paid (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    min="0.01"
                    step="0.01"
                    value={reimbursementForm.amount}
                    onChange={(e) => setReimbursementForm({ ...reimbursementForm, amount: e.target.value })}
                    required
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                    placeholder="e.g., 250.75"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="merchantUpiId" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Merchant UPI ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="merchantUpiId"
                  id="merchantUpiId"
                  value={reimbursementForm.merchantUpiId}
                  onChange={(e) => setReimbursementForm({ ...reimbursementForm, merchantUpiId: e.target.value })}
                  required
                  className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="e.g., merchant@okhdfcbank, 9876543210@upi"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="referenceId" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Reference/Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  name="referenceId"
                  id="referenceId"
                  value={reimbursementForm.referenceId}
                  onChange={(e) => setReimbursementForm({ ...reimbursementForm, referenceId: e.target.value })}
                  className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="Payment reference number from your UPI app"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Expense Details & Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={4}
                  value={reimbursementForm.notes}
                  onChange={(e) => setReimbursementForm({ ...reimbursementForm, notes: e.target.value })}
                  required
                  className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="Describe what you paid for, why it was necessary for the room, and any other relevant details."
                  disabled={submitting}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <div className="flex items-start">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">Tips for Faster Approval:</h3>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                      <li>Be specific in your expense details.</li>
                      <li>If you have receipts or screenshots, mention them in the notes (you might be asked to share them later).</li>
                      <li>Ensure the expense aligns with the room's purpose.</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
                <button
                  type="submit"
                  disabled={submitting || !reimbursementForm.amount || !reimbursementForm.merchantUpiId.trim() || !reimbursementForm.notes.trim()}
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60 transition-colors"
                >
                  {submitting ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  {submitting ? 'Submitting...' : 'Submit Request'}
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
          ) : (
             !loading && <div className="text-center text-slate-500 py-10">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p>Could not load room details. Please try again or go back.</p>
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
