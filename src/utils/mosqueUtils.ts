import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MosqueData } from '../types';

// Constants for localStorage keys
const MOSQUES_CACHE_KEY = 'mosque_data_cache';
const CITIES_CACHE_KEY = 'cities_data_cache';
const CACHE_TIMESTAMP_KEY = 'mosque_cache_timestamp';
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

// دالة مساعدة لتحويل التاريخ بشكل آمن
const safeConvertToDate = (dateValue: any): Date => {
  // إذا كان null أو undefined، إرجاع التاريخ الحالي
  if (!dateValue) {
    return new Date();
  }
  
  // إذا كان كائن Date بالفعل
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // إذا كان كائن Timestamp من Firebase (يحتوي على دالة toDate)
  if (dateValue && typeof dateValue.toDate === 'function') {
    try {
      return dateValue.toDate();
    } catch (error) {
      console.warn('خطأ في تحويل Timestamp:', error);
      return new Date();
    }
  }
  
  // إذا كان كائن يحتوي على seconds و nanoseconds (Timestamp object)
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    try {
      return new Date(dateValue.seconds * 1000 + (dateValue.nanoseconds || 0) / 1000000);
    } catch (error) {
      console.warn('خطأ في تحويل كائن Timestamp:', error);
      return new Date();
    }
  }
  
  // إذا كان string أو number، محاولة تحويله إلى Date
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
      console.warn('خطأ في تحويل التاريخ من string/number:', error);
      return new Date();
    }
  }
  
  // في حالة عدم التمكن من التحويل، إرجاع التاريخ الحالي
  console.warn('نوع تاريخ غير مدعوم:', typeof dateValue, dateValue);
  return new Date();
};

// حفظ بيانات المساجد في التخزين المحلي
const saveMosquesToLocal = (mosques: MosqueData[]): void => {
  try {
    const dataToStore = {
      mosques: mosques.map(mosque => ({
        ...mosque,
        createdAt: mosque.createdAt.toISOString() // تحويل التاريخ إلى string للتخزين
      })),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(MOSQUES_CACHE_KEY, JSON.stringify(dataToStore));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
    console.log(`💾 تم حفظ ${mosques.length} مسجد في التخزين المحلي`);
  } catch (error) {
    console.error('❌ خطأ في حفظ بيانات المساجد محلياً:', error);
  }
};

// تحميل بيانات المساجد من التخزين المحلي
const loadMosquesFromLocal = (): MosqueData[] | null => {
  try {
    const cachedData = localStorage.getItem(MOSQUES_CACHE_KEY);
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cachedData || !cacheTimestamp) {
      console.log('📭 لا توجد بيانات مساجد محفوظة محلياً');
      return null;
    }

    // التحقق من انتهاء صلاحية التخزين المؤقت
    const cacheTime = new Date(cacheTimestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > CACHE_EXPIRY_HOURS) {
      console.log(`⏰ انتهت صلاحية التخزين المؤقت (${hoursDiff.toFixed(1)} ساعة)`);
      // لا نحذف البيانات، فقط نشير إلى انتهاء الصلاحية
      // سيتم استخدامها كـ fallback إذا فشل التحميل من الشبكة
    }

    const parsedData = JSON.parse(cachedData);
    const mosques: MosqueData[] = parsedData.mosques.map((mosque: any) => ({
      ...mosque,
      createdAt: safeConvertToDate(mosque.createdAt) // تحويل التاريخ من string إلى Date
    }));

    console.log(`📱 تم تحميل ${mosques.length} مسجد من التخزين المحلي`);
    return mosques;
  } catch (error) {
    console.error('❌ خطأ في تحميل بيانات المساجد من التخزين المحلي:', error);
    return null;
  }
};

// حفظ قائمة المدن في التخزين المحلي
const saveCitiesToLocal = (cities: string[]): void => {
  try {
    localStorage.setItem(CITIES_CACHE_KEY, JSON.stringify(cities));
    console.log(`💾 تم حفظ ${cities.length} مدينة في التخزين المحلي`);
  } catch (error) {
    console.error('❌ خطأ في حفظ قائمة المدن محلياً:', error);
  }
};

