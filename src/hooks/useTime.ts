import { useState, useEffect, useRef } from 'react';
import { getCorrectedTime, getStoredOffsetMs, recordDeviceTime, detectClockReset, syncTimeFromServer } from '../utils/timeCorrection';

export const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(getCorrectedTime());
  const offsetRef = useRef(getStoredOffsetMs());

  useEffect(() => {
    const tick = () => {
      const currentOffset = getStoredOffsetMs();
      if (currentOffset !== offsetRef.current) {
        offsetRef.current = currentOffset;
      }
      setCurrentTime(new Date(Date.now() + offsetRef.current));
    };

    tick();
    const timer = setInterval(tick, 1000);

    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'manarah_time_offset' || (e.key === null && e.url !== null)) {
        offsetRef.current = getStoredOffsetMs();
        tick();
      }
    };
    window.addEventListener('storage', storageHandler);

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        offsetRef.current = getStoredOffsetMs();
        tick();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', storageHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  return currentTime;
};

export const useClockResetDetection = (onReset: () => void) => {
  useEffect(() => {
    const check = () => {
      if (detectClockReset()) {
        onReset();
      }
    };

    check();

    const interval = setInterval(() => {
      recordDeviceTime();
      check();
    }, 30000);

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [onReset]);
};

export const useAutoTimeSync = () => {
  useEffect(() => {
    if (!navigator.onLine) return;

    const doSync = async () => {
      const ok = await syncTimeFromServer();
      if (ok) {
        recordDeviceTime();
      }
    };

    const timer = setTimeout(doSync, 3000);

    const onlineHandler = () => doSync();
    window.addEventListener('online', onlineHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', onlineHandler);
    };
  }, []);
};
