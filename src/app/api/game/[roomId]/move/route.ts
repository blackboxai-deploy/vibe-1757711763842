import { NextRequest, NextResponse } from 'next/server';
import { GameStateManager } from '@/lib/gameStateManager';
import { RoomManager } from '@/lib/roomUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { playerId, tokenId, newPosition } = body;

    if (!roomId || !playerId || !tokenId) {
      return NextResponse.json({
        success: false,
        error: 'Room ID, Player ID, and Token ID are required'
      }, { status: 400 });
    }

    // Check if room exists
    const room = RoomManager.getRoomById(roomId);
    if (!room) {
      return NextResponse.json({
        success: false,
        error: 'Room not found'
      }, { status: 404 });
    }

    // Check if it's the player's turn
    if (!GameStateManager.isPlayerTurn(roomId, playerId)) {
      return NextResponse.json({
        success: false,
        error: 'Not your turn'
      }, { status: 400 });
    }

    // Check if the token can move
    const validMoves = GameStateManager.getValidMoves(roomId, playerId);
    if (!validMoves.includes(tokenId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token move'
      }, { status: 400 });
    }

    // Move token
    const updatedGameState = GameStateManager.moveToken(roomId, playerId, tokenId, newPosition);

    if (!updatedGameState) {
      return NextResponse.json({
        success: false,
        error: 'Failed to move token'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      gameState: updatedGameState
    });

  } catch (error) {
    console.error('Move token error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}