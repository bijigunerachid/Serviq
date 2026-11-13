
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  isValidLocale,
  getDirection,
} from '@/i18n/config';

import { getDictionary } from '@/i18n/dictionaries';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return [
    { locale: 'fr' },
    { locale: 'ar' },
  ];
}

export default async function HomePage({
  params,
}: Props) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = getDictionary(locale);

  return (
    <main
      lang={locale}
      dir={getDirection(locale)}
      className="flex min-h-screen flex-col
        items-center justify-center gap-6
        bg-slate-50 px-6 text-slate-900"
    >
      <h1 className="text-4xl font-bold">
        {t.welcome}
      </h1>

      <p className="text-center text-lg text-slate-600">
        {t.description}
      </p>

      <nav className="flex gap-4">
        <Link
          href="/fr"
          className="rounded-lg border px-4 py-2"
        >
          Français
        </Link>

        <Link
          href="/ar"
          className="rounded-lg border px-4 py-2"
        >
          العربية
        </Link>
      </nav>
    </main>
  );
}
