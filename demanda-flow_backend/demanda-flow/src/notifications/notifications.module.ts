import { Module } from '@nestjs/common';
//import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  //imports: [
   // BullModule.registerQueue({ name: 'notifications' }),
   // JwtModule.register({}),
  //],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, NotificationsProcessor],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
