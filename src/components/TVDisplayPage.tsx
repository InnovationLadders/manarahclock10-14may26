import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { usePWAInstall } from '../hooks/usePWAInstall';

const TVDisplayPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(() => {
    const id = `tv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return id;
  });
  const [status, setStatus] = useState<'waiting' | 'selected'>('waiting');
  const [mosqueName, setMosqueName] = useState('');
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();

  const pairUrl = `${window.location.origin}/pair?session=${sessionId}`;

  // Show install banner shortly after page loads if not yet installed
  useEffect(() => {
    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => setShowInstallBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled]);

  // Request wake lock to prevent screen sleep on TV Box
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {
          // Wake lock not supported or denied — not critical
        }
      }
    };

    requestWakeLock();

    const reacquire = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', reacquire);

    return () => {
      document.removeEventListener('visibilitychange', reacquire);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const sessionRef = doc(db, 'tv_sessions', sessionId);

    setDoc(sessionRef, {
      status: 'waiting',
      createdAt: serverTimestamp(),
      mosqueId: null,
      mosqueName: null
    }).catch(console.error);

    unsubRef.current = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === 'selected' && data.mosqueId) {
        setStatus('selected');
        setMosqueName(data.mosqueName || '');
        setTimeout(() => {
          navigate(`/mosque/${data.mosqueId}`, { replace: true });
        }, 1500);
      }
    });

    return () => {
      unsubRef.current?.();
    };
  }, [sessionId, navigate]);

  const handleInstall = async () => {
    setInstalling(true);
    await triggerInstall();
    setInstalling(false);
    setShowInstallBanner(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
        fontFamily: 'Cairo, sans-serif'
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Manual install instructions overlay */}
      {showManualInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowManualInstall(false)}>
          <div
            className="relative bg-white/10 border border-white/20 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl"
            style={{ fontFamily: 'Cairo, sans-serif' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowManualInstall(false)}
              className="absolute top-4 left-4 p-2 text-white/60 hover:text-white transition-colors"
              aria-label="إغلاق"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 text-center">كيفية تثبيت التطبيق</h2>

            <div className="space-y-5 text-right">
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-emerald-300 font-bold mb-1">Chrome / Edge</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  القائمة (ثلاث نقاط ⋮) &larr; <strong>إضافة إلى الشاشة الرئيسية</strong> أو <strong>تثبيت التطبيق</strong>
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-emerald-300 font-bold mb-1">Samsung Internet</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  القائمة &larr; <strong>إضافة صفحة إلى</strong> &larr; <strong>الشاشة الرئيسية</strong>
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-emerald-300 font-bold mb-1">متصفح TV Box المدمج</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  الإعدادات &larr; <strong>حفظ كتطبيق</strong> أو <strong>إضافة اختصار</strong>
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-emerald-300 font-bold mb-1">Safari (iPhone/iPad)</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  زر المشاركة &larr; <strong>أضف إلى الشاشة الرئيسية</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowManualInstall(false)}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-colors"
            >
              فهمت
            </button>
          </div>
        </div>
      )}

      {/* Install banner */}
      {showInstallBanner && (
        <div
          className="absolute top-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-8 py-4"
          style={{
            background: 'linear-gradient(90deg, #059669, #047857)',
            fontFamily: 'Cairo, sans-serif'
          }}
        >
          <div className="flex items-center gap-3">
            <img src="/logo_MANARAH_25.svg" alt="منارة" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-white font-bold text-lg leading-tight">ثبّت ساعة منارة على شاشتك</p>
              <p className="text-emerald-100 text-sm">لفتح التطبيق مباشرةً بدون متصفح في كل مرة</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all duration-200 disabled:opacity-70 text-base"
            >
              {installing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  جاري التثبيت...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  تثبيت الآن
                </>
              )}
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-2 text-white/70 hover:text-white transition-colors rounded-lg"
              aria-label="إغلاق"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-10 px-8">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo_MANARAH_25.svg"
            alt="منارة"
            className="w-16 h-16 object-contain"
          />
          <h1
            className="text-4xl font-bold text-white"
            style={{ fontFamily: 'Amiri, serif' }}
          >
            ساعة منارة
          </h1>
        </div>

        {status === 'waiting' ? (
          <>
            <div className="bg-white rounded-3xl p-6 shadow-2xl">
              <QRCodeSVG
                value={pairUrl}
                size={280}
                bgColor="#ffffff"
                fgColor="#0f2027"
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="text-center max-w-md">
              <p className="text-2xl text-white font-semibold mb-2">
                امسح الرمز بجوالك
              </p>
              <p className="text-white/60 text-lg">
                لاختيار مسجدك وتشغيل الشاشة فوراً
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-300 text-base">في انتظار المسح...</span>
            </div>

            {/* زر التثبيت التلقائي عند توفره */}
            {canInstall && !showInstallBanner && !isInstalled && (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-emerald-200 font-semibold rounded-2xl transition-all duration-200 text-base backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                أضف للشاشة الرئيسية
              </button>
            )}

            {/* زر التثبيت اليدوي للأجهزة التي لا تدعم beforeinstallprompt */}
            {!canInstall && !isInstalled && (
              <button
                onClick={() => setShowManualInstall(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white font-semibold rounded-2xl transition-all duration-200 text-sm backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                كيفية تثبيت التطبيق
              </button>
            )}
          </>
        ) : (
          <div className="text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-3xl text-white font-bold" style={{ fontFamily: 'Amiri, serif' }}>
              {mosqueName}
            </p>
            <p className="text-white/70 text-xl">جاري تحميل الشاشة...</p>
          </div>
        )}
      </div>

      <div
        className="absolute bottom-6 text-white/30 text-sm"
        style={{ fontFamily: 'Cairo, sans-serif' }}
      >
        manarahclock.net/tv
      </div>
    </div>
  );
};

export default TVDisplayPage;
