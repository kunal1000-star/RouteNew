// Server-safe Error Logger
// This is a version that works on both client and server

import { logError as originalLogError, logWarning, logInfo as originalLogInfo, type ErrorContext } from './error-logger';

// Server-safe logError that falls back to console.error
export function logError(error: Error, context: ErrorContext = {}): string {
  // Check if we're on the server
  if (typeof window === 'undefined') {
    // Server-side: use console.error
    const errorId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.error(`[${errorId}] ${error.message}`, context);
    return errorId;
  } else {
    // Client-side: use original error logger
    return originalLogError(error, context);
  }
}

// Server-safe logInfo that works on both client and server
export function logInfo(message: string, context: ErrorContext = {}): string {
  // Check if we're on the server
  if (typeof window === 'undefined') {
    // Server-side: use console.info
    const infoId = `server_info_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.info(`[${infoId}] ${message}`, context);
    return infoId;
  } else {
    // Client-side: use original info logger
    return originalLogInfo(message, context);
  }
}

export { logWarning };
export type { ErrorContext };