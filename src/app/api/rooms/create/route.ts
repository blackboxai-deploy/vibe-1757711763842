import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/roomUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName } = body;

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

    const result = RoomManager.createRoom(playerName.trim());

    if (result.success) {
      return NextResponse.json({
        success: true,
        room: result.room,
        playerId: result.playerId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to create room'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = RoomManager.getStats();
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}