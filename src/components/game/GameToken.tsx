'use client';

import { motion } from 'framer-motion';
import { GameToken as GameTokenType } from '@/types/game';
import { ANIMATION_CONFIG } from '@/types/game';

interface GameTokenProps {
  token: GameTokenType;
  isSelected: boolean;
  canSelect: boolean;
  onClick: () => void;
  stackIndex: number;
}

export function GameToken({ token, isSelected, canSelect, onClick, stackIndex }: GameTokenProps) {
  const getTokenColor = (color: string) => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-gradient-to-br from-red-500 to-red-600',
          border: 'border-red-700',
          shadow: 'shadow-red-300',
          selected: 'ring-4 ring-red-300'
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-500 to-blue-600', 
          border: 'border-blue-700',
          shadow: 'shadow-blue-300',
          selected: 'ring-4 ring-blue-300'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
          border: 'border-gray-700',
          shadow: 'shadow-gray-300',
          selected: 'ring-4 ring-gray-300'
        };
    }
  };

  const colorStyle = getTokenColor(token.color);
  
  // Calculate position offset for stacked tokens
  const stackOffset = stackIndex * 2;

  return (
    <motion.div
      className={`
        absolute w-6 h-6 rounded-full border-2 cursor-pointer z-10
        ${colorStyle.bg} ${colorStyle.border} ${colorStyle.shadow}
        ${isSelected ? colorStyle.selected : ''}
        ${canSelect ? 'hover:scale-110' : 'cursor-not-allowed opacity-60'}
        transition-all duration-200
      `}
      style={{
        top: `${stackOffset}px`,
        left: `${stackOffset}px`,
        transform: 'translate(25%, 25%)'
      }}
      onClick={canSelect ? onClick : undefined}
      initial={{ 
        scale: 0,
        rotate: -180
      }}
      animate={{ 
        scale: 1,
        rotate: 0,
        y: isSelected ? [0, -4, 0] : 0
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        duration: ANIMATION_CONFIG.TOKEN_MOVE_DURATION
      }}
      whileHover={canSelect ? { 
        scale: ANIMATION_CONFIG.HOVER_SCALE,
        zIndex: 20
      } : {}}
      whileTap={canSelect ? { 
        scale: ANIMATION_CONFIG.BOUNCE_SCALE 
      } : {}}
      layout
      layoutId={token.id}
    >
      {/* Token inner glow */}
      <motion.div 
        className="absolute inset-0 rounded-full bg-white opacity-30"
        animate={isSelected ? {
          opacity: [0.3, 0.6, 0.3]
        } : {}}
        transition={{
          duration: 1,
          repeat: isSelected ? Infinity : 0,
          ease: 'easeInOut'
        }}
      />
      
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute -inset-1 rounded-full border-2 border-yellow-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 0.4, 0.8]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Token number/identifier */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white drop-shadow-md">
          {token.id.slice(-1)}
        </span>
      </div>

      {/* Movement trail effect */}
      {canSelect && (
        <motion.div
          className={`absolute inset-0 rounded-full ${colorStyle.bg} opacity-20`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.div>
  );
}