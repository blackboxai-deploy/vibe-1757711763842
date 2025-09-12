import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/roomUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, playerName } = body;

    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Room code is required'
      }, { status: 400 });
    }

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Player name is required'
      }, { status: 400 });
    }

    if (playerName.trim().length > 20) {
      return NextResponse.json({
        success: false,
        error: 'Player name must be 20 characters or less'
      }, { status: 400 });
    }

    const code = roomCode.trim().toUpperCase();
    if (!RoomManager.isValidRoomCode(code)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid room code format'
      }, { status: 400 });
    }

    const result = RoomManager.joinRoom(code, playerName.trim());

    if (result.success) {
      return NextResponse.json({
        success: true,
        room: result.room,
        playerId: result.playerId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to join room'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}