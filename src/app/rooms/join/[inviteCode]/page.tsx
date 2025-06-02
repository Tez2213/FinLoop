'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface InviteDetails {
  room_id: string;
  room_name: string;
  room_description: string;
  created_by: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
}

export default function JoinRoomPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.inviteCode as string;
  
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      fetchInviteDetails();
    }
  }, [inviteCode]);

  const fetchInviteDetails = async () => {
    try {
      console.log('Fetching invite details for code:', inviteCode);
      const response = await fetch(`/api/rooms/join/${inviteCode}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invite details');
      }
      
      const data = await response.json();
      console.log('Invite details received:', data);
      
      // Check if user is already a member
      if (data.already_member) {
        setAlreadyMember(true);
        setInviteDetails(data);
        // Auto redirect after 3 seconds
        setTimeout(() => {
          router.push(`/rooms/${data.room_id}`);
        }, 3000);
      } else {
        setInviteDetails(data);
      }
    } catch (err: any) {
      console.error('Fetch invite error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    setJoining(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/rooms/join/${inviteCode}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join room');
      }
      
      const data = await response.json();
      console.log('Successfully joined room:', data);
      setSuccess(true);
      
      // Redirect to room after 2 seconds
      setTimeout(() => {
        router.push(`/rooms/${data.room_id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Join room error:', err);
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invite</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/rooms')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Go to Rooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Successfully Joined!</h1>
            <p className="text-gray-600 mb-6">
              You have been added to {inviteDetails?.room_name}. Redirecting to the room...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle already member case
  if (alreadyMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-blue-500 text-5xl mb-4">ℹ️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Already a Member!</h1>
            <p className="text-gray-600 mb-6">
              You are already a member of <strong>{inviteDetails?.room_name}</strong>. 
              Redirecting you to the room...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <button
              onClick={() => router.push(`/rooms/${inviteDetails?.room_id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Room Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Room</h1>
          <p className="text-gray-600">You've been invited to join a room!</p>
        </div>

        {inviteDetails && (
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="font-semibold text-lg text-blue-900">
                {inviteDetails.room_name}
              </h2>
              {inviteDetails.room_description && (
                <p className="text-blue-700 text-sm mt-1">
                  {inviteDetails.room_description}
                </p>
              )}
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>Expires: {new Date(inviteDetails.expires_at).toLocaleString()}</p>
              <p>
                Uses: {inviteDetails.current_uses} / {inviteDetails.max_uses}
              </p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={joinRoom}
            disabled={joining}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Room'}
          </button>
          <button
            onClick={() => router.push('/rooms')}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}