import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddReservationEventFields1739180000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
