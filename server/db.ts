import fs from 'fs';
import path from 'path';
import { Pool, PoolConfig } from 'pg';
import { store } from '../src/services/store';

let pool: Pool | null = null;
let isConnected = false;
let dbError: string | null = null;
let saveTimeout: NodeJS.Timeout | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

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

function maskDatabaseUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}`;
  } catch {
    return 'URL_OCULTA';
  }
}

async function attemptPoolConnection(connString: string, sslOption: boolean | { rejectUnauthorized: boolean }): Promise<{ pool: Pool; client: any }> {
  const config: PoolConfig = {
    connectionString: connString,
    ssl: sslOption,
    connectionTimeoutMillis: 10000,
  };

  const testPool = new Pool(config);
  testPool.on('error', (err) => {
    console.warn('[Database] Advertencia en conexión background de pool:', err.message);
  });

  const client = await testPool.connect();
  return { pool: testPool, client };
}

async function establishConnection(rawUrl: string): Promise<{ pool: Pool; client: any }> {
  const isRender = process.env.RENDER === 'true' || !!process.env.IS_PULL_REQUEST || !!process.env.RENDER_SERVICE_ID;
  let targetUrl = rawUrl.trim();

  // If NOT on Render and an internal Render host is provided (dpg-xxxx-a without domain), try resolving to external domain
  if (!isRender) {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.hostname.startsWith('dpg-') && !parsed.hostname.includes('.')) {
        parsed.hostname = `${parsed.hostname}.oregon-postgres.render.com`;
        targetUrl = parsed.toString();
      }
    } catch {
      // ignore URL parsing error
    }
  }

  const isLocalhost = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');
  const hasDisableSsl = targetUrl.includes('sslmode=disable');

  // Strategy 1: If localhost or explicitly disabled, start without SSL; otherwise start with rejectUnauthorized: false
  const primarySsl = (!isLocalhost && !hasDisableSsl) ? { rejectUnauthorized: false } : false;

  try {
    return await attemptPoolConnection(targetUrl, primarySsl);
  } catch (firstErr: any) {
    // Strategy 2: If primary failed with an SSL or handshake error, retry with inverse SSL setting
    const errMsg = (firstErr.message || '').toLowerCase();
    const isSslRelated = errMsg.includes('ssl') || errMsg.includes('tls') || errMsg.includes('encryption') || errMsg.includes('unsupported');

    if (isSslRelated) {
      const alternateSsl = !primarySsl;
      console.log(`[Database] Reintentando conexión con SSL=${alternateSsl ? 'habilitado' : 'deshabilitado'}...`);
      return await attemptPoolConnection(targetUrl, alternateSsl);
    }
    throw firstErr;
  }
}

async function setupTablesAndSync(client: any): Promise<void> {
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
}

export async function initDb(): Promise<boolean> {
  const connectionString = process.env.DATABASE_URL;

  // Always register store onChange listener to persist to disk and database
  store.setOnChange(() => {
    debouncedSave();
  });

  if (!connectionString) {
    console.log('[Database] Sin DATABASE_URL configurada. Inicializando persistencia en disco local.');
    const diskState = loadFromDisk();
    if (diskState) {
      console.log('[Database] Restaurando estado guardado desde almacenamiento local.');
      store.loadSnapshot(diskState);
    }
    return false;
  }

  const masked = maskDatabaseUrl(connectionString);
  console.log(`[Database] Conectando a PostgreSQL (${masked})...`);

  // Try up to 3 connection attempts with backoff (crucial for Render when web and DB boot together)
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { pool: connectedPool, client } = await establishConnection(connectionString);
      pool = connectedPool;
      isConnected = true;
      dbError = null;
      console.log('[Database] PostgreSQL conectado exitosamente.');

      try {
        await setupTablesAndSync(client);
      } finally {
        client.release();
      }

      // Clear any reconnect intervals if previously active
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }

      return true;
    } catch (err: any) {
      const isLast = attempt === maxAttempts;
      dbError = `${err.code ? `[${err.code}] ` : ''}${err.message || 'Error connecting to PostgreSQL'}`;

      if (!isLast) {
        console.warn(`[Database] Intento ${attempt}/${maxAttempts} falló (${dbError}). Reintentando en 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        isConnected = false;
        if (pool) {
          pool.end().catch(() => {});
          pool = null;
        }
        console.warn('[Database] Advertencia al conectar con PostgreSQL tras reintentos:', dbError);
        console.log('[Database] Activando persistencia en disco local como respaldo de alta disponibilidad.');
        const diskState = loadFromDisk();
        if (diskState) {
          store.loadSnapshot(diskState);
        }

        // Setup background reconnect worker to automatically connect when DB becomes ready
        startBackgroundReconnect(connectionString);
      }
    }
  }

  return false;
}

function startBackgroundReconnect(connString: string) {
  if (reconnectInterval) return;
  console.log('[Database] Iniciando monitor en segundo plano para reconectar con PostgreSQL cuando esté disponible...');
  reconnectInterval = setInterval(async () => {
    if (isConnected) {
      if (reconnectInterval) clearInterval(reconnectInterval);
      return;
    }
    try {
      const { pool: newPool, client } = await establishConnection(connString);
      pool = newPool;
      isConnected = true;
      dbError = null;
      console.log('[Database] ¡Reconexión exitosa con PostgreSQL establecida en segundo plano!');
      try {
        await setupTablesAndSync(client);
      } finally {
        client.release();
      }
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    } catch {
      // silent retry in background
    }
  }, 20000);
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
    timestamp: new Date().toISOString(),
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

export async function loadEmailConfigFromDb(): Promise<any | null> {
  try {
    if (pool && isConnected) {
      const res = await pool.query(`SELECT data FROM app_state WHERE key = 'votosmart_email_config' LIMIT 1;`);
      if (res.rows.length > 0 && res.rows[0].data) {
        return res.rows[0].data;
      }
    } else {
      const disk = loadFromDisk();
      if (disk && disk._email_config) {
        return disk._email_config;
      }
    }
  } catch (err: any) {
    console.warn('[Database] Advertencia al leer config de email desde BD:', err.message);
  }
  return null;
}

export async function saveEmailConfigToDb(config: any): Promise<boolean> {
  try {
    const disk = loadFromDisk() || {};
    disk._email_config = config;
    saveToDisk(disk);

    if (pool && isConnected) {
      await pool.query(
        `
        INSERT INTO app_state (key, data, updated_at)
        VALUES ('votosmart_email_config', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE
        SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
        `,
        [JSON.stringify(config)]
      );
      return true;
    }
  } catch (err: any) {
    console.error('[Database] Error guardando config de email en PostgreSQL:', err.message);
  }
  return false;
}
