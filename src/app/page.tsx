'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const createRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName: playerName.trim() }),
      });

      const data = await response.json();

      if (data.success && data.room) {
        // Store player info in localStorage
        localStorage.setItem('ludoPlayer', JSON.stringify({
          name: playerName.trim(),
          id: data.playerId || 'player1'
        }));
        router.push(`/game/${data.room.id}`);
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Create room error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-digit room code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          roomCode: roomCode.trim().toUpperCase(), 
          playerName: playerName.trim() 
        }),
      });

      const data = await response.json();

      if (data.success && data.room) {
        // Store player info in localStorage
        localStorage.setItem('ludoPlayer', JSON.stringify({
          name: playerName.trim(),
          id: data.playerId || 'player2'
        }));
        router.push(`/game/${data.room.id}`);
      } else {
        setError(data.error || 'Failed to join room');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Join room error:', err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        
        {/* Hero Section */}
        <motion.div 
          className="flex flex-col justify-center space-y-6"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-center md:text-left">
            <motion.div
              className="inline-block mb-4"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="text-6xl">🎲</div>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Online Ludo Game
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              Play the classic board game with your friends online! 
              Create a room or join with a code.
            </p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Badge variant="secondary" className="px-3 py-1">
                ⚡ Real-time Multiplayer
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                🎮 2 Players
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                📱 Mobile Friendly
              </Badge>
            </div>
          </div>

          {/* Game Preview */}
          <div className="hidden md:block">
            <div className="bg-white rounded-lg p-6 shadow-lg border">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">How to Play:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Roll the dice to move your tokens</li>
                <li>• Get all 4 tokens to the center to win</li>
                <li>• Capture opponent tokens to send them home</li>
                <li>• Safe zones protect your tokens</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Game Controls */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          
          {/* Player Name Input */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">Join the Game</CardTitle>
              <CardDescription>Enter your name to start playing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your Name
                </label>
                <Input
                  placeholder="Enter your name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full"
                  maxLength={20}
                />
              </div>
              
              {error && (
                <motion.div 
                  className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Create Room */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg text-gray-800">Create New Game</CardTitle>
              <CardDescription>Start a new room and invite a friend</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={createRoom}
                disabled={isCreating || !playerName.trim()}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Room...
                  </div>
                ) : (
                  '🎯 Create Room'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg text-gray-800">Join Existing Game</CardTitle>
              <CardDescription>Enter the 6-digit room code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Room Code
                </label>
                <Input
                  placeholder="Enter 6-digit code..."
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  className="w-full text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
              </div>
              
              <Button 
                onClick={joinRoom}
                disabled={isJoining || !playerName.trim() || roomCode.length !== 6}
                variant="outline"
                className="w-full h-12 text-lg border-2 hover:bg-gray-50"
              >
                {isJoining ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Joining Room...
                  </div>
                ) : (
                  '🚪 Join Room'
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}