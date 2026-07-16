import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehicleDocuments1784234609123 implements MigrationInterface {
    name = 'CreateVehicleDocuments1784234609123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vehicle_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_id" uuid NOT NULL, "documentType" character varying NOT NULL, "expiryDate" date NOT NULL, "storageFileId" character varying, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_d0cc0eb10dcf41a4f35575f5273" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8215ef09586915f4ab3e7db016" ON "vehicle_documents" ("vehicle_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_09f1fe4e67790189d9ec87bc7e" ON "vehicle_documents" ("expiryDate") `);
        await queryRunner.query(`ALTER TABLE "vehicle_documents" ADD CONSTRAINT "FK_8215ef09586915f4ab3e7db0162" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_documents" DROP CONSTRAINT "FK_8215ef09586915f4ab3e7db0162"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09f1fe4e67790189d9ec87bc7e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8215ef09586915f4ab3e7db016"`);
        await queryRunner.query(`DROP TABLE "vehicle_documents"`);
    }

}
