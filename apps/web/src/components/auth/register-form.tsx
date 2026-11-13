
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Locale } from '@/i18n/config';

// ============================================
// 1. Form Validation
// ============================================

function createRegisterSchema(locale: Locale) {
    const ar = locale === 'ar';

    return z.object({
        fullName: z
            .string()
            .trim()
            .min(2, ar ? 'الاسم قصير جداً' : 'Nom trop court')
            .max(100, ar ? 'الاسم طويل جداً' : 'Nom trop long'),

        email: z.email({
            error: ar
                ? 'البريد الإلكتروني غير صالح'
                : 'Adresse e-mail invalide',
        }),

        companyName: z
            .string()
            .trim()
            .min(
                2,
                ar ? 'أدخل اسم الشركة' : "Entrez le nom de l'entreprise",
            )
            .max(150),

        slug: z
            .string()
            .min(
                3,
                ar ? 'المعرّف قصير جداً' : 'Identifiant trop court',
            )
            .max(60)
            .regex(
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                ar
                    ? 'استخدم حروفاً لاتينية صغيرة وأرقاماً وشرطات فقط'
                    : 'Utilisez des lettres minuscules, chiffres et tirets',
            ),

        password: z
            .string()
            .min(
                12,
                ar
                    ? 'كلمة المرور يجب أن تحتوي على 12 حرفاً على الأقل'
                    : 'Le mot de passe doit contenir au moins 12 caractères',
            )
            .max(128),
    });
}

type RegisterValues = z.infer<
    ReturnType<typeof createRegisterSchema>
>;

// ============================================
// 2. Translations
// ============================================

const translations = {
    fr: {
        title: 'Créez votre espace Serviq',
        subtitle:
            'Commencez à gérer votre entreprise plus efficacement.',

        fullName: 'Nom complet',
        fullNamePlaceholder: 'Ex. Ahmed Amrani',

        email: 'Adresse e-mail',
        emailPlaceholder: 'nom@entreprise.com',

        companyName: "Nom de l'entreprise",
        companyPlaceholder: 'Ex. Atlas Maintenance',

        slug: "Identifiant de l'entreprise",
        slugPlaceholder: 'atlas-maintenance',
        slugHelp:
            'Lettres minuscules, chiffres et tirets uniquement.',

        password: 'Mot de passe',
        passwordPlaceholder: '12 caractères minimum',
        passwordHelp:
            'Utilisez un mot de passe unique de 12 caractères minimum.',

        showPassword: 'Afficher le mot de passe',
        hidePassword: 'Masquer le mot de passe',

        submit: 'Créer mon compte',
        validating: 'Validation...',

        success:
            'Votre formulaire est valide. La connexion au serveur sera bientôt disponible.',

        brandTitle:
            'Toutes vos interventions. Une seule plateforme.',
        brandDescription:
            'Organisez vos équipes, suivez vos interventions et améliorez la qualité de vos services.',

        feature1: 'Gestion des interventions',
        feature2: 'Planification des techniciens',
        feature3: 'Suivi des clients et équipements',

        loginQuestion: 'Vous avez déjà un compte ?',
        login: 'Se connecter',

        terms: 'En continuant, vous acceptez les conditions d’utilisation.',
        footer: 'Gestion intelligente des services techniques',
    },

    ar: {
        title: 'أنشئ حساب شركتك في Serviq',
        subtitle: 'ابدأ بإدارة شركتك بطريقة أكثر احترافية.',

        fullName: 'الاسم الكامل',
        fullNamePlaceholder: 'مثال: أحمد العمراني',

        email: 'البريد الإلكتروني',
        emailPlaceholder: 'name@company.com',

        companyName: 'اسم الشركة',
        companyPlaceholder: 'مثال: أطلس للصيانة',

        slug: 'المعرّف الفريد للشركة',
        slugPlaceholder: 'atlas-maintenance',
        slugHelp:
            'استخدم أحرفاً لاتينية صغيرة وأرقاماً وشرطات فقط.',

        password: 'كلمة المرور',
        passwordPlaceholder: '12 حرفاً على الأقل',
        passwordHelp:
            'استخدم كلمة مرور فريدة مكونة من 12 حرفاً على الأقل.',

        showPassword: 'إظهار كلمة المرور',
        hidePassword: 'إخفاء كلمة المرور',

        submit: 'إنشاء الحساب',
        validating: 'جارٍ التحقق...',

        success:
            'بيانات النموذج صحيحة. سيتم ربط التسجيل بالخادم لاحقاً.',

        brandTitle: 'جميع تدخلات شركتك في منصة واحدة.',
        brandDescription:
            'نظّم فريقك، وتابع عمليات الصيانة، وحسّن جودة الخدمات التي تقدمها.',

        feature1: 'إدارة التدخلات التقنية',
        feature2: 'جدولة مهام التقنيين',
        feature3: 'متابعة العملاء والمعدات',

        loginQuestion: 'لديك حساب بالفعل؟',
        login: 'تسجيل الدخول',

        terms: 'بالمتابعة، فإنك توافق على شروط الاستخدام.',
        footer: 'إدارة ذكية للخدمات التقنية',
    },
} as const;

