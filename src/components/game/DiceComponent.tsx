'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DiceRoll } from '@/types/game';
import { ANIMATION_CONFIG } from '@/types/game';

interface DiceComponentProps {
  dice: DiceRoll;
  canRoll: boolean;
  onRoll: () => void;
}

export function DiceComponent({ dice, canRoll, onRoll }: DiceComponentProps) {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = async () => {
    if (!canRoll || isRolling) return;
    
    setIsRolling(true);
    onRoll();
    
    // Stop rolling animation after dice roll duration
    setTimeout(() => {
      setIsRolling(false);
    }, ANIMATION_CONFIG.DICE_ROLL_DURATION * 1000);
  };

  const getDiceFace = (value: number) => {
    const faces = {
      1: [4], // center dot
      2: [0, 8], // diagonal corners
      3: [0, 4, 8], // diagonal + center
      4: [0, 2, 6, 8], // four corners
      5: [0, 2, 4, 6, 8], // four corners + center
      6: [0, 2, 3, 5, 6, 8] // six dots
    };

    return faces[value as keyof typeof faces] || [4];
  };

  const renderDiceDots = (value: number) => {
    const activeDots = getDiceFace(value);
    
    return (
      <div className="grid grid-cols-3 gap-1 w-full h-full p-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <motion.div
            key={index}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${activeDots.includes(index) ? 'bg-red-600' : 'bg-transparent'}
            `}
            initial={{ scale: 0 }}
            animate={{ 
              scale: activeDots.includes(index) ? 1 : 0,
              opacity: activeDots.includes(index) ? 1 : 0
            }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg border">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Roll Dice</h3>
        
        {/* Dice Container */}
        <div className="flex justify-center mb-4">
          <motion.div
            className="relative"
            animate={isRolling || dice.isRolling ? {
              rotateX: [0, 180, 360, 180, 0],
              rotateY: [0, 180, 0, 360, 180],
              rotateZ: [0, 90, 180, 270, 360]
            } : {}}
            transition={{
              duration: ANIMATION_CONFIG.DICE_ROLL_DURATION,
              ease: "easeInOut",
              repeat: isRolling || dice.isRolling ? Infinity : 0
            }}
          >
            {/* Dice Cube */}
            <motion.div
              className="w-16 h-16 bg-white border-2 border-gray-400 rounded-lg shadow-lg relative perspective-1000"
              whileHover={canRoll ? { scale: 1.05 } : {}}
              whileTap={canRoll ? { scale: 0.95 } : {}}
            >
              {/* Dice Face */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={dice.value || 'empty'}
                  className="w-full h-full flex items-center justify-center"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.3 }}
                >
                  {dice.value ? (
                    renderDiceDots(dice.value)
                  ) : (
                    <div className="text-2xl text-gray-400">?</div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Dice Glow Effect */}
              {(isRolling || dice.isRolling) && (
                <motion.div
                  className="absolute -inset-2 rounded-lg bg-yellow-400 opacity-30 blur"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Dice Value Display */}
        <AnimatePresence>
          {dice.value && !isRolling && !dice.isRolling && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {dice.value}
              </div>
              <div className="text-sm text-gray-600">
                Last roll
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roll Button */}
        <Button
          onClick={handleRoll}
          disabled={!canRoll || isRolling || dice.isRolling}
          className={`
            w-full h-12 text-lg font-semibold transition-all duration-200
            ${canRoll && !isRolling && !dice.isRolling
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
              : 'bg-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isRolling || dice.isRolling ? (
            <motion.div 
              className="flex items-center gap-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Rolling...
            </motion.div>
          ) : canRoll ? (
            '🎲 Roll Dice'
          ) : (
            'Wait for your turn'
          )}
        </Button>

        {/* Roll History/Info */}
        {dice.value && (
          <motion.div 
            className="text-xs text-gray-500 space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div>
              Rolled: {new Date(dice.timestamp).toLocaleTimeString()}
            </div>
            {dice.value === 6 && (
              <div className="text-green-600 font-medium">
                🎉 Six! Roll again!
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}