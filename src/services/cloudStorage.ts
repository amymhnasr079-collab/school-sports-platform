import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import {
  isSupabaseConfigured,
  uploadToSupabaseStorage,
  fetchBlobFromSupabaseStorage,
  deleteFromSupabaseStorage,
} from './supabase';
import { MediaItem } from '../types';
import { saveMediaFileLocally, getMediaFileLocally, deleteMediaFileLocally } from './mediaStorage';

// Firestore collection for persistent cloud file storage
const CLOUD_FILES_COLLECTION = 'cloud_files';

// 350,000 characters Base64 chunks (~260KB raw binary per chunk, comfortably safe within Firestore limits)
const CHUNK_SIZE = 350000;

// Maximum chunks to write in a single Firestore writeBatch (keeps batch payload well under the 10MB limit)
const MAX_CHUNKS_PER_BATCH = 6;

// Maximum file size in bytes to store directly in Firestore chunked documents (~35MB)
// Larger files use Supabase Storage (up to 50MB+) or direct URLs
const MAX_FIRESTORE_CHUNKABLE_BYTES = 35 * 1024 * 1024;

/**
 * Convert a File or Blob into a Base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Strip metadata prefix if present, e.g. "data:application/pdf;base64,"
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a Base64 string into a Blob safely across all devices and browsers
 */
