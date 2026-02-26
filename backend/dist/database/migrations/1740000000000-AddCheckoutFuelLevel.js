"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCheckoutFuelLevel1740000000000 = void 0;
class AddCheckoutFuelLevel1740000000000 {
    constructor() {
        this.name = 'AddCheckoutFuelLevel1740000000000';
    }
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "checkoutFuelLevel" VARCHAR(50)');
    }
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE "reservations" DROP COLUMN IF EXISTS "checkoutFuelLevel"');
    }
}
exports.AddCheckoutFuelLevel1740000000000 = AddCheckoutFuelLevel1740000000000;
//# sourceMappingURL=1740000000000-AddCheckoutFuelLevel.js.map