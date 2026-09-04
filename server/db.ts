import { Pool } from 'pg';
import { store } from '../src/services/store';

let pool: Pool | null = null;
let isConnected = false;
let dbError: string | null = null;
let saveTimeout: NodeJS.Timeout | null = null;

export async function initDb(): Promise<boolean> {
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log('[Database] No DATABASE_URL provided. Running with In-Memory / Local store.');
    return false;
  }

  // Automatic Fix for Render.com PostgreSQL:
  // Render provides an "Internal Database URL" (e.g. host is dpg-xxxx-a without domain) which only resolves inside Render.
  // When running outside Render, auto-resolve to Render's external host: dpg-xxxx-a.oregon-postgres.render.com
  try {
    const parsed = new URL(connectionString);
    if (parsed.hostname.startsWith('dpg-') && !parsed.hostname.includes('.')) {
      console.log(`[Database] Detectado host interno de Render (${parsed.hostname}). Ajustando automáticamente a host externo.`);
      parsed.hostname = `${parsed.hostname}.oregon-postgres.render.com`;
      connectionString = parsed.toString();
    }
  } catch (err: any) {
    // If URL parsing fails, continue with original connectionString
  }

  try {
    console.log('[Database] Connecting to PostgreSQL database...');
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    // Guard against unhandled background pool errors
    pool.on('error', (err) => {
      console.warn('[Database] Background pool connection warning:', err.message);
    });

    const client = await pool.connect();
    console.log('[Database] PostgreSQL connected successfully!');
    isConnected = true;
    dbError = null;

    // Create table for persisted state
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Load existing state if available
    const res = await client.query(`SELECT data FROM app_state WHERE key = 'votosmart_main_state' LIMIT 1;`);
    client.release();

    if (res.rows.length > 0 && res.rows[0].data) {
      console.log('[Database] Loading saved state from PostgreSQL into store...');
      store.loadSnapshot(res.rows[0].data);
    } else {
      console.log('[Database] No existing state in database. Seeding initial data to PostgreSQL...');
      await saveStateNow();
    }

    // Register store listener to persist changes automatically
    store.setOnChange(() => {
      debouncedSave();
    });

    return true;
  } catch (err: any) {
    isConnected = false;
    dbError = err.message || 'Error connecting to PostgreSQL';
    if (pool) {
      pool.end().catch(() => {});
      pool = null;
    }
    console.warn('[Database] Advertencia al conectar con PostgreSQL:', dbError);
    console.log('[Database] Continuando de forma segura en modo In-Memory.');
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

export function getDbStatus() {
  return {
    connected: isConnected,
    type: isConnected ? 'PostgreSQL' : 'In-Memory',
    error: dbError,
    databaseUrlSet: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString()
  };
}

function debouncedSave() {
  if (!pool || !isConnected) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveStateNow().catch((err) => {
      console.error('[Database] Error in debounced state save:', err.message);
    });
  }, 1000);
}

export async function saveStateNow(): Promise<boolean> {
  if (!pool || !isConnected) return false;
  try {
    const snapshot = store.getSnapshot();
    await pool.query(
      `
      INSERT INTO app_state (key, data, updated_at)
      VALUES ('votosmart_main_state', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
      `,
      [JSON.stringify(snapshot)]
    );
    return true;
  } catch (err: any) {
    console.error('[Database] Error saving state to PostgreSQL:', err.message);
    return false;
  }
}
