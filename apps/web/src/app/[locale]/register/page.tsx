
import { notFound } from 'next/navigation';

import {
  isValidLocale,
  locales,
} from '@/i18n/config';

import { RegisterForm } from '@/components/auth/register-form';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

// Generate registration pages for supported languages.
export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function RegisterPage({
  params,
}: Props) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return <RegisterForm locale={locale} />;
}
