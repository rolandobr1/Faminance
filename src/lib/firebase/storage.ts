'use client';

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads a receipt image to Firebase Storage.
 * @param file - The image file to upload.
 * @param transactionId - A unique ID to namespace the file (use Date.now() for new transactions).
 * @param onProgress - Optional callback with upload progress (0–100).
 * @returns The public download URL of the uploaded image.
 */
export async function uploadReceipt(
  file: File,
  transactionId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `receipts/${transactionId}.${ext}`;
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        console.error('Receipt upload error:', error);
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}
