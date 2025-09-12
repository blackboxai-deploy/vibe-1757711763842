'use client';

import { motion } from 'framer-motion';
import { Player } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlayerPanelProps {
  player: Player;
  isCurrentPlayer: boolean;
  isCurrentTurn: boolean;
}

export function PlayerPanel({ player, isCurrentPlayer, isCurrentTurn }: PlayerPanelProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          bg: 'from-red-100 to-red-200',
          border: 'border-red-300',
          accent: 'bg-red-500',
          text: 'text-red-800'
        };
      case 'blue':
        return {
          bg: 'from-blue-100 to-blue-200', 
          border: 'border-blue-300',
          accent: 'bg-blue-500',
          text: 'text-blue-800'
        };
      default:
        return {
          bg: 'from-gray-100 to-gray-200',
          border: 'border-gray-300', 
          accent: 'bg-gray-500',
          text: 'text-gray-800'
        };
    }
  };

  const colorStyle = getColorClasses(player.color);
  const tokensInHome = player.tokens.filter(token => token.position === -1).length;
  const tokensOnBoard = player.tokens.filter(token => token.position >= 0 && token.position < 84).length;
  const tokensFinished = player.tokens.filter(token => token.position === 84).length;

  return (
    <motion.div
      className={`
        relative bg-gradient-to-br ${colorStyle.bg} border-2 ${colorStyle.border}
        rounded-lg p-4 shadow-lg transition-all duration-300
        ${isCurrentTurn ? 'ring-4 ring-yellow-400 ring-opacity-60' : ''}
        ${isCurrentPlayer ? 'border-yellow-400' : ''}
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      
      {/* Turn Indicator */}
      {isCurrentTurn && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <span className="text-xs text-white font-bold">⭐</span>
        </motion.div>
      )}

      {/* Player Info Header */}
      <div className="flex items-center gap-3 mb-3">
        
        {/* Player Avatar */}
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarFallback className={`${colorStyle.accent} text-white font-bold text-lg`}>
              {player.name.charAt(0).toUpperCase()}
            </AvatarFallback>
            <AvatarImage src="" alt={player.name} />
          </Avatar>
          
          {/* Online Status */}
          <motion.div
            className={`
              absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
              ${player.isOnline ? 'bg-green-500' : 'bg-red-500'}
            `}
            animate={player.isOnline ? {
              scale: [1, 1.2, 1]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${colorStyle.text} truncate`}>
              {player.name}
            </h3>
            {isCurrentPlayer && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                You
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${colorStyle.accent} text-white`}
            >
              {player.color.toUpperCase()}
            </Badge>
            <span className={`text-xs ${colorStyle.text} opacity-75`}>
              {player.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Token Status */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-2">Token Status:</div>
        
        {/* Token Progress */}
        <div className="space-y-2">
          
          {/* Home Tokens */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">🏠 At Home:</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{tokensInHome}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className={`
                      w-2 h-2 rounded-full 
                      ${index < tokensInHome ? colorStyle.accent : 'bg-gray-300'}
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Board Tokens */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">🎯 On Board:</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{tokensOnBoard}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className={`
                      w-2 h-2 rounded-full 
                      ${index < tokensOnBoard ? 'bg-yellow-500' : 'bg-gray-300'}
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Finished Tokens */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">👑 Finished:</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{tokensFinished}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className={`
                      w-2 h-2 rounded-full 
                      ${index < tokensFinished ? 'bg-green-500' : 'bg-gray-300'}
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round((tokensFinished / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(tokensFinished / 4) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Victory Check */}
        {tokensFinished === 4 && (
          <motion.div
            className="text-center py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-2xl animate-bounce">🏆</div>
            <div className="text-sm font-bold text-green-600">Winner!</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}