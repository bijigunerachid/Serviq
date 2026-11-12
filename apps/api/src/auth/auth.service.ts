
import {
    ConflictException,
    Injectable,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { EmailService } from '../email/email.service.js';
import { EmailVerificationService } from '../email-verification/email-verification.service.js';
@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailVerification: EmailVerificationService,
        private readonly emailService: EmailService,
    ) { }

    async registerTenant(dto: RegisterTenantDto) {
        const email = dto.email.trim().toLowerCase();
        const slug = dto.slug.trim().toLowerCase();

        // Never store plaintext passwords.
        const passwordHash = await argon2.hash(
            dto.password,
            { type: argon2.argon2id },
        );

        try {
            return await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        fullName: dto.fullName.trim(),
                        email,
                        passwordHash,
                    },
                });

                const tenant = await tx.tenant.create({
                    data: {
                        name: dto.companyName.trim(),
                        slug,
                        defaultLocale: 'fr',
                    },
                });

                await tx.membership.create({
                    data: {
                        userId: user.id,
                        tenantId: tenant.id,
                        role: 'OWNER',
                        status: 'INVITED',
                    },
                });

                return {
                    userId: user.id,
                    tenantId: tenant.id,
                    companyName: tenant.name,
                    status: 'PENDING_VERIFICATION',
                };
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    'Email or company slug already exists',
                );
            }

            throw error;
        }
    }

async registerTenantAndSendVerification(
  dto: RegisterTenantDto,
) {
  const registration = await this.registerTenant(dto);

  const membership =
    await this.prisma.membership.findUniqueOrThrow({
      where: {
        tenantId_userId: {
          tenantId: registration.tenantId,
          userId: registration.userId,
        },
      },
    });

  const { token } = await this.emailVerification.issueToken(
    registration.userId,
    membership.id,
  );

  await this.emailService.sendVerificationEmail(
    dto.email.trim().toLowerCase(),
    token,
  );

  return {
    status: 'PENDING_VERIFICATION',
    message: 'Verification email sent',
  };
}

}
