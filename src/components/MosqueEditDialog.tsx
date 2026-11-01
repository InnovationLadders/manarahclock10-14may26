import React, { useState } from 'react';
import { X, Loader, AlertCircle, Save } from 'lucide-react';
import { MosqueData, COUNTRIES, MADHABS } from '../types';
import { getCitiesByCountry, getCityCoordinates } from '../data/cities';
import { updateMosqueDetails, MosqueDetailsUpdate } from '../utils/mosqueAdmin';

interface MosqueEditDialogProps {
  mosque: MosqueData;
  onClose: () => void;
  onSaved: (update: MosqueDetailsUpdate) => void;
}

const MosqueEditDialog: React.FC<MosqueEditDialogProps> = ({ mosque, onClose, onSaved }) => {
  const countryKey = COUNTRIES.find((c) => c.name === mosque.location.country)?.key || 'SA';
  const cityOptions = getCitiesByCountry(countryKey);
  const hasCurrentCity = cityOptions.some((c) => c.name === mosque.location.city);

  const [mosqueName, setMosqueName] = useState(mosque.mosqueName);
  const [madhab, setMadhab] = useState(mosque.madhab);
  const [city, setCity] = useState(mosque.location.city);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mosqueName.trim()) {
      setError('يرجى إدخال اسم المسجد');
      return;
    }

    const coords = getCityCoordinates(countryKey, city);
    const update: MosqueDetailsUpdate = {
      mosqueName: mosqueName.trim(),
      madhab,
      city,
      latitude: coords?.latitude ?? mosque.location.latitude,
      longitude: coords?.longitude ?? mosque.location.longitude
    };

    setSaving(true);
    setError('');
    try {
      await updateMosqueDetails(mosque.id, update);
      onSaved(update);
    } catch (err) {
      console.error('خطأ في تحديث بيانات المسجد:', err);
      setError('تعذر حفظ التغييرات. تحقق من الاتصال وحاول مرة أخرى');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={handleSave} className="w-full max-w-lg bg-gray-900 border border-white/20 rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">تعديل بيانات المسجد</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">اسم المسجد</label>
          <input type="text" value={mosqueName} onChange={(e) => setMosqueName(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">المدينة</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
            {!hasCurrentCity && <option value={mosque.location.city}>{mosque.location.city}</option>}
            {cityOptions.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">المذهب الفقهي</label>
          <select value={madhab} onChange={(e) => setMadhab(e.target.value)} className={inputClass}>
            {MADHABS.map((m) => (
              <option key={m.key} value={m.key}>{m.name}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-200" />
            <span className="text-red-200 text-sm">{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            إلغاء
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 rounded-xl transition-colors font-medium">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MosqueEditDialog;
