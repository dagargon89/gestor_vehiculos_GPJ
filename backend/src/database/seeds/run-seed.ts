import { config } from 'dotenv';
import { resolve } from 'path';

// Raíz del proyecto (donde está docker-compose): misma DB_PASSWORD que usó Postgres
const rootEnv = resolve(process.cwd(), '../.env');
const backendEnv = resolve(process.cwd(), '.env');
config({ path: rootEnv }); // primero raíz
config({ path: backendEnv }); // dotenv no sobrescribe por defecto, así que DB_* de raíz se mantienen

import dataSourceConfig from '../../config/typeorm-data-source';
import { runAllSeeds } from './index';

async function run(): Promise<void> {
  const ds = dataSourceConfig;
  if (!ds.isInitialized) {
    await ds.initialize();
  }
  try {
    await runAllSeeds(ds);
  } finally {
    if (ds.isInitialized) {
      await ds.destroy();
    }
  }
}

run().catch((err) => {
  console.error('Error ejecutando seeders:', err);
  process.exit(1);
});
