import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { store } from '../src/services/store';

let pool: Pool | null = null;
let isConnected = false;
let dbError: string | null = null;
let saveTimeout: NodeJS.Timeout | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'votosmart_state.json');

function saveToDisk(snapshot: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Database] Advertencia al escribir backup local:', err.message);
  }
}

function loadFromDisk(): any | null {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err: any) {
    console.warn('[Database] Advertencia al leer backup local:', err.message);
  }
  return null;
}

export async function initDb(): Promise<boolean> {
  let connectionString = process.env.DATABASE_URL;

  // Always register store onChange listener to persist to disk and database
  store.setOnChange(() => {
    debouncedSave();
  });

  if (!connectionString) {
    console.log('[Database] Sin DATABASE_URL. Inicializando almacenamiento en disco local.');
    const diskState = loadFromDisk();
    if (diskState) {
      console.log('[Database] Restaurando estado guardado desde almacenamiento local.');
      store.loadSnapshot(diskState);
    }
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
    console.log('[Database] Conectando a la base de datos PostgreSQL...');
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    // Guard against unhandled background pool errors
    pool.on('error', (err) => {
      console.warn('[Database] Advertencia en conexión background de pool:', err.message);
    });

    const client = await pool.connect();
    console.log('[Database] PostgreSQL conectado exitosamente.');
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
      console.log('[Database] Restaurando estado persistido desde PostgreSQL...');
      store.loadSnapshot(res.rows[0].data);
    } else {
      const diskState = loadFromDisk();
      if (diskState) {
        console.log('[Database] Restaurando estado desde archivo local a PostgreSQL...');
        store.loadSnapshot(diskState);
      } else {
        console.log('[Database] Inicializando primer snapshot en PostgreSQL...');
      }
      await saveStateNow();
    }

    return true;
  } catch (err: any) {
    isConnected = false;
    dbError = err.message || 'Error connecting to PostgreSQL';
    if (pool) {
      pool.end().catch(() => {});
      pool = null;
    }
    console.warn('[Database] Advertencia al conectar con PostgreSQL:', dbError);
    console.log('[Database] Activando persistencia en disco local como respaldo de alta disponibilidad.');
    const diskState = loadFromDisk();
    if (diskState) {
      store.loadSnapshot(diskState);
    }
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

export function getDbStatus() {
  return {
    connected: isConnected,
    type: isConnected ? 'PostgreSQL' : 'Local Disk / Memory',
    error: dbError,
    databaseUrlSet: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString()
  };
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveStateNow().catch((err) => {
      console.error('[Database] Error en guardado debounced:', err.message);
    });
  }, 250);
}

export async function saveStateNow(): Promise<boolean> {
  try {
    const snapshot = store.getSnapshot();
    saveToDisk(snapshot);

    if (!pool || !isConnected) return true;

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
    console.error('[Database] Error guardando estado en PostgreSQL:', err.message);
    return false;
  }
}

const EMAIL_CONFIG_FILE = path.join(DATA_DIR, 'email_config.json');

export async function saveEmailConfig(config: any): Promise<boolean> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(EMAIL_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Database] Advertencia al escribir email_config local:', err.message);
  }

  if (pool && isConnected) {
    try {
      await pool.query(
        `
        INSERT INTO app_state (key, data, updated_at)
        VALUES ('email_config', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE
        SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
        `,
        [JSON.stringify(config)]
      );
      return true;
    } catch (err: any) {
      console.warn('[Database] Advertencia guardando email_config en PostgreSQL:', err.message);
    }
  }
  return true;
}

export async function loadEmailConfig(): Promise<any | null> {
  if (pool && isConnected) {
    try {
      const res = await pool.query(`SELECT data FROM app_state WHERE key = 'email_config' LIMIT 1;`);
      if (res.rows.length > 0 && res.rows[0].data) {
        return res.rows[0].data;
      }
    } catch (err: any) {
      console.warn('[Database] Advertencia leyendo email_config de PostgreSQL:', err.message);
    }
  }

  try {
    if (fs.existsSync(EMAIL_CONFIG_FILE)) {
      const raw = fs.readFileSync(EMAIL_CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err: any) {
    console.warn('[Database] Advertencia leyendo email_config local:', err.message);
  }
  return null;
}
