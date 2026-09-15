import { showToast } from './toast';

export interface UploadResult {
  urls: string[];
  publicIds: string[];
}

/**
 * Handles image uploads with rollback on failure
 * If the main operation fails, uploaded images are deleted
 */
export const uploadWithRollback = {
  /**
   * Upload files and execute a callback operation
   * If callback fails, uploaded files are automatically cleaned up
   */
  async executeWithCleanup<T>(
    uploadFn: () => Promise<UploadResult>,
    executeFn: (urls: string[], publicIds: string[]) => Promise<T>,
    cleanupFn?: (publicIds: string[]) => Promise<void>
  ): Promise<T> {
    let uploadedPublicIds: string[] = [];
    let uploadedUrls: string[] = [];

    try {
      // Step 1: Upload images
      const uploadResult = await uploadFn();
      uploadedPublicIds = uploadResult.publicIds;
      uploadedUrls = uploadResult.urls;

      if (!uploadedUrls.length) {
        throw new Error('No images were uploaded');
      }

      // Step 2: Execute main operation with uploaded URLs
      try {
        const result = await executeFn(uploadedUrls, uploadedPublicIds);
        return result;
      } catch (execError) {
        // Step 3a: Operation failed - clean up uploaded images
        showToast.error('Failed to save. Cleaning up uploaded files...');

        if (cleanupFn) {
          try {
            await cleanupFn(uploadedPublicIds);
            showToast.info('Uploaded files cleaned up');
          } catch (cleanupError) {
            console.error('Error cleaning up uploaded files:', cleanupError);
            showToast.warning('Failed to clean up some uploaded files. Please contact support.');
          }
        }

        throw execError;
      }
    } catch (error) {
      console.error('Upload transaction failed:', error);
      throw error;
    }
  },

  /**
   * Safe wrapper that shows loading and handles errors
   */
  async safeExecute<T>(
    uploadFn: () => Promise<UploadResult>,
    executeFn: (urls: string[], publicIds: string[]) => Promise<T>,
    cleanupFn?: (publicIds: string[]) => Promise<void>,
    onSuccess?: () => void
  ): Promise<T | null> {
    try {
      const result = await this.executeWithCleanup(uploadFn, executeFn, cleanupFn);
      onSuccess?.();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      showToast.error(message);
      return null;
    }
  },
};

/**
 * Track upload progress and handle multiple file uploads
 */
export const trackUploadProgress = {
  async uploadMultiple(
    files: File[],
    uploadFn: (file: File) => Promise<{ url: string; publicId: string }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<UploadResult> {
    const urls: string[] = [];
    const publicIds: string[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (let i = 0; i < files.length; i++) {
      try {
        onProgress?.(i + 1, files.length);
        const result = await uploadFn(files[i]);
        urls.push(result.url);
        publicIds.push(result.publicId);
      } catch (error) {
        errors.push({
          file: files[i].name,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    if (errors.length > 0) {
      const errorMsg = errors.map(e => `${e.file}: ${e.error}`).join('\n');
      console.warn('Some uploads failed:', errorMsg);
    }

    return { urls, publicIds };
  },
};
