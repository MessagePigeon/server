import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { formatTimeToNow } from '~/common/utils/format-time-to-now.util';
import { isTimeToNowGte } from '~/common/utils/is-time-to-now-gte.util';
import { StateService } from '~/state/state.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(private readonly state: StateService) {}

  /**
   * Cleanup connect request which created more than 3 hours every day midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  cleanUpConnectRequests() {
    this.state.connectRequests.forEach(({ id, createdAt }, index) => {
      if (isTimeToNowGte(createdAt, '3h')) {
        this.state.connectRequests.splice(index, 1);
        const timeoutInterval = formatTimeToNow(createdAt);
        this.logger.warn(
          `Cleanup connect request ${id} which created ${timeoutInterval}`,
        );
      }
    });
  }
}
