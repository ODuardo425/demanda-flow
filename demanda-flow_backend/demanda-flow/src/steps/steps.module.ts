import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StepsService } from './steps.service';
import { StepsController } from './steps.controller';

@Module({
  imports: [
    //BullModule.registerQueue(
      //{ name: 'assignment' },
      //{ name: 'workflow' },
      //{ name: 'notifications' },
    //),
  ],
  controllers: [StepsController],
  providers: [StepsService],
  exports: [StepsService],
})
export class StepsModule {}
