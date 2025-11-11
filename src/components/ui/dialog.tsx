"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 sm:bg-black/80",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "transition-colors duration-200 ease-in-out",
      "backdrop-blur-sm",
      "cursor-pointer",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const [startX, setStartX] = React.useState(0);
  const [startY, setStartY] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);

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
    
    // Consider it a swipe if horizontal movement is significant
    if (diffX > 30 && diffY < 50) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const touch = event.changedTouches[0];
    const diffX = touch.clientX - startX;
    
    // Close dialog if swiped left or right significantly
    if (Math.abs(diffX) > 50) {
      // Trigger close by clicking the close button programmatically
      const closeButton = event.currentTarget.querySelector('[data-state="open"][aria-label="Close dialog"]');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
    }
    
    setIsSwiping(false);
    setStartX(0);
    setStartY(0);
  };

  return (
    <DialogPortal>
      <DialogOverlay
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg sm:rounded-lg",
          "max-h-[90vh] overflow-hidden",
          "sm:max-w-lg md:max-w-xl lg:max-w-2xl",
          "min-h-[200px] min-w-[300px]",
          "mobile:[width:calc(100vw-2rem)] mobile:[height:calc(100vh-2rem)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "focus:outline-none focus:ring-0",
          className
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        <div
          className="relative w-full h-full overflow-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
          <DialogPrimitive.Close
            className={cn(
              "absolute right-2 sm:right-4 top-2 sm:top-4",
              "flex items-center justify-center",
              "w-11 h-11 sm:w-8 sm:h-8",
              "rounded-md sm:rounded-sm",
              "opacity-70 hover:opacity-100",
              "transition-all duration-200 ease-in-out",
              "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none",
              "data-[state=open]:bg-accent/20 data-[state=open]:text-muted-foreground",
              "hover:data-[state=open]:bg-accent/40",
              "backdrop-blur-sm",
              "touch-manipulation"
            )}
            aria-label="Close dialog"
            tabIndex={0}
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="sr-only">Close dialog</span>
          </DialogPrimitive.Close>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

// Export mobile-optimized variants
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
} from './mobile-dialog'

// Export responsive components
export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogClose,
} from './responsive-dialog'
