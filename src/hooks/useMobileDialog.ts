import { useEffect, useState } from 'react'

interface UseMobileDialogOptions {
  breakpoint?: string
  customMobileCheck?: () => boolean
}

export function useMobileDialog(options: UseMobileDialogOptions = {}) {
  const { 
    breakpoint = '(max-width: 640px)', 
    customMobileCheck 
  } = options
  
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    
    if (customMobileCheck) {
      return customMobileCheck()
    }
    
    return window.matchMedia(breakpoint).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(breakpoint)
    const handleChange = () => {
      if (customMobileCheck) {
        setIsMobile(customMobileCheck())
      } else {
        setIsMobile(mediaQuery.matches)
      }
    }

    // Initial check
    handleChange()

    // Add listener
    mediaQuery.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [breakpoint, customMobileCheck])

  return isMobile
}