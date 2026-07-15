import { MigrationInterface, QueryRunner } from "typeorm";

export class Baseline1700000000000 implements MigrationInterface {
    name = 'Baseline1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firebaseUid" character varying(128) NOT NULL, "email" character varying NOT NULL, "displayName" character varying, "photoUrl" text, "employeeId" character varying, "department" character varying, "licenseNumber" character varying, "licenseType" character varying, "licenseExpiry" date, "licenseRestrictions" text, "phone" character varying, "emergencyContactName" character varying, "emergencyContactPhone" character varying, "emergencyContactRelationship" character varying, "status" character varying NOT NULL DEFAULT 'active', "role_id" uuid, "emailNotifications" boolean NOT NULL DEFAULT true, "autoApprovalEnabled" boolean NOT NULL DEFAULT false, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_e621f267079194e5428e19af2f3" UNIQUE ("firebaseUid"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "resource" character varying NOT NULL, "action" character varying NOT NULL, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reservations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "vehicle_id" uuid NOT NULL, "startDatetime" TIMESTAMP WITH TIME ZONE NOT NULL, "endDatetime" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "eventName" character varying(255), "description" text, "destination" character varying(255), "checkinOdometer" integer, "checkinFuelPhotoUrl" text, "checkinConditionPhotoUrls" text, "checkoutOdometer" integer, "checkoutFuelPhotoUrl" text, "checkoutFuelLevel" character varying(50), "checkoutConditionPhotoUrls" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plate" character varying NOT NULL, "brand" character varying NOT NULL, "model" character varying NOT NULL, "year" integer, "color" character varying, "vin" character varying, "photoUrls" text, "status" character varying NOT NULL DEFAULT 'available', "currentOdometer" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "contactName" character varying, "phone" character varying, "email" character varying, "address" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_af13fc2ebf382fe0dad2e4793aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "system_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" text NOT NULL, CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key"), CONSTRAINT "PK_82521f08790d248b2a80cc85d40" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "maintenance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicleId" character varying NOT NULL, "scheduledDate" date NOT NULL, "type" character varying, "description" text, "status" character varying NOT NULL DEFAULT 'scheduled', "odometerAtService" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "vehicle_id" uuid, CONSTRAINT "PK_542fb6a28537140d2df95faa52a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fuel_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicleId" character varying NOT NULL, "date" date NOT NULL, "liters" numeric(10,2) NOT NULL, "cost" numeric(10,2), "odometer" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "vehicle_id" uuid, CONSTRAINT "PK_9dbfb8fb6ec138c89ad8c043642" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "costs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicleId" character varying NOT NULL, "category" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "date" date NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "vehicle_id" uuid, CONSTRAINT "PK_05cc8aa05396a72553cdff6d5be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicleId" character varying NOT NULL, "userId" character varying, "date" date NOT NULL, "description" text NOT NULL, "status" character varying NOT NULL DEFAULT 'open', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "vehicle_id" uuid, "user_id" uuid, CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sanctions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "reason" text NOT NULL, "effectiveDate" date NOT NULL, "endDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "user_id" uuid, CONSTRAINT "PK_29bef7647676bb7ec707f29b18f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "read" boolean NOT NULL DEFAULT false, "actionUrl" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying, "action" character varying NOT NULL, "resource" character varying, "resourceId" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "storage_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entityType" character varying NOT NULL, "entityId" uuid NOT NULL, "fileName" character varying NOT NULL, "filePath" text NOT NULL, "firebaseUrl" text NOT NULL, "fileSize" integer, "mimeType" character varying, "uploadedBy" character varying, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "uploaded_by" uuid, CONSTRAINT "PK_3f5d0395ab1f8358e812ac4fe28" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("rolesId" uuid NOT NULL, "permissionsId" uuid NOT NULL, CONSTRAINT "PK_7931614007a93423204b4b73240" PRIMARY KEY ("rolesId", "permissionsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0cb93c5877d37e954e2aa59e52" ON "role_permissions" ("rolesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d422dabc78ff74a8dab6583da0" ON "role_permissions" ("permissionsId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_4af5055a871c46d011345a255a6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_f1815b51cc48775472c57b95109" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance" ADD CONSTRAINT "FK_695487b4a7876df7e70f2ae8564" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_records" ADD CONSTRAINT "FK_b7a752e90a822d17b8405501a08" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "costs" ADD CONSTRAINT "FK_7e8560a938e7c986fb816782925" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_544fc2e8bc0943de085b87ce768" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_66f302514887c0a1202dc48c239" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sanctions" ADD CONSTRAINT "FK_59abe13f5fc2c495a5eda526c66" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "storage_files" ADD CONSTRAINT "FK_7964bf45f2399c8e650cad4d789" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_0cb93c5877d37e954e2aa59e52c" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_d422dabc78ff74a8dab6583da02" FOREIGN KEY ("permissionsId") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_d422dabc78ff74a8dab6583da02"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_0cb93c5877d37e954e2aa59e52c"`);
        await queryRunner.query(`ALTER TABLE "storage_files" DROP CONSTRAINT "FK_7964bf45f2399c8e650cad4d789"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "sanctions" DROP CONSTRAINT "FK_59abe13f5fc2c495a5eda526c66"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_66f302514887c0a1202dc48c239"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_544fc2e8bc0943de085b87ce768"`);
        await queryRunner.query(`ALTER TABLE "costs" DROP CONSTRAINT "FK_7e8560a938e7c986fb816782925"`);
        await queryRunner.query(`ALTER TABLE "fuel_records" DROP CONSTRAINT "FK_b7a752e90a822d17b8405501a08"`);
        await queryRunner.query(`ALTER TABLE "maintenance" DROP CONSTRAINT "FK_695487b4a7876df7e70f2ae8564"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_f1815b51cc48775472c57b95109"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_4af5055a871c46d011345a255a6"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d422dabc78ff74a8dab6583da0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cb93c5877d37e954e2aa59e52"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "storage_files"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "sanctions"`);
        await queryRunner.query(`DROP TABLE "incidents"`);
        await queryRunner.query(`DROP TABLE "costs"`);
        await queryRunner.query(`DROP TABLE "fuel_records"`);
        await queryRunner.query(`DROP TABLE "maintenance"`);
        await queryRunner.query(`DROP TABLE "system_settings"`);
        await queryRunner.query(`DROP TABLE "providers"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "reservations"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
