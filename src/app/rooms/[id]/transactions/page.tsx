'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Room {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  notes: string;
  status: string;
  user_id: string;
  transaction_date: string;
  merchant_upi_id?: string;
  reference_id?: string;
}

interface RoomFund {
  total_contributions: number;
  total_reimbursements: number;
  current_balance: number;
}

export default function TransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [roomFund, setRoomFund] = useState<RoomFund | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'contributions' | 'reimbursements' | 'pending' | 'confirmed'>('all');

  useEffect(() => {
    fetchData();
  }, [roomId]);

  const fetchData = async () => {
    try {
      // Fetch room data
      const roomResponse = await fetch(`/api/rooms/${roomId}`);
      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setRoom(roomData.room);
      }

      // Fetch transactions
      const transactionsResponse = await fetch(`/api/rooms/${roomId}/transactions`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions || []);
      }

      // Fetch fund summary
      const fundResponse = await fetch(`/api/rooms/${roomId}/fund`);
      if (fundResponse.ok) {
        const fundData = await fundResponse.json();
        setRoomFund(fundData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    switch (filter) {
      case 'contributions':
        return transaction.type === 'CONTRIBUTION';
      case 'reimbursements':
        return transaction.type === 'REIMBURSEMENT';
      case 'pending':
        return transaction.status === 'PENDING';
      case 'confirmed':
        return transaction.status === 'CONFIRMED';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📊</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
              <p className="text-gray-600">Room: {room?.name}</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/rooms/${roomId}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ← Back to Room
          </button>
        </div>

        {/* Fund Summary */}
        {roomFund && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Contributions</p>
                  <p className="text-2xl font-bold text-green-700">₹{roomFund.total_contributions}</p>
                </div>
                <span className="text-3xl">💰</span>
              </div>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Total Reimbursements</p>
                  <p className="text-2xl font-bold text-red-700">₹{roomFund.total_reimbursements}</p>
                </div>
                <span className="text-3xl">🧾</span>
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-700">₹{roomFund.current_balance}</p>
                </div>
                <span className="text-3xl">💳</span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All Transactions', icon: '📊' },
            { key: 'contributions', label: 'Contributions', icon: '💰' },
            { key: 'reimbursements', label: 'Reimbursements', icon: '🧾' },
            { key: 'pending', label: 'Pending', icon: '⏳' },
            { key: 'confirmed', label: 'Confirmed', icon: '✅' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.icon} {filterOption.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">
                      {transaction.type === 'CONTRIBUTION' ? '💰' : '🧾'}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transaction.type === 'CONTRIBUTION' ? 'Fund Contribution' : 'Reimbursement Request'}
                      </h3>
                      <p className="text-xl font-bold text-gray-700">₹{transaction.amount}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 text-sm font-medium rounded-full ${
                    transaction.status === 'CONFIRMED' 
                      ? 'bg-green-100 text-green-800' 
                      : transaction.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Details:</h4>
                    <p className="text-gray-600">{transaction.notes}</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">User ID:</span>
                      <p className="text-sm text-gray-900">{transaction.user_id}</p>
                    </div>
                    {transaction.merchant_upi_id && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Merchant UPI:</span>
                        <p className="text-sm text-gray-900 font-mono">{transaction.merchant_upi_id}</p>
                      </div>
                    )}
                    {transaction.reference_id && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Reference ID:</span>
                        <p className="text-sm text-gray-900 font-mono">{transaction.reference_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {filter === 'all' ? '📊' : 
               filter === 'contributions' ? '💰' :
               filter === 'reimbursements' ? '🧾' : '⏳'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {filter === 'all' ? 'transactions' : filter} found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Start contributing or requesting reimbursements to see activity here!'
                : `No ${filter} transactions found. Try a different filter.`
              }
            </p>
            <div className="space-x-3">
              <button
                onClick={() => router.push(`/rooms/${roomId}/contribute`)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                💰 Contribute Fund
              </button>
              <button
                onClick={() => router.push(`/rooms/${roomId}/reimbursement`)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                🧾 Request Reimbursement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}