// ============================================
// 3. Register Component
// ============================================

export function RegisterForm({
    locale,
}: {
    locale: Locale;
}) {
    const t = translations[locale];
    const schema = createRegisterSchema(locale);
    const isRTL = locale === 'ar';

    const [showPassword, setShowPassword] = useState(false);
    const [validated, setValidated] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterValues>({
        resolver: zodResolver(schema),
        mode: 'onBlur',
        defaultValues: {
            fullName: '',
            email: '',
            companyName: '',
            slug: '',
            password: '',
        },
    });

    function onValid(_values: RegisterValues) {
        // Frontend-only validation.
        // API registration will be enabled after
        // authentication security is completed.
        setValidated(true);
    }

    const fields = [
        {
            name: 'fullName',
            label: t.fullName,
            placeholder: t.fullNamePlaceholder,
            type: 'text',
            autoComplete: 'name',
        },
        {
            name: 'email',
            label: t.email,
            placeholder: t.emailPlaceholder,
            type: 'email',
            autoComplete: 'email',
        },
        {
            name: 'companyName',
            label: t.companyName,
            placeholder: t.companyPlaceholder,
            type: 'text',
            autoComplete: 'organization',
        },
        {
            name: 'slug',
            label: t.slug,
            placeholder: t.slugPlaceholder,
            type: 'text',
            autoComplete: 'off',
        },
    ] as const;

    return (
        <main
            lang={locale}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-2"
        >
            {/* ======================================
          LEFT: Brand Panel
      ====================================== */}

            <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 p-8 text-white lg:min-h-screen lg:p-14 xl:p-20">
                {/* Background glow */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -end-32 -top-32 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl"
                />

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-40 -start-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"
                />

                {/* Logo */}
                <Link
                    href={`/${locale}`}
                    className="relative z-10 inline-flex w-fit items-center gap-3"
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 font-bold text-white shadow-lg shadow-teal-500/20">
                        S
                    </div>

                    <span className="text-2xl font-bold tracking-tight">
                        Serviq
                        <span className="text-teal-400">.</span>
                    </span>
                </Link>

                {/* Brand Content */}
                <div className="relative z-10 my-14 max-w-xl space-y-7 lg:my-20">
                    <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-medium text-teal-300">
                        Field Service Management
                    </div>

                    <h1 className="text-3xl leading-tight font-bold sm:text-4xl xl:text-5xl">
                        {t.brandTitle}
                    </h1>

                    <p className="max-w-lg text-base leading-8 text-slate-300">
                        {t.brandDescription}
                    </p>

                    <div className="space-y-4 pt-4">
                        {[t.feature1, t.feature2, t.feature3].map(
                            (feature) => (
                                <div
                                    key={feature}
                                    className="flex items-center gap-3"
                                >
                                    <CheckCircle2
                                        className="h-5 w-5 shrink-0 text-teal-400"
                                        aria-hidden="true"
                                    />

                                    <span className="text-sm text-slate-200">
                                        {feature}
                                    </span>
                                </div>
                            ),
                        )}
                    </div>
                </div>

                <p className="relative z-10 text-sm text-slate-400">
                    © 2026 Serviq · {t.footer}
                </p>
            </section>

            {/* ======================================
          RIGHT: Registration Form
      ====================================== */}

            <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
                <div className="w-full max-w-md space-y-8">
                    {/* Language Switcher */}
                    <nav
                        aria-label="Language"
                        className="flex items-center justify-end gap-2 text-sm"
                    >
                        <Link
                            href="/fr/register"
                            hrefLang="fr"
                            aria-current={locale === 'fr' ? 'page' : undefined}
                            className={`rounded-lg px-3 py-2 transition-colors ${locale === 'fr'
                                    ? 'bg-teal-50 font-semibold text-teal-700'
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            FR
                        </Link>

                        <Link
                            href="/ar/register"
                            hrefLang="ar"
                            aria-current={locale === 'ar' ? 'page' : undefined}
                            className={`rounded-lg px-3 py-2 transition-colors ${locale === 'ar'
                                    ? 'bg-teal-50 font-semibold text-teal-700'
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            العربية
                        </Link>
                    </nav>

                    {/* Heading */}
                    <header className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {t.title}
                        </h2>

                        <p className="text-sm leading-7 text-slate-500">
                            {t.subtitle}
                        </p>
                    </header>

                    {/* Form */}
                    <form
                        noValidate
                        onSubmit={handleSubmit(
                            onValid,
                            () => setValidated(false),
                        )}
                        onChange={() => setValidated(false)}
                        className="space-y-5"
                    >
                        {fields.map((field) => {
                            const error = errors[field.name];

                            return (
                                <div
                                    key={field.name}
                                    className="space-y-2"
                                >
                                    <Label htmlFor={field.name}>
                                        {field.label}
                                    </Label>

                                    <Input
                                        id={field.name}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        autoComplete={field.autoComplete}
                                        aria-invalid={Boolean(error)}
                                        aria-describedby={
                                            error
                                                ? `${field.name}-error`
                                                : field.name === 'slug'
                                                    ? 'slug-help'
                                                    : undefined
                                        }
                                        dir={
                                            field.name === 'email' ||
                                                field.name === 'slug'
                                                ? 'ltr'
                                                : undefined
                                        }
                                        className="h-11 rounded-lg border-slate-200 bg-white focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
                                        {...register(field.name)}
                                    />

                                    {field.name === 'slug' && (
                                        <p
                                            id="slug-help"
                                            className="text-xs text-slate-500"
                                        >
                                            {t.slugHelp}
                                        </p>
                                    )}

                                    {error && (
                                        <p
                                            id={`${field.name}-error`}
                                            role="alert"
                                            className="text-sm text-red-600"
                                        >
                                            {error.message}
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {t.password}
                            </Label>

                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t.passwordPlaceholder}
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={
                                        errors.password
                                            ? 'password-error'
                                            : 'password-help'
                                    }
                                    className="h-11 rounded-lg border-slate-200 bg-white pe-12 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
                                    {...register('password')}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((previous) => !previous)
                                    }
                                    aria-label={
                                        showPassword
                                            ? t.hidePassword
                                            : t.showPassword
                                    }
                                    aria-pressed={showPassword}
                                    className="absolute end-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-500 transition-colors hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                                >
                                    {showPassword ? (
                                        <EyeOff
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Eye
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            </div>

                            <p
                                id="password-help"
                                className="text-xs leading-5 text-slate-500"
                            >
                                {t.passwordHelp}
                            </p>

                            {errors.password && (
                                <p
                                    id="password-error"
                                    role="alert"
                                    className="text-sm text-red-600"
                                >
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 w-full rounded-lg bg-teal-700 font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
                        >
                            {isSubmitting ? (
                                t.validating
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {t.submit}
                                    <ArrowRight
                                        aria-hidden="true"
                                        className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''
                                            }`}
                                    />
                                </span>
                            )}
                        </Button>

                        {/* Validation Success */}
                        {validated && (
                            <div
                                role="status"
                                className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800"
                            >
                                <CheckCircle2
                                    aria-hidden="true"
                                    className="mt-0.5 h-5 w-5 shrink-0"
                                />
                                <p>{t.success}</p>
                            </div>
                        )}
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-sm text-slate-600">
                        {t.loginQuestion}{' '}
                        <Link
                            href={`/${locale}/login`}
                            className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                        >
                            {t.login}
                        </Link>
                    </p>

                    <p className="text-center text-xs leading-6 text-slate-400">
                        {t.terms}
                    </p>
                </div>
            </section>
        </main>
    );
}
