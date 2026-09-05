import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { PrayerTimes, Settings } from '../types';
import { calculatePrayerTimes, getEffectiveSettings } from '../utils/prayerCalculations';
import { getSettings, getSettingsSync, subscribeToSettings } from '../utils/storage';
import { getCorrectedTime } from '../utils/timeCorrection';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const prayerTimesEqual = (a: PrayerTimes, b: PrayerTimes): boolean =>
  a.fajr.getTime() === b.fajr.getTime() &&
  a.sunrise.getTime() === b.sunrise.getTime() &&
  a.dhuhr.getTime() === b.dhuhr.getTime() &&
  a.asr.getTime() === b.asr.getTime() &&
  a.maghrib.getTime() === b.maghrib.getTime() &&
  a.isha.getTime() === b.isha.getTime();

export const usePrayerTimes = (user?: User | null, mosqueId?: string) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [effectiveSettings, setEffectiveSettings] = useState<Settings | null>(null);
  const [isFriday, setIsFriday] = useState<boolean>(false);
  const [mosqueFound, setMosqueFound] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);
  const lastComputedDayRef = useRef<string>('');
  const cachedPrayerTimesRef = useRef<PrayerTimes | null>(null);

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

      // الاشتراك بالتحديثات الفورية فقط عند توفر الاتصال
      if (uid && navigator.onLine) {
        unsubRef.current = subscribeToSettings(uid, (updated) => {
          setSettings(updated);
          setMosqueFound(true);
        });
      }
    };

    loadSettings();

    const onlineHandler = () => {
      if (navigator.onLine && uid && !unsubRef.current) {
        unsubRef.current = subscribeToSettings(uid, (updated) => {
          setSettings(updated);
          setMosqueFound(true);
        });
      }
    };
    window.addEventListener('online', onlineHandler);

    const offlineHandler = () => {
      // عند انقطاع الاتصال، نوقف الاشتراك الفوري ونعتمد على الإعدادات المحلية
      unsubRef.current?.();
      unsubRef.current = null;
    };
    window.addEventListener('offline', offlineHandler);

    return () => {
      clearTimeout(timeoutId);
      unsubRef.current?.();
      unsubRef.current = null;
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, [user?.uid, mosqueId]);

  // حساب أوقات الصلاة — مرة واحدة يومياً أو عند تغيّر الإعدادات
  // لا يتم إعادة الحساب كل دقيقة (سبب الوميض السابق)
  useEffect(() => {
    const compute = () => {
      if (!settings) return;
      const now = getCorrectedTime();
      const { settings: effective, isFriday: friActive, fridayDate } = getEffectiveSettings(settings, now);

      // حساب أوقات الصلاة فقط إذا تغيّر اليوم أو لم تُحسب بعد
      const dayKey = now.toDateString() + (friActive ? '-friday' : '');
      if (dayKey === lastComputedDayRef.current && cachedPrayerTimesRef.current) {
        // نفس اليوم — نعيد القيم المحفوظة بدون إعادة الحساب
        setPrayerTimes(prev => prev || cachedPrayerTimesRef.current);
        setEffectiveSettings(effective);
        setIsFriday(friActive);
        return;
      }

      const times = fridayDate ? calculatePrayerTimes(effective, fridayDate) : calculatePrayerTimes(effective);

      // نتحقق أن الأوقات فعلاً تغيّرت قبل تحديث الحالة
      if (cachedPrayerTimesRef.current && prayerTimesEqual(cachedPrayerTimesRef.current, times)) {
        lastComputedDayRef.current = dayKey;
        setEffectiveSettings(effective);
        setIsFriday(friActive);
        return;
      }

      cachedPrayerTimesRef.current = times;
      lastComputedDayRef.current = dayKey;
      setPrayerTimes(times);
      setEffectiveSettings(effective);
      setIsFriday(friActive);
    };

    compute();

    // إعادة الحساب عند منتصف الليل (تغيّر اليوم) — يُفحص كل دقيقة بصمت
    const interval = setInterval(() => {
      const now = getCorrectedTime();
      const dayKey = now.toDateString();
      if (dayKey !== lastComputedDayRef.current) {
        compute();
      }
    }, 60000);

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
