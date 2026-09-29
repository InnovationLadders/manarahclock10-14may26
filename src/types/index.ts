export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface BackgroundItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  objectFit: 'cover' | 'contain' | 'fill';
  objectPosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export interface LayoutSettings {
  xOffset: number;
  yOffset: number;
  scale: number;
}

export interface FontColors {
  mosqueName: string;
  mainTime: string;
  gregorianDate: string;
  hijriDate: string;
  countdownType: string;
  prayerName: string;
  countdownTimer: string;
  prayerNamesBar: string;
  adhanTimes: string;
  iqamahTimes: string;
  duasTitle: string;
  duasText: string;
  announcementsTitle: string;
  announcementsText: string;
}

export interface Settings {
  mosqueName: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    manualCoordinates?: boolean;
    timezone?: string;
  };
  calculationMethod: 'UmmAlQura' | 'MuslimWorldLeague' | 'Egyptian' | 'Karachi' | 'NorthAmerica' | 'Dubai' | 'Kuwait' | 'Qatar' | 'Singapore' | 'Turkey' | 'Tehran' | 'MoonsightingCommittee' | 'Gulf' | 'France' | 'Russia' | 'Tunisia' | 'Algeria' | 'Morocco' | 'Portugal' | 'Jordan' | 'Jakim' | 'Kemenag';
  madhab: 'Shafi' | 'Hanafi' | 'Maliki';
  backgrounds: BackgroundItem[];
  rotateBackgrounds: boolean;
  rotationInterval: number; // بالثواني
  selectedBackgroundId: string | null;
  displayMode: 'landscape' | 'portrait';
  screenType: 'dawahScreen' | 'prayerTimes';
  fontSettings: {
    mosqueName: {
      fontFamily: string;
      fontWeight: string;
    };
    mainTime: {
      fontFamily: string;
      fontWeight: string;
    };
    gregorianDate: {
      fontFamily: string;
      fontWeight: string;
    };
    hijriDate: {
      fontFamily: string;
      fontWeight: string;
    };
    prayerTimes: {
      fontFamily: string;
      fontWeight: string;
    };
    prayerNames: {
      fontFamily: string;
      fontWeight: string;
    };
    countdown: {
      fontFamily: string;
      fontWeight: string;
    };
    duasFontSize: number;
    duasFontFamily: string;
    duasFontWeight: string;
    autoAdjustDuasFontSize: boolean;
    announcementsFontSize: number;
    announcementsFontFamily: string;
    announcementsFontWeight: string;
    autoAdjustAnnouncementsFontSize: boolean;
    postPrayerDhikrFontSize: number;
    postPrayerDhikrFontFamily: string;
    postPrayerDhikrFontWeight: string;
    autoAdjustPostPrayerDhikrFontSize: boolean;
  };
  colors: FontColors;
  layout: {
    mosqueName: LayoutSettings;
    mainTime: LayoutSettings;
    gregorianHijriDate: LayoutSettings;
    mainClock: LayoutSettings;
    countdownCircle: LayoutSettings;
    duasPanel: LayoutSettings;
    announcementsPanel: LayoutSettings;
    prayerTimesBar: LayoutSettings;
  };
  iqamahDelays: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  prayerTimeAdjustments: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  duas: string[];
  announcements: string[];
  enablePrayerInProgressScreen: boolean;
  prayerDuration: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  enablePostPrayerDhikrScreen: boolean;
  postPrayerDhikrDuration: number;
  postPrayerDhikrText: string;
  postPrayerDhikrScreenHeight: number;
  showDuasPanel: boolean;
  showAnnouncementsPanel: boolean;
  fridaySettings: {
    enabled: boolean;
    firstAdhanAdjustment: number;
    secondAdhanGap: number;
    prayerDuration: number;
  };
}

