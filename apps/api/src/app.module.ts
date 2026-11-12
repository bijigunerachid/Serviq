
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EmailVerificationModule } from './email-verification/email-verification.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        'apps/api/.env',
      ],
    }),
    PrismaModule,
    HealthModule,
    TenantsModule,
    AuthModule,
    EmailVerificationModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
