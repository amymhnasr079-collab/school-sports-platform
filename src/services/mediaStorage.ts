import { MediaItem } from '../types';
import { fetchCloudFileBlob } from './cloudStorage';

const DB_NAME = 'AishaSportsMediaStore_v1';
const STORE_NAME = 'media_files';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

export interface StoredMediaRecord {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  updatedAt: string;
}

/**
 * Save a media file Blob/File to local IndexedDB
 */
export async function saveMediaFileLocally(
  id: string,
  file: File | Blob,
  fileName: string,
  mimeType: string
): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: StoredMediaRecord = {
        id,
        blob: file,
        fileName,
        mimeType: mimeType || file.type || 'application/octet-stream',
        fileSize: file.size,
        updatedAt: new Date().toISOString(),
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.error('Error saving media file to IndexedDB:', err);
    throw err;
  }
}

/**
 * Retrieve a stored media file Blob from IndexedDB
 */
export async function getMediaFileLocally(id: string): Promise<StoredMediaRecord | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        resolve((getRequest.result as StoredMediaRecord) || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (err) {
    console.warn('Error fetching media file from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete a media file from IndexedDB
 */
export async function deleteMediaFileLocally(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delRequest = store.delete(id);

      delRequest.onsuccess = () => resolve();
      delRequest.onerror = () => reject(delRequest.error);
    });
  } catch (err) {
    console.warn('Error deleting media file from IndexedDB:', err);
  }
}

/**
 * Download a media item to the user's computer/phone
 */
export async function downloadMediaFileToDevice(
  item: MediaItem,
  preloadedBlob?: Blob | null
): Promise<{ success: boolean; message: string }> {
  try {
    let blobToDownload: Blob | null = preloadedBlob || null;
    let downloadFileName = item.fileName;

    if (!downloadFileName) {
      const ext =
        item.fileType === 'powerpoint'
          ? 'pptx'
          : item.fileType === 'pdf'
          ? 'pdf'
          : item.fileType === 'video'
          ? 'mp4'
          : item.fileType === 'document'
          ? 'docx'
          : 'dat';
      downloadFileName = `${item.title.replace(/[\\/:*?"<>|]/g, '_')}.${ext}`;
    }

    // 1. Try fetching from Persistent Cloud Storage (works across Netlify and all devices)
    if (!blobToDownload) {
      try {
        const cloudBlob = await fetchCloudFileBlob(item);
        if (cloudBlob) {
          blobToDownload = cloudBlob;
        }
      } catch (err) {
        console.warn('Persistent cloud fetch failed:', err);
      }
    }

    // 2. Check if stored in IndexedDB (local cache)
    if (!blobToDownload && item.id) {
      const record = await getMediaFileLocally(item.id);
      if (record && record.blob) {
        blobToDownload = record.blob;
        if (record.fileName) downloadFileName = record.fileName;
      }
    }

    // 3. If item has a local data URL
    if (!blobToDownload && item.localDataUrl) {
      const res = await fetch(item.localDataUrl);
      blobToDownload = await res.blob();
    }

    // 3. Trigger Blob download if available
    if (blobToDownload) {
      const url = URL.createObjectURL(blobToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      return { success: true, message: `تم بدء تحميل الملف (${downloadFileName}) وحفظه على جهازكِ بنجاح ✓` };
    }

    // 4. Fallback for external direct links (e.g., online PDF, direct video)
    if (item.url && item.url.startsWith('http')) {
      const a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true, message: `جاري فتح / تحميل الملف من الرابط الخارجي...` };
    }

    return {
      success: false,
      message: 'تعذر العثور على محتوى الملف الأصلي لتحميله. يُرجى إعادة اختياره من جهازكِ.',
    };
  } catch (err) {
    console.error('Download error:', err);
    return {
      success: false,
      message: 'حدث خطأ أثناء محاولة حفظ الملف على الجهاز.',
    };
  }
}

/**
 * Format bytes to readable Arabic representation
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

/**
 * Detect file type and category from uploaded file name and MIME
 */
export function detectFileDetails(file: File): {
  fileType: MediaItem['fileType'];
  suggestedCategory: MediaItem['category'];
} {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  // PowerPoint
  if (
    name.endsWith('.pptx') ||
    name.endsWith('.ppt') ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return { fileType: 'powerpoint', suggestedCategory: 'presentation' };
  }

  // PDF
  if (name.endsWith('.pdf') || mime.includes('pdf')) {
    // If name contains lesson or plan, default to lesson_plan, otherwise presentation
    if (name.includes('خطة') || name.includes('درس') || name.includes('نموذج')) {
      return { fileType: 'pdf', suggestedCategory: 'lesson_plan' };
    }
    return { fileType: 'pdf', suggestedCategory: 'presentation' };
  }

  // Video
  if (
    name.endsWith('.mp4') ||
    name.endsWith('.webm') ||
    name.endsWith('.mov') ||
    name.endsWith('.mkv') ||
    name.endsWith('.avi') ||
    mime.startsWith('video/')
  ) {
    return { fileType: 'video', suggestedCategory: 'video' };
  }

  // Word & Documents
  if (
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    mime.includes('word') ||
    mime.includes('document')
  ) {
    return { fileType: 'document', suggestedCategory: 'lesson_plan' };
  }

  // Audio
  if (name.endsWith('.mp3') || name.endsWith('.wav') || mime.startsWith('audio/')) {
    return { fileType: 'audio', suggestedCategory: 'rules' };
  }

  return { fileType: 'link', suggestedCategory: 'presentation' };
}

/**
 * Get device storage stats
 */
export async function getLocalDeviceStorageStats(): Promise<{
  count: number;
  totalSizeBytes: number;
  formattedSize: string;
}> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result as StoredMediaRecord[]) || [];
        const count = records.length;
        const totalSizeBytes = records.reduce((sum, r) => sum + (r.fileSize || 0), 0);
        resolve({
          count,
          totalSizeBytes,
          formattedSize: formatBytes(totalSizeBytes),
        });
      };
      req.onerror = () => {
        resolve({ count: 0, totalSizeBytes: 0, formattedSize: '0 بايت' });
      };
    });
  } catch {
    return { count: 0, totalSizeBytes: 0, formattedSize: '0 بايت' };
  }
}
