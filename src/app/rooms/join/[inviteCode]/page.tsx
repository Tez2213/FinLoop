'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MailOpen, CheckCircle, XCircle, ArrowRight, LogIn, Loader2, Home } from 'lucide-react'; // Added icons

interface InviteDetails {
  room_id: string;
  room_name: string;
  room_description: string; // Kept for potential future use, though not displayed in current UI
  inviter_name: string;
  custom_message?: string;
}

export default function JoinRoomPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.inviteCode as string;
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null); // Consider using User type from @supabase/supabase-js

  const supabase = createClient();

  useEffect(() => {
    checkAuthAndInvite();
  }, [inviteCode]);

  const checkAuthAndInvite = async () => {
    setLoading(true); // Ensure loading is true at the start
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        // Potentially set an error state here if auth is critical before fetching invite
      }
      setCurrentUser(user);

      if (user && user.user_metadata?.invited_to_room && user.user_metadata.invite_code === inviteCode) {
        setInviteDetails({
          room_id: user.user_metadata.room_id,
          room_name: user.user_metadata.room_name,
          room_description: user.user_metadata.room_description || '',
          inviter_name: user.user_metadata.inviter_name,
          custom_message: user.user_metadata.custom_message
        });
        await joinRoom(true); // Pass true for autoJoin
        return; // Exit after auto-join attempt
      }
      
      // If not auto-joining, fetch details normally
      await fetchInviteDetails();
      
    } catch (err: any) {
      console.error('Error checking auth and invite:', err);
      setError(err.message || 'Failed to load invitation details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInviteDetails = async () => {
    try {
      const response = await fetch(`/api/rooms/join/${inviteCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invite details. The link might be invalid or expired.');
      }
      setInviteDetails(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const joinRoom = async (autoJoin = false) => {
    if (!currentUser) {
      // Store invite code in session/local storage or pass as query param for post-login redirect
      sessionStorage.setItem('pendingInviteCode', inviteCode);
      router.push(`/login?redirect=${encodeURIComponent(`/rooms/join/${inviteCode}`)}&reason=join_room`);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/join/${inviteCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${currentUser.token}` // If your API needs auth
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join the room. You might already be a member or the invite is no longer valid.');
      }

      if (currentUser.user_metadata?.invited_to_room) {
        await supabase.auth.updateUser({
          data: {
            invited_to_room: null, // Use null to remove
            room_id: null,
            room_name: null,
            invite_code: null,
            inviter_name: null,
            custom_message: null,
            room_description: null,
          }
        });
      }
      sessionStorage.removeItem('pendingInviteCode'); // Clear pending invite
      router.push(`/dashboard/rooms/${data.room_id}`); // Navigate to the specific room

    } catch (err: any) {
      console.error('Error joining room:', err);
      setError(err.message);
    } finally {
      setJoining(false);
      if (autoJoin) setLoading(false); // Ensure loading is false after auto-join attempt
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto" />
          <p className="mt-4 text-slate-300 text-lg">Loading Invitation...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-lg border border-red-700/50 rounded-xl shadow-2xl p-6 sm:p-8 text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-red-300 mb-3">
            Oops! Invitation Problem
          </h1>
          <p className="text-slate-400 mb-8 text-sm sm:text-base">
            {error}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No Invite Details Found (after loading and no error)
  if (!inviteDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl p-6 sm:p-8 text-center">
          <MailOpen className="h-16 w-16 text-purple-400 mx-auto mb-6 opacity-70" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">
            Invitation Not Found
          </h1>
          <p className="text-slate-400 mb-8 text-sm sm:text-base">
            We couldn't find any details for this invitation. It might be invalid or expired.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main Invite View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-lg border border-purple-700/50 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8 text-center">
          <MailOpen className="h-16 w-16 text-purple-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            You're Invited!
          </h1>
          <p className="text-slate-300 mb-6 text-sm sm:text-base">
            <span className="font-semibold text-purple-300">{inviteDetails.inviter_name}</span> wants you to join their expense room:
          </p>
          
          <div className="bg-slate-700/50 border border-purple-600/50 rounded-lg p-4 sm:p-5 mb-6 sm:mb-8 text-left">
            <h2 className="text-xl font-semibold text-slate-100 mb-1">
              {inviteDetails.room_name}
            </h2>
            {/* Room description can be added here if available and desired */}
            {/* <p className="text-xs text-slate-400">{inviteDetails.room_description}</p> */}
          </div>

          {inviteDetails.custom_message && (
            <div className="mb-6 sm:mb-8 p-4 bg-slate-700/30 rounded-lg border-l-4 border-purple-500 text-left">
              <p className="text-sm text-slate-300 italic">
                "{inviteDetails.custom_message}"
              </p>
              <p className="text-xs text-slate-400 mt-2 text-right">
                - {inviteDetails.inviter_name}
              </p>
            </div>
          )}

          {currentUser ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Logged in as: <span className="font-medium text-slate-300">{currentUser.email}</span>
              </p>
              <button
                onClick={() => joinRoom()}
                disabled={joining}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                {joining ? 'Joining Room...' : 'Accept & Join Room'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-300 mb-2">
                Sign in to accept this invitation.
              </p>
              <button
                onClick={() => joinRoom()} // This will redirect to login
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold transform hover:scale-105"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In to Join
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}