type Connection = { saveData?: boolean; effectiveType?: string };

/** True on Save-Data, 2G, and 3G, where extra prefetches compete with the open page. */
export function isConstrainedNetwork(): boolean {
  const conn = (navigator as Navigator & { connection?: Connection }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return conn.effectiveType === "slow-2g" || conn.effectiveType === "2g" || conn.effectiveType === "3g";
}
