import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const TVDisplayPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(() => {
    const id = `tv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return id;
  });
  const [status, setStatus] = useState<'waiting' | 'selected'>('waiting');
  const [mosqueName, setMosqueName] = useState('');
  const unsubRef = useRef<(() => void) | null>(null);

  const pairUrl = `${window.location.origin}/pair?session=${sessionId}`;

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
