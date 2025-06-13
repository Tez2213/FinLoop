'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3, Info, CheckCircle, AlertTriangle, PlusCircle, Loader2 } from 'lucide-react'; // Updated icons

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
            // This case should ideally not happen if API returns ID on success
            setError("Room created, but couldn't get ID for redirect. Please check your dashboard.");
            router.push('/dashboard/rooms'); // Redirect to rooms list
          }
        }, 2500);
      }
    } catch (e: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-200 flex flex-col">
      {/* Enhanced Navigation */}
      <nav className="bg-slate-800/70 backdrop-blur-lg border-b border-purple-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link 
                href="/dashboard/rooms" // Link back to My Rooms page
                className="flex items-center text-purple-300 hover:text-purple-200 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 mr-1.5 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">My Rooms</span>
              </Link>
              <div className="h-6 w-px bg-purple-700/50"></div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-100">Create New Room</h1>
              </div>
            </div>
            {/* Optional: Add a logo or brand name here if needed */}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg mb-4 shadow-lg">
                <PlusCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Launch a New Room
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Set up a new space to manage shared expenses with your group.
            </p>
          </div>

          <div className="bg-slate-800/70 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
              {error && (
                <div className="flex items-start p-3 sm:p-4 text-sm text-red-300 bg-red-500/20 border border-red-700/50 rounded-lg" role="alert">
                  <AlertTriangle className="w-5 h-5 mr-2.5 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
              {successMessage && (
                <div className="flex items-start p-3 sm:p-4 text-sm text-green-300 bg-green-500/20 border border-green-700/50 rounded-lg" role="alert">
                  <CheckCircle className="w-5 h-5 mr-2.5 flex-shrink-0 text-green-400" />
                  <span>{successMessage}</span>
                </div>
              )}
              
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Room Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="roomName"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-4 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                  placeholder="e.g., Goa Trip, Apartment Utilities"
                  disabled={isLoading || !!successMessage}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-3.5 pr-4 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                  placeholder="A brief description of what this room is for."
                  disabled={isLoading || !!successMessage}
                />
              </div>

              <div>
                <label htmlFor="adminUpiId" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Your UPI ID for this Room <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="adminUpiId"
                  id="adminUpiId"
                  value={adminUpiId}
                  onChange={(e) => setAdminUpiId(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-4 py-2.5 bg-slate-700/50 border border-purple-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                  placeholder="yourname@upi"
                  disabled={isLoading || !!successMessage}
                />
                <p className="mt-2 text-xs text-slate-400 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1.5 text-slate-500 flex-shrink-0" />
                  This is where members will send contributions for this room.
                </p>
              </div>

              {!successMessage && ( // Only show button if no success message
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <PlusCircle className="w-5 h-5 mr-2" />
                    )}
                    {isLoading ? 'Creating Room...' : 'Create Room'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
       {/* Footer */}
       <footer className="py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 border-t border-purple-700/30 mt-auto">
        &copy; {new Date().getFullYear()} FinLoop. All rights reserved.
      </footer>
    </div>
  );
}