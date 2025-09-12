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
    const { playerId } = body;

    if (!roomId || !playerId) {
      return NextResponse.json({
        success: false,
        error: 'Room ID and Player ID are required'
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

    // Roll dice
    const updatedGameState = GameStateManager.rollDice(roomId, playerId);

    if (!updatedGameState) {
      return NextResponse.json({
        success: false,
        error: 'Failed to roll dice'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      gameState: updatedGameState,
      diceValue: updatedGameState.dice.value
    });

  } catch (error) {
    console.error('Roll dice error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}