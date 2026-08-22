import { db } from '../firebase';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';

const OFFSET_KEY = 'manarah_time_offset';
const LAST_DEVICE_TIME_KEY = 'manarah_last_device_time';
const LAST_REAL_TIME_KEY = 'manarah_last_real_time';
const SYNC_SOURCE_KEY = 'manarah_time_sync_source';

export type TimeSyncSource = 'server' | 'manual' | 'none';

interface StoredOffset {
  offsetMs: number;
  setAt: number;
  source: TimeSyncSource;
}

function readStoredOffset(): StoredOffset | null {
  try {
    const raw = localStorage.getItem(OFFSET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOffset;
    if (typeof parsed.offsetMs !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredOffset(offsetMs: number, source: TimeSyncSource) {
  const entry: StoredOffset = { offsetMs, setAt: Date.now(), source };
  localStorage.setItem(OFFSET_KEY, JSON.stringify(entry));
  localStorage.setItem(SYNC_SOURCE_KEY, source);
}

export function clearStoredOffset() {
  localStorage.removeItem(OFFSET_KEY);
  localStorage.removeItem(SYNC_SOURCE_KEY);
  localStorage.removeItem(LAST_DEVICE_TIME_KEY);
  localStorage.removeItem(LAST_REAL_TIME_KEY);
}

export function getSyncSource(): TimeSyncSource {
  const stored = readStoredOffset();
  if (!stored) {
    const raw = localStorage.getItem(SYNC_SOURCE_KEY);
    return (raw as TimeSyncSource) || 'none';
  }
  return stored.source;
}

export function getStoredOffsetMs(): number {
  const stored = readStoredOffset();
  return stored ? stored.offsetMs : 0;
}

export function getCorrectedTime(): Date {
  return new Date(Date.now() + getStoredOffsetMs());
}

export function setManualTime(year: number, month: number, day: number, hours: number, minutes: number) {
  const userDate = new Date(year, month, day, hours, minutes, 0, 0);
  const offsetMs = userDate.getTime() - Date.now();
  writeStoredOffset(offsetMs, 'manual');
  recordDeviceTime();
}

export function setServerOffset(serverNowMs: number) {
  const offsetMs = serverNowMs - Date.now();
  writeStoredOffset(offsetMs, 'server');
  recordDeviceTime();
}

export function recordDeviceTime() {
  const now = Date.now();
  localStorage.setItem(LAST_DEVICE_TIME_KEY, String(now));
  localStorage.setItem(LAST_REAL_TIME_KEY, String(now + getStoredOffsetMs()));
}

export function detectClockReset(): boolean {
  const stored = readStoredOffset();
  const lastDeviceRaw = localStorage.getItem(LAST_DEVICE_TIME_KEY);

  if (stored && stored.source === 'server') {
    const deviceNow = Date.now();
    if (lastDeviceRaw) {
      const lastDevice = parseInt(lastDeviceRaw, 10);
      if (deviceNow < lastDevice - 60000) return true;
    }
    const correctedNow = deviceNow + stored.offsetMs;
    if (correctedNow < stored.setAt - 60000) return true;
  }

  if (lastDeviceRaw) {
    const lastDevice = parseInt(lastDeviceRaw, 10);
    const deviceNow = Date.now();
    if (deviceNow < lastDevice - 60000) return true;
  }

  const deviceNow = Date.now();
  if (deviceNow < 946684800000) return true;

  return false;
}

let serverSyncInProgress = false;

export async function syncTimeFromServer(): Promise<boolean> {
  if (serverSyncInProgress) return false;
  if (!navigator.onLine) return false;

  serverSyncInProgress = true;
  try {
    const ref = doc(db, 'time_sync', 'now');
    await getDoc(ref).catch(() => {});
    const resp = await fetch('https://www.google.com/generate_204', { method: 'GET', cache: 'no-store' });
    if (resp.ok) {
      const serverDate = resp.headers.get('date');
      if (serverDate) {
        const serverMs = new Date(serverDate).getTime();
        if (!isNaN(serverMs)) {
          setServerOffset(serverMs);
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  } finally {
    serverSyncInProgress = false;
  }
}

export async function syncFromFirestoreServerTimestamp(): Promise<boolean> {
  if (!navigator.onLine) return false;

  try {
    const ref = doc(db, 'time_sync', 'now');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const ts = snap.data()?.serverTime;
      if (ts && typeof ts.toMillis === 'function') {
        setServerOffset(ts.toMillis());
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
