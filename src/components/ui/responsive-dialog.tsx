"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "./dialog"
import { MobileDialog, MobileDialogContent, MobileDialogHeader, MobileDialogFooter, MobileDialogTitle, MobileDialogDescription, MobileDialogTrigger, MobileDialogClose } from "./mobile-dialog"
import { useMobileDialog } from "@/hooks/useMobileDialog"

interface ResponsiveDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  mobileBreakpoint?: string
  customMobileCheck?: () => boolean
}

export const ResponsiveDialog = ({
  children,
  open,
  onOpenChange,
  className,
  mobileBreakpoint,
  customMobileCheck,
  ...props
}: ResponsiveDialogProps) => {
  const isMobile = useMobileDialog({
    breakpoint: mobileBreakpoint,
    customMobileCheck
  })

  // Extract dialog components from children
  const [trigger, content] = React.useMemo(() => {
    const childrenArray = React.Children.toArray(children)
    const trigger = childrenArray.find(child => 
      React.isValidElement(child) && 
      (child.type === ResponsiveDialogTrigger || 
       (typeof child.type === 'function' && child.type.name === 'DialogTrigger') ||
       (typeof child.type === 'object' && child.type?.['$$typeof']))
    )
    
    const content = childrenArray.find(child =>
      React.isValidElement(child) &&
      (child.type === ResponsiveDialogContent ||
       (typeof child.type === 'function' && child.type.name === 'DialogContent') ||
       (typeof child.type === 'object' && child.type?.['$$typeof']))
    )
    
    return [trigger, content]
  }, [children])

  return isMobile ? (
    <MobileDialog open={open} onOpenChange={onOpenChange} {...props}>
      {trigger && React.cloneElement(trigger as React.ReactElement, {
        ...trigger.props,
        asChild: true
      })}
      {content}
    </MobileDialog>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      {trigger && React.cloneElement(trigger as React.ReactElement, {
        ...trigger.props,
        asChild: true
      })}
      {content}
    </Dialog>
  )
}

// Wrapper components that work with both mobile and desktop variants
export const ResponsiveDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogTrigger>
>(({ children, ...props }, ref) => {
  const isMobile = useMobileDialog()
  
  return isMobile ? (
    <MobileDialogTrigger ref={ref} {...props}>
      {children}
    </MobileDialogTrigger>
  ) : (
    <DialogTrigger ref={ref} {...props}>
      {children}
    </DialogTrigger>
  )
})

export const ResponsiveDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ children, className, ...props }, ref) => {
  const isMobile = useMobileDialog()
  
  if (isMobile) {
    return (
      <MobileDialogContent ref={ref} className={className} {...props}>
        {children}
      </MobileDialogContent>
    )
  }
  
  return (
    <DialogContent ref={ref} className={className} {...props}>
      {children}
    </DialogContent>
  )
})

export const ResponsiveDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogHeader>
>(({ children, className, ...props }, ref) => {
  const isMobile = useMobileDialog()
  
  if (isMobile) {
    return (
      <MobileDialogHeader ref={ref} className={className} {...props}>
        {children}
      </MobileDialogHeader>
    )
  }
  
  return (
    <DialogHeader ref={ref} className={className} {...props}>
      {children}
    </DialogHeader>
  )
})

export const ResponsiveDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogFooter>
>(({ children, className, ...props }, ref) => {
  const isMobile = useMobileDialog()
  
  if (isMobile) {
    return (
      <MobileDialogFooter ref={ref} className={className} {...props}>
        {children}
      </MobileDialogFooter>
    )
  }
  
  return (
    <DialogFooter ref={ref} className={className} {...props}>
      {children}
    </DialogFooter>
  )
})

export const ResponsiveDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ children, className, ...props }, ref) => {
  const isMobile = useMobileDialog()
  
  if (isMobile) {
    return (
      <MobileDialogTitle ref={ref} className={className} {...props}>
        {children}
      </MobileDialogTitle>
    )
  }
  
  return (
    <DialogTitle ref={ref} className={className} {...props}>
      {children}
    </DialogTitle>
  )
})

export const ResponsiveDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ children, className, ...props }, ref) => {
  const isMobile = useMobileDialog()
  
  if (isMobile) {
    return (
      <MobileDialogDescription ref={ref} className={className} {...props}>
        {children}
      </MobileDialogDescription>
    )
  }
  
  return (
    <DialogDescription ref={ref} className={className} {...props}>
      {children}
    </DialogDescription>
  )
})

export const ResponsiveDialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogClose>
>(({ children, ...props }, ref) => {
  const isMobile = useMobileDialog()
  
  if (isMobile) {
    return (
      <MobileDialogClose ref={ref} {...props}>
        {children}
      </MobileDialogClose>
    )
  }
  
  return (
    <DialogClose ref={ref} {...props}>
      {children}
    </DialogClose>
  )
})

// Re-export for convenience
ResponsiveDialog.Trigger = ResponsiveDialogTrigger
ResponsiveDialog.Content = ResponsiveDialogContent
ResponsiveDialog.Header = ResponsiveDialogHeader
ResponsiveDialog.Footer = ResponsiveDialogFooter
ResponsiveDialog.Title = ResponsiveDialogTitle
ResponsiveDialog.Description = ResponsiveDialogDescription
ResponsiveDialog.Close = ResponsiveDialogClose