import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DemandsService } from './demands.service';
import { DemandsController } from './demands.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'assignment' })],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}
