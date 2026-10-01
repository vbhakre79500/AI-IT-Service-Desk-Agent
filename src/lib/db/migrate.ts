// Load .env.local (and .env, .env.production) before any other imports.
// @next/env is bundled with Next.js — no extra install needed.
// This replicates what `next dev/build` does, so DATABASE_URL is available
// when this script is run standalone via: tsx src/lib/db/migrate.ts
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getPool, initPostgresSchema, checkDatabaseConnectivity, closeDatabase } from './index';
import { seedDatabase } from './seed';

/**
 * Migration & Database Initialization CLI script.
 * Executed during build or pre-deployment to prepare Supabase PostgreSQL schema.
 *
 * Usage:
 *   npx tsx src/lib/db/migrate.ts
 *   npx tsx src/lib/db/migrate.ts --seed
 */
async function runMigration() {
  console.log('🚀 Initializing AutoDesk AI PostgreSQL database schema...');

  const connectivity = await checkDatabaseConnectivity();
  console.log(`🔌 Database Provider: ${connectivity.provider}`);
  if (!connectivity.connected) {
    console.error(`❌ Database connectivity error: ${connectivity.error || 'Connection failed'}`);
    process.exit(1);
  }

  const pool = getPool();
  await initPostgresSchema(pool);
  console.log('✅ PostgreSQL schema successfully migrated (all 13 tables & indexes verified).');

  const shouldSeed = process.argv.includes('--seed') || process.argv.includes('-s');
  if (shouldSeed) {
    console.log('🌱 Seeding initial demo data...');
    await seedDatabase(pool);
  }

  await closeDatabase();
  console.log('✨ Migration process completed successfully.');
  process.exit(0);
}

runMigration().catch(async (err) => {
  console.error('❌ Migration failed:', err.message || err);
  await closeDatabase();
  process.exit(1);
});
