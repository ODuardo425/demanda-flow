import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WorkflowService } from './workflow.service';

@Processor('workflow')
export class WorkflowProcessor extends WorkerHost {
  constructor(private workflow: WorkflowService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'step-completed':
        await this.workflow.onStepCompleted(job.data.stepId);
        break;
      case 'sweep-overdue':
        await this.workflow.sweepOverdueSteps();
        break;
    }
  }
}