// تحميل قائمة المدن من التخزين المحلي
const loadCitiesFromLocal = (): string[] | null => {
  try {
    const cachedCities = localStorage.getItem(CITIES_CACHE_KEY);
    if (!cachedCities) {
      console.log('📭 لا توجد قائمة مدن محفوظة محلياً');
      return null;
    }

    const cities: string[] = JSON.parse(cachedCities);
    console.log(`📱 تم تحميل ${cities.length} مدينة من التخزين المحلي`);
    return cities;
  } catch (error) {
    console.error('❌ خطأ في تحميل قائمة المدن من التخزين المحلي:', error);
    return null;
  }
};

// جلب البيانات من الشبكة وحفظها محلياً
const fetchAndCacheMosques = async (): Promise<MosqueData[]> => {
  try {
    console.log('🌐 بدء جلب بيانات المساجد من الشبكة...');
    
    const mosquesRef = collection(db, 'mosques');
    const q = query(mosquesRef);
    const snapshot = await getDocs(q);
    
    console.log(`📊 تم العثور على ${snapshot.size} مستند في مجموعة 'mosques' من الشبكة`);
    
    const mosques: MosqueData[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      processedCount++;
      
      if (data.mosqueName && data.location?.latitude && data.location?.longitude) {
        const createdAtDate = safeConvertToDate(data.createdAt);
        
        const mosqueData: MosqueData = {
          id: doc.id,
          mosqueName: data.mosqueName,
          email: data.email || 'غير محدد',
          madhab: data.madhab || 'Shafi',
          imageUrl: data.imageUrl,
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            city: data.location.city || 'غير محدد',
            country: data.location.country || 'غير محدد'
          },
          createdAt: createdAtDate,
          isActive: true,
          hidden: data.hidden === true
        };
        
        mosques.push(mosqueData);
      } else {
        skippedCount++;
        console.warn(`❌ تم تخطي المسجد ID: ${doc.id} بسبب بيانات غير مكتملة`);
      }
    });

    // ترتيب المساجد حسب تاريخ الإنشاء (الأحدث أولاً)
    mosques.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // حفظ البيانات محلياً
    saveMosquesToLocal(mosques);
    
    console.log(`✅ تم جلب وحفظ ${mosques.length} مسجد من الشبكة`);
    return mosques;
  } catch (error) {
    console.error('💥 خطأ في جلب بيانات المساجد من الشبكة:', error);
    throw error;
  }
};

// التحقق من حالة الاتصال بالإنترنت
const isOnline = (): boolean => {
  return navigator.onLine;
};

// جلب جميع المساجد المسجلة
export const getAllMosquesForAdmin = async (): Promise<MosqueData[]> => {
  console.log('🔍 بدء جلب بيانات المساجد - حالة الاتصال:', isOnline() ? 'متصل' : 'غير متصل');
  
  // محاولة تحميل البيانات من التخزين المحلي أولاً
  const localMosques = loadMosquesFromLocal();
  
  // إذا كان هناك بيانات محلية، استخدمها فوراً
  if (localMosques && localMosques.length > 0) {
    console.log(`⚡ استخدام البيانات المحلية: ${localMosques.length} مسجد`);
    
    // إذا كان متصل بالإنترنت، حاول تحديث البيانات في الخلفية
    if (isOnline()) {
      console.log('🔄 تحديث البيانات في الخلفية...');
      fetchAndCacheMosques().catch(error => {
        console.warn('⚠️ فشل في تحديث البيانات في الخلفية:', error);
      });
    }
    
    return localMosques;
  }
  
  // إذا لم توجد بيانات محلية، حاول الجلب من الشبكة
  if (isOnline()) {
    try {
      return await fetchAndCacheMosques();
    } catch (error) {
      console.error('💥 فشل في جلب البيانات من الشبكة:', error);
      
      // كـ fallback أخير، حاول استخدام أي بيانات محلية حتى لو منتهية الصلاحية
      const fallbackMosques = loadMosquesFromLocal();
      if (fallbackMosques && fallbackMosques.length > 0) {
        console.log('🆘 استخدام البيانات المحلية المنتهية الصلاحية كـ fallback');
        return fallbackMosques;
      }
      
      return [];
    }
  } else {
    console.log('📵 غير متصل بالإنترنت - لا توجد بيانات محلية');
    return [];
  }
};

