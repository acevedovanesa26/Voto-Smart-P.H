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

interface ConnectionCandidate {
  url: string;
  ssl: boolean | { rejectUnauthorized: boolean };
  label: string;
}

function buildCandidates(rawUrl: string): ConnectionCandidate[] {
  const trimmed = rawUrl.trim();
  const candidates: ConnectionCandidate[] = [];

  let parsed: URL | null = null;
  try {
    parsed = new URL(trimmed);
  } catch {
    return [{ url: trimmed, ssl: { rejectUnauthorized: false }, label: 'URL directa' }];
  }

  const host = parsed.hostname;
  const isRenderInternal = host.startsWith('dpg-') && !host.includes('.');
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  if (isRenderInternal) {
    // 1. External Oregon FQDN with SSL (Verified default in Render, works across regions and outside VPC)
    const oregonParsed = new URL(trimmed);
    oregonParsed.hostname = `${host}.oregon-postgres.render.com`;
    candidates.push({
      url: oregonParsed.toString(),
      ssl: { rejectUnauthorized: false },
      label: 'Render Oregon FQDN (SSL)',
    });

    // 2. Direct internal Render host WITHOUT SSL (Standard internal VPC network within same region)
    candidates.push({
      url: trimmed,
      ssl: false,
      label: 'Render Red Interna VPC (Sin SSL)',
    });

    // 3. Direct internal Render host WITH SSL
    candidates.push({
      url: trimmed,
      ssl: { rejectUnauthorized: false },
      label: 'Render Red Interna VPC (Con SSL)',
    });

    // 4. External Ohio / Frankfurt fallbacks
    const ohioParsed = new URL(trimmed);
    ohioParsed.hostname = `${host}.ohio-postgres.render.com`;
    candidates.push({
      url: ohioParsed.toString(),
      ssl: { rejectUnauthorized: false },
      label: 'Render Ohio FQDN (SSL)',
    });

    const frankfurtParsed = new URL(trimmed);
    frankfurtParsed.hostname = `${host}.frankfurt-postgres.render.com`;
    candidates.push({
      url: frankfurtParsed.toString(),
      ssl: { rejectUnauthorized: false },
      label: 'Render Frankfurt FQDN (SSL)',
    });
  } else if (!isLocalhost) {
    // External remote host (e.g. Render external, Supabase, Neon)
    candidates.push({
      url: trimmed,
      ssl: { rejectUnauthorized: false },
      label: 'Host Remoto Externo (SSL)',
    });
    candidates.push({
      url: trimmed,
      ssl: false,
      label: 'Host Remoto Externo (Sin SSL)',
    });
  } else {
    // Localhost development
    candidates.push({
      url: trimmed,
      ssl: false,
      label: 'Localhost (Sin SSL)',
    });
  }

  return candidates;
}

async function establishConnection(rawUrl: string): Promise<{ pool: Pool; client: any; activeCandidate: ConnectionCandidate }> {
  const candidates = buildCandidates(rawUrl);
  let lastError: any = null;

  for (const candidate of candidates) {
    try {
      const config: PoolConfig = {
        connectionString: candidate.url,
        ssl: candidate.ssl,
        connectionTimeoutMillis: 7000,
      };
      const testPool = new Pool(config);
      testPool.on('error', (err) => {
        console.warn('[Database] Advertencia en conexión background de pool:', err.message);
      });

      const client = await testPool.connect();
      return { pool: testPool, client, activeCandidate: candidate };
    } catch (err: any) {
      lastError = err;
      // Continue to next candidate silently
    }
  }

  throw lastError || new Error('No se pudo establecer conexión con PostgreSQL');
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
      const { pool: connectedPool, client, activeCandidate } = await establishConnection(connectionString);
      pool = connectedPool;
      isConnected = true;
      dbError = null;
      console.log(`[Database] PostgreSQL conectado exitosamente vía: ${activeCandidate.label}.`);

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
      const { pool: newPool, client, activeCandidate } = await establishConnection(connString);
      pool = newPool;
      isConnected = true;
      dbError = null;
      console.log(`[Database] ¡Reconexión exitosa con PostgreSQL establecida vía ${activeCandidate.label}!`);
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
