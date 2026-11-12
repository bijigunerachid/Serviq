
import 'dotenv/config';

import { randomBytes } from 'node:crypto';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const database = new URL(connectionString);

  // Never run this integration test against production.
  if (
    database.hostname !== '127.0.0.1' ||
    database.port !== '5433' ||
    database.pathname !== '/serviq' ||
    process.env.SMTP_HOST !== '127.0.0.1' ||
    process.env.SMTP_PORT !== '1025' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error('Local development environment required');
  }

  const app = await NestFactory.createApplicationContext(
    AppModule,
    { logger: ['error'] },
  );

  try {
    const auth = app.get(AuthService);
    const prisma = app.get(PrismaService);

    const suffix = randomBytes(8).toString('hex');
    const email = `onboarding-${suffix}@example.com`;
    const password = randomBytes(24).toString('base64url');
    const slug = `serviq-onboarding-${suffix}`;

    console.log('1. Starting company registration...');

    const result =
      await auth.registerTenantAndSendVerification({
        fullName: 'Serviq Test Owner',
        email,
        password,
        companyName: 'Serviq Onboarding Test',
        slug,
      });

    if (result.status !== 'PENDING_VERIFICATION') {
      throw new Error('Unexpected registration status');
    }

    console.log('2. Registration service completed.');

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug },
    });

    const membership =
      await prisma.membership.findUniqueOrThrow({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: user.id,
          },
        },
      });

    if (
      membership.role !== 'OWNER' ||
      membership.status !== 'INVITED'
    ) {
      throw new Error('Invalid membership state');
    }

    console.log('3. User, tenant and membership verified.');

    const tokens =
      await prisma.emailVerificationToken.findMany({
        where: {
          userId: user.id,
          membershipId: membership.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

    if (tokens.length !== 1) {
      throw new Error(
        'Expected exactly one active verification token',
      );
    }

    if (!/^[a-f0-9]{64}$/.test(tokens[0].tokenHash)) {
      throw new Error('Invalid stored token hash');
    }

    console.log('4. Verification token stored securely.');
    console.log('5. Email accepted by local SMTP.');

    console.log('ALL REGISTRATION EMAIL TESTS PASSED');
    console.log('Test recipient:', email);
    console.log('Check Mailpit: http://localhost:8025');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Integration test failed:', error);
  process.exitCode = 1;
});
