/**
 * Global Error Handler Utility
 *
 * Provides centralized error handling for the app.
 * Formats error messages and prepares errors for logging.
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  GPS = 'GPS',
  CAMERA = 'CAMERA',
  UPLOAD = 'UPLOAD',
  API = 'API',
  AUTH = 'AUTH',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  userMessage: string;
  timestamp: number;
}

class ErrorHandler {
  /**
   * Handle any error and convert to AppError
   */
  handleError(error: any, type: ErrorType = ErrorType.UNKNOWN): AppError {
    const appError: AppError = {
      type,
      message: this.extractErrorMessage(error),
      originalError: error,
      userMessage: this.getUserFriendlyMessage(type, error),
      timestamp: Date.now(),
    };

    // Log error (in development)
    if (__DEV__) {
      console.error(`[${type}] Error:`, appError);
    }

    // TODO: Send to error reporting service (Sentry)
    // this.reportToSentry(appError);

    return appError;
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error) {
      return error.error;
    }

    return 'An unknown error occurred';
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(type: ErrorType, error: any): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Network connection unavailable. Please check your internet connection.';

      case ErrorType.PERMISSION:
        if (error?.message?.includes('location')) {
          return 'Location permission denied. Please enable location access in settings.';
        }
        if (error?.message?.includes('camera')) {
          return 'Camera permission denied. Please enable camera access in settings.';
        }
        if (error?.message?.includes('notification')) {
          return 'Notification permission denied. Enable notifications to receive delivery updates.';
        }
        return 'Permission denied. Please grant required permissions in settings.';

      case ErrorType.GPS:
        return 'GPS unavailable. Make sure location services are enabled and you have a clear view of the sky.';

      case ErrorType.CAMERA:
        return 'Camera unavailable. Please check camera permissions and try again.';

      case ErrorType.UPLOAD:
        return 'Upload failed. Your photo will be retried automatically when connection improves.';

      case ErrorType.API:
        if (error?.status === 401) {
          return 'Session expired. Please log in again.';
        }
        if (error?.status === 403) {
          return 'Access denied. You don\'t have permission for this action.';
        }
        if (error?.status === 404) {
          return 'Resource not found. Please try again later.';
        }
        if (error?.status === 500) {
          return 'Server error. Our team has been notified. Please try again later.';
        }
        return 'Server request failed. Please try again.';

      case ErrorType.AUTH:
        return 'Authentication failed. Please check your credentials and try again.';

      case ErrorType.UNKNOWN:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error: any): boolean {
    return (
      error?.message?.includes('Network') ||
      error?.message?.includes('network') ||
      error?.message?.includes('ECONNABORTED') ||
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ETIMEDOUT' ||
      !navigator.onLine
    );
  }

  /**
   * Check if error is a permission error
   */
  isPermissionError(error: any): boolean {
    return (
      error?.message?.includes('permission') ||
      error?.message?.includes('Permission') ||
      error?.message?.includes('denied') ||
      error?.code === 'E_PERMISSION_DENIED'
    );
  }

  /**
   * Retry an async operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry if it's a permission error or auth error
        if (this.isPermissionError(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Report error to monitoring service (Sentry)
   */
  private reportToSentry(_error: AppError): void {
    // TODO: Implement Sentry reporting
    // Sentry.captureException(error.originalError, {
    //   tags: {
    //     errorType: error.type,
    //   },
    //   extra: {
    //     message: error.message,
    //     userMessage: error.userMessage,
    //     timestamp: error.timestamp,
    //   },
    // });
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export convenience functions
export const handleNetworkError = (error: any) =>
  errorHandler.handleError(error, ErrorType.NETWORK);

export const handlePermissionError = (error: any) =>
  errorHandler.handleError(error, ErrorType.PERMISSION);

export const handleGPSError = (error: any) =>
  errorHandler.handleError(error, ErrorType.GPS);

export const handleCameraError = (error: any) =>
  errorHandler.handleError(error, ErrorType.CAMERA);

export const handleUploadError = (error: any) =>
  errorHandler.handleError(error, ErrorType.UPLOAD);

export const handleAPIError = (error: any) =>
  errorHandler.handleError(error, ErrorType.API);

export const handleAuthError = (error: any) =>
  errorHandler.handleError(error, ErrorType.AUTH);
