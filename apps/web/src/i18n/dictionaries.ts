
import type { Locale } from './config';

export const dictionaries = {
  fr: {
    welcome: 'Bienvenue sur Serviq',
    description:
      'Gérez vos interventions techniques simplement.',
    login: 'Se connecter',
    register: 'Créer un compte',
  },

  ar: {
    welcome: 'مرحباً بك في Serviq',
    description:
      'أدر التدخلات التقنية لشركتك بسهولة.',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