export interface MosqueData {
  id: string;
  mosqueName: string;
  email: string;
  madhab: string;
  imageUrl?: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    manualCoordinates?: boolean;
    timezone?: string;
  };
  createdAt: Date;
  isActive: boolean;
}

export interface NextPrayer {
  name: string;
  time: Date;
  iqamahTime: Date;
  isIqamah: boolean;
}

export const SAUDI_CITIES = [
  { name: 'الرياض', latitude: 24.7136, longitude: 46.6753 },
  { name: 'جدة', latitude: 21.4858, longitude: 39.1925 },
  { name: 'مكة المكرمة', latitude: 21.3891, longitude: 39.8579 },
  { name: 'المدينة المنورة', latitude: 24.5247, longitude: 39.5692 },
  { name: 'الدمام', latitude: 26.4207, longitude: 50.0888 },
  { name: 'الطائف', latitude: 21.2703, longitude: 40.4158 },
  { name: 'تبوك', latitude: 28.3998, longitude: 36.5700 },
  { name: 'بريدة', latitude: 26.3260, longitude: 43.9750 },
  { name: 'خميس مشيط', latitude: 18.3000, longitude: 42.7300 },
  { name: 'حائل', latitude: 27.5114, longitude: 41.6900 }
];

export const COUNTRIES = [
  { key: 'SA', name: 'المملكة العربية السعودية', timezone: 'Asia/Riyadh' },
  { key: 'AE', name: 'الإمارات العربية المتحدة', timezone: 'Asia/Dubai' },
  { key: 'KW', name: 'الكويت', timezone: 'Asia/Kuwait' },
  { key: 'QA', name: 'قطر', timezone: 'Asia/Qatar' },
  { key: 'BH', name: 'البحرين', timezone: 'Asia/Bahrain' },
  { key: 'OM', name: 'عُمان', timezone: 'Asia/Muscat' },
  { key: 'JO', name: 'الأردن', timezone: 'Asia/Amman' },
  { key: 'LB', name: 'لبنان', timezone: 'Asia/Beirut' },
  { key: 'SY', name: 'سوريا', timezone: 'Asia/Damascus' },
  { key: 'IQ', name: 'العراق', timezone: 'Asia/Baghdad' },
  { key: 'EG', name: 'مصر', timezone: 'Africa/Cairo' },
  { key: 'LY', name: 'ليبيا', timezone: 'Africa/Tripoli' },
  { key: 'TN', name: 'تونس', timezone: 'Africa/Tunis' },
  { key: 'DZ', name: 'الجزائر', timezone: 'Africa/Algiers' },
  { key: 'MA', name: 'المغرب', timezone: 'Africa/Casablanca' },
  { key: 'SD', name: 'السودان', timezone: 'Africa/Khartoum' },
  { key: 'YE', name: 'اليمن', timezone: 'Asia/Aden' },
  { key: 'TR', name: 'تركيا', timezone: 'Europe/Istanbul' },
  { key: 'MY', name: 'ماليزيا', timezone: 'Asia/Kuala_Lumpur' },
  { key: 'ID', name: 'إندونيسيا', timezone: 'Asia/Jakarta' },
  { key: 'PK', name: 'باكستان', timezone: 'Asia/Karachi' },
  { key: 'BD', name: 'بنغلاديش', timezone: 'Asia/Dhaka' },
  { key: 'IN', name: 'الهند', timezone: 'Asia/Kolkata' },
  { key: 'US', name: 'الولايات المتحدة الأمريكية', timezone: 'America/New_York' },
  { key: 'CA', name: 'كندا', timezone: 'America/Toronto' },
  { key: 'GB', name: 'المملكة المتحدة', timezone: 'Europe/London' },
  { key: 'FR', name: 'فرنسا', timezone: 'Europe/Paris' },
  { key: 'DE', name: 'ألمانيا', timezone: 'Europe/Berlin' },
  { key: 'AU', name: 'أستراليا', timezone: 'Australia/Sydney' },
  { key: 'PT', name: 'البرتغال', timezone: 'Europe/Lisbon' },
  { key: 'RU', name: 'روسيا', timezone: 'Europe/Moscow' },
  { key: 'IR', name: 'إيران', timezone: 'Asia/Tehran' },
  { key: 'NG', name: 'نيجيريا', timezone: 'Africa/Lagos' },
  { key: 'ZA', name: 'جنوب إفريقيا', timezone: 'Africa/Johannesburg' },
  { key: 'OTHER', name: 'أخرى', timezone: 'Asia/Riyadh' }
];

