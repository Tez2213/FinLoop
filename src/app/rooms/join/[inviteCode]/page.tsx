'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface InviteDetails {
  room_id: string;
  room_name: string;
  room_description: string;
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    checkAuthAndInvite();
  }, [inviteCode]);

  const checkAuthAndInvite = async () => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
      }

      setCurrentUser(user);

      // Check if the user was just invited (has invitation metadata)
      if (user && user.user_metadata?.invited_to_room) {
        console.log('User has invitation metadata:', user.user_metadata);
        
        // Use metadata from the invitation
        setInviteDetails({
          room_id: user.user_metadata.room_id,
          room_name: user.user_metadata.room_name,
          room_description: '',
          inviter_name: user.user_metadata.inviter_name,
          custom_message: user.user_metadata.custom_message
        });
        
        // Auto-join the room if user was just invited
        if (user.user_metadata.invite_code === inviteCode) {
          console.log('Auto-joining room from invitation...');
          await joinRoom(true);
          return;
        }
      }

      // Fetch invite details normally
      await fetchInviteDetails();
      
    } catch (err: any) {
      console.error('Error checking auth and invite:', err);
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const fetchInviteDetails = async () => {
    try {
      const response = await fetch(`/api/rooms/join/${inviteCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invite details');
      }

      setInviteDetails(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const joinRoom = async (autoJoin = false) => {
    if (!currentUser) {
      // Redirect to login with invitation info
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}&invite=${inviteCode}`;
      router.push(loginUrl);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/join/${inviteCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      // Clear invitation metadata after successful join
      if (currentUser.user_metadata?.invited_to_room) {
        await supabase.auth.updateUser({
          data: {
            invited_to_room: false,
            room_id: null,
            room_name: null,
            invite_code: null,
            inviter_name: null,
            custom_message: null
          }
        });
      }

      // Success! Redirect to the room
      router.push(`/rooms/${data.room_id}`);

    } catch (err: any) {
      console.error('Error joining room:', err);
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!inviteDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No invitation details found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-green-500 text-4xl mb-4">📨</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Invited!
          </h1>
          <p className="text-gray-600 mb-6">
            {inviteDetails.inviter_name} has invited you to join the expense room:
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900">
              {inviteDetails.room_name}
            </h2>
            {inviteDetails.custom_message && (
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-500">
                <p className="text-sm text-gray-700 italic">
                  "{inviteDetails.custom_message}"
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  - {inviteDetails.inviter_name}
                </p>
              </div>
            )}
          </div>

          {currentUser ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Logged in as: {currentUser.email}
              </p>
              <button
                onClick={() => joinRoom()}
                disabled={joining}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Please sign in to join this room
              </p>
              <button
                onClick={() => joinRoom()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Sign In to Join
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}