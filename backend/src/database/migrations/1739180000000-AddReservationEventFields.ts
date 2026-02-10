import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReservationEventFields1739180000000 implements MigrationInterface {
  name = 'AddReservationEventFields1739180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "eventName" VARCHAR(255)',
    );
    await queryRunner.query(
      'ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "description" TEXT',
    );
    await queryRunner.query(
      'ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "destination" VARCHAR(255)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reservations" DROP COLUMN IF EXISTS "eventName"',
    );
    await queryRunner.query(
      'ALTER TABLE "reservations" DROP COLUMN IF EXISTS "description"',
    );
    await queryRunner.query(
      'ALTER TABLE "reservations" DROP COLUMN IF EXISTS "destination"',
    );
  }
}
