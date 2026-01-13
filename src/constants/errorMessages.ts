/**
 * User-Friendly Error Messages
 *
 * Centralized error messages for consistent UX
 */

export const ERROR_MESSAGES = {
  // Network Errors
  NETWORK_UNAVAILABLE: {
    title: 'No Internet Connection',
    message: 'Please check your internet connection and try again. Your actions will be saved and synced when connection is restored.',
  },
  NETWORK_TIMEOUT: {
    title: 'Request Timed Out',
    message: 'The request took too long. Please check your connection and try again.',
  },
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'We\'re experiencing technical difficulties. Our team has been notified. Please try again later.',
  },

  // Permission Errors
  LOCATION_PERMISSION_DENIED: {
    title: 'Location Permission Required',
    message: 'Please enable location permissions in your device settings to start tracking deliveries.',
  },
  CAMERA_PERMISSION_DENIED: {
    title: 'Camera Permission Required',
    message: 'Please enable camera permissions to take delivery proof photos.',
  },
  NOTIFICATION_PERMISSION_DENIED: {
    title: 'Notification Permission Required',
    message: 'Enable notifications to receive delivery updates and important alerts.',
  },
  BACKGROUND_LOCATION_DENIED: {
    title: 'Background Location Required',
    message: 'Please allow "Always" location access to track deliveries when the app is in the background.',
  },

  // GPS Errors
  GPS_UNAVAILABLE: {
    title: 'GPS Unavailable',
    message: 'Unable to get your location. Make sure location services are enabled and you have a clear view of the sky.',
  },
  GPS_TIMEOUT: {
    title: 'GPS Timeout',
    message: 'Location request timed out. Please try again.',
  },
  GPS_SIGNAL_WEAK: {
    title: 'Weak GPS Signal',
    message: 'GPS signal is weak. Move to an area with better sky visibility for accurate tracking.',
  },

  // Camera Errors
  CAMERA_UNAVAILABLE: {
    title: 'Camera Unavailable',
    message: 'Camera is currently unavailable. Please check camera permissions and try again.',
  },
  PHOTO_TOO_LARGE: {
    title: 'Photo Too Large',
    message: 'Photo exceeds maximum size (5MB). Please take another photo.',
  },

  // Upload Errors
  UPLOAD_FAILED: {
    title: 'Upload Failed',
    message: 'Photo upload failed. Your photo has been saved and will be uploaded automatically when connection improves.',
  },
  UPLOAD_QUEUED: {
    title: 'Upload Queued',
    message: 'Photo will be uploaded when internet connection is available.',
  },

  // API Errors
  UNAUTHORIZED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
  },
  FORBIDDEN: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
  },
  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested resource was not found.',
  },
  VALIDATION_ERROR: {
    title: 'Invalid Data',
    message: 'Please check your input and try again.',
  },

  // Order Errors
  ORDER_UPDATE_FAILED: {
    title: 'Order Update Failed',
    message: 'Failed to update order status. Please try again.',
  },
  ORDER_NOT_ASSIGNED: {
    title: 'Order Not Assigned',
    message: 'This order is not assigned to you.',
  },

  // Session Errors
  SESSION_REQUIRED: {
    title: 'Clock In Required',
    message: 'Please clock in before going online.',
  },
  SESSION_INVALID: {
    title: 'Invalid Session',
    message: 'Your session is invalid. Please clock out and clock in again.',
  },

  // WebSocket Errors
  WEBSOCKET_CONNECTION_FAILED: {
    title: 'Connection Failed',
    message: 'Failed to connect to real-time updates. Retrying automatically...',
  },
  WEBSOCKET_DISCONNECTED: {
    title: 'Connection Lost',
    message: 'Real-time updates disconnected. Reconnecting...',
  },

  // Generic Errors
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
  },
  OPERATION_FAILED: {
    title: 'Operation Failed',
    message: 'Failed to complete the operation. Please try again.',
  },
};

/**
 * Helper function to get error message by key
 */
export const getErrorMessage = (key: keyof typeof ERROR_MESSAGES) => {
  return ERROR_MESSAGES[key] || ERROR_MESSAGES.UNKNOWN_ERROR;
};
