'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, ListChecks, DollarSign, CreditCard, FileText, Filter, CheckCircle, AlertTriangle, Clock, Home, Loader2, LayoutDashboard, LogOut 
} from 'lucide-react'; // Added Lucide icons

interface Room {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  type: 'CONTRIBUTION' | 'REIMBURSEMENT' | 'EXPENSE'; // Made type more specific
  amount: number;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'; // Made status more specific
  user_id: string;
  user_name?: string; // Added for displaying user name
  transaction_date: string;
  merchant_upi_id?: string;
  reference_id?: string;
}

interface RoomFund {
  total_contributions: number;
  total_reimbursements: number;
  current_balance: number;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

export default function TransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [roomFund, setRoomFund] = useState<RoomFund | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'CONTRIBUTION' | 'REIMBURSEMENT' | 'PENDING' | 'CONFIRMED'>('all');

  // Helper to format date and time
  const formatDateTime = (dateString: string) => 
    new Date(dateString).toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch current user (assuming you have a way to get this, e.g., from Supabase auth)
        // For now, I'll mock it or you can integrate your actual user fetching logic
        // const { data: { user } } = await supabase.auth.getUser(); // Example
        // if (user) {
        //   setCurrentUser({ id: user.id, email: user.email!, name: user.user_metadata?.name || user.email?.split('@')[0] });
        // }

