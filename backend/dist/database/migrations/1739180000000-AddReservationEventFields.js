"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddReservationEventFields1739180000000 = void 0;
class AddReservationEventFields1739180000000 {
    constructor() {
        this.name = 'AddReservationEventFields1739180000000';
    }
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "eventName" VARCHAR(255)');
        await queryRunner.query('ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "description" TEXT');
        await queryRunner.query('ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "destination" VARCHAR(255)');
    }
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE "reservations" DROP COLUMN IF EXISTS "eventName"');
        await queryRunner.query('ALTER TABLE "reservations" DROP COLUMN IF EXISTS "description"');
        await queryRunner.query('ALTER TABLE "reservations" DROP COLUMN IF EXISTS "destination"');
    }
}
exports.AddReservationEventFields1739180000000 = AddReservationEventFields1739180000000;
//# sourceMappingURL=1739180000000-AddReservationEventFields.js.map