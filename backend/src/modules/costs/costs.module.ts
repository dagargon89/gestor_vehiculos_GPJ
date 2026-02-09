import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cost } from '../../database/entities/cost.entity';
import { CostsService } from './costs.service';
import { CostsController } from './costs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cost])],
  controllers: [CostsController],
  providers: [CostsService],
  exports: [CostsService],
})
export class CostsModule {}
