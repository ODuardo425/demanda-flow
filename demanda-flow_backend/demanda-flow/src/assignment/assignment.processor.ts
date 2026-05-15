import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AssignmentService } from './assignment.service';

@Processor('assignment')
export class AssignmentProcessor extends WorkerHost {
  constructor(private assignment: AssignmentService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'assign-step':
        await this.assignment.assign(job.data.stepId);
        break;
      case 'release-root-steps':
        await this.assignment.releaseRootSteps(job.data.demandId);
        break;
      default:
        // ignora jobs desconhecidos
        break;
    }
  }
}
