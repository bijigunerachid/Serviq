
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ThrottlerGuard,
  Throttle,
} from '@nestjs/throttler';

import {
  EmailVerificationService,
} from '../email-verification/email-verification.service.js';

import {
  VerifyEmailDto,
} from './dto/verify-email.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailVerification:
      EmailVerificationService,
  ) {}

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
  ) {
    await this.emailVerification.verifyToken(
      dto.token,
    );

    return {
      success: true,
      code: 'EMAIL_VERIFIED',
      message: 'Email verified successfully',
    };
  }
}
