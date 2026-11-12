
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { EmailModule } from '../email/email.module.js';
import { EmailVerificationModule } from '../email-verification/email-verification.module.js';

@Module({
  imports: [
    EmailModule,
    EmailVerificationModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
