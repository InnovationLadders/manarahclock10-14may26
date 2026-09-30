
const DB_NAME = 'manarah-bg-cache';
const STORE_NAME = 'backgrounds';
const DB_VERSION = 1;

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
    tx.objectStore(STORE_NAME).put(blob, id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    console.log(`backgroundCache: cached "${id}" successfully`);
    return true;
  } catch (e) {
    console.warn(`backgroundCache: could not cache "${id}":`, e);
    return false;
  }
}

export async function getCachedBlobUrl(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (blob) return URL.createObjectURL(blob);
    return null;
  } catch {
    return null;
  }
}

export async function isBackgroundCached(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const countReq = tx.objectStore(STORE_NAME).count(id);
    const count = await new Promise<number>((resolve, reject) => {
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => reject(countReq.error);
    });
    db.close();
    return count > 0;
  } catch {
    return false;
  }
}

export async function getCachedBackgroundIds(): Promise<Set<string>> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const keysReq = tx.objectStore(STORE_NAME).getAllKeys();
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      keysReq.onsuccess = () => resolve(keysReq.result);
      keysReq.onerror = () => reject(keysReq.error);
    });
    db.close();
    return new Set(keys.map(k => String(k)));
  } catch {
    return new Set();
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
