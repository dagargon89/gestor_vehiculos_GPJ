import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDoubleFkAndAddConstraints1784155578219 implements MigrationInterface {
    name = 'FixDoubleFkAndAddConstraints1784155578219'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Backfill antes de eliminar las columnas duplicadas: copia el valor de la
        // columna escalar legacy (camelCase, ej. "vehicleId") a la columna física
        // real usada por la relación FK (snake_case, ej. "vehicle_id") cuando esta
        // última quedó en NULL por el bug de doble columna (guardar vía el escalar
        // dejaba la columna del JoinColumn en NULL, rompiendo leftJoinAndSelect).
        await queryRunner.query(`UPDATE "maintenance" SET "vehicle_id" = "vehicleId"::uuid WHERE "vehicle_id" IS NULL`);
        await queryRunner.query(`UPDATE "fuel_records" SET "vehicle_id" = "vehicleId"::uuid WHERE "vehicle_id" IS NULL`);
        await queryRunner.query(`UPDATE "costs" SET "vehicle_id" = "vehicleId"::uuid WHERE "vehicle_id" IS NULL`);
        await queryRunner.query(`UPDATE "incidents" SET "vehicle_id" = "vehicleId"::uuid WHERE "vehicle_id" IS NULL`);
        await queryRunner.query(`UPDATE "incidents" SET "user_id" = "userId"::uuid WHERE "user_id" IS NULL AND "userId" IS NOT NULL`);
        await queryRunner.query(`UPDATE "notifications" SET "user_id" = "userId"::uuid WHERE "user_id" IS NULL`);

        await queryRunner.query(`ALTER TABLE "maintenance" DROP COLUMN "vehicleId"`);
        await queryRunner.query(`ALTER TABLE "fuel_records" DROP COLUMN "vehicleId"`);
        await queryRunner.query(`ALTER TABLE "costs" DROP COLUMN "vehicleId"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP COLUMN "vehicleId"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE ("plate")`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "UQ_8288ce015b69c5856cf54e07a67" UNIQUE ("vin")`);
        await queryRunner.query(`ALTER TABLE "maintenance" DROP CONSTRAINT "FK_695487b4a7876df7e70f2ae8564"`);
        await queryRunner.query(`ALTER TABLE "maintenance" ALTER COLUMN "vehicle_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_records" DROP CONSTRAINT "FK_b7a752e90a822d17b8405501a08"`);
        await queryRunner.query(`ALTER TABLE "fuel_records" ALTER COLUMN "vehicle_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "costs" DROP CONSTRAINT "FK_7e8560a938e7c986fb816782925"`);
        await queryRunner.query(`ALTER TABLE "costs" ALTER COLUMN "vehicle_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_544fc2e8bc0943de085b87ce768"`);
        await queryRunner.query(`ALTER TABLE "incidents" ALTER COLUMN "vehicle_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_4af5055a871c46d011345a255a" ON "reservations" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f1815b51cc48775472c57b9510" ON "reservations" ("vehicle_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c42f5dcdd13d6e63ee44b4cb23" ON "reservations" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "UQ_7331684c0c5b063803a425001a0" UNIQUE ("resource", "action")`);
        await queryRunner.query(`ALTER TABLE "maintenance" ADD CONSTRAINT "FK_695487b4a7876df7e70f2ae8564" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_records" ADD CONSTRAINT "FK_b7a752e90a822d17b8405501a08" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "costs" ADD CONSTRAINT "FK_7e8560a938e7c986fb816782925" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_544fc2e8bc0943de085b87ce768" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Nota: este down() recrea las columnas duplicadas eliminadas
        // ("vehicleId"/"userId") pero NO restaura sus valores — eran datos
        // redundantes (duplicados del dato canónico "vehicle_id"/"user_id", que
        // sigue intacto). No hay backfill inverso porque no existe una fuente de
        // datos distinta para reconstruirlos; quedan NULL/"" tras un rollback.
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_544fc2e8bc0943de085b87ce768"`);
        await queryRunner.query(`ALTER TABLE "costs" DROP CONSTRAINT "FK_7e8560a938e7c986fb816782925"`);
        await queryRunner.query(`ALTER TABLE "fuel_records" DROP CONSTRAINT "FK_b7a752e90a822d17b8405501a08"`);
        await queryRunner.query(`ALTER TABLE "maintenance" DROP CONSTRAINT "FK_695487b4a7876df7e70f2ae8564"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "UQ_7331684c0c5b063803a425001a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c42f5dcdd13d6e63ee44b4cb23"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1815b51cc48775472c57b9510"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4af5055a871c46d011345a255a"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ALTER COLUMN "vehicle_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_544fc2e8bc0943de085b87ce768" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "costs" ALTER COLUMN "vehicle_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "costs" ADD CONSTRAINT "FK_7e8560a938e7c986fb816782925" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_records" ALTER COLUMN "vehicle_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_records" ADD CONSTRAINT "FK_b7a752e90a822d17b8405501a08" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance" ALTER COLUMN "vehicle_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "maintenance" ADD CONSTRAINT "FK_695487b4a7876df7e70f2ae8564" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "UQ_8288ce015b69c5856cf54e07a67"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "userId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD "userId" character varying`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD "vehicleId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "costs" ADD "vehicleId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_records" ADD "vehicleId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "maintenance" ADD "vehicleId" character varying NOT NULL`);
    }

}
