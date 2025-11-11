'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Menu, 
  X, 
  Hand,
  Touchpad
} from 'lucide-react';

interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
  lastSwipeTime: number;
}

interface AndroidGesturesProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onDoubleTap?: () => void;
  children: React.ReactNode;
}

export function AndroidGestureHandler({ 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeDown, 
  onSwipeUp, 
  onDoubleTap, 
  children 
}: AndroidGesturesProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const gestureRef = useRef<HTMLDivElement>(null);
  const [gestureState, setGestureState] = useState<GestureState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
    lastSwipeTime: 0
  });
  
  const [showGestureHints, setShowGestureHints] = useState(false);
  const doubleTapTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setGestureState(prev => ({
        ...prev,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        isSwiping: true
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!gestureState.isSwiping) return;

      const touch = e.touches[0];
      setGestureState(prev => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY
      }));

      // Prevent vertical scrolling when swiping horizontally
      const diffX = Math.abs(touch.clientX - gestureState.startX);
      const diffY = Math.abs(touch.clientY - gestureState.startY);
      
      if (diffX > diffY && diffX > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gestureState.isSwiping) return;

      const diffX = gestureState.currentX - gestureState.startX;
      const diffY = gestureState.currentY - gestureState.startY;
      const timeDiff = Date.now() - gestureState.lastSwipeTime;

      // Check for swipe gestures
      if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
        const swipeThreshold = 50;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
          // Horizontal swipe
          if (diffX > swipeThreshold && onSwipeRight) {
            onSwipeRight();
          } else if (diffX < -swipeThreshold && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (diffY > swipeThreshold && onSwipeDown) {
            onSwipeDown();
          } else if (diffY < -swipeThreshold && onSwipeUp) {
            onSwipeUp();
          }
        }
        
        setGestureState(prev => ({ ...prev, lastSwipeTime: Date.now() }));
      }

      setGestureState(prev => ({ ...prev, isSwiping: false }));
    };

    // Double tap detection
    const handleTouchEndForTap = (e: TouchEvent) => {
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
        doubleTapTimer.current = null;
        if (onDoubleTap) {
          onDoubleTap();
        }
      } else {
        doubleTapTimer.current = setTimeout(() => {
          doubleTapTimer.current = null;
        }, 300);
      }
    };

    const currentElement = gestureRef.current;
    if (currentElement) {
      currentElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      currentElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      currentElement.addEventListener('touchend', handleTouchEnd);
      currentElement.addEventListener('touchend', handleTouchEndForTap);
    }

    // Show gesture hints after 5 seconds
    const hintTimer = setTimeout(() => {
      setShowGestureHints(true);
    }, 5000);

    return () => {
      clearTimeout(hintTimer);
      if (currentElement) {
        currentElement.removeEventListener('touchstart', handleTouchStart);
        currentElement.removeEventListener('touchmove', handleTouchMove);
        currentElement.removeEventListener('touchend', handleTouchEnd);
        currentElement.removeEventListener('touchend', handleTouchEndForTap);
      }
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
      }
    };
  }, [gestureState.isSwiping, gestureState.startX, gestureState.startY, onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp, onDoubleTap, isMobile]);

  // Don't wrap with gesture handler on desktop
  if (!isMobile) {
    return <div ref={gestureRef}>{children}</div>;
  }

  return (
    <div ref={gestureRef} className="relative">
      {children}
      
      {/* Gesture Hints */}
      {showGestureHints && (
        <div className="fixed top-20 left-4 right-4 z-40">
          <div className="bg-background/95 backdrop-blur-md border border-muted/20 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Hand className="h-4 w-4 text-primary animate-bounce" />
              <span className="text-sm font-medium">Try These Gestures</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                <span>Swipe left: Previous</span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                <span>Swipe right: Next</span>
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                <span>Swipe down: Refresh</span>
              </div>
              <div className="flex items-center gap-1">
                <Menu className="h-3 w-3" />
                <span>Swipe up: Menu</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGestureHints(false)}
              className="w-full mt-2 h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Don't Show Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Android-specific gesture utilities
export function useAndroidGestures() {
  const [isGestureActive, setIsGestureActive] = useState(false);
  
  const handleSwipeLeft = () => {
    console.log('Android swipe left gesture');
    // Navigate back, close sidebar, etc.
  };

  const handleSwipeRight = () => {
    console.log('Android swipe right gesture');
    // Navigate forward, open sidebar, etc.
  };

  const handleSwipeDown = () => {
    console.log('Android swipe down gesture');
    // Refresh content, close modal, etc.
  };

  const handleSwipeUp = () => {
    console.log('Android swipe up gesture');
    // Open menu, scroll to top, etc.
  };

  const handleDoubleTap = () => {
    console.log('Android double tap gesture');
    // Quick actions, zoom, etc.
  };

  return {
    isGestureActive,
    setIsGestureActive,
    handleSwipeLeft,
    handleSwipeRight,
    handleSwipeDown,
    handleSwipeUp,
    handleDoubleTap
  };
}