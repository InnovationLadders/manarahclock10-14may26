import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Check, X, ChevronUp, ChevronDown, Calendar, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { getCorrectedTime, getSyncSource, setManualTime, clearStoredOffset, syncTimeFromServer, getStoredOffsetMs } from '../utils/timeCorrection';

const TimeSetup: React.FC = () => {
  const navigate = useNavigate();
  const [syncSource, setSyncSource] = useState(getSyncSource());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'success' | 'failed' | null>(null);
  const [saved, setSaved] = useState(false);

  const correctedNow = getCorrectedTime();
  const [year, setYear] = useState(correctedNow.getFullYear());
  const [month, setMonth] = useState(correctedNow.getMonth());
  const [day, setDay] = useState(correctedNow.getDate());
  const [hours, setHours] = useState(correctedNow.getHours());
  const [minutes, setMinutes] = useState(correctedNow.getMinutes());

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const adjust = useCallback((setter: React.Dispatch<React.SetStateAction<number>>, delta: number, min: number, max: number, wrap: boolean) => {
    setter(prev => {
      let next = prev + delta;
      if (wrap) {
        if (next > max) next = min;
        if (next < min) next = max;
      } else {
        next = Math.max(min, Math.min(max, next));
      }
      return next;
    });
  }, []);

  const handleSave = () => {
    setManualTime(year, month, day, hours, minutes);
    setSyncSource('manual');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSyncFromServer = async () => {
    setSyncing(true);
    setSyncResult(null);
    const ok = await syncTimeFromServer();
    if (ok) {
      setSyncSource('server');
      setSyncResult('success');
      const newNow = getCorrectedTime();
      setYear(newNow.getFullYear());
      setMonth(newNow.getMonth());
      setDay(newNow.getDate());
      setHours(newNow.getHours());
      setMinutes(newNow.getMinutes());
      setTimeout(() => setSyncResult(null), 3000);
    } else {
      setSyncResult('failed');
      setTimeout(() => setSyncResult(null), 4000);
    }
    setSyncing(false);
  };

  const handleResetOffset = () => {
    clearStoredOffset();
    setSyncSource('none');
    const deviceNow = new Date();
    setYear(deviceNow.getFullYear());
    setMonth(deviceNow.getMonth());
    setDay(deviceNow.getDate());
    setHours(deviceNow.getHours());
    setMinutes(deviceNow.getMinutes());
  };

  const handleDone = () => {
    const hasOffset = getStoredOffsetMs() !== 0 || syncSource !== 'none';
    if (hasOffset) {
      navigate(-1);
    } else {
      handleSave();
      setTimeout(() => navigate(-1), 500);
    }
  };

  const padded = (n: number) => n.toString().padStart(2, '0');
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const StepButton: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean }> = ({ onClick, children, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center w-14 h-14 bg-white/10 hover:bg-white/25 active:bg-white/35 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl border border-white/20 transition-all duration-200 text-white text-2xl font-bold"
    >
      {children}
    </button>
  );

  const ValueDisplay: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="text-5xl md:text-6xl font-bold text-white tabular-nums tracking-wider" style={{ fontFamily: 'Cairo, sans-serif' }}>
        {value}
      </div>
      <div className="text-white/50 text-sm mt-2">{label}</div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8"
      style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', fontFamily: 'Cairo, sans-serif' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-400/30">
              <Clock className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">ضبط الوقت</h1>
              <p className="text-white/60 text-sm">عند انقطاع الكهرباء، قد تعود ساعة الجهاز لتاريخ خاطئ</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all duration-200"
            title="رجوع"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Status banner */}
        <div className={`rounded-2xl p-4 mb-6 border flex items-center gap-3 ${
          syncSource === 'server'
            ? 'bg-emerald-500/15 border-emerald-400/30'
            : syncSource === 'manual'
            ? 'bg-yellow-500/15 border-yellow-400/30'
            : 'bg-red-500/15 border-red-400/30'
        }`}>
          {syncSource === 'server' ? (
            <>
              <Wifi className="w-5 h-5 text-emerald-300 shrink-0" />
              <span className="text-emerald-200 text-sm">الوقت متزامن تلقائياً من الإنترنت</span>
            </>
          ) : syncSource === 'manual' ? (
            <>
              <Clock className="w-5 h-5 text-yellow-300 shrink-0" />
              <span className="text-yellow-200 text-sm">الوقت مضبوط يدوياً — قد يحتاج إعادة ضبط دورية</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-red-300 shrink-0" />
              <span className="text-red-200 text-sm">الوقت غير مضبوط — يرجى ضبط الوقت أدناه أو الاتصال بالإنترنت</span>
            </>
          )}
        </div>

        {/* Sync button if online */}
        {isOnline && (
          <button
            onClick={handleSyncFromServer}
            disabled={syncing}
            className="w-full mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-2xl transition-all duration-200"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>جاري المزامنة...</span>
              </>
            ) : (
              <>
                <Wifi className="w-5 h-5" />
                <span>مزامنة تلقائية من الإنترنت</span>
              </>
            )}
          </button>
        )}

        {!isOnline && (
          <div className="mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/50 text-sm">
            <WifiOff className="w-5 h-5" />
            <span>لا يوجد اتصال بالإنترنت — اضبط الوقت يدوياً أدناه</span>
          </div>
        )}

        {syncResult === 'success' && (
          <div className="mb-4 px-4 py-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-200 text-sm text-center">
            تمت المزامنة بنجاح!
          </div>
        )}
        {syncResult === 'failed' && (
          <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-400/30 rounded-2xl text-red-200 text-sm text-center">
            فشلت المزامنة — يرجى المحاولة مرة أخرى أو الضبط اليدوي
          </div>
        )}

        {/* Date section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 mb-4 border border-white/10">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">التاريخ</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {/* Year */}
            <div className="flex flex-col items-center gap-2">
              <StepButton onClick={() => adjust(setYear, 1, 2000, 2100, false)}>
                <ChevronUp className="w-7 h-7" />
              </StepButton>
              <ValueDisplay value={String(year)} label="السنة" />
              <StepButton onClick={() => adjust(setYear, -1, 2000, 2100, false)}>
                <ChevronDown className="w-7 h-7" />
              </StepButton>
            </div>

            {/* Month */}
            <div className="flex flex-col items-center gap-2">
              <StepButton onClick={() => adjust(setMonth, 1, 0, 11, true)}>
                <ChevronUp className="w-7 h-7" />
              </StepButton>
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {monthNames[month]}
                </div>
                <div className="text-white/50 text-sm mt-2">الشهر</div>
              </div>
              <StepButton onClick={() => adjust(setMonth, -1, 0, 11, true)}>
                <ChevronDown className="w-7 h-7" />
              </StepButton>
            </div>

            {/* Day */}
            <div className="flex flex-col items-center gap-2">
              <StepButton onClick={() => adjust(setDay, 1, 1, daysInMonth, true)}>
                <ChevronUp className="w-7 h-7" />
              </StepButton>
              <ValueDisplay value={padded(day)} label="اليوم" />
              <StepButton onClick={() => adjust(setDay, -1, 1, daysInMonth, true)}>
                <ChevronDown className="w-7 h-7" />
              </StepButton>
            </div>
          </div>
        </div>

        {/* Time section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-white/10">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">الوقت</h2>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-8">
            {/* Hours */}
            <div className="flex flex-col items-center gap-2">
              <StepButton onClick={() => adjust(setHours, 1, 0, 23, true)}>
                <ChevronUp className="w-7 h-7" />
              </StepButton>
              <ValueDisplay value={padded(hours)} label="الساعة" />
              <StepButton onClick={() => adjust(setHours, -1, 0, 23, true)}>
                <ChevronDown className="w-7 h-7" />
              </StepButton>
            </div>

            {/* Separator */}
            <div className="text-5xl md:text-6xl font-bold text-white/30 mt-8">:</div>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-2">
              <StepButton onClick={() => adjust(setMinutes, 1, 0, 59, true)}>
                <ChevronUp className="w-7 h-7" />
              </StepButton>
              <ValueDisplay value={padded(minutes)} label="الدقيقة" />
              <StepButton onClick={() => adjust(setMinutes, -1, 0, 59, true)}>
                <ChevronDown className="w-7 h-7" />
              </StepButton>
            </div>
          </div>

          {/* AM/PM indicator */}
          <div className="text-center mt-4">
            <span className="text-white/60 text-lg">
              {hours < 12 ? 'صباحاً' : 'مساءً'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {syncSource !== 'none' && (
            <button
              onClick={handleResetOffset}
              className="flex items-center justify-center gap-2 px-5 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 rounded-2xl transition-all duration-200 font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              <span>إلغاء التصحيح</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saved}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white font-bold rounded-2xl transition-all duration-200 text-lg"
          >
            {saved ? (
              <>
                <Check className="w-6 h-6" />
                <span>تم الحفظ</span>
              </>
            ) : (
              <>
                <Check className="w-6 h-6" />
                <span>حفظ الوقت</span>
              </>
            )}
          </button>

          <button
            onClick={handleDone}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all duration-200 text-lg"
          >
            <span>تم</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSetup;
