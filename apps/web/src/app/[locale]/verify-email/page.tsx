
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import {
  isValidLocale,
  locales,
} from '@/i18n/config';

import { EmailVerification } from '@/components/auth/email-verification';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function VerifyEmailPage({
  params,
}: Props) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div
            role="status"
            className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"
          />
        </main>
      }
    >
      <EmailVerification locale={locale} />
    </Suspense>
  );
}