        await fetchData();
      } catch (err) {
        console.error('Initial data fetch error:', err);
        setPageError('Failed to load initial page data.');
      }
    };
    fetchInitialData();
  }, [roomId]);

  const fetchData = async () => {
    setLoading(true);
    setPageError(null);
    try {
      // Fetch room data
      const roomResponse = await fetch(`/api/rooms/${roomId}`);
      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setRoom(roomData.room);
      } else {
        throw new Error('Failed to fetch room details.');
      }

      // Fetch transactions
      const transactionsResponse = await fetch(`/api/rooms/${roomId}/transactions`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        // Assuming transactionsData.transactions is an array
        // You might want to fetch user names for each transaction here if not already included
        setTransactions(transactionsData.transactions || []);
      } else {
        throw new Error('Failed to fetch transactions.');
      }

      // Fetch fund summary
      const fundResponse = await fetch(`/api/rooms/${roomId}/fund`);
      if (fundResponse.ok) {
        const fundData = await fundResponse.json();
        setRoomFund(fundData);
      } else {
        throw new Error('Failed to fetch fund summary.');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setPageError(err.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'CONTRIBUTION' || filter === 'REIMBURSEMENT') {
      return transaction.type === filter;
    }
    if (filter === 'PENDING' || filter === 'CONFIRMED') {
      return transaction.status === filter;
    }
    return true;
  });
  
  const currentUserName = currentUser?.name || 'User'; // Fallback for user name

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto" />
          <p className="mt-4 text-slate-300 text-lg">Loading Transactions...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-lg border border-red-700/50 rounded-xl shadow-2xl p-6 sm:p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-red-300 mb-3">Error Loading Page</h1>
          <p className="text-slate-400 bg-red-900/30 p-3 rounded-md mb-8 text-sm sm:text-base">{pageError}</p>
          <button
            onClick={() => router.push(`/rooms/${roomId}`)}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Room
          </button>
        </div>
      </div>
    );
  }

  return (
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
              {/* Add sign out if needed, or remove if not part of this page's scope */}
              {/* <form action="/auth/signout" method="post">
                <button type="submit" className="p-2 rounded-full text-slate-400 hover:bg-purple-600/30 hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 transition-colors" aria-label="Sign out">
                  <LogOut className="w-5 h-5" />
                </button>
              </form> */}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="p-2.5 bg-gradient-to-br from-purple-600/20 to-blue-600/10 rounded-lg">
                <ListChecks className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                  Room Transactions
                </h1>
                <p className="text-sm text-slate-400">
                  For Room: <span className="font-medium text-purple-300">{room?.name || 'Loading...'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/rooms/${roomId}`)}
              className="inline-flex items-center px-4 py-2.5 bg-slate-700/50 border border-purple-600/50 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Room
            </button>
          </div>

          {/* Fund Summary Cards */}
          {roomFund && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {[
                { title: "Total Contributions", value: roomFund.total_contributions, Icon: CreditCard, color: "green" },
                { title: "Total Reimbursements", value: roomFund.total_reimbursements, Icon: FileText, color: "orange" },
                { title: "Current Balance", value: roomFund.current_balance, Icon: DollarSign, color: "blue" }
              ].map(stat => (
                <div key={stat.title} className={`bg-slate-800/50 backdrop-blur-md rounded-xl shadow-lg p-5 sm:p-6 border border-purple-700/30 hover:border-${stat.color}-500/70 transition-all group`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs sm:text-sm font-medium text-slate-400 group-hover:text-${stat.color}-300 transition-colors`}>{stat.title}</p>
                      <p className={`text-2xl sm:text-3xl font-bold text-${stat.color}-400 group-hover:text-${stat.color}-300 transition-colors`}>₹{stat.value.toFixed(2)}</p>
                    </div>
                    <div className={`p-2.5 sm:p-3 bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/10 rounded-lg group-hover:scale-110 transition-transform`}>
                      <stat.Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${stat.color}-400`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter Buttons */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 text-sm text-slate-400 mb-2">
              <Filter className="w-4 h-4" />
              <span>Filter by:</span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { key: 'all', label: 'All', Icon: ListChecks },
                { key: 'CONTRIBUTION', label: 'Contributions', Icon: CreditCard },
                { key: 'REIMBURSEMENT', label: 'Reimbursements', Icon: FileText },
                { key: 'PENDING', label: 'Pending', Icon: Clock },
                { key: 'CONFIRMED', label: 'Confirmed', Icon: CheckCircle }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all transform hover:scale-105
                    ${filter === filterOption.key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-purple-700/40 hover:border-purple-600/70'
                    }`}
                >
                  <filterOption.Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4 sm:space-y-5">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-lg border border-purple-700/40 hover:border-purple-600/70 transition-all overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4">
                      <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                        <span className={`p-2 rounded-lg ${
                          transaction.type === 'CONTRIBUTION' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {transaction.type === 'CONTRIBUTION' ? <CreditCard className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </span>
                        <div>
                          <h3 className="text-md sm:text-lg font-semibold text-slate-100">
                            {transaction.type === 'CONTRIBUTION' ? 'Fund Contribution' : 'Reimbursement Request'}
                          </h3>
                          <p className="text-lg sm:text-xl font-bold text-slate-200">₹{transaction.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-full flex-shrink-0 ${
                        transaction.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-300' 
                        : transaction.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' 
                        : 'bg-red-500/20 text-red-300' // Assuming 'REJECTED' is a possible status
                      }`}>
                        {transaction.status}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-400 mb-3">
                      <p>By: <span className="font-medium text-slate-300">{transaction.user_name || transaction.user_id}</span></p>
                      <p>Date: <span className="font-medium text-slate-300">{formatDateTime(transaction.transaction_date)}</span></p>
                    </div>
                    
                    <div className="bg-slate-700/40 p-3 rounded-md text-xs sm:text-sm">
                      <p className="text-slate-300 font-medium mb-1">Notes:</p>
                      <p className="text-slate-400 whitespace-pre-wrap break-words">
                        {transaction.notes || <span className="italic">No notes provided.</span>}
                      </p>
                    </div>

                    {(transaction.merchant_upi_id || transaction.reference_id) && (
                      <div className="mt-3 pt-3 border-t border-purple-700/30 text-xs sm:text-sm space-y-1.5">
                        {transaction.merchant_upi_id && (
                          <p className="text-slate-400">Merchant UPI: <span className="font-mono text-purple-300">{transaction.merchant_upi_id}</span></p>
                        )}
                        {transaction.reference_id && (
                          <p className="text-slate-400">Reference ID: <span className="font-mono text-purple-300">{transaction.reference_id}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-slate-800/50 backdrop-blur-md rounded-xl shadow-lg border border-purple-700/30">
              <div className="text-purple-400 mb-6">
                {filter === 'all' ? <ListChecks className="w-16 h-16 sm:w-20 sm:h-20 mx-auto opacity-70" /> : 
                 filter === 'CONTRIBUTION' ? <CreditCard className="w-16 h-16 sm:w-20 sm:h-20 mx-auto opacity-70" /> :
                 filter === 'REIMBURSEMENT' ? <FileText className="w-16 h-16 sm:w-20 sm:h-20 mx-auto opacity-70" /> :
                 filter === 'PENDING' ? <Clock className="w-16 h-16 sm:w-20 sm:h-20 mx-auto opacity-70" /> :
                 <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 mx-auto opacity-70" />
                }
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3">
                No {filter === 'all' ? 'transactions' : filter.toLowerCase()} found
              </h3>
              <p className="text-slate-400 mb-8 leading-relaxed text-sm sm:text-base max-w-md mx-auto">
                {filter === 'all' 
                  ? 'It seems a bit quiet here. Start by contributing funds or requesting reimbursements to see activity!'
                  : `There are no ${filter.toLowerCase()} transactions matching your current filter. Try selecting a different one.`
                }
              </p>
              <div className="space-y-3 sm:space-y-0 sm:space-x-3">
                <Link
                  href={`/rooms/${roomId}/contribute`}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105"
                >
                  <CreditCard className="w-4 h-4 mr-2" /> Contribute Fund
                </Link>
                <Link
                  href={`/rooms/${roomId}/reimbursement`}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium transform hover:scale-105"
                >
                  <FileText className="w-4 h-4 mr-2" /> Request Reimbursement
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-purple-700/30 mt-auto">
        &copy; {new Date().getFullYear()} FinLoop. All rights reserved.
      </footer>
    </div>
  );
}