import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StepsService } from './steps.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class StepsController {
  constructor(private steps: StepsService) {}

  // Caixa de entrada
  @Get('me/tasks')
  inbox(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.steps.inbox(user.id, { status });
  }

  @Post('steps/:id/start')
  start(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.steps.start(id, user);
  }

  @Post('steps/:id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.steps.complete(id, user);
  }

  @Post('steps/:id/reassign')
  reassign(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.steps.reassign(id, userId, user);
  }

  @Post('steps/:id/comments')
  comment(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.steps.addComment(id, content, user);
  }

  @Get('steps/:id/comments')
  listComments(@Param('id') id: string) {
    return this.steps.listComments(id);
  }
}
