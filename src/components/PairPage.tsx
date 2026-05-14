import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getAllMosques } from '../utils/mosqueUtils';
import { MosqueData } from '../types';
import { Search, MapPin, CheckCircle } from 'lucide-react';

const PairPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || '';

  const [mosques, setMosques] = useState<MosqueData[]>([]);
  const [filtered, setFiltered] = useState<MosqueData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MosqueData | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getAllMosques().then((data) => {
      setMosques(data);
      setFiltered(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      setFiltered(mosques);
    } else {
      setFiltered(
        mosques.filter(
          (m) =>
            m.mosqueName.toLowerCase().includes(term) ||
            m.location.city.toLowerCase().includes(term) ||
            m.location.country.toLowerCase().includes(term)
        )
      );
    }
  }, [search, mosques]);

  const handleSelect = async (mosque: MosqueData) => {
    if (!sessionId || sending) return;
    setSelected(mosque);
    setSending(true);
    try {
      await updateDoc(doc(db, 'tv_sessions', sessionId), {
        status: 'selected',
        mosqueId: mosque.id,
        mosqueName: mosque.mosqueName,
        selectedAt: serverTimestamp()
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      setSending(false);
      setSelected(null);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-center px-6">
        <div>
          <p className="text-2xl font-bold mb-3" style={{ fontFamily: 'Amiri, serif' }}>
            رابط غير صالح
          </p>
          <p className="text-white/60">
            يرجى مسح رمز QR من شاشة التلفزيون مجدداً
          </p>
        </div>
      </div>
    );
  }

  if (done && selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center px-6 gap-6">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <div>
          <p
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'Amiri, serif' }}
          >
            {selected.mosqueName}
          </p>
          <p className="text-white/60 text-lg">
            تم اختيار المسجد بنجاح، شاشة التلفزيون تتحدث الآن
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-900 text-white flex flex-col"
      style={{ fontFamily: 'Cairo, sans-serif' }}
      dir="rtl"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 pt-6 pb-4"
        style={{ background: 'linear-gradient(180deg, #111827 80%, transparent)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <img src="/logo_MANARAH_25.svg" alt="منارة" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif' }}>
              اختر مسجدك
            </h1>
            <p className="text-white/50 text-sm">ستتحدث شاشة التلفزيون فوراً</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المسجد أو المدينة..."
            className="w-full bg-white/10 border border-white/15 rounded-xl py-3 pr-10 pl-4 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-lg">لم يتم العثور على مساجد</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {filtered.map((mosque) => (
              <button
                key={mosque.id}
                onClick={() => handleSelect(mosque)}
                disabled={!!selected}
                className={`w-full text-right bg-white/8 hover:bg-white/15 border rounded-2xl p-4 transition-all duration-200 flex items-center gap-4 ${
                  selected?.id === mosque.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10'
                }`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white text-lg font-bold" style={{ fontFamily: 'Amiri, serif' }}>
                    {mosque.mosqueName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-base truncate" style={{ fontFamily: 'Amiri, serif' }}>
                    {mosque.mosqueName}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                    <p className="text-white/50 text-sm truncate">
                      {mosque.location.city}، {mosque.location.country}
                    </p>
                  </div>
                </div>
                {selected?.id === mosque.id && sending && (
                  <div className="w-5 h-5 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PairPage;
