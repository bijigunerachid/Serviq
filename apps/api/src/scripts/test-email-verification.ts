
import 'dotenv/config';

import { randomBytes } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';

import { AppModule } from '../app.module.js';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailVerificationService } from '../email-verification/email-verification.service.js';

async function main() {
  // Protect against accidentally running on production.
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing');
  }

  const url = new URL(databaseUrl);

  if (
    url.hostname !== '127.0.0.1' ||
    url.port !== '5433' ||
    url.pathname !== '/serviq' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error('Use the local test database only');
  }

  const app = await NestFactory.createApplicationContext(
    AppModule,
    { logger: ['error'] },
  );

  try {
    const auth = app.get(AuthService);
    const prisma = app.get(PrismaService);
    const verification = app.get(
      EmailVerificationService,
    );

    const suffix = randomBytes(8).toString('hex');
    const password = randomBytes(24).toString('base64url');

    // 1. Register a test company
    const registration = await auth.registerTenant({
      fullName: 'Serviq Verification Tester',
      email: `verify-${suffix}@example.com`,
      password,
      companyName: 'Verification Test Company',
      slug: `verification-${suffix}`,
    });

    const membership =
      await prisma.membership.findUniqueOrThrow({
        where: {
          tenantId_userId: {
            tenantId: registration.tenantId,
            userId: registration.userId,
          },
        },
      });

    if (membership.status !== 'INVITED') {
      throw new Error('Expected INVITED membership');
    }

    console.log('PASS: Membership starts as INVITED');

    // 2. Issue token
    const { token, expiresAt } =
      await verification.issueToken(
        registration.userId,
        membership.id,
      );

    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new Error('Invalid token format');
    }

    const storedToken =
      await prisma.emailVerificationToken.findUniqueOrThrow({
        where: {
          tokenHash: (
            await import('node:crypto')
          ).createHash('sha256').update(token).digest('hex'),
        },
      });

    if (
      storedToken.tokenHash === token ||
      storedToken.membershipId !== membership.id ||
      storedToken.expiresAt.getTime() !== expiresAt.getTime()
    ) {
      throw new Error('Invalid stored verification token');
    }

    console.log('PASS: Token generated and hash stored');

    // 3. Verify token
    await verification.verifyToken(token);

    const activated =
      await prisma.membership.findUniqueOrThrow({
        where: { id: membership.id },
      });

    if (activated.status !== 'ACTIVE') {
      throw new Error('Membership was not activated');
    }

    console.log('PASS: Membership activated');

    // 4. Reject token reuse
    let reuseRejected = false;

    try {
      await verification.verifyToken(token);
    } catch (error) {
      if (error instanceof BadRequestException) {
        reuseRejected = true;
      } else {
        throw error;
      }
    }

    if (!reuseRejected) {
      throw new Error('Token reuse was accepted');
    }

    console.log('PASS: Reused token rejected');

    // 5. Register second company to test expiration
    const second = await auth.registerTenant({
      fullName: 'Expiration Test',
      email: `expired-${suffix}@example.com`,
      password,
      companyName: 'Expiration Test Company',
      slug: `expired-${suffix}`,
    });

    const secondMembership =
      await prisma.membership.findUniqueOrThrow({
        where: {
          tenantId_userId: {
            tenantId: second.tenantId,
            userId: second.userId,
          },
        },
      });

    const expiring = await verification.issueToken(
      second.userId,
      secondMembership.id,
    );

    // Simulate expiration in our local test database.
    const { createHash } = await import('node:crypto');

    await prisma.emailVerificationToken.update({
      where: {
        tokenHash: createHash('sha256')
          .update(expiring.token)
          .digest('hex'),
      },
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    let expiredRejected = false;

    try {
      await verification.verifyToken(expiring.token);
    } catch (error) {
      if (error instanceof BadRequestException) {
        expiredRejected = true;
      } else {
        throw error;
      }
    }

    const unchanged =
      await prisma.membership.findUniqueOrThrow({
        where: { id: secondMembership.id },
      });

    if (
      !expiredRejected ||
      unchanged.status !== 'INVITED'
    ) {
      throw new Error('Expired token validation failed');
    }

    console.log('PASS: Expired token rejected');
    console.log('PASS: Expired membership stays INVITED');

    console.log('ALL EMAIL VERIFICATION TESTS PASSED');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Email verification test failed:', error);
  process.exitCode = 1;
});
