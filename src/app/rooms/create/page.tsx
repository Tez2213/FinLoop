'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3, Info, CheckCircle, AlertTriangle, LayoutDashboard } from 'lucide-react'; // Added icons

export default function CreateRoomPage() {
  const router = useRouter();
  
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [adminUpiId, setAdminUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!roomName.trim()) {
      setError('Room name is required.');
      setIsLoading(false);
      return;
    }
    if (!adminUpiId.trim()) {
      setError('Your UPI ID for this room is required.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name: roomName,
        description: description,
        admin_upi_id: adminUpiId,
      };
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create room. Please try again.');
      } else {
        setSuccessMessage(`Room "${result.name}" created successfully! Redirecting...`);
        setRoomName('');
        setDescription('');
        setAdminUpiId('');
        setTimeout(() => {
          if (result.id) {
            router.push(`/rooms/${result.id}`);
          } else {
            setError("Room created, but couldn't get ID for redirect. Check console.");
            router.push('/dashboard');
          }
        }, 2000);
      }
    } catch (e: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">
                FinLoop
              </span>
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Edit3 className="mx-auto h-12 w-12 text-slate-500 mb-3" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Create a New Room
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Set up a new space to manage shared expenses with your group.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 shadow-xl rounded-lg border border-slate-200">
            {error && (
              <div className="flex items-start p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg" role="alert">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-start p-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg" role="alert">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Room Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="roomName"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
                className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm transition-colors"
                placeholder="e.g., Goa Trip, Apartment Utilities"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm transition-colors"
                placeholder="A brief description of what this room is for."
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="adminUpiId" className="block text-sm font-medium text-slate-700 mb-1.5">
                Your UPI ID for this Room <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="adminUpiId"
                id="adminUpiId"
                value={adminUpiId}
                onChange={(e) => setAdminUpiId(e.target.value)}
                required
                className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm transition-colors"
                placeholder="yourname@upi"
                disabled={isLoading}
              />
              <p className="mt-1.5 text-xs text-slate-500 flex items-center">
                <Info className="w-3 h-3 mr-1 text-slate-400 flex-shrink-0" />
                This is where members will send contributions for this room.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating Room...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </main>
       {/* Footer (Optional) */}
       <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-slate-200 mt-auto">
        &copy; {new Date().getFullYear()} FinLoop. All rights reserved.
      </footer>
    </div>
  );
}