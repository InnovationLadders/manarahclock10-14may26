import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { COUNTRIES, COUNTRY_CALCULATION_METHOD_MAP, COUNTRY_MADHAB_MAP } from '../types';
import { getCitiesByCountry } from '../data/cities';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Monitor, Smartphone, CheckCircle } from 'lucide-react';

type Step = 'orientation' | 'info' | 'auth' | 'done';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('orientation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [displayMode, setDisplayMode] = useState<'landscape' | 'portrait'>('landscape');
  const [mosqueName, setMosqueName] = useState('');
  const [country, setCountry] = useState('المملكة العربية السعودية');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState(24.7136);
  const [longitude, setLongitude] = useState(46.6753);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const countryKey = COUNTRIES.find((c) => c.name === country)?.key || 'SA';
  const cities = getCitiesByCountry(countryKey);

  const handleCountryChange = (val: string) => {
    const key = COUNTRIES.find((c) => c.name === val)?.key || 'SA';
    const newCities = getCitiesByCountry(key);
    setCountry(val);
    if (newCities.length > 0) {
      setCity(newCities[0].name);
      setLatitude(newCities[0].latitude);
      setLongitude(newCities[0].longitude);
    } else {
      setCity('');
    }
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    const found = cities.find((c) => c.name === val);
    if (found) {
      setLatitude(found.latitude);
      setLongitude(found.longitude);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!email || !password) return;
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const calcMethod = COUNTRY_CALCULATION_METHOD_MAP[countryKey] || 'MuslimWorldLeague';
      const madhab = COUNTRY_MADHAB_MAP[countryKey] || 'Shafi';

      const mosqueData = {
        ...DEFAULT_SETTINGS,
        mosqueName: mosqueName || 'مسجد',
        location: { latitude, longitude, city, country },
        email,
        displayMode,
        calculationMethod: calcMethod,
        madhab,
        createdAt: serverTimestamp(),
        isActive: true,
        accountStatus: 'trial',
        trialStartedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'mosques', uid), mosqueData);
      setStep('done');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('هذا البريد الإلكتروني مستخدم بالفعل');
          break;
        case 'auth/invalid-email':
          setError('البريد الإلكتروني غير صالح');
          break;
        case 'auth/weak-password':
          setError('كلمة المرور ضعيفة جداً');
          break;
        default:
          setError('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-colors';
  const labelClass = 'block text-white/80 text-sm font-medium mb-1.5';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
        fontFamily: 'Cairo, sans-serif'
      }}
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo_MANARAH_25.svg" alt="منارة" className="w-14 h-14 object-contain mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Amiri, serif' }}>
            تسجيل مسجدك
          </h1>
          <p className="text-white/50 mt-1">ابدأ التجربة المجانية لمدة 3 أيام</p>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {(['orientation', 'info', 'auth'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === s
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : (['orientation', 'info', 'auth'] as Step[]).indexOf(step) > i
                      ? 'bg-emerald-500/40 text-emerald-300'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {(['orientation', 'info', 'auth'] as Step[]).indexOf(step) > i ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && <div className="w-10 h-0.5 bg-white/20 rounded" />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-7 border border-white/15 shadow-2xl">

          {/* Step 1: Orientation */}
          {step === 'orientation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">كيف ستُركَّب الشاشة؟</h2>
                <p className="text-white/50 text-sm">يمكن تغيير هذا لاحقاً من الإعدادات</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDisplayMode('landscape')}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                    displayMode === 'landscape'
                      ? 'border-emerald-400 bg-emerald-500/15'
                      : 'border-white/15 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {displayMode === 'landscape' && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {/* Landscape screen illustration */}
                  <div className="w-16 h-10 border-2 border-current rounded-md flex items-center justify-center relative"
                    style={{ color: displayMode === 'landscape' ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
                    <div className="w-full h-full p-1 flex flex-col gap-0.5">
                      <div className="h-1.5 bg-current rounded opacity-60" />
                      <div className="flex gap-0.5 flex-1">
                        <div className="w-4 bg-current rounded opacity-40" />
                        <div className="flex-1 bg-current rounded opacity-30" />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 w-4 h-1 bg-current rounded" />
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${displayMode === 'landscape' ? 'text-emerald-300' : 'text-white/70'}`}>
                      أفقي
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">تلفزيون عادي</p>
                  </div>
                </button>

                <button
                  onClick={() => setDisplayMode('portrait')}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                    displayMode === 'portrait'
                      ? 'border-emerald-400 bg-emerald-500/15'
                      : 'border-white/15 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {displayMode === 'portrait' && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {/* Portrait screen illustration */}
                  <div className="w-10 h-16 border-2 border-current rounded-md flex items-center justify-center relative"
                    style={{ color: displayMode === 'portrait' ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
                    <div className="w-full h-full p-1 flex flex-col gap-0.5">
                      <div className="h-2 bg-current rounded opacity-60" />
                      <div className="flex-1 bg-current rounded opacity-30" />
                      <div className="flex gap-0.5">
                        <div className="flex-1 h-2 bg-current rounded opacity-50" />
                        <div className="flex-1 h-2 bg-current rounded opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${displayMode === 'portrait' ? 'text-emerald-300' : 'text-white/70'}`}>
                      طولي
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">شاشة عمودية</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setStep('info')}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Mosque Info */}
          {step === 'info' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">معلومات المسجد</h2>

              <div>
                <label className={labelClass}>اسم المسجد</label>
                <input
                  type="text"
                  value={mosqueName}
                  onChange={(e) => setMosqueName(e.target.value)}
                  className={inputClass}
                  placeholder="مسجد الهدى"
                />
              </div>

              <div>
                <label className={labelClass}>الدولة</label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className={inputClass + ' cursor-pointer'}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.key} value={c.name} className="bg-gray-800">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>المدينة</label>
                {cities.length > 0 ? (
                  <select
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className={inputClass + ' cursor-pointer'}
                  >
                    {cities.map((c) => (
                      <option key={c.name} value={c.name} className="bg-gray-800">
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                    placeholder="أدخل اسم المدينة"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('orientation')}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (!mosqueName.trim()) {
                      setError('يرجى إدخال اسم المسجد');
                      return;
                    }
                    setError('');
                    setStep('auth');
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* Step 3: Auth */}
          {step === 'auth' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">بيانات الحساب</h2>

              <div>
                <label className={labelClass}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="mosque@example.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label className={labelClass}>كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass + ' pl-10'}
                    placeholder="6 أحرف على الأقل"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setError(''); setStep('info'); }}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading || !email || !password}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>إنشاء الحساب</span>
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Amiri, serif' }}>
                  مرحباً بك في منارة!
                </h2>
                <p className="text-white/60">
                  تم إنشاء حساب مسجدك. لديك 3 أيام تجربة مجانية.
                </p>
              </div>
              <button
                onClick={() => navigate('/display')}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors"
              >
                الدخول للشاشة
              </button>
            </div>
          )}
        </div>

        {step !== 'done' && (
          <p className="text-center text-white/40 text-sm mt-6">
            لديك حساب بالفعل؟{' '}
            <Link to="/display" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              تسجيل الدخول
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
