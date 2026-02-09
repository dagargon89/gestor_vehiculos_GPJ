"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermission = void 0;
const common_1 = require("@nestjs/common");
const permissions_guard_1 = require("../guards/permissions.guard");
const RequirePermission = (resource, action) => (0, common_1.SetMetadata)(permissions_guard_1.REQUIRE_PERMISSION_KEY, { resource, action });
exports.RequirePermission = RequirePermission;
//# sourceMappingURL=permissions.decorator.js.map