// جلب المساجد الظاهرة للعامة (بدون المساجد المخفية)
export const getAllMosques = async (): Promise<MosqueData[]> => {
  const mosques = await getAllMosquesForAdmin();
  return mosques.filter((mosque) => !mosque.hidden);
};

// النسخة القديمة من getAllMosques (للمرجع فقط - يمكن حذفها لاحقاً)
export const getAllMosquesLegacy = async (): Promise<MosqueData[]> => {
  try {
    console.log('🔍 بدء جلب بيانات المساجد من Firestore...');
    
    const mosquesRef = collection(db, 'mosques');
    // إزالة orderBy مؤقتاً لتجنب أخطاء الفهرسة
    const q = query(mosquesRef);
    const snapshot = await getDocs(q);
    
    console.log(`📊 تم العثور على ${snapshot.size} مستند في مجموعة 'mosques'`);
    
    const mosques: MosqueData[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      processedCount++;
      
      console.log(`📄 معالجة مستند المسجد ID: ${doc.id}`, {
        mosqueName: data.mosqueName,
        email: data.email,
        location: data.location,
        createdAt: data.createdAt,
        createdAtType: typeof data.createdAt,
        allData: data
      });
      
      // التحقق من وجود البيانات المطلوبة
      if (data.mosqueName && data.location?.latitude && data.location?.longitude) {
        // تحويل التاريخ بشكل آمن
        const createdAtDate = safeConvertToDate(data.createdAt);
        
        const mosqueData: MosqueData = {
          id: doc.id,
          mosqueName: data.mosqueName,
          email: data.email || 'غير محدد',
          madhab: data.madhab || 'Shafi',
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            city: data.location.city || 'غير محدد',
            country: data.location.country || 'غير محدد'
          },
          createdAt: createdAtDate,
          isActive: true // يمكن إضافة منطق للتحقق من النشاط
        };
        
        mosques.push(mosqueData);
        console.log(`✅ تمت إضافة المسجد: "${data.mosqueName}" في ${data.location.city}`, {
          createdAt: createdAtDate.toISOString(),
          originalCreatedAt: data.createdAt
        });
      } else {
        skippedCount++;
        console.warn(`❌ تم تخطي المسجد ID: ${doc.id} بسبب بيانات غير مكتملة:`, {
          mosqueName: data.mosqueName || 'مفقود',
          hasLocation: !!data.location,
          latitude: data.location?.latitude || 'مفقود',
          longitude: data.location?.longitude || 'مفقود',
          locationObject: data.location
        });
      }
    });

    // ترتيب المساجد حسب تاريخ الإنشاء (الأحدث أولاً)
    mosques.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    console.log(`📈 ملخص النتائج:`, {
      totalDocuments: snapshot.size,
      processedDocuments: processedCount,
      addedMosques: mosques.length,
      skippedDocuments: skippedCount
    });

    if (mosques.length === 0) {
      console.warn('⚠️ لم يتم العثور على أي مساجد صالحة للعرض!');
      console.log('💡 تأكد من أن مستندات المساجد تحتوي على:');
      console.log('   - mosqueName: اسم المسجد (نص)');
      console.log('   - location.latitude: خط العرض (رقم)');
      console.log('   - location.longitude: خط الطول (رقم)');
    }

    return mosques;
  } catch (error) {
    console.error('💥 خطأ في جلب بيانات المساجد:', error);
    
    // معلومات إضافية عن الخطأ
    if (error instanceof Error) {
      console.error('📝 تفاصيل الخطأ:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return [];
  }
};

// جلب المساجد حسب المدينة
export const getMosquesByCity = async (city: string): Promise<MosqueData[]> => {
  try {
    console.log(`🏙️ جلب المساجد في مدينة: ${city}`);
    
    const mosquesRef = collection(db, 'mosques');
    const q = query(
      mosquesRef, 
      where('location.city', '==', city)
    );
    const snapshot = await getDocs(q);
    
    console.log(`📊 تم العثور على ${snapshot.size} مسجد في ${city}`);
    
    const mosques: MosqueData[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      console.log(`📄 معالجة مسجد في ${city} - ID: ${doc.id}`, data);
      
      if (data.mosqueName && data.location?.latitude && data.location?.longitude) {
        // تحويل التاريخ بشكل آمن
        const createdAtDate = safeConvertToDate(data.createdAt);
        
        mosques.push({
          id: doc.id,
          mosqueName: data.mosqueName,
          email: data.email || 'غير محدد',
          madhab: data.madhab || 'Shafi',
          imageUrl: data.imageUrl,
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            city: data.location.city || 'غير محدد',
            country: data.location.country || 'غير محدد'
          },
          createdAt: createdAtDate,
          isActive: true
        });
        console.log(`✅ تمت إضافة المسجد: ${data.mosqueName}`);
      } else {
        console.warn(`❌ تم تخطي المسجد في ${city} - ID: ${doc.id} بسبب بيانات غير مكتملة`);
      }
    });

    // ترتيب المساجد حسب تاريخ الإنشاء (الأحدث أولاً)
    mosques.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    console.log(`📈 تم جلب ${mosques.length} مسجد صالح من ${city}`);
    return mosques;
  } catch (error) {
    console.error(`💥 خطأ في جلب المساجد حسب المدينة (${city}):`, error);
    return [];
  }
};

