import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AssignmentService } from './assignment.service';
import { AssignmentProcessor } from './assignment.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'assignment' }, { name: 'notifications' }),
  ],
  providers: [AssignmentService, AssignmentProcessor],
  exports: [AssignmentService],
})
export class AssignmentModule {}
