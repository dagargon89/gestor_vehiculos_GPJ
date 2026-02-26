import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckoutFuelLevel1740000000000 implements MigrationInterface {
  name = 'AddCheckoutFuelLevel1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "checkoutFuelLevel" VARCHAR(50)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reservations" DROP COLUMN IF EXISTS "checkoutFuelLevel"',
    );
  }
}
