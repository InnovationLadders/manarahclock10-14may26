import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useCurrentTime } from './hooks/useTime';
import { getScreenState } from './utils/prayerCalculations';
import MainDisplay from './components/MainDisplay';
import Settings from './components/Settings';
import Login from './components/Login';
import PrayerInProgressScreen from './components/PrayerInProgressScreen';
import PostPrayerDhikrScreen from './components/PostPrayerDhikrScreen';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { usePWAInstall } from './hooks/usePWAInstall';
import { checkAdminStatus } from './utils/adminUtils';
import { Settings as SettingsIcon, Maximize, Minimize, Download } from 'lucide-react';

const MosquesLandingPage = lazy(() => import('./components/MosquesLandingPage'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const TVDisplayPage = lazy(() => import('./components/TVDisplayPage'));
const PairPage = lazy(() => import('./components/PairPage'));
const RegisterPage = lazy(() => import('./components/RegisterPage'));

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 1024;
};

const isTouchDevice = () =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const MainApp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const { updateAvailable, reloadApp, clearCache } = usePWAUpdate();
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [showControls, setShowControls] = useState(true);
  const [manualScreenOverride, setManualScreenOverride] = useState<'mainDisplay' | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const currentTime = useCurrentTime();
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const mosqueId = params.mosqueId || searchParams.get('mosqueId');

  useEffect(() => {
    if (!mosqueId) {
      navigate('/', { replace: true });
    }
  }, [mosqueId, navigate]);

  // مراقبة تغيير حجم الشاشة لإعادة حساب الـ scale
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // manifest ديناميكي مرتبط برابط المسجد المحدد
  useEffect(() => {
    if (!mosqueId) return;
    const startUrl = `${window.location.origin}/mosque/${mosqueId}`;
    const manifest = {
      name: 'ساعة منارة - ساعة المسجد الذكية لأوقات الصلاة',
      short_name: 'ساعة منارة',
      description: 'ساعة منارة - ساعة المسجد الذكية والتلفزيونية لعرض أوقات الصلاة',
      theme_color: '#059669',
      background_color: '#0f2027',
      display: 'fullscreen',
      display_override: ['fullscreen', 'standalone', 'minimal-ui'],
      orientation: 'any',
      lang: 'ar',
      dir: 'rtl',
      start_url: startUrl,
      scope: '/',
      prefer_related_applications: false,
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    const prev = link.href;
    link.href = url;
    return () => {
      URL.revokeObjectURL(url);
      if (link) link.href = prev;
    };
  }, [mosqueId]);
  
  const { prayerTimes, settings, isFriday, mosqueFound, refreshSettings, loading } = usePrayerTimes(user, mosqueId || undefined);

  // تحديد حالة الشاشة التلقائية
  const automaticScreenState = (prayerTimes && settings) ? getScreenState(prayerTimes, settings, isFriday) : { state: 'mainDisplay' as const };
  
  // تحديد حالة الشاشة الفعلية (مع مراعاة التجاوز اليدوي)
  const effectiveScreenState = manualScreenOverride ? { state: manualScreenOverride } : automaticScreenState;

  // دالة للخروج من الشاشات الخاصة والعودة للشاشة الرئيسية
  const handleExitSpecialScreen = () => {
    // تعيين تجاوز يدوي للعودة للشاشة الرئيسية
    setManualScreenOverride('mainDisplay');
  };

  // تحديد وضع العرض
  const isPortrait = settings.displayMode === 'portrait';

  useEffect(() => {
    // مراقبة حالة المصادقة
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Check if user is admin
        const isAdmin = await checkAdminStatus(user);
        setUserIsAdmin(isAdmin);
      } else {
        setUserIsAdmin(false);
      }
      
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // مراقبة تغييرات وضع ملء الشاشة
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // مراقبة حالة الشاشة التلقائية لإلغاء التجاوز اليدوي عند الحاجة
  useEffect(() => {
    // إذا كان هناك تجاوز يدوي وأصبحت الحالة التلقائية هي الشاشة الرئيسية
    // فهذا يعني أن الفترة الخاصة انتهت طبيعياً، يمكن إلغاء التجاوز اليدوي
    if (manualScreenOverride === 'mainDisplay' && automaticScreenState.state === 'mainDisplay') {
      setManualScreenOverride(null);
    }
  }, [automaticScreenState.state, manualScreenOverride]);

  // إخفاء الأزرار تلقائياً بعد 5 ثوانٍ من التحميل
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    return () => clearTimeout(initialTimer);
  }, []);

  // إظهار الأزرار عند تمرير الماوس
  const handleMouseEnter = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setShowControls(true);
  };

  // إخفاء الأزرار بعد 30 ثانية من مغادرة الماوس
  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 30000);
  };

  // إظهار الأزرار عند اللمس على الجوال
  const handleTouchStart = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setShowControls(true);
    hideTimer.current = setTimeout(() => setShowControls(false), 5000);
  };

  const handleSettingsClick = () => {
    // Always show login page when settings is clicked
    setShowLogin(true);
  };

  const handleLoginSuccess = (user: User) => {
    setShowLogin(false);
    setShowSettings(true);
  };

  const handleAdminLoginSuccess = (user: User) => {
    setUser(user);
    setUserIsAdmin(true);
    navigate('/admin-panel');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowSettings(false);
      setUserIsAdmin(false);
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // الدخول في وضع ملء الشاشة
        await document.documentElement.requestFullscreen();
      } else {
        // الخروج من وضع ملء الشاشة
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('خطأ في تبديل وضع ملء الشاشة:', error);
    }
  };

  // عرض شاشة تسجيل الدخول
  if (showLogin) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setShowLogin(false)}
      />
    );
  }

  // عرض شاشة الإعدادات
  if (showSettings) {
    return (
      <Settings
        onBack={() => setShowSettings(false)}
        onRefreshSettings={refreshSettings}
        updateAvailable={updateAvailable}
        onUpdate={reloadApp}
        onClearCache={clearCache}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // إذا لم يكن هناك mosqueId، لا تعرض شيئاً (سيتم التوجيه للصفحة الرئيسية)
  if (!mosqueId) {
    return null;
  }

  // عرض شاشة تحميل جميلة أثناء تحميل البيانات
  if (loading || !prayerTimes || !settings) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        {/* خلفية إسلامية متحركة */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white/30 rotate-45 rounded-lg animate-spin-slow"></div>
          <div className="absolute top-32 right-20 w-24 h-24 border-4 border-white/20 rotate-12 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-32 w-40 h-40 border-4 border-white/25 -rotate-12 rounded-lg animate-spin-slow"></div>
          <div className="absolute bottom-40 right-16 w-28 h-28 border-4 border-white/20 rotate-45 rounded-full animate-pulse"></div>
        </div>

        <div className="text-center z-10 max-w-md mx-auto p-8">
          {/* الشعار */}
          <div className="mb-8 flex justify-center">
            <img
              src="/logo_MANARAH_25.svg"
              alt="شعار منارة"
              className="w-24 h-24 object-contain drop-shadow-2xl animate-pulse"
            />
          </div>

          {/* دائرة التحميل */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-8 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-t-white border-r-white/50 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>

          {/* رسالة التحميل */}
          <h2 className="text-3xl font-bold mb-4 drop-shadow-2xl animate-pulse" style={{ fontFamily: 'Amiri, serif' }}>
            جاري تحميل بيانات المسجد
          </h2>

          <p className="text-xl text-emerald-200 mb-6 drop-shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
            يرجى الانتظار قليلاً...
          </p>

          {/* نقاط متحركة */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>

          {/* زر العودة للطوارئ */}
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto text-white backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>العودة للصفحة الرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  // عرض شاشة الصلاة
  if (effectiveScreenState.state === 'prayerInProgress') {
    return (
      <PrayerInProgressScreen
        currentTime={currentTime}
        settings={settings}
        onExit={handleExitSpecialScreen}
      />
    );
  }

  // عرض شاشة أذكار ما بعد الصلاة
  if (effectiveScreenState.state === 'postPrayerDhikr') {
    return (
      <PostPrayerDhikrScreen
        settings={settings}
        remainingTime={automaticScreenState.remainingTime || 0}
        onExit={handleExitSpecialScreen}
      />
    );
  }

  const isMobile = isMobileDevice();
  const isTouch = isTouchDevice();

  // يعيد أبعاد وتحويلات حاوية شاشة التلفزيون لمحاكاتها على الجوال
  const getTVCanvasStyle = (): React.CSSProperties => {
    const vw = windowSize.w;
    const vh = windowSize.h;
    const isDeviceLandscape = vw > vh;

    if (!isMobile) {
      // سطح المكتب: حاوية عادية تملأ الشاشة
      return { width: '100vw', height: '100vh' };
    }

    if (isPortrait) {
      // شاشة المسجد رأسية (9:16)
      if (!isDeviceLandscape) {
        // جوال رأسي + مسجد رأسي: يملأ الشاشة بشكل طبيعي
        return { width: '100vw', height: '100vh' };
      } else {
        // جوال أفقي + مسجد رأسي: عرض شريط رأسي مُمركز
        const canvasW = Math.round(vh * 9 / 16);
        return {
          position: 'fixed',
          top: 0,
          left: Math.round((vw - canvasW) / 2),
          width: canvasW,
          height: vh,
        };
      }
    } else {
      // شاشة المسجد أفقية (16:9)
      if (isDeviceLandscape) {
        // جوال أفقي + مسجد أفقي: يملأ الشاشة بشكل طبيعي
        return { width: '100vw', height: '100vh' };
      } else {
        // جوال رأسي + مسجد أفقي:
        // نضع canvas بأبعاد (vh × vw) ثم ندوّره 90° فيصبح (vw × vh) بصرياً
        // المركز: (vw/2, vh/2) — يُحسب من top/left + نصف الأبعاد
        return {
          position: 'fixed',
          width: vh,
          height: vw,
          top: Math.round((vh - vw) / 2),
          left: Math.round((vw - vh) / 2),
          transform: 'rotate(90deg)',
          transformOrigin: 'center center',
        };
      }
    }
  };

  const canvasStyle = getTVCanvasStyle();

  // هل يحتاج الجهاز خلفية سوداء (letterbox)؟
  const needsLetterbox = isMobile && (
    (isPortrait && windowSize.w > windowSize.h) ||
    (!isPortrait && windowSize.w < windowSize.h)
  );

  return (
    <>
      {/* خلفية سوداء لـ letterbox عند الحاجة */}
      {needsLetterbox && (
        <div className="fixed inset-0 bg-black z-0" />
      )}

      {/* حاوية شاشة التلفزيون */}
      <div
        className="relative overflow-hidden"
        style={{ ...canvasStyle, zIndex: 1 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
      >
        <MainDisplay user={user} mosqueFound={mosqueFound} mosqueId={mosqueId} />
      </div>

      {/* أزرار التحكم — خارج حاوية الـ transform لتبقى على viewport مباشرة */}
      <div
        className={`fixed flex gap-3 z-50 transition-all duration-500 ${
          isPortrait
            ? 'top-24 right-8 -rotate-90 origin-top-right'
            : 'top-4 right-4'
        } ${
          showControls
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* زر ملء الشاشة */}
        <button
          onClick={toggleFullscreen}
          className={`p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full border border-white/20 transition-all duration-300 ${
            isPortrait ? 'rotate-90' : ''
          }`}
          title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
        >
          {isFullscreen ? (
            <Minimize className={`w-6 h-6 text-white ${isPortrait ? '-rotate-90' : ''}`} />
          ) : (
            <Maximize className={`w-6 h-6 text-white ${isPortrait ? '-rotate-90' : ''}`} />
          )}
        </button>

        {/* زر تثبيت التطبيق على سطح المكتب (يخضع لمنطق الإخفاء) */}
        {canInstall && !isInstalled && !isTouch && (
          <button
            onClick={() => triggerInstall()}
            className={`p-3 bg-emerald-600/40 hover:bg-emerald-600/70 backdrop-blur-sm rounded-full border border-emerald-400/40 transition-all duration-300 ${
              isPortrait ? 'rotate-90' : ''
            }`}
            title="تثبيت التطبيق على الجهاز"
          >
            <Download className={`w-6 h-6 text-white ${isPortrait ? '-rotate-90' : ''}`} />
          </button>
        )}

        {/* زر الإعدادات */}
        <button
          onClick={handleSettingsClick}
          className={`p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full border border-white/20 transition-all duration-300 ${
            isPortrait ? 'rotate-90' : ''
          }`}
          title={user ? 'الإعدادات' : 'تسجيل الدخول'}
        >
          <SettingsIcon className={`w-6 h-6 text-white ${isPortrait ? '-rotate-90' : ''}`} />
        </button>
      </div>

      {/* زر تثبيت التطبيق على الجوال — دائم الظهور في أسفل الشاشة */}
      {canInstall && !isInstalled && isTouch && (
        <button
          onClick={() => triggerInstall()}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-2xl border border-emerald-400/50 shadow-2xl transition-all duration-300 text-white"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          <Download className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">ثبّت التطبيق على جهازك</span>
        </button>
      )}
    </>
  );
};

function App() {
  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-medium text-gray-700">جاري التحميل...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<MosquesLandingPage />} />
          <Route path="/tv" element={<TVDisplayPage />} />
          <Route path="/pair" element={<PairPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-login" element={<AdminLogin onLoginSuccess={(user) => window.location.href = '/admin-panel'} onBack={() => window.location.href = '/'} />} />
          <Route path="/admin-panel" element={<AdminPanel user={null} onLogout={() => { signOut(auth); window.location.href = '/'; }} onBack={() => window.location.href = '/'} />} />
          <Route path="/display" element={<MainApp />} />
          <Route path="/mosque/:mosqueId" element={<MainApp />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;