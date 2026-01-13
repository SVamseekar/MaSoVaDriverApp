/**
 * Photo Upload Service
 *
 * Handles uploading proof of delivery photos to backend.
 * Integrates with offline queue for reliability.
 */

import axios from 'axios';
import API_CONFIG from '../config/api.config';
import { Asset } from 'react-native-image-picker';
import { offlineQueueService, QueueActionType } from './offlineQueueService';

export interface PhotoUploadResult {
  success: boolean;
  photoUrl?: string;
  message?: string;
}

class PhotoUploadService {
  /**
   * Upload proof of delivery photo
   * @param orderId - Order ID
   * @param photo - Photo asset from camera/gallery
   * @param token - Auth token
   * @returns Upload result
   */
  async uploadProofOfDelivery(
    orderId: string,
    photo: Asset,
    token: string
  ): Promise<PhotoUploadResult> {
    try {
      // Validate photo
      if (!photo.uri || !photo.fileName) {
        throw new Error('Invalid photo: missing URI or filename');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || `delivery_${orderId}_${Date.now()}.jpg`,
      } as any);

      formData.append('orderId', orderId);
      formData.append('timestamp', new Date().toISOString());

      console.log(`Uploading proof photo for order ${orderId}...`);

      // Upload to backend
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/delivery/${orderId}/proof`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('✓ Photo uploaded successfully');
        return {
          success: true,
          photoUrl: response.data.photoUrl,
          message: 'Photo uploaded successfully',
        };
      } else {
        throw new Error(`Upload failed with status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Photo upload failed:', error);

      // Check if network error - queue for retry
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        console.log('Network error detected, queueing photo for retry...');

        await offlineQueueService.enqueue(
          QueueActionType.PHOTO_UPLOAD,
          {
            orderId,
            photo: {
              uri: photo.uri,
              type: photo.type,
              fileName: photo.fileName,
            },
          },
          5 // Max 5 retries for photos
        );

        return {
          success: false,
          message: 'Photo queued for upload (network unavailable)',
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to upload photo',
      };
    }
  }

  /**
   * Upload multiple photos
   * @param orderId - Order ID
   * @param photos - Array of photo assets
   * @param token - Auth token
   * @returns Array of upload results
   */
  async uploadMultiplePhotos(
    orderId: string,
    photos: Asset[],
    token: string
  ): Promise<PhotoUploadResult[]> {
    const results: PhotoUploadResult[] = [];

    for (const photo of photos) {
      const result = await this.uploadProofOfDelivery(orderId, photo, token);
      results.push(result);
    }

    return results;
  }

  /**
   * Get uploaded photo URL
   * @param orderId - Order ID
   * @param token - Auth token
   * @returns Photo URL or null
   */
  async getDeliveryPhoto(orderId: string, token: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/delivery/${orderId}/proof`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data.photoUrl || null;
    } catch (error) {
      console.error('Failed to get delivery photo:', error);
      return null;
    }
  }

  /**
   * Validate photo size
   * @param photo - Photo asset
   * @param maxSizeMB - Maximum size in MB (default 5MB)
   * @returns true if valid
   */
  validatePhotoSize(photo: Asset, maxSizeMB: number = 5): boolean {
    if (!photo.fileSize) {
      console.warn('Photo size unknown, skipping validation');
      return true;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (photo.fileSize > maxSizeBytes) {
      console.error(
        `Photo too large: ${(photo.fileSize / 1024 / 1024).toFixed(2)}MB (max ${maxSizeMB}MB)`
      );
      return false;
    }

    return true;
  }

  /**
   * Estimate upload time based on photo size
   * @param photo - Photo asset
   * @param uploadSpeedKBps - Upload speed in KB/s (default 100 KB/s)
   * @returns Estimated time in seconds
   */
  estimateUploadTime(photo: Asset, uploadSpeedKBps: number = 100): number {
    if (!photo.fileSize) {
      return 0;
    }

    const fileSizeKB = photo.fileSize / 1024;
    return Math.ceil(fileSizeKB / uploadSpeedKBps);
  }
}

// Export singleton instance
export const photoUploadService = new PhotoUploadService();
