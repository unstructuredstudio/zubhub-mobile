import { translations, LangCode } from './translations';

export { LangCode };

export function t(key: string, lang: string): string {
  const code = (lang as LangCode) in translations ? (lang as LangCode) : 'en';
  return translations[code][key] ?? translations['en'][key] ?? key;
}
