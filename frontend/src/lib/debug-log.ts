/** Debug session logging (browser → ingest + sessionStorage for inspection). */
export function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
) {
  const payload = {
    sessionId: '2f146f',
    runId: 'post-fix',
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  // #region agent log
  try {
    sessionStorage.setItem('lifeos_debug_last', JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  fetch('http://127.0.0.1:7401/ingest/940c290b-13c7-4abf-8310-a062bfb90237', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '2f146f' },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}
