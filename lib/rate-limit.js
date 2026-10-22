// IP ごとの簡易レート制限（メモリ内）。
// 注意: Vercel のサーバーレスでは関数インスタンスごとに別の記憶になるため、
// これは「1 台から連打されたときの歯止め」であって厳密な上限ではない。
// 厳密に絞るには共有ストア（Upstash Redis 等）が必要。

const buckets = new Map();

function rateLimit(key, { limit, windowMs, now = Date.now() }) {
  const b = buckets.get(key);
  if (!b || now - b.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now - v.start >= windowMs) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

function _resetRateLimit() {
  buckets.clear();
}

module.exports = { rateLimit, _resetRateLimit };
