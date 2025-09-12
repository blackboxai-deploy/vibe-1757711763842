import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/roomUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    if (!roomId) {
      return NextResponse.json({
        success: false,
        error: 'Room ID is required'
      }, { status: 400 });
    }

    const room = RoomManager.getRoomById(roomId);

    if (!room) {
      return NextResponse.json({
        success: false,
        error: 'Room not found'
      }, { status: 404 });
    }

    // Update activity timestamp
    RoomManager.updateActivity(roomId);

    return NextResponse.json({
      success: true,
      room
    });

  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { playerId } = body;

    if (!roomId || !playerId) {
      return NextResponse.json({
        success: false,
        error: 'Room ID and Player ID are required'
      }, { status: 400 });
    }

    const success = RoomManager.removePlayerFromRoom(roomId, playerId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Player removed from room'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to remove player or room not found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Delete room error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}