
const DB_NAME = 'manarah-bg-cache';
const STORE_NAME = 'backgrounds';
const DB_VERSION = 1;

type CachedBackground = { url: string; blob: Blob };

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheBackground(id: string, url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`backgroundCache: fetch failed for "${id}" (status ${response.status})`);
      return false;
    }
    const blob = await response.blob();
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const record: CachedBackground = { url, blob };
    tx.objectStore(STORE_NAME).put(record, id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch (e) {
    console.warn(`backgroundCache: could not cache "${id}":`, e);
    return false;
  }
}

export async function getCachedBlobUrl(id: string, url: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    const record = await new Promise<CachedBackground | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as CachedBackground | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (record && record.url === url && record.blob) return URL.createObjectURL(record.blob);
    return null;
  } catch {
    return null;
  }
}

export async function deleteCachedBackground(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}
