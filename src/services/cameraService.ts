/**
 * Camera Service - React Native
 * Handles camera capture for proof of delivery photos
 */

import {
  launchCamera,
  launchImageLibrary,
  CameraOptions,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface CapturedImage {
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  base64?: string;
}

class CameraService {
  /**
   * Request camera permission (Android)
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions through Info.plist
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'MaSoVa Driver needs camera access to take delivery photos',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  }

  /**
   * Take a photo with camera
   */
  async takePhoto(options?: {
    includeBase64?: boolean;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  }): Promise<CapturedImage | null> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required to take delivery photos'
      );
      return null;
    }

    const cameraOptions: CameraOptions = {
      mediaType: 'photo',
      quality: options?.quality || 0.8,
      maxWidth: options?.maxWidth || 1920,
      maxHeight: options?.maxHeight || 1080,
      includeBase64: options?.includeBase64 || false,
      saveToPhotos: false,
      cameraType: 'back',
    };

    return new Promise((resolve) => {
      launchCamera(cameraOptions, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
          resolve(null);
          return;
        }

        if (response.errorCode) {
          console.error('Camera error:', response.errorMessage);
          Alert.alert('Camera Error', response.errorMessage || 'Failed to take photo');
          resolve(null);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          resolve(this.formatAsset(asset));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Pick a photo from gallery
   */
  async pickFromGallery(options?: {
    includeBase64?: boolean;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  }): Promise<CapturedImage | null> {
    const cameraOptions: CameraOptions = {
      mediaType: 'photo',
      quality: options?.quality || 0.8,
      maxWidth: options?.maxWidth || 1920,
      maxHeight: options?.maxHeight || 1080,
      includeBase64: options?.includeBase64 || false,
      selectionLimit: 1,
    };

    return new Promise((resolve) => {
      launchImageLibrary(cameraOptions, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
          resolve(null);
          return;
        }

        if (response.errorCode) {
          console.error('Image picker error:', response.errorMessage);
          Alert.alert('Error', response.errorMessage || 'Failed to select photo');
          resolve(null);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          resolve(this.formatAsset(asset));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Show action sheet to choose between camera and gallery
   */
  async selectPhoto(options?: {
    includeBase64?: boolean;
    quality?: number;
  }): Promise<CapturedImage | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Photo',
        'Choose a method to add delivery proof photo',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const photo = await this.takePhoto(options);
              resolve(photo);
            },
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const photo = await this.pickFromGallery(options);
              resolve(photo);
            },
          },
          {
            text: 'Cancel',
            onPress: () => resolve(null),
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Take multiple photos
   */
  async takeMultiplePhotos(
    count: number,
    options?: {
      includeBase64?: boolean;
      quality?: number;
    }
  ): Promise<CapturedImage[]> {
    const photos: CapturedImage[] = [];

    for (let i = 0; i < count; i++) {
      const shouldContinue = await new Promise<boolean>((resolve) => {
        Alert.alert(
          `Photo ${i + 1} of ${count}`,
          'Take the next delivery photo',
          [
            {
              text: 'Skip',
              onPress: () => resolve(false),
              style: 'cancel',
            },
            {
              text: 'Take Photo',
              onPress: () => resolve(true),
            },
          ]
        );
      });

      if (!shouldContinue) break;

      const photo = await this.takePhoto(options);
      if (photo) {
        photos.push(photo);
      }
    }

    return photos;
  }

  /**
   * Format asset to CapturedImage
   */
  private formatAsset(asset: Asset): CapturedImage {
    return {
      uri: asset.uri || '',
      fileName: asset.fileName,
      type: asset.type,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
      base64: asset.base64,
    };
  }

  /**
   * Compress image (for upload optimization)
   */
  async compressImage(
    image: CapturedImage,
    _quality: number = 0.7
  ): Promise<CapturedImage> {
    // This would require additional library like react-native-image-resizer
    // For now, return as-is
    // TODO: Implement image compression
    return image;
  }

  /**
   * Convert image to FormData for upload
   */
  createFormData(image: CapturedImage, fieldName: string = 'photo'): FormData {
    const formData = new FormData();

    formData.append(fieldName, {
      uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
      type: image.type || 'image/jpeg',
      name: image.fileName || `delivery-proof-${Date.now()}.jpg`,
    } as any);

    return formData;
  }

  /**
   * Validate image size
   */
  isValidSize(image: CapturedImage, maxSizeMB: number = 5): boolean {
    if (!image.fileSize) return true;
    const sizeMB = image.fileSize / (1024 * 1024);
    return sizeMB <= maxSizeMB;
  }
}

export const cameraService = new CameraService();
