
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  createHash,
  randomBytes,
} from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  async issueToken(
    userId: string,
    membershipId: string,
  ) {
    const membership =
      await this.prisma.membership.findFirst({
        where: {
          id: membershipId,
          userId,
          status: 'INVITED',
        },
        include: {
          tenant: {
            select: { isActive: true },
          },
        },
      });

    if (!membership || !membership.tenant.isActive) {
      throw new BadRequestException(
        'Membership cannot be verified',
      );
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        membershipId,
        tokenHash,
        expiresAt,
      },
    });

    // Return only to trusted internal code.
    // Never log or expose this value publicly.
    return { token, expiresAt };
  }

  async verifyToken(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new BadRequestException(
        'Invalid verification token',
      );
    }

    const tokenHash = this.hashToken(token);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const record =
        await tx.emailVerificationToken.findUnique({
          where: { tokenHash },
        });

      if (!record) {
        throw new BadRequestException(
          'Invalid verification token',
        );
      }

      const claimed =
        await tx.emailVerificationToken.updateMany({
          where: {
            id: record.id,
            usedAt: null,
            expiresAt: { gt: now },
          },
          data: { usedAt: now },
        });

      if (claimed.count !== 1) {
        throw new BadRequestException(
          'Expired or already used token',
        );
      }

      const activated = await tx.membership.updateMany({
        where: {
          id: record.membershipId,
          userId: record.userId,
          status: 'INVITED',
          tenant: { isActive: true },
          user: { isActive: true },
        },
        data: { status: 'ACTIVE' },
      });

      if (activated.count !== 1) {
        throw new BadRequestException(
          'Membership cannot be activated',
        );
      }

      return {
        success: true,
        message: 'Membership verified',
      };
    });
  }
}
