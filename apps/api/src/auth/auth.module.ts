
import { Module } from '@nestjs/common';
import {
  ThrottlerModule,
} from '@nestjs/throttler';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

import { EmailModule } from '../email/email.module.js';

import {
  EmailVerificationModule,
} from '../email-verification/email-verification.module.js';

@Module({
  imports: [
    EmailModule,
    EmailVerificationModule,

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
