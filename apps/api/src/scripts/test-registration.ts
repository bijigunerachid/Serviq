
import 'dotenv/config';

import { randomBytes } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as argon2 from 'argon2';

import { AppModule } from '../app.module.js';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing');
  }

  // Only allow this script on our local development database.
  const url = new URL(databaseUrl);

  if (
    url.hostname !== '127.0.0.1' ||
    url.port !== '5433' ||
    url.pathname !== '/serviq' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error('Unsafe test database configuration');
  }

  const app = await NestFactory.createApplicationContext(
    AppModule,
    { logger: ['error'] },
  );

  try {
    const auth = app.get(AuthService);
    const prisma = app.get(PrismaService);

    const suffix = randomBytes(6).toString('hex');
    const email = `test-${suffix}@example.com`;
    const slug = `test-company-${suffix}`;

    const password = randomBytes(24).toString('base64url');

    console.log('1. Registering test company...');

    const result = await auth.registerTenant({
      fullName: 'Serviq Test Owner',
      email,
      password,
      companyName: 'Serviq Test Company',
      slug,
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
    });

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: result.tenantId },
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

    if (!user.passwordHash) {
      throw new Error('Missing password hash');
    }

    const passwordValid = await argon2.verify(
      user.passwordHash,
      password,
    );

    if (!passwordValid) {
      throw new Error('Password verification failed');
    }

    if (
      !user.passwordHash.startsWith('$argon2id$') ||
      membership.role !== 'OWNER' ||
      membership.status !== 'INVITED' ||
      result.status !== 'PENDING_VERIFICATION'
    ) {
      throw new Error('Invalid registration state');
    }

    console.log('2. User, tenant and membership verified.');
    console.log('3. Argon2id password verification passed.');

    // Test that an existing company slug is rejected
    // and that the transaction does not leave an orphan user.
    const duplicateEmail =
      `duplicate-${suffix}@example.com`;

    let conflictDetected = false;

    try {
      await auth.registerTenant({
        fullName: 'Duplicate Test',
        email: duplicateEmail,
        password,
        companyName: 'Duplicate Company',
        slug,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        conflictDetected = true;
      } else {
        throw error;
      }
    }

    if (!conflictDetected) {
      throw new Error('Duplicate slug was not rejected');
    }

    const orphanUser = await prisma.user.findUnique({
      where: { email: duplicateEmail },
    });

    if (orphanUser !== null) {
      throw new Error('Transaction rollback failed');
    }

    console.log('4. Duplicate slug correctly rejected.');
    console.log('5. Transaction rollback verified.');
    console.log('ALL REGISTRATION TESTS PASSED');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Registration test failed:', error);
  process.exitCode = 1;
});
