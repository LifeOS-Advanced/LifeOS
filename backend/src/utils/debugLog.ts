import fs from 'fs';
import path from 'path';

const LOG_PATH = path.resolve(__dirname, '../../../debug-2f146f.log');

export function debugLog(payload: Record<string, unknown>) {
  const line = JSON.stringify({ sessionId: '2f146f', timestamp: Date.now(), ...payload }) + '\n';
  // #region agent log
  try {
    fs.appendFileSync(LOG_PATH, line);
  } catch {
    /* ignore */
  }
  // #endregion
}
