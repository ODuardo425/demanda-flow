import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';   // ← use este pacote
import { DemandsService } from './demands.service';
import { DemandsController } from './demands.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'assignment' })], // ← descomentado
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}