// الحصول على قائمة المدن المتاحة
export const getAvailableCities = async (): Promise<string[]> => {
  try {
    console.log('🌍 جلب قائمة المدن المتاحة...');
    
    // محاولة تحميل المدن من التخزين المحلي أولاً
    const localCities = loadCitiesFromLocal();
    
    const mosques = await getAllMosques();
    const cities = [...new Set(mosques.map(mosque => mosque.location.city))];
    const validCities = cities.filter(city => city && city !== 'غير محدد').sort();
    
    // حفظ المدن محلياً
    saveCitiesToLocal(validCities);
    
    console.log(`🏙️ تم العثور على ${validCities.length} مدينة:`, validCities);
    
    return validCities;
  } catch (error) {
    console.error('💥 خطأ في جلب قائمة المدن:', error);
    
    // كـ fallback، حاول استخدام المدن المحفوظة محلياً
    const fallbackCities = loadCitiesFromLocal();
    if (fallbackCities && fallbackCities.length > 0) {
      console.log('🆘 استخدام قائمة المدن المحفوظة محلياً كـ fallback');
      return fallbackCities;
    }
    
    return [];
  }
};

// دالة لمسح التخزين المؤقت المحلي
export const clearLocalCache = (): void => {
  try {
    localStorage.removeItem(MOSQUES_CACHE_KEY);
    localStorage.removeItem(CITIES_CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('🗑️ تم مسح التخزين المؤقت المحلي للمساجد');
  } catch (error) {
    console.error('❌ خطأ في مسح التخزين المؤقت:', error);
  }
};

// دالة للحصول على معلومات التخزين المؤقت
export const getCacheInfo = (): { hasCache: boolean; cacheAge: number; mosquesCount: number } => {
  try {
    const cachedData = localStorage.getItem(MOSQUES_CACHE_KEY);
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cachedData || !cacheTimestamp) {
      return { hasCache: false, cacheAge: 0, mosquesCount: 0 };
    }

    const cacheTime = new Date(cacheTimestamp);
    const now = new Date();
    const cacheAge = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60); // بالساعات
    
    const parsedData = JSON.parse(cachedData);
    const mosquesCount = parsedData.mosques ? parsedData.mosques.length : 0;
    
    return {
      hasCache: true,
      cacheAge,
      mosquesCount
    };
  } catch (error) {
    console.error('❌ خطأ في الحصول على معلومات التخزين المؤقت:', error);
    return { hasCache: false, cacheAge: 0, mosquesCount: 0 };
  }
};