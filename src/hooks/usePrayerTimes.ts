import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { PrayerTimes, Settings } from '../types';
import { calculatePrayerTimes, getEffectiveSettings } from '../utils/prayerCalculations';
import { getSettings, getSettingsSync, subscribeToSettings } from '../utils/storage';

export const usePrayerTimes = (user?: User | null, mosqueId?: string) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [effectiveSettings, setEffectiveSettings] = useState<Settings | null>(null);
  const [isFriday, setIsFriday] = useState<boolean>(false);
  const [mosqueFound, setMosqueFound] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const uid = mosqueId || user?.uid;

    // إلغاء الاشتراك السابق
    unsubRef.current?.();
    unsubRef.current = null;

    const loadSettings = async () => {
      setLoading(true);

      timeoutId = setTimeout(() => {
        setLoading(false);
        setMosqueFound(false);
      }, 10000);

      try {
        const { settings: newSettings, found } = await getSettings(user, mosqueId);
        clearTimeout(timeoutId);
        setSettings(newSettings);
        setMosqueFound(found);
      } catch (error) {
        clearTimeout(timeoutId);
        setMosqueFound(false);
        setSettings(getSettingsSync(mosqueId));
      } finally {
        setLoading(false);
      }

      // الاشتراك بالتحديثات الفورية إذا كان لدينا uid
      if (uid) {
        unsubRef.current = subscribeToSettings(uid, (updated) => {
          setSettings(updated);
          setMosqueFound(true);
        });
      }
    };

    loadSettings();

    return () => {
      clearTimeout(timeoutId);
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [user?.uid, mosqueId]);

  useEffect(() => {
    const compute = () => {
      if (!settings) return;
      const now = new Date();
      const { settings: effective, isFriday: friActive, fridayDate } = getEffectiveSettings(settings, now);
      const times = fridayDate ? calculatePrayerTimes(effective, fridayDate) : calculatePrayerTimes(effective);
      setPrayerTimes(times);
      setEffectiveSettings(effective);
      setIsFriday(friActive);
    };

    compute();

    const interval = setInterval(compute, 60000);

    return () => clearInterval(interval);
  }, [settings]);

  const refreshSettings = async () => {
    setLoading(true);
    try {
      const { settings: newSettings, found } = await getSettings(user, mosqueId);
      setSettings(newSettings);
      setMosqueFound(found);
    } catch (error) {
      setMosqueFound(false);
      setSettings(getSettingsSync());
    } finally {
      setLoading(false);
    }
  };

  return {
    prayerTimes,
    settings: effectiveSettings || settings || getSettingsSync(),
    isFriday,
    mosqueFound,
    refreshSettings,
    loading
  };
};
