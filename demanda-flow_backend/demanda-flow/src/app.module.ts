import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SkillsModule } from './skills/skills.module';
import { DemandsModule } from './demands/demands.module';
import { StepsModule } from './steps/steps.module';
import { AssignmentModule } from './assignment/assignment.module';
import { WorkflowModule } from './workflow/workflow.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          url: process.env.REDIS_URL, // O valor será lido automaticamente do ambiente Render
        },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SkillsModule,
    DemandsModule,
    StepsModule,
    AssignmentModule,
    WorkflowModule,
    NotificationsModule,
    DashboardModule,
  ],
})
export class AppModule {}
//