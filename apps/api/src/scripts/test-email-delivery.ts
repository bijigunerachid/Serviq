
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { EmailService } from '../email/email.service.js';

async function main() {
  if (
    process.env.SMTP_HOST !== '127.0.0.1' ||
    process.env.SMTP_PORT !== '1025' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(
      'This test requires local Mailpit',
    );
  }

  const app = await NestFactory.createApplicationContext(
    AppModule,
    { logger: ['error'] },
  );

  try {
    const emailService = app.get(EmailService);

    await emailService.sendTestEmail(
      'test@example.com',
    );

    console.log('EMAIL SENT TO LOCAL MAILPIT');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Email delivery test failed:', error);
  process.exitCode = 1;
});
