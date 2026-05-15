import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowService } from './workflow.service';
import { WorkflowProcessor } from './workflow.processor';

@Module({
  imports: [
    //BullModule.registerQueue(
      //{ name: 'workflow' },
      //{ name: 'assignment' },
      //{ name: 'notifications' },
    //),
  ],
  providers: [WorkflowService, WorkflowProcessor],
  exports: [WorkflowService],
})
export class WorkflowModule {}
