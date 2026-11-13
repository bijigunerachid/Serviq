
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MailCheck,
  MailWarning,
  ShieldCheck,
} from 'lucide-react';

import type { Locale } from '@/i18n/config';

const messages = {
  fr: {
    title: 'Vérification de votre adresse e-mail',
    subtitle:
      'Une dernière étape pour activer votre espace Serviq.',
    missingTitle: 'Lien de vérification incomplet',
    missingDescription:
      'Aucun jeton de vérification n’a été trouvé dans ce lien.',
    readyTitle: 'Lien de vérification reçu',
    readyDescription:
      'Votre lien contient un jeton. La vérification sécurisée sera disponible après la connexion de notre API.',
    security:
      'Votre compte ne sera activé qu’après validation du jeton par notre serveur.',
    register: 'Retour à l’inscription',
    brand: 'Gestion intelligente des services techniques',
  },
  ar: {
    title: 'التحقق من بريدك الإلكتروني',
    subtitle: 'خطوة أخيرة لتفعيل حساب شركتك في Serviq.',
    missingTitle: 'رابط التحقق غير مكتمل',
    missingDescription:
      'لم نعثر على رمز التحقق داخل هذا الرابط.',
    readyTitle: 'تم استلام رابط التحقق',
    readyDescription:
      'الرابط يحتوي على رمز تحقق. سيصبح التحقق الآمن متاحاً بعد ربط الصفحة بالخادم.',
    security:
      'لن يُفعّل حسابك إلا بعد التحقق من الرمز على الخادم.',
    register: 'العودة إلى التسجيل',
    brand: 'إدارة ذكية للخدمات التقنية',
  },
} as const;

export function EmailVerification({
  locale,
}: {
  locale: Locale;
}) {
  const searchParams = useSearchParams();
  const hasToken = Boolean(searchParams.get('token')?.trim());
  const t = messages[locale];

  return (
    <main
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="flex min-h-screen flex-col bg-slate-50 text-slate-900"
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <Link
          href={`/${locale}`}
          className="text-2xl font-bold tracking-tight"
        >
          Serviq<span className="text-teal-600">.</span>
        </Link>

        <nav className="flex gap-3 text-sm">
          <Link
            href="/fr/verify-email"
            className={locale === 'fr'
              ? 'font-semibold text-teal-700'
              : 'text-slate-500'}
          >
            FR
          </Link>

          <Link
            href="/ar/verify-email"
            className={locale === 'ar'
              ? 'font-semibold text-teal-700'
              : 'text-slate-500'}
          >
            العربية
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50">
            {hasToken ? (
              <MailCheck
                aria-hidden="true"
                className="h-10 w-10 text-teal-700"
              />
            ) : (
              <MailWarning
                aria-hidden="true"
                className="h-10 w-10 text-amber-600"
              />
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t.title}
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            {t.subtitle}
          </p>

          <div
            role="status"
            className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <h2 className="font-semibold">
              {hasToken
                ? t.readyTitle
                : t.missingTitle}
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {hasToken
                ? t.readyDescription
                : t.missingDescription}
            </p>
          </div>

          <div className="mt-7 flex items-start gap-3 rounded-xl bg-teal-50 p-4 text-start">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
            />
            <p className="text-xs leading-6 text-teal-900">
              {t.security}
            </p>
          </div>

          <Link
            href={`/${locale}/register`}
            className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-teal-700 px-5 font-semibold text-white transition-colors hover:bg-teal-800"
          >
            {t.register}
          </Link>
        </div>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-slate-400">
        Serviq · {t.brand}
      </footer>
    </main>
  );
}