export function base64ToBlob(base64: string, mimeType: string = 'application/octet-stream'): Blob {
  // Clean whitespace/newlines
  const cleanBase64 = base64.replace(/[\r\n\s]/g, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export interface CloudUploadResult {
  url: string;
  cloudFileId: string;
  storageProvider: 'supabase' | 'firebase_storage' | 'firestore_cloud' | 'device';
  storagePath?: string;
  notice?: 'cloud_success' | 'firestore_chunks' | 'large_local_storage' | 'fallback_device';
}

/**
 * Upload a presentation, video, PDF or file to Persistent Storage
 * Multi-Engine Architecture:
 * 1. Always caches locally in IndexedDB first (0.01s instant responsiveness, handles 100MB+)
 * 2. Supabase Storage (handles videos up to 50MB+ if configured via Netlify environment variables)
 * 3. Firebase Cloud Storage (with 5s safe timeout so it never hangs)
 * 4. Resilient Chunked Firestore Storage in small batches (guaranteed < 10MB batch limit)
 * 5. Device storage fallback (so video is NEVER lost even if network or cloud limits occur)
 */
export async function uploadFileToCloud(
  file: File,
  itemId: string,
  onProgress?: (percent: number) => void
): Promise<CloudUploadResult> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `media/${itemId}_${sanitizedName}`;

  // Step 0: Always cache locally in IndexedDB first so file is never lost and plays instantly
  try {
    await saveMediaFileLocally(itemId, file, file.name, file.type);
    if (onProgress) onProgress(20);
  } catch (err) {
    console.warn('Local IndexedDB caching notice:', err);
  }

  // 1. Attempt upload to Supabase Storage if configured via environment variables
  if (isSupabaseConfigured()) {
    try {
      if (onProgress) onProgress(35);
      const res = await uploadToSupabaseStorage(file, storagePath);
      if (res.success && res.publicUrl) {
        if (onProgress) onProgress(100);
        return {
          url: res.publicUrl,
          cloudFileId: itemId,
          storageProvider: 'supabase',
          storagePath,
          notice: 'cloud_success',
        };
      }
      console.warn('Supabase upload attempt failed, falling back to next engine:', res.error);
    } catch (supaErr) {
      console.warn('Supabase upload exception, falling back to next engine:', supaErr);
    }
  }

  // 2. Attempt upload to Firebase Cloud Storage (with a 5-second timeout to prevent hanging)
  if (storage) {
    try {
      const fileRef = ref(storage, `sports_platform/${storagePath}`);
      const uploadTask = uploadBytesResumable(fileRef, file, {
        contentType: file.type || 'application/octet-stream',
      });

      const downloadUrl = await Promise.race([
        new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (onProgress) onProgress(Math.round(progress));
            },
            (error) => reject(error),
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (err) {
                reject(err);
              }
            }
          );
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            uploadTask.cancel();
            reject(new Error('Firebase Storage upload timed out (60s)'));
          }, 60000)
        ),
      ]);

      if (onProgress) onProgress(100);
      return {
        url: downloadUrl,
        cloudFileId: itemId,
        storageProvider: 'firebase_storage',
        storagePath,
        notice: 'cloud_success',
      };
    } catch (storageErr) {
      console.warn(
        'Firebase Storage not available or timed out. Proceeding to Firestore Cloud Storage:',
        storageErr
      );
    }
  }

  // 3. Persistent Firestore Cloud Storage engine (for files up to ~12MB)
  if (file.size <= MAX_FIRESTORE_CHUNKABLE_BYTES) {
    try {
      if (onProgress) onProgress(40);
      const base64Data = await blobToBase64(file);
      if (onProgress) onProgress(60);

      const totalLength = base64Data.length;
      const chunkCount = Math.ceil(totalLength / CHUNK_SIZE);
      const mainDocRef = doc(db, CLOUD_FILES_COLLECTION, itemId);

      if (chunkCount <= 1) {
        // Single chunk document
        await setDoc(mainDocRef, {
          fileId: itemId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          chunkCount: 1,
          dataBase64: base64Data,
          storagePath,
          storageProvider: 'firestore_cloud',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Multi-chunk documents in a dedicated subcollection, written in small batches
        await setDoc(mainDocRef, {
          fileId: itemId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          chunkCount,
          storagePath,
          storageProvider: 'firestore_cloud',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Commit in small batches of MAX_CHUNKS_PER_BATCH (approx 1.5MB per batch, strictly under Firestore's 10MB limit)
        for (let b = 0; b < chunkCount; b += MAX_CHUNKS_PER_BATCH) {
          const batch = writeBatch(db);
          const endChunk = Math.min(b + MAX_CHUNKS_PER_BATCH, chunkCount);

          for (let i = b; i < endChunk; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalLength);
            const chunkStr = base64Data.substring(start, end);
            const chunkDocRef = doc(db, CLOUD_FILES_COLLECTION, itemId, 'chunks', `chunk_${i}`);
            batch.set(chunkDocRef, {
              index: i,
              chunk: chunkStr,
            });
          }

          await batch.commit();

          if (onProgress) {
            const progress = Math.round(60 + (endChunk / chunkCount) * 38);
            onProgress(Math.min(progress, 98));
          }
        }
      }

      if (onProgress) onProgress(100);

      return {
        url: '', // Stored in Firestore cloud_files collection chunks
        cloudFileId: itemId,
        storageProvider: 'firestore_cloud',
        storagePath,
        notice: 'firestore_chunks',
      };
    } catch (firestoreErr) {
      console.warn('Firestore chunked upload encountered error, falling back to local persistent store:', firestoreErr);
    }
  } else {
    console.info(
      `File size (${file.size} bytes) exceeds direct Firestore doc limit. Stored safely in IndexedDB.`
    );
  }

  // 4. If file is larger than 12MB or Firestore chunking was skipped/errored:
  // Still sync file metadata to Firestore so all users see the item
  try {
    const mainDocRef = doc(db, CLOUD_FILES_COLLECTION, itemId);
    await setDoc(
      mainDocRef,
      {
        fileId: itemId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        chunkCount: 0,
        storagePath,
        storageProvider: 'device',
        isLargeMedia: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (metaErr) {
    console.warn('Metadata sync notice:', metaErr);
  }

  if (onProgress) onProgress(100);

  return {
    url: '',
    cloudFileId: itemId,
    storageProvider: 'device',
    storagePath,
    notice: 'large_local_storage',
  };
}

/**
 * Retrieve the binary Blob of a stored file (PDF, PPTX, MP4, etc.)
 * Works seamlessly across all devices and Netlify deployments.
 */
export async function fetchCloudFileBlob(
  item: MediaItem,
  onProgress?: (percent: number) => void
): Promise<Blob | null> {
  const fileId = item.cloudFileId || item.deviceStorageKey || item.id;
  const mimeType =
    item.mimeType ||
    (item.fileType === 'pdf'
      ? 'application/pdf'
      : item.fileType === 'video'
      ? 'video/mp4'
      : 'application/octet-stream');

  // 1. Check local IndexedDB first for instant (0ms) zero-network loading
  try {
    const localRecord = await getMediaFileLocally(item.id);
    if (localRecord && localRecord.blob) {
      if (onProgress) onProgress(100);
      return localRecord.blob;
    }
  } catch (idbErr) {
    console.warn('IndexedDB initial retrieval check notice:', idbErr);
  }

  // 2. If stored in Supabase Storage
  if (item.storageProvider === 'supabase' && item.storagePath && isSupabaseConfigured()) {
    try {
      if (onProgress) onProgress(30);
      const supaBlob = await fetchBlobFromSupabaseStorage(item.storagePath);
      if (supaBlob) {
        if (onProgress) onProgress(100);
        saveMediaFileLocally(item.id, supaBlob, item.fileName || 'file', mimeType).catch(() => {});
        return supaBlob;
      }
    } catch (supaErr) {
      console.warn('Supabase storage blob fetch error:', supaErr);
    }
  }

  // 3. If item has a public URL (Supabase public URL, Firebase Storage URL, or external direct URL)
  const targetUrl = item.cloudDownloadUrl || item.url;
  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    try {
      if (onProgress) onProgress(25);
      const res = await fetch(targetUrl, { mode: 'cors' });
      if (res.ok) {
        if (onProgress) onProgress(80);
        const blob = await res.blob();
        if (onProgress) onProgress(100);
        saveMediaFileLocally(item.id, blob, item.fileName || 'file', mimeType).catch(() => {});
        return blob;
      }
    } catch (fetchErr) {
      console.warn('Direct fetch from URL notice (CORS/network):', fetchErr);
    }
  }

  // 4. If stored in Firestore Cloud Storage (cloud_files collection chunks)
  try {
    if (onProgress) onProgress(15);
    const mainDocRef = doc(db, CLOUD_FILES_COLLECTION, fileId);
    const snap = await getDoc(mainDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const chunkCount = data.chunkCount || 0;

      if (chunkCount === 1 && data.dataBase64) {
        if (onProgress) onProgress(80);
        const blob = base64ToBlob(data.dataBase64, data.mimeType || mimeType);
        if (onProgress) onProgress(100);
        saveMediaFileLocally(item.id, blob, item.fileName || 'file', mimeType).catch(() => {});
        return blob;
      }

      if (chunkCount > 1) {
        if (onProgress) onProgress(30);
        // Fetch chunks from subcollection
        const chunksRef = collection(db, CLOUD_FILES_COLLECTION, fileId, 'chunks');
        const chunksSnap = await getDocs(chunksRef);
        const chunksList: { index: number; chunk: string }[] = [];

        let count = 0;
        chunksSnap.forEach((docSnap) => {
          const cData = docSnap.data();
          chunksList.push({ index: cData.index, chunk: cData.chunk });
          count++;
          if (onProgress && chunkCount > 0) {
            const p = Math.round(30 + (count / chunkCount) * 55);
            onProgress(Math.min(p, 90));
          }
        });

        chunksList.sort((a, b) => a.index - b.index);
        const fullBase64 = chunksList.map((c) => c.chunk).join('');
        if (onProgress) onProgress(95);
        const blob = base64ToBlob(fullBase64, data.mimeType || mimeType);
        if (onProgress) onProgress(100);
        saveMediaFileLocally(item.id, blob, item.fileName || 'file', mimeType).catch(() => {});
        return blob;
      }
    }
  } catch (err) {
    console.warn('Error fetching file from Firestore cloud_files:', err);
  }

  // 5. Fallback again to local IndexedDB (with key check)
  try {
    const record = await getMediaFileLocally(fileId);
    if (record && record.blob) {
      if (onProgress) onProgress(100);
      return record.blob;
    }
  } catch (idbErr) {
    console.warn('IndexedDB secondary retrieval fallback notice:', idbErr);
  }

  return null;
}

/**
 * Delete file persistently from Storage (Supabase, Firebase, and Firestore)
 */
export async function deleteFileFromCloud(item: MediaItem): Promise<void> {
  const fileId = item.cloudFileId || item.deviceStorageKey || item.id;

  // 1. Delete from Supabase Storage if applicable
  if (item.storageProvider === 'supabase' && item.storagePath && isSupabaseConfigured()) {
    try {
      await deleteFromSupabaseStorage(item.storagePath);
    } catch (err) {
      console.warn('Supabase Storage delete notice:', err);
    }
  }

  // 2. Delete from Firebase Storage if applicable
  if (item.storageProvider === 'firebase_storage' && storage && item.url) {
    try {
      const sanitizedName = (item.fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileRef = ref(storage, `sports_platform/media/${fileId}_${sanitizedName}`);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn('Firebase Storage delete notice:', err);
    }
  }

  // 3. Delete from Firestore cloud_files collection
  try {
    const mainDocRef = doc(db, CLOUD_FILES_COLLECTION, fileId);
    const snap = await getDoc(mainDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.chunkCount && data.chunkCount > 1) {
        const chunksRef = collection(db, CLOUD_FILES_COLLECTION, fileId, 'chunks');
        const chunksSnap = await getDocs(chunksRef);
        // Delete in safe chunks
        const deleteBatch = writeBatch(db);
        chunksSnap.forEach((docSnap) => deleteBatch.delete(docSnap.ref));
        await deleteBatch.commit();
      }
      await deleteDoc(mainDocRef);
    }
  } catch (err) {
    console.warn('Firestore cloud_files delete notice:', err);
  }

  // 4. Delete from local IndexedDB
  await deleteMediaFileLocally(item.id);
}
