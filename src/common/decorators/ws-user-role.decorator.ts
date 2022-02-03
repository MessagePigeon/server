import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const WsUserRole = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const { role } = context.switchToWs().getData();
    return role;
  },
);
