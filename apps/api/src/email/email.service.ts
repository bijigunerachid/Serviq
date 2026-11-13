
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly transporter: Transporter;

    constructor(
        private readonly config: ConfigService,
    ) {
        const host = this.config.getOrThrow<string>(
            'SMTP_HOST',
        );

        const port = Number(
            this.config.getOrThrow<string>('SMTP_PORT'),
        );

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: false,
        });
    }

    async sendTestEmail(to: string): Promise<void> {
        await this.transporter.sendMail({
            from: this.config.getOrThrow<string>(
                'SMTP_FROM',
            ),
            to,
            subject: 'Serviq - Email Test',
            text: 'Your Serviq email service is working.',
            html: `
        <h2>Welcome to Serviq</h2>
        <p>Your email service is working correctly.</p>
      `,
        });
    }

    async sendVerificationEmail(
        to: string,
        token: string,
    ): Promise<void> {
        const verificationUrl = new URL(
            '/fr/verify-email',
            'http://localhost:3001',
        );

        verificationUrl.searchParams.set('token', token);

        await this.transporter.sendMail({
            from: this.config.getOrThrow<string>(
                'SMTP_FROM',
            ),
            to,
            subject: 'Serviq - Vérifiez votre adresse e-mail',
            text: [
                'Bienvenue sur Serviq !',
                '',
                'Confirmez votre adresse e-mail :',
                verificationUrl.toString(),
                '',
                'Ce lien expire dans 30 minutes.',
            ].join('\n'),
        });
    }

}