export const CALCULATION_METHODS = [
  { key: 'UmmAlQura', name: 'أم القرى (السعودية)', region: 'السعودية' },
  { key: 'MuslimWorldLeague', name: 'رابطة العالم الإسلامي', region: 'عالمي - أوروبا وآسيا' },
  { key: 'Egyptian', name: 'الهيئة المصرية العامة للمساحة', region: 'مصر وإفريقيا' },
  { key: 'Karachi', name: 'جامعة العلوم الإسلامية، كراتشي', region: 'باكستان وبنغلاديش والهند' },
  { key: 'NorthAmerica', name: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)', region: 'أمريكا الشمالية' },
  { key: 'Dubai', name: 'دبي', region: 'الإمارات' },
  { key: 'Kuwait', name: 'وزارة الأوقاف الكويتية', region: 'الكويت' },
  { key: 'Qatar', name: 'وزارة الأوقاف القطرية', region: 'قطر' },
  { key: 'Singapore', name: 'المجلس الديني الإسلامي - سنغافورة', region: 'سنغافورة' },
  { key: 'Turkey', name: 'رئاسة الشؤون الدينية التركية (Diyanet)', region: 'تركيا' },
  { key: 'Tehran', name: 'معهد الجيوفيزياء - طهران', region: 'إيران' },
  { key: 'MoonsightingCommittee', name: 'لجنة رصد الهلال', region: 'أمريكا الشمالية وأوروبا' },
  { key: 'Gulf', name: 'منطقة الخليج', region: 'البحرين وعُمان ودول الخليج' },
  { key: 'France', name: 'الاتحاد الإسلامي الفرنسي (UOIF)', region: 'فرنسا وأوروبا' },
  { key: 'Russia', name: 'الإدارة الروحية لمسلمي روسيا', region: 'روسيا' },
  { key: 'Tunisia', name: 'تونس', region: 'تونس' },
  { key: 'Algeria', name: 'الجزائر', region: 'الجزائر' },
  { key: 'Morocco', name: 'المغرب', region: 'المغرب' },
  { key: 'Portugal', name: 'الجالية الإسلامية - البرتغال', region: 'البرتغال' },
  { key: 'Jordan', name: 'وزارة الأوقاف الأردنية', region: 'الأردن' },
  { key: 'Jakim', name: 'JAKIM - ماليزيا', region: 'ماليزيا' },
  { key: 'Kemenag', name: 'KEMENAG - إندونيسيا', region: 'إندونيسيا' }
];

export const MADHABS = [
  { key: 'Shafi', name: 'الشافعي' },
  { key: 'Hanafi', name: 'الحنفي' },
  { key: 'Maliki', name: 'المالكي' }
];

export const BACKGROUND_IMAGES = [
  {
    name: 'المصباح',
    url: 'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
  },
  {
    name: 'الغروب',
    url: 'https://images.pexels.com/photos/4668228/pexels-photo-4668228.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
  },
];

export const FONT_FAMILIES = [
  { key: 'Amiri', name: 'أميري (Amiri)' },
  { key: 'Cairo', name: 'القاهرة (Cairo)' },
  { key: 'Tajawal', name: 'تجوال (Tajawal)' },
  { key: 'Almarai', name: 'المرعي (Almarai)' }
];

