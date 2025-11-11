"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"

const MobileDialog = DialogPrimitive.Root

const MobileDialogTrigger = DialogPrimitive.Trigger

const MobileDialogPortal = DialogPrimitive.Portal

const MobileDialogClose = DialogPrimitive.Close

const MobileDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/70 sm:bg-black/80",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "transition-colors duration-200 ease-in-out",
      "backdrop-blur-sm",
      "cursor-pointer touch-manipulation",
      className
    )}
    {...props}
  />
))
MobileDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const MobileDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null)
  const [startX, setStartX] = React.useState(0)
  const [startY, setStartY] = React.useState(0)
  const [isSwiping, setIsSwiping] = React.useState(false)

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsSwiping(false);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!startX || !startY) return;
    
    const touch = event.touches[0];
    const diffX = Math.abs(touch.clientX - startX);
    const diffY = Math.abs(touch.clientY - startY);
    const threshold = 10;
    
    if (diffX > threshold || diffY > threshold) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const touch = event.changedTouches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;
    
    // Close dialog if swiped horizontally with significant movement
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
      setSwipeDirection(diffX > 0 ? 'right' : 'left');
      // Trigger close after animation
      setTimeout(() => {
        const closeButton = event.currentTarget.querySelector('[data-state="open"][aria-label="Close dialog"]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
      }, 200);
    }
    
    setIsSwiping(false);
    setStartX(0);
    setStartY(0);
  };

  return (
    <MobileDialogPortal>
      <MobileDialogOverlay 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-0 z-50",
          "bg-background border-border",
          "flex flex-col",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-dialog-swipe-end-x)]",
          "focus:outline-none focus:ring-0",
          swipeDirection === 'left' && "animate-slide-out-left",
          swipeDirection === 'right' && "animate-slide-out-right",
          className
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10">
          <MobileDialogClose 
            className={cn(
              "flex items-center justify-center",
              "w-12 h-12",
              "rounded-lg",
              "opacity-70 hover:opacity-100",
              "transition-all duration-200 ease-in-out",
              "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none",
              "data-[state=open]:bg-accent/20 data-[state=open]:text-muted-foreground",
              "hover:data-[state=open]:bg-accent/40",
              "touch-manipulation",
              "backdrop-blur-sm"
            )}
            aria-label="Close dialog"
            tabIndex={0}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </MobileDialogClose>
          
          <div className="flex-1 flex justify-center">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto" />
          </div>
          
          <div className="w-12 h-12" />
        </div>

        {/* Dialog Content */}
        <div 
          className="flex-1 overflow-auto p-4 touch-manipulation"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </div>
      </DialogPrimitive.Content>
    </MobileDialogPortal>
  );
})
MobileDialogContent.displayName = DialogPrimitive.Content.displayName

const MobileDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center",
      className
    )}
    {...props}
  />
)
MobileDialogHeader.displayName = "MobileDialogHeader"

const MobileDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2",
      "p-4 border-t border-border",
      "bg-background/95 backdrop-blur-md sticky bottom-0 z-10",
      className
    )}
    {...props}
  />
)
MobileDialogFooter.displayName = "MobileDialogFooter"

const MobileDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      "text-foreground",
      className
    )}
    {...props}
  />
))
MobileDialogTitle.displayName = DialogPrimitive.Title.displayName

const MobileDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
MobileDialogDescription.displayName = DialogPrimitive.Description.displayName

// CSS animations for swipe gestures
const swipeStyles = `
@keyframes slide-out-left {
  to {
    transform: translateX(-100%);
  }
}

@keyframes slide-out-right {
  to {
    transform: translateX(100%);
  }
}

.animate-slide-out-left {
  animation: slide-out-left 0.2s ease-out forwards;
}

.animate-slide-out-right {
  animation: slide-out-right 0.2s ease-out forwards;
}
`

export {
  MobileDialog,
  MobileDialogPortal,
  MobileDialogOverlay,
  MobileDialogClose,
  MobileDialogTrigger,
  MobileDialogContent,
  MobileDialogHeader,
  MobileDialogFooter,
  MobileDialogTitle,
  MobileDialogDescription,
}