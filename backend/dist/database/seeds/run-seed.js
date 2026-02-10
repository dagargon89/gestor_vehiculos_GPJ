"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const rootEnv = (0, path_1.resolve)(process.cwd(), '../.env');
const backendEnv = (0, path_1.resolve)(process.cwd(), '.env');
(0, dotenv_1.config)({ path: rootEnv });
(0, dotenv_1.config)({ path: backendEnv });
const typeorm_data_source_1 = require("../../config/typeorm-data-source");
const index_1 = require("./index");
async function run() {
    const ds = typeorm_data_source_1.default;
    if (!ds.isInitialized) {
        await ds.initialize();
    }
    try {
        await (0, index_1.runAllSeeds)(ds);
    }
    finally {
        if (ds.isInitialized) {
            await ds.destroy();
        }
    }
}
run().catch((err) => {
    console.error('Error ejecutando seeders:', err);
    process.exit(1);
});
//# sourceMappingURL=run-seed.js.map