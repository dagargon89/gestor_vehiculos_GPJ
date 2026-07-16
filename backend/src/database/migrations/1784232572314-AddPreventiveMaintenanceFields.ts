import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPreventiveMaintenanceFields1784232572314 implements MigrationInterface {
    name = 'AddPreventiveMaintenanceFields1784232572314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "maintenanceIntervalKm" integer`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "maintenanceIntervalDays" integer`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "nextServiceOdometer" integer`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "nextServiceDate" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "nextServiceDate"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "nextServiceOdometer"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "maintenanceIntervalDays"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "maintenanceIntervalKm"`);
    }

}