export const FONT_WEIGHTS = [
  { key: '300', name: 'خفيف (Light)' },
  { key: '400', name: 'عادي (Regular)' },
  { key: '500', name: 'متوسط (Medium)' },
  { key: '600', name: 'نصف ثقيل (Semi-Bold)' },
  { key: '700', name: 'ثقيل (Bold)' },
  { key: '800', name: 'ثقيل جداً (Extra Bold)' },
  { key: '900', name: 'أثقل (Black)' }
];

export const COUNTRY_CALCULATION_METHOD_MAP: Record<string, string> = {
  'SA': 'UmmAlQura',
  'AE': 'Dubai',
  'KW': 'Kuwait',
  'QA': 'Qatar',
  'BH': 'Gulf',
  'OM': 'Gulf',
  'JO': 'Jordan',
  'LB': 'MuslimWorldLeague',
  'SY': 'MuslimWorldLeague',
  'IQ': 'MuslimWorldLeague',
  'EG': 'Egyptian',
  'LY': 'Egyptian',
  'TN': 'Tunisia',
  'DZ': 'Algeria',
  'MA': 'Morocco',
  'SD': 'Egyptian',
  'YE': 'UmmAlQura',
  'TR': 'Turkey',
  'MY': 'Jakim',
  'ID': 'Kemenag',
  'PK': 'Karachi',
  'BD': 'Karachi',
  'IN': 'Karachi',
  'US': 'MoonsightingCommittee',
  'CA': 'MoonsightingCommittee',
  'GB': 'MoonsightingCommittee',
  'FR': 'France',
  'DE': 'MuslimWorldLeague',
  'AU': 'MuslimWorldLeague',
  'PT': 'Portugal',
  'RU': 'Russia',
  'IR': 'Tehran',
  'NG': 'Egyptian',
  'ZA': 'MuslimWorldLeague',
  'OTHER': 'MuslimWorldLeague'
};

export const COUNTRY_MADHAB_MAP: Record<string, string> = {
  'SA': 'Shafi',
  'AE': 'Maliki',
  'KW': 'Maliki',
  'QA': 'Hanafi',
  'BH': 'Maliki',
  'OM': 'Shafi',
  'JO': 'Shafi',
  'LB': 'Shafi',
  'SY': 'Hanafi',
  'IQ': 'Hanafi',
  'EG': 'Shafi',
  'LY': 'Maliki',
  'TN': 'Maliki',
  'DZ': 'Maliki',
  'MA': 'Maliki',
  'SD': 'Maliki',
  'YE': 'Shafi',
  'TR': 'Hanafi',
  'MY': 'Shafi',
  'ID': 'Shafi',
  'PK': 'Hanafi',
  'BD': 'Hanafi',
  'IN': 'Hanafi',
  'US': 'Shafi',
  'CA': 'Shafi',
  'GB': 'Shafi',
  'FR': 'Maliki',
  'DE': 'Hanafi',
  'AU': 'Shafi',
  'PT': 'Shafi',
  'RU': 'Hanafi',
  'IR': 'Hanafi',
  'NG': 'Maliki',
  'ZA': 'Shafi',
  'OTHER': 'Shafi'
};

export function getRecommendedCalculationMethod(countryName: string): string {
  const country = COUNTRIES.find(c => c.name === countryName);
  if (country) {
    return COUNTRY_CALCULATION_METHOD_MAP[country.key] || 'MuslimWorldLeague';
  }
  return 'MuslimWorldLeague';
}

export function getRecommendedMadhab(countryName: string): string {
  const country = COUNTRIES.find(c => c.name === countryName);
  if (country) {
    return COUNTRY_MADHAB_MAP[country.key] || 'Shafi';
  }
  return 'Shafi';
}

export function getRecommendedTimezone(countryName: string): string {
  const country = COUNTRIES.find(c => c.name === countryName);
  if (country && country.timezone) {
    return country.timezone;
  }
  return 'Asia/Riyadh';
}