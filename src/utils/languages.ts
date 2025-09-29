// Language support for Nigerian Agricultural System
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  ha: 'Hausa',
  yo: 'Yoruba',
  ig: 'Igbo'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Common agricultural terms translations
export const translations = {
  // Navigation
  dashboard: {
    en: 'Dashboard',
    ha: 'Batu na Bayanai',
    yo: 'Atẹle Bawo',
    ig: 'Ebe Nlele'
  },
  farmers: {
    en: 'Farmers',
    ha: 'Manoma',
    yo: 'Awon Agbe',
    ig: 'Ndi Oru Ugbo'
  },
  crops: {
    en: 'Crops',
    ha: 'Amfani',
    yo: 'Awon Eso',
    ig: 'Ihe Ubi'
  },
  livestock: {
    en: 'Livestock',
    ha: 'Dabbobi',
    yo: 'Awon Eranko',
    ig: 'Anu Ulo'
  },
  
  // Common farming terms
  planting: {
    en: 'Planting',
    ha: 'Shuki',
    yo: 'Gbingbin',
    ig: 'Iko Mkpuru'
  },
  harvest: {
    en: 'Harvest',
    ha: 'Girbi',
    yo: 'Ikore',
    ig: 'Owuwe Ihe'
  },
  fertilizer: {
    en: 'Fertilizer',
    ha: 'Taki',
    yo: 'Epo Ile',
    ig: 'Nri Ala'
  },
  pesticide: {
    en: 'Pesticide',
    ha: 'Maganin Kwari',
    yo: 'Egun Kokoro',
    ig: 'Ogwu Ebe'
  },
  
  // Weather terms
  rain: {
    en: 'Rain',
    ha: 'Ruwan sama',
    yo: 'Ojo',
    ig: 'Mmiri Ozuzo'
  },
  drought: {
    en: 'Drought',
    ha: 'Fari',
    yo: 'Ogbele',
    ig: 'Okpomoku'
  },
  sunshine: {
    en: 'Sunshine',
    ha: 'Hasken rana',
    yo: 'Imole oorun',
    ig: 'Ìhè Anyanwu'
  },
  
  // Market terms
  price: {
    en: 'Price',
    ha: 'Farashi',
    yo: 'Owo',
    ig: 'Onu Ego'
  },
  market: {
    en: 'Market',
    ha: 'Kasuwa',
    yo: 'Oja',
    ig: 'Ahia'
  },
  sell: {
    en: 'Sell',
    ha: 'Sayarwa',
    yo: 'Ta',
    ig: 'Ree'
  },
  buy: {
    en: 'Buy',
    ha: 'Saya',
    yo: 'Ra',
    ig: 'Zuo'
  }
};

export const getTranslation = (key: keyof typeof translations, language: SupportedLanguage = 'en'): string => {
  return translations[key]?.[language] || translations[key]?.en || key;
};

// Nigerian states for location context
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

// Major markets in Nigeria
export const MAJOR_MARKETS = {
  'Lagos': ['Mile 12 Market', 'Alaba International Market', 'Mushin Market'],
  'Kano': ['Dawanau Market', 'Sabon Gari Market', 'Kurmi Market'],
  'Oyo': ['Bodija Market', 'Oja Oba Market'],
  'Rivers': ['Mile 3 Market', 'Creek Road Market'],
  'FCT': ['Wuse Market', 'Garki Market', 'Nyanya Market'],
  'Kaduna': ['Central Market', 'Kasuwar Barci'],
  'Plateau': ['Terminus Market', 'Building Materials Market'],
  'Benue': ['Wurukum Market', 'Modern Market']
};

// Common crop varieties in Nigeria
export const NIGERIAN_CROP_VARIETIES = {
  rice: ['FARO 44', 'FARO 52', 'FARO 57', 'NERICA varieties'],
  maize: ['TZB-SR', 'SAMMAZ varieties', 'BR 9928-DMRSR'],
  cassava: ['TMS varieties', 'NR varieties'],
  yam: ['TDr varieties', 'Local varieties'],
  cowpea: ['IT varieties', 'Sampea varieties'],
  sorghum: ['SAMSORG varieties', 'Local varieties'],
  millet: ['SOSAT varieties', 'Local varieties']
};

export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
};