import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthUserId = createParamDecorator(
  (data: 'http' | 'ws', context: ExecutionContext) => {
    if (data === 'ws') {
      const { userId } = context.switchToWs().getData();
      return userId;
    } else {
      const { userId } = context.switchToHttp().getRequest();
      return userId;
    }
  },
);
