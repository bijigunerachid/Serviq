
import { notFound } from 'next/navigation';

import {
  getDirection,
  isValidLocale,
} from '@/i18n/config';

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div
      lang={locale}
      dir={getDirection(locale)}
      className="min-h-screen"
    >
      {children}
    </div>
  );
}
