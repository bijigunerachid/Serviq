
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';

type VerificationStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'invalid'
  | 'rate_limited'
  | 'unavailable';

const messages = {
  fr: {
    title: 'Vérifiez votre adresse e-mail',
    subtitle: 'Activez votre compte Serviq en toute sécurité.',
    ready: 'Votre lien de vérification est prêt.',
    missing: 'Ce lien ne contient aucun jeton de vérification.',
    confirm: 'Confirmer mon adresse e-mail',
    loading: 'Vérification en cours...',
    success: 'Votre adresse e-mail a été vérifiée.',
    invalid: 'Ce lien est invalide, expiré ou déjà utilisé.',
    rate: 'Trop de tentatives. Réessayez dans une minute.',
    unavailable: 'Service indisponible. Veuillez réessayer.',
    retry: 'Réessayer',
    register: "Retour à l'inscription",
    login: 'Se connecter',
    security: 'Votre jeton est validé uniquement par notre serveur.',
  },
  ar: {
    title: 'تأكيد بريدك الإلكتروني',
    subtitle: 'فعّل حسابك في Serviq بطريقة آمنة.',
    ready: 'رابط التحقق جاهز.',
    missing: 'هذا الرابط لا يحتوي على رمز تحقق.',
    confirm: 'تأكيد البريد الإلكتروني',
    loading: 'جارٍ التحقق...',
    success: 'تم تأكيد بريدك الإلكتروني بنجاح.',
    invalid: 'الرابط غير صالح أو منتهي الصلاحية أو سبق استخدامه.',
    rate: 'محاولات كثيرة. حاول مجدداً بعد دقيقة.',
    unavailable: 'الخدمة غير متاحة حالياً. حاول مجدداً.',
    retry: 'إعادة المحاولة',
    register: 'العودة إلى التسجيل',
    login: 'تسجيل الدخول',
    security: 'يتم التحقق من الرمز حصرياً على الخادم.',
  },
} as const;

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function EmailVerification({
  locale,
}: {
  locale: Locale;
}) {
  const searchParams = useSearchParams();
  const tokenRef = useRef<string | null>(null);
  const lockedRef = useRef(false);

  const [status, setStatus] =
    useState<VerificationStatus>('idle');

  const t = messages[locale];

  // The query parameter is never displayed or logged.
  const urlToken = searchParams.get('token');
  const token = tokenRef.current ?? urlToken;
  const hasValidFormat = Boolean(
    token && TOKEN_PATTERN.test(token),
  );

  async function verifyEmail() {
    if (lockedRef.current || status === 'success') {
      return;
    }

    const value = tokenRef.current ?? urlToken;

    if (!value || !TOKEN_PATTERN.test(value)) {
      setStatus('invalid');
      return;
    }

    lockedRef.current = true;
    tokenRef.current = value;
    setStatus('loading');

    // Remove token from the address bar before requesting.
    // Keep the value only in memory for this page session.
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('token');

    window.history.replaceState(
      window.history.state,
      '',
      cleanUrl.pathname + cleanUrl.search + cleanUrl.hash,
    );

    try {
      const response = await fetch(
        '/api/auth/verify-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: value }),
          cache: 'no-store',
          credentials: 'same-origin',
          referrerPolicy: 'no-referrer',
        },
      );

      if (response.ok) {
        const result: unknown = await response.json();

        if (
          typeof result === 'object' &&
          result !== null &&
          'code' in result &&
          result.code === 'EMAIL_VERIFIED'
        ) {
          tokenRef.current = null;
          setStatus('success');
        } else {
          setStatus('unavailable');
        }
      } else if (response.status === 400) {
        tokenRef.current = null;
        setStatus('invalid');
      } else if (response.status === 429) {
        setStatus('rate_limited');
      } else {
        setStatus('unavailable');
      }
    } catch {
      setStatus('unavailable');
    } finally {
      lockedRef.current = false;
    }
  }

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  const statusText =
    status === 'success' ? t.success :
    status === 'invalid' ? t.invalid :
    status === 'rate_limited' ? t.rate :
    status === 'unavailable' ? t.unavailable :
    status === 'loading' ? t.loading :
    hasValidFormat ? t.ready : t.missing;

  const canSubmit =
    !isLoading &&
    !isSuccess &&
    status !== 'invalid' &&
    hasValidFormat;

  return (
    <main
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="flex min-h-screen flex-col bg-slate-50 text-slate-900"
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <Link
          href={`/${locale}`}
          className="text-2xl font-bold"
        >
          Serviq<span className="text-teal-600">.</span>
        </Link>

        <nav className="flex gap-4 text-sm">
          <span className="font-medium">
            {locale === 'fr' ? 'Français' : 'العربية'}
          </span>
        </nav>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50">
            {isLoading ? (
              <LoaderCircle
                className="h-10 w-10 animate-spin text-teal-700"
                aria-hidden="true"
              />
            ) : isSuccess ? (
              <CheckCircle2
                className="h-10 w-10 text-teal-700"
                aria-hidden="true"
              />
            ) : status === 'invalid' || !hasValidFormat ? (
              <CircleAlert
                className="h-10 w-10 text-amber-600"
                aria-hidden="true"
              />
            ) : (
              <MailCheck
                className="h-10 w-10 text-teal-700"
                aria-hidden="true"
              />
            )}
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            {t.title}
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            {t.subtitle}
          </p>

          <div
            role="status"
            aria-live="polite"
            className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7"
          >
            {statusText}
          </div>

          {canSubmit && (
            <Button
              type="button"
              onClick={verifyEmail}
              disabled={isLoading}
              className="mt-7 h-11 w-full bg-teal-700 text-white hover:bg-teal-800"
            >
              {status === 'idle' ? t.confirm : t.retry}
            </Button>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-teal-50 p-4 text-start">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
              aria-hidden="true"
            />
            <p className="text-xs leading-6 text-teal-900">
              {t.security}
            </p>
          </div>

          <Link
            href={`/${locale}/${isSuccess ? 'login' : 'register'}`}
            className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-semibold hover:bg-slate-50"
          >
            {isSuccess ? t.login : t.register}
          </Link>
        </div>
      </section>
    </main>
  );
}
