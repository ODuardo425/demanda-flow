import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  constructor(private notifications: NotificationsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'notify') {
      const { userId, type, payload } = job.data;
      await this.notifications.create(userId, type, payload);
    }
  }